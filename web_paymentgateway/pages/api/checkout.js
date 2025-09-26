import { connectDB } from "@/lib/db";
import Checkout from "@/models/Checkout";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  await connectDB();
  const { items } = req.body; // [{_id,name,price,qty}]
  const total = items.reduce((s,i)=>s + i.price*i.qty, 0);
  const doc = await Checkout.create({
    items: items.map(i => ({
      productId: i._id, name: i.name, price: i.price, qty: i.qty
    })),
    total,
  });
  res.json({ checkoutId: String(doc._id), total, status: doc.status });
}
