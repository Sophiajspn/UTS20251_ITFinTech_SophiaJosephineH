import { connectDB } from "@/lib/db";
import Checkout from "@/models/Checkout";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  await connectDB();
  const { items } = req.body; // [{productId,name,price,qty}]
  const total = items.reduce((s,i)=>s + i.price*i.qty, 0);
  const doc = await Checkout.create({ items, total });
  res.json({ id: doc._id, total, status: doc.status });
}
