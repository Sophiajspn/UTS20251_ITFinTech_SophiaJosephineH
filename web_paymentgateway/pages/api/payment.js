// pages/api/payment.js
import { connectDB } from "@/lib/db";
import Checkout from "@/models/Checkout";

function basicAuthHeader(secret) {
  return "Basic " + Buffer.from(`${secret}:`).toString("base64");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { checkoutId, email } = req.body || {};
    if (!checkoutId) return res.status(400).json({ ok:false, error:"checkoutId required" });

    const SECRET = process.env.XENDIT_SECRET_KEY || process.env.XENDIT_SECRET;
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_BASE_URL;

    if (!SECRET) {
      console.error("[/api/payment] Missing XENDIT_SECRET_KEY / XENDIT_SECRET");
      return res.status(500).json({ ok:false, error:"Xendit secret missing" });
    }
    if (!BASE_URL) {
      console.error("[/api/payment] Missing NEXT_PUBLIC_BASE_URL / APP_BASE_URL");
      return res.status(500).json({ ok:false, error:"BASE_URL missing" });
    }

    await connectDB();

    const co = await Checkout.findById(checkoutId);
    if (!co) return res.status(404).json({ ok:false, error:"checkout not found" });

    co.externalId = String(checkoutId);
    if (!co.status || co.status === "CANCEL") co.status = "PENDING";
    if (email && !co.payerEmail) co.payerEmail = email;
    await co.save();

    // 1) Try create invoice
    const create = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: basicAuthHeader(SECRET),
      },
      body: JSON.stringify({
        external_id: co.externalId,
        amount: co.total,
        payer_email: co.payerEmail || email || "customer@example.com",
        description: `Checkout ${checkoutId}`,
        success_redirect_url: `${BASE_URL}/success?cid=${checkoutId}`,
        failure_redirect_url: `${BASE_URL}/failed?cid=${checkoutId}`,
      }),
    });

    const data = await create.json();

    if (!create.ok) {
      const msg = (data?.message || "").toLowerCase();
      // 2) If duplicate external_id → fetch existing invoice & reuse
      if (create.status === 400 && msg.includes("external_id")) {
        console.warn("[/api/payment] duplicate external_id, fetching existing invoice…");
        const q = await fetch(
          "https://api.xendit.co/v2/invoices?external_id=" + encodeURIComponent(co.externalId),
          { headers: { Authorization: basicAuthHeader(SECRET) } }
        );
        const list = await q.json();
        const invoice = Array.isArray(list?.data) ? list.data[0] : list?.data || list?.[0];
        if (invoice?.invoice_url) {
          co.invoiceId = invoice.id;
          await co.save();
          return res.status(200).json({
            ok: true,
            checkoutId,
            externalId: co.externalId,
            invoice_id: invoice.id,
            invoice_url: invoice.invoice_url,
            reused: true,
          });
        }
      }

      console.error("[/api/payment] Xendit error:", create.status, data);
      return res.status(500).json({ ok:false, error: data?.message || "xendit error" });
    }

    co.invoiceId = data.id;
    await co.save();

    return res.status(200).json({
      ok: true,
      checkoutId,
      externalId: co.externalId,
      invoice_id: data.id,
      invoice_url: data.invoice_url,
    });
  } catch (e) {
    console.error("[/api/payment] server error:", e);
    return res.status(500).json({ ok:false, error:"server error" });
  }
}
