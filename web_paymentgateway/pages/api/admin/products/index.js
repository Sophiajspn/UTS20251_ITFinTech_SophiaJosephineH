import { connectDB } from "../../../../lib/db";
import Product from "../../../../models/Product";
import { requireAdmin } from "../../../../lib/requireAdmin";

export default async function handler(req, res) {
  const gate = await requireAdmin(req, res);
  if (!gate.ok) return res.status(gate.status).json({ message: gate.msg });

  await connectDB();

  if (req.method === "GET") {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.json({ products });
  }

  if (req.method === "POST") {
    const { name, sku, price, stock, imageUrl } = req.body;
    const created = await Product.create({ name, sku, price, stock, imageUrl });
    return res.status(201).json({ product: created });
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}
