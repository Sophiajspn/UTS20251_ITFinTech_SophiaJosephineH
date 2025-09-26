import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  await connectDB();
  await Product.deleteMany({});
  await Product.insertMany([
    { name: "Kopi Arabica", price: 35000, category: "Beverage" },
    { name: "Susu UHT",     price: 18000, category: "Dairy" },
    { name: "Cookies",      price: 22000, category: "Snack"  },
  ]);
  res.json({ ok: true });
}
