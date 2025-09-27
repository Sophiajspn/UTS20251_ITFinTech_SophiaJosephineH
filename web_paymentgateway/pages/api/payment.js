// pages/api/payments.js
import { connectDB } from "@/lib/db";
import Checkout from "@/models/Checkout";

function basicAuthHeader(secret) {
  return "Basic " + Buffer.from(`${secret}:`).toString("base64");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { checkoutId, email } = req.body;
    if (!checkoutId) {
      return res.status(400).json({ ok: false, error: "checkoutId required" });
    }

    const XENDIT_SECRET =
      process.env.XENDIT_SECRET_KEY || process.env.XENDIT_SECRET; // pakai salah satu yg kamu punya
    if (!XENDIT_SECRET) {
      return res.status(500).json({ ok: false, error: "Xendit secret missing in env" });
    }

    const BASE_URL =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_BASE_URL; // dukung dua nama
    if (!BASE_URL) {
      return res.status(500).json({ ok: false, error: "BASE_URL missing in env" });
    }

    await connectDB();

    // 1) Ambil dokumen checkout
    const co = await Checkout.findById(checkoutId);
    if (!co) return res.status(404).json({ ok: false, error: "checkout not found" });

    // 2) Tandai status lokal jadi PENDING + simpan externalId (pakai checkoutId)
    if (co.status !== "PENDING") co.status = "PENDING";
    co.externalId = String(checkoutId); // penting untuk dihubungkan oleh webhook
    if (email && !co.payerEmail) co.payerEmail = email;
    await co.save();

    // 3) Create invoice ke Xendit
    const resp = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: basicAuthHeader(XENDIT_SECRET), // username = secret key, password kosong
      },
      body: JSON.stringify({
        external_id: String(checkoutId),               // match dengan co.externalId
        amount: co.total,
        payer_email: email || co.payerEmail || "customer@example.com",
        description: `Checkout ${checkoutId}`,
        success_redirect_url: `${BASE_URL}/success?cid=${checkoutId}`,
        failure_redirect_url: `${BASE_URL}/failed?cid=${checkoutId}`,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("Xendit create invoice error:", data);
      return res
        .status(500)
        .json({ ok: false, error: data?.message || "xendit error", detail: data });
    }

    // 4) Simpan invoiceId dari Xendit ke dokumen kita
    co.invoiceId = data.id; // penting untuk cross-check kalau perlu
    await co.save();

    // 5) Kirim balik link invoice
    return res.status(200).json({
      ok: true,
      checkoutId,
      externalId: co.externalId,
      invoice_id: data.id,
      invoice_url: data.invoice_url,
    });
  } catch (e) {
    console.error("payments api error:", e);
    return res.status(500).json({ ok: false, error: "server error" });
  }
}
