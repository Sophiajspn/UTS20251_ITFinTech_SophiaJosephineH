import { connectDB } from "../../../../lib/db";
import Order from "../../../../models/Checkout";
import { requireAdmin } from "../../../../lib/requireAdmin";

export default async function handler(req, res) {
  const gate = await requireAdmin(req, res);
  if (!gate.ok) return res.status(gate.status).json({ message: gate.msg });

  await connectDB();

  const { range = "day" } = req.query;
  const dateFormat = range === "month" ? "%Y-%m" : "%Y-%m-%d";

  const data = await Order.aggregate([
    { $match: { status: "paid" } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
        totalAmount: { $sum: "$total" },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const labels = data.map(d => d._id);
  const amounts = data.map(d => d.totalAmount);
  const counts = data.map(d => d.count);

  res.json({ labels, amounts, counts });
}
