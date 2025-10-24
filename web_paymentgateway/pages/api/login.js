import bcrypt from "bcrypt"; // atau "bcryptjs" kalau kamu pakai itu
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import User from "../../models/User";
import { connectDB } from "../../lib/db";

// 🔹 Fungsi untuk menentukan role berdasarkan domain email
function deriveRoleFromEmail(email) {
  // ADMIN kalau pakai email @domain.com, sisanya CUSTOMER
  return email.toLowerCase().endsWith("@domain.com") ? "admin" : "customer";
}

export default async function handler(req, res) {
  await connectDB();

  // Hanya izinkan metode POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // 🔹 Cek apakah user ada di database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔹 Bandingkan password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔹 Tentukan role berdasarkan email
    const derivedRole = deriveRoleFromEmail(user.email);

    // Update role di DB kalau belum sesuai
    if (user.role !== derivedRole) {
      user.role = derivedRole;
      await user.save();
    }

    // 🔹 Pastikan JWT_SECRET tersedia
    if (!process.env.JWT_SECRET) {
      console.error("❌ Missing JWT_SECRET in environment variables");
      return res.status(500).json({ message: "Server misconfigured" });
    }

    // 🔹 Buat payload JWT
    const payload = {
      userId: String(user._id),
      email: user.email,
      role: derivedRole,
    };

    // 🔹 Generate token JWT (berlaku 7 hari)
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

    // 🔹 Set cookie untuk simpan token JWT
    const isProd = process.env.NODE_ENV === "production";

    res.setHeader(
      "Set-Cookie",
      serialize("token", token, {
        httpOnly: true,
        path: "/",
        sameSite: isProd ? "lax" : "lax", // "none" kalau FE & API beda domain
        secure: isProd, // true kalau HTTPS
        maxAge: 60 * 60 * 24 * 7, // 7 hari
      })
    );

    // 🔹 Kirim respons sukses
    return res.status(200).json({
      message: "Login successful",
      user: { email: user.email, role: derivedRole },
    });
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).json({ message: "Server error. Please try again" });
  }
}
