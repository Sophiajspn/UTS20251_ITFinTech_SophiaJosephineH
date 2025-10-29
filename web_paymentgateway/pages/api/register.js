import bcrypt from 'bcrypt';
import User from '../../models/User'; 
import { connectDB } from '../../lib/db';  
import { sendWaText, toFonnteFormat } from '@/lib/wa_fonnte'; 

export default async function handler(req, res) {
  await connectDB();  

  if (req.method === 'POST') {
    const { name, email, phone, password, role } = req.body;  

    // Validasi input
    if (!email || !password || !name || !phone || !role) {  
      return res.status(400).json({ message: 'All fields are required' });
    }

    try {
      // Cek phone sudah ada atau belum
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number already exists' });
      }

      // Cek email sudah ada atau belum
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate OTP 6 digit
      const otp = Math.floor(100000 + Math.random() * 900000);

      // Simpan user dengan OTP
      const newUser = new User({
        name,
        email,
        phone,
        password: hashedPassword,
        role,  
        isVerified: false,
        otp, // ✅ Simpan OTP langsung
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      });

      await newUser.save();

      // ✅ Kirim OTP via Fonnte (non-blocking)
      try {
        const to = toFonnteFormat(phone);
        const body = `Halo *${name}*! 👋

Kode OTP kamu untuk verifikasi akun:

*${otp}*

Kode berlaku selama 10 menit.

Jangan bagikan kode ini ke siapa pun! 🔒`;

        await sendWaText({ to, body });
        console.log("✅ OTP sent to:", to);

      } catch (waError) {
        console.error("⚠️ Failed to send OTP via WA:", waError.message);
        // Tidak throw error, registrasi tetap sukses
        // User bisa request resend OTP
      }

      res.status(201).json({ 
        message: 'Registrasi berhasil! Cek WhatsApp kamu untuk kode OTP.',
        userId: newUser._id 
      });

    } catch (error) {
      console.error("❌ Register error:", error);  
      res.status(500).json({ message: 'Error saat registrasi user' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}