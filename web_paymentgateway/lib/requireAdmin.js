import { connectDB } from "./db";
import User from "../models/User";

export async function requireAdmin(req, res) {
  await connectDB();

  const email = req.headers["x-user-email"]; 

  if (!email) return { ok: false, status: 401, msg: "Unauthenticated" };

  const user = await User.findOne({ email });
  if (!user) return { ok: false, status: 404, msg: "User not found" };

  if (user.role !== "admin") {
    return { ok: false, status: 403, msg: "Forbidden — admin only" };
  }

  return { ok: true, user };
}
