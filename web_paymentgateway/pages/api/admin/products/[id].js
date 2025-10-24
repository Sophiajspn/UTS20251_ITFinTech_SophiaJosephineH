import { connectDB } from "../../../../lib/db";
import Product from "../../../../models/Product";
import { requireAdmin } from "../../../../lib/requireAdmin";

export default async function handler(req, res) {
  const gate = await requireAdmin(req, res);
  if (!gate.ok) return res.status(gate.status).json({ message: gate.msg });

  await connectDB();
  const { id } = req.query;

  try {
    if (req.method === "PUT") {
      let { name, sku, price, stock, image, imageUrl, category } = req.body;

      if (!image && imageUrl) image = imageUrl;

      const updateData = {
        name,
        sku,
        price: Number(price),
        stock: Number(stock),
        image: image || "",
        category,
      };

      const updated = await Product.findByIdAndUpdate(id, updateData, { new: true });

      if (!updated) {
        return res.status(404).json({ message: "Produk tidak ditemukan." });
      }

      return res.status(200).json({ product: updated });
    }

    if (req.method === "DELETE") {
      const deleted = await Product.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: "Produk tidak ditemukan." });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ message: "Method Not Allowed" });
  } catch (err) {
    console.error("Error in /api/admin/products/[id]:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}
