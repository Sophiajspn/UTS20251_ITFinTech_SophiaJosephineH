import { connectDB } from "@/lib/db";
import Checkout from "@/models/Checkout";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  const id = req.query.id;  // bisa pakai externalId atau _id
  if (!id) return res.status(400).json({ ok:false, error:"id required" });

  await connectDB();
  const doc = await Checkout.findOne({ externalId: id }).lean()
           || await Checkout.findById(id).lean();

  if (!doc) return res.status(404).json({ ok:false, error:"not found" });

  return res.status(200).json({
    ok: true,
    status: doc.status,
    total: doc.total,
    externalId: doc.externalId,
    invoiceId: doc.invoiceId,
  });
}
