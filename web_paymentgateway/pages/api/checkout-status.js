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

    const cleanItems = items.map((i) => ({
      productId: i._id,
      name: String(i.name || ""),
      price: Number(i.price),
      qty: Number(i.qty),
    }));

    const total = cleanItems.reduce((s, i) => s + i.price * i.qty, 0);

    // 1️⃣ simpan ke Mongo
    const doc = await Checkout.create({
      payerEmail,
      items: cleanItems,
      total,
    });

    // 2️⃣ buat invoice Xendit
    const response = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          process.env.XENDIT_API_KEY + ":"
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        external_id: `checkout-${doc._id}`,
        amount: total,
        payer_email: payerEmail,
        description: `Invoice untuk pesanan ${doc._id}`,
        success_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?inv=${doc._id}`,
        failure_redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/failed?inv=${doc._id}`,
      }),
    });

    const invoice = await response.json();

    if (!response.ok) {
      console.error("Xendit error:", invoice);
      return res
        .status(500)
        .json({ message: "Gagal membuat invoice", error: invoice });
    }

    await Checkout.findByIdAndUpdate(doc._id, {
      invoiceId: invoice.id,
      externalId: invoice.external_id,
    });

    return res.status(201).json({
      checkoutId: String(doc._id),
      total,
      status: doc.status,
      invoiceUrl: invoice.invoice_url, 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
