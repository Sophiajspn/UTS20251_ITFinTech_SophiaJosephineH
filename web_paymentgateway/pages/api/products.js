import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

export default async function handler(req, res) {
  await connectDB();
  const products = await Product.find().lean();
  res.json(products);
}
