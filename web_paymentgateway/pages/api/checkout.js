import { connectDB } from "@/lib/db";
import Checkout from "@/models/Checkout";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    await connectDB();

    const { items, payerEmail: rawEmail } = req.body;
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
      items: cleanItems,
      total,
    });

    // 2) panggil Xendit buat invoice
    const externalId = `checkout-${doc._id}`; // dijamin unik
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // NOTE: pastikan XENDIT_API_KEY ada di .env.local
    const auth = Buffer.from(`${process.env.XENDIT_API_KEY}:`).toString(
      "base64"
    );

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
      // log detail error biar gampang debug
      console.error("Xendit error:", xenditResp.status, invoice);
      // rollback status optional: bisa tandai FAILED
      await Checkout.findByIdAndUpdate(doc._id, { status: "FAILED" });
      return res
        .status(502)
        .json({
          message: "Gagal membuat invoice",
          xendit: invoice, // kirim balik detail agar keliatan di FE
        });
    }

    // 3) simpan id invoice dari Xendit
    await Checkout.findByIdAndUpdate(doc._id, {
      invoiceId: invoice.id,
      externalId: invoice.external_id,
    });

    // 4) kirim ke FE
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