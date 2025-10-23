import { connectDB } from "../../../../lib/db";
import Product from "../../../../models/Product";
import { requireAdmin } from "../../../../lib/requireAdmin";

export default async function handler(req, res) {
  const gate = await requireAdmin(req, res);
  if (!gate.ok) return res.status(gate.status).json({ message: gate.msg });

  await connectDB();
  const { id } = req.query;

  if (req.method === "PUT") {
    const { name, sku, price, stock, imageUrl } = req.body;
    const updated = await Product.findByIdAndUpdate(id, { name, sku, price, stock, imageUrl }, { new: true });
    return res.json({ product: updated });
  }

  if (req.method === "DELETE") {
    await Product.findByIdAndDelete(id);
    return res.json({ ok: true });
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}
