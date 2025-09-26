import { connectDB } from "@/lib/db";
import Checkout from "@/models/Checkout";
import Payment from "@/models/Payment";

export default async function handler(req, res) {
  // verifikasi token callback
  const headerToken = req.headers["x-callback-token"];
  const expected =
    process.env.XENDIT_CB_TOKEN || process.env.XENDIT_WEBHOOK_TOKEN; // ← pakai salah satu
  if (expected && headerToken !== expected) {
    return res.status(401).json({ error: "invalid callback token" });
  }

  if (req.method !== "POST") return res.status(405).end();

  try {
    await connectDB();
    const payload = req.body || {};
    const data = payload.data || {};
    const status = (data.status || "").toUpperCase();

    if (data.id) {
      await Payment.findOneAndUpdate(
        { invoiceId: data.id },
        { status, raw: payload },
        { upsert: true, new: true }
      );
    }
    if (status === "PAID" && data.external_id) {
      await Checkout.findByIdAndUpdate(data.external_id, { status: "LUNAS" });
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error("WEBHOOK_ERR:", e);
    return res.status(500).json({ error: "webhook error" });
  }
}
