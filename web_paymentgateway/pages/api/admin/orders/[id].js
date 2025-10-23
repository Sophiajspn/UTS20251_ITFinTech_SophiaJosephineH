import { connectDB } from "../../../../lib/db";
import Order from "../../../../models/Order";
import { requireAdmin } from "../../../../lib/requireAdmin";

export default async function handler(req, res) {
  const gate = await requireAdmin(req, res);
  if (!gate.ok) return res.status(gate.status).json({ message: gate.msg });

  await connectDB();
  const { id } = req.query;

  if (req.method === "PATCH") {
    const { status } = req.body; // "waiting" | "paid"
    const updated = await Order.findByIdAndUpdate(id, { status }, { new: true });
    return res.json({ order: updated });
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}
