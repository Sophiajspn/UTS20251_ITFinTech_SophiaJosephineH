import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

export default async function handler(req, res) {
  try {
    await connectDB();
    const products = await Product.find().lean();
    res.json(products);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}