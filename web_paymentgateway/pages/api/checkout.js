import { connectDB } from "@/lib/db";
import Checkout from "@/models/Checkout";

// WA helper (samakan dengan file yang sudah kamu buat di /lib/wa_twilio.js)
import { sendWaText, toWhatsAppE164 } from "@/lib/wa_twilio";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    await connectDB();

    const { items, payerEmail: rawEmail, payerPhone: rawPhone, payerName } = req.body;

    const payerEmail =
      typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    if (!payerEmail) {
      return res.status(400).json({ message: "payerEmail is required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items is required" });
    }

    // sanitasi item
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

    // 1) simpan ke Mongo
    const doc = await Checkout.create({
      payerEmail,
      payerPhone: rawPhone || null,
      payerName: payerName || null,
      items: cleanItems,
      total,
      status: "PENDING",
      notified: { checkout: false, paid: false }, // flag idempotency sederhana
      createdAt: new Date(),
    });

    // 2) panggil Xendit buat invoice
    const externalId = `checkout-${doc._id}`; // dijamin unik
    const baseUrl =
      process.env.EXT_PUBLIC_BASE_URL || "http://localhost:3000"; // disamakan dg .env kamu

    // NOTE: pastikan XENDIT_API_KEY ada di .env.local
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
      }),
    });

    const invoice = await xenditResp.json();

    if (!xenditResp.ok) {
      console.error("Xendit error:", xenditResp.status, invoice);
      await Checkout.findByIdAndUpdate(doc._id, { status: "FAILED" });
      return res
        .status(502)
        .json({ message: "Gagal membuat invoice", xendit: invoice });
    }

    // 3) simpan id invoice dari Xendit
    await Checkout.findByIdAndUpdate(doc._id, {
      invoiceId: invoice.id,
      externalId: invoice.external_id,
      invoiceUrl: invoice.invoice_url,
      status: "PENDING",
    });

    // 4) Kirim WA (non-blocking, jangan gagalkan checkout kalau gagal)
    if (rawPhone) {
      try {
        const to = toWhatsAppE164(rawPhone);
        const body =
`Halo ${payerName || "Customer"} 👋
Pesanan kamu #${doc._id} sudah kami terima ✅
Total: Rp ${Number(total).toLocaleString("id-ID")}
Invoice: ${invoice.invoice_url}

Silakan selesaikan pembayaran. Terima kasih!`;
        await sendWaText({ to, body });
        // update flag notified
        await Checkout.findByIdAndUpdate(doc._id, { "notified.checkout": true });
      } catch (e) {
        console.error("WA checkout fail:", e.message);
        // sengaja tidak throw
      }
    }

    // 5) response ke FE
    return res.status(201).json({
      checkoutId: String(doc._id),
      total,
      status: "PENDING",
      invoiceUrl: invoice.invoice_url,
    });
  } catch (err) {
    console.error("Checkout API error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
