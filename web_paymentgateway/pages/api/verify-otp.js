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
      const user = await User.findOne({ otp });

      if (!user) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "Account already verified" });
      }

      if (user.otpExpiry && new Date() > user.otpExpiry) {
        return res.status(400).json({ 
          message: "OTP has expired. Please request a new one." 
        });
      }

      user.isVerified = true;
      user.otp = undefined; 
      user.otpExpiry = undefined; 
      await user.save();

      res.status(200).json({ 
        message: "Account successfully verified!",
        success: true 
      });

    } catch (error) {
      console.error("❌ Verify OTP error:", error);
      res.status(500).json({ message: "Error while verifying OTP" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}