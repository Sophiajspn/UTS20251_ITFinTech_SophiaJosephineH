import { connectDB } from "@/lib/db";
import Checkout from "@/models/Checkout";
import { sendWaText, toFonnteFormat } from "@/lib/wa_fonnte";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    await connectDB();

    const { items, payerEmail: rawEmail, payerPhone: rawPhone, payerName } = req.body;

    // Validasi email
    const payerEmail = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!payerEmail) {
      return res.status(400).json({ message: "payerEmail is required" });
    }

    // Validasi items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items is required" });
    }

    // Sanitasi item
    const cleanItems = items.map((i) => ({
      productId: i._id,
      name: String(i.name || ""),
      price: Number(i.price),
      qty: Number(i.qty),
    }));

    if (
      cleanItems.some(
        (i) =>
          !i.productId ||
          !i.name ||
          !Number.isFinite(i.price) ||
          !Number.isFinite(i.qty)
      )
    ) {
      return res.status(400).json({ message: "Invalid items data" });
    }

    const total = cleanItems.reduce((s, i) => s + i.price * i.qty, 0);
    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ message: "Invalid total amount" });
    }

    // 1) Simpan ke MongoDB
    const doc = await Checkout.create({
      payerEmail,
      payerPhone: rawPhone || null,
      payerName: payerName || null,
      items: cleanItems,
      total,
      status: "PENDING",
      notified: { 
        checkout: false, 
        paid: false,
        expired: false 
      },
      createdAt: new Date(),
    });

    console.log("✅ Checkout created:", doc._id);

    // 2) Buat invoice Xendit
    const externalId = `checkout-${doc._id}`;
    const baseUrl =
      process.env.EXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    // ✅ FIX: Pakai tanda kurung biasa
    const auth = Buffer.from(`${process.env.XENDIT_API_KEY}:`).toString("base64");

    const xenditResp = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: Math.round(total),
        payer_email: payerEmail,
        description: `Invoice pesanan ${doc._id}`,
        success_redirect_url: `${baseUrl}/success?inv=${doc._id}`,
        failure_redirect_url: `${baseUrl}/failed?inv=${doc._id}`,
        
        // ✅ FIX: Path webhook (sesuaikan dengan nama folder kamu)
        // Jika folder kamu "webhook" (singular), pakai ini:
        // callback_url: `${baseUrl}/api/webhook/xendit`,
        // Jika folder kamu "webhooks" (plural), pakai ini:
        callback_url: `${baseUrl}/api/webhooks/xendit`,
        
        callback_authentication_token: process.env.XENDIT_CB_TOKEN,
        customer: {
          given_names: payerName || "Customer",
          mobile_number: rawPhone || undefined,
          email: payerEmail,
        },
        currency: "IDR",
        metadata: {
          checkout_id: String(doc._id),
          source: "bonoya_cafe_web",
        },
        
        // Expired dalam 24 jam
        invoice_duration: 86400,
      }),
    });

    const invoice = await xenditResp.json();

    if (!xenditResp.ok) {
      console.error("❌ Xendit error:", xenditResp.status, invoice);
      await Checkout.findByIdAndUpdate(doc._id, { status: "FAILED" });
      return res
        .status(502)
        .json({ message: "Gagal membuat invoice", xendit: invoice });
    }

    console.log("✅ Xendit invoice created:", invoice.id);

    // 3) Simpan invoice ID ke database
    await Checkout.findByIdAndUpdate(doc._id, {
      invoiceId: invoice.id,
      externalId: invoice.external_id,
      invoiceUrl: invoice.invoice_url,
      status: "PENDING",
    });

    // 4) Kirim WA notifikasi checkout (non-blocking)
    if (rawPhone) {
      try {
        const to = toFonnteFormat(rawPhone);
        const itemsList = cleanItems
          .map((i) => `• ${i.name} (${i.qty}x) - Rp ${(i.price * i.qty).toLocaleString("id-ID")}`)
          .join("\n");

        const body = `Halo *${payerName || "Customer"}* 👋

Pesanan kamu sudah kami terima! ✅

*Detail Pesanan:*
${itemsList}

*Total: Rp ${Number(total).toLocaleString("id-ID")}*

Silakan selesaikan pembayaran melalui link berikut:
${invoice.invoice_url}

ID Pesanan: #${doc._id}

Terima kasih! ☕`;

        await sendWaText({ to, body });
        await Checkout.findByIdAndUpdate(doc._id, { "notified.checkout": true });
        console.log("✅ WA checkout notification sent to:", to);
      } catch (e) {
        console.error("⚠️ WA checkout failed:", e.message);
        // Sengaja tidak throw, checkout tetap sukses
      }
    }

    // 5) Response ke frontend
    return res.status(201).json({
      checkoutId: String(doc._id),
      total,
      status: "PENDING",
      invoiceUrl: invoice.invoice_url,
    });

  } catch (err) {
    console.error("❌ Checkout API error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}