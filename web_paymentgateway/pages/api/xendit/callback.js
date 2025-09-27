// pages/api/xendit/callback.js
import { connectDB } from "@/lib/db";
import Checkout from "@/models/Checkout";

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" }, // biar JSON besar bisa masuk
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    // (Opsional) verifikasi token dari Xendit
    const token = req.headers["x-callback-token"];
    if (
      process.env.XENDIT_CALLBACK_TOKEN &&
      token !== process.env.XENDIT_CALLBACK_TOKEN
    ) {
      console.warn("Invalid callback token");
      return res.status(401).json({ ok: false });
    }

    const evt = req.body; // payload dari Xendit
    const status =
      (evt.status || evt.payment_status || evt.data?.status || "")
        .toString()
        .toUpperCase();

    const externalId = evt.external_id || evt.data?.external_id || null;
    const invoiceId = evt.id || evt.invoice_id || evt.data?.id || null;

    console.log("Webhook received!");
    console.log(
      `Webhook data: external_id=${externalId || "-"}, status=${status || "-"}`
    );

    // Connect ke DB
    await connectDB();

    // Tentukan query pakai externalId dulu, fallback ke invoiceId
    const query = externalId ? { externalId } : { invoiceId };

    if (status === "PAID") {
      await Checkout.findOneAndUpdate(query, { status: "PAID", invoiceId }, { new: true });
      console.log(
        `Webhook SUCCESS: Payment ${externalId || invoiceId} updated to PAID.`
      );
    } else if (status === "EXPIRED") {
      await Checkout.findOneAndUpdate(query, { status: "EXPIRED" });
      console.log(`Webhook: ${externalId || invoiceId} -> EXPIRED`);
    } else if (status) {
      await Checkout.findOneAndUpdate(query, { status });
      console.log(`Webhook: ${externalId || invoiceId} -> ${status}`);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Callback error:", e);
    return res.status(500).json({ ok: false });
  }
}
