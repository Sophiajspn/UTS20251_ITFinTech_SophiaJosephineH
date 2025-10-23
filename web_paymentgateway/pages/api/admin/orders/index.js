import { connectDB } from "../../../../lib/db";
import Order from "../../../../models/Checkout";
import { requireAdmin } from "../../../../lib/requireAdmin";

export default async function handler(req, res) {
  const gate = await requireAdmin(req, res);
  if (!gate.ok) return res.status(gate.status).json({ message: gate.msg });

  await connectDB();

  if (req.method === "GET") {
    const { status } = req.query; 
    const filter = status ? { status } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.json({ orders });
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}
