import { connectDB } from "../../../../lib/db";
import Product from "../../../../models/Product";
import { requireAdmin } from "../../../../lib/requireAdmin";

export default async function handler(req, res) {
  const gate = await requireAdmin(req, res);
  if (!gate.ok) return res.status(gate.status).json({ message: gate.msg });

  await connectDB();

  try {
    // GET: list all products
    if (req.method === "GET") {
      const products = await Product.find().sort({ createdAt: -1 }).lean();
      return res.status(200).json({ products });
    }

    // POST: create new product
    if (req.method === "POST") {
      // accept both `image` and legacy `imageUrl`
      let { name, sku, price, stock, image, imageUrl, category } = req.body;

      // coerce numbers safely
      const priceNum = Number(price);
      const stockNum = stock === undefined || stock === null || stock === "" ? 0 : Number(stock);

      // fallback: map imageUrl -> image
      if (!image && imageUrl) image = imageUrl;

      // basic validation
      if (!name || Number.isNaN(priceNum)) {
        return res.status(400).json({ message: "Nama dan harga wajib diisi dan valid." });
      }

      const created = await Product.create({
        name: String(name),
        sku: sku ? String(sku) : undefined,
        price: priceNum,
        stock: Number.isNaN(stockNum) ? 0 : stockNum,
        image: image ? String(image) : "",
        category: category ? String(category) : undefined,
      });

      return res.status(201).json({ product: created });
    }

    return res.status(405).json({ message: "Method Not Allowed" });
  } catch (err) {
    // Handle duplicate SKU nicely
    if (err?.code === 11000 && err?.keyPattern?.sku) {
      return res.status(409).json({ message: "SKU sudah digunakan. Gunakan SKU lain." });
    }
    console.error("Error in /api/admin/products:", err);
    return res.status(500).json({ message: "Server error", error: err?.message || String(err) });
  }
}
