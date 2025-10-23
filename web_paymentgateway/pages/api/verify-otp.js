import User from "../../models/User";
import { connectDB } from "../../lib/db";

export default async function handler(req, res) {
  await connectDB();

  if (req.method === "POST") {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    try {
      // Cari pengguna berdasarkan OTP
      const user = await User.findOne({ otp });

      if (!user) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      // Verifikasi OTP dan update status verifikasi
      user.isVerified = true;
      user.otp = undefined; // Hapus OTP setelah verifikasi
      await user.save();

      res.status(200).json({ message: "Account successfully verified!" });
    } catch (error) {
      res.status(500).json({ message: "Error while verifying OTP" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
