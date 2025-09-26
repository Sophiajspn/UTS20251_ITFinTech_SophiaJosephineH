import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, msg: "Use POST" });
  try {
    await connectDB();
    const before = await Product.countDocuments();
    await Product.deleteMany({});
    const docs = await Product.insertMany([
      { name: "Kopi Arabica", price: 35000, category: "Beverage" },
      { name: "Susu UHT",     price: 18000, category: "Dairy" },
      { name: "Cookies",      price: 22000, category: "Snack"  },
    ]);
    const after = await Product.countDocuments();
    res.json({ ok: true, before, inserted: docs.length, after });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
