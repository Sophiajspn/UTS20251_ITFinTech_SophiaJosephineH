import bcrypt from 'bcrypt';
import User from '../../models/User'; 
import { connectDB } from '../../lib/db';  
import twilio from 'twilio';  

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export default async function handler(req, res) {
  await connectDB();  

  if (req.method === 'POST') {
    const { name, email, phone, password, role } = req.body;  

    // Validasi input
    if (!email || !password || !name || !phone || !role) {  
      return res.status(400).json({ message: 'All fields are required' });
    }

    try {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number already exists' });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        name,
        email,
        phone,
        password: hashedPassword,
        role,  
        isVerified: false, 
      });

      await newUser.save();

      const otp = Math.floor(100000 + Math.random() * 900000); // OTP 6 digit

      const phoneWithCountryCode = phone.startsWith('+') ? phone : `+62${phone.slice(1)}`; // Misalnya untuk Indonesia

      const message = await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${phoneWithCountryCode}`,
        body: `Your OTP code is: ${otp}`,
      });

      console.log("OTP sent:", message.sid);

      newUser.otp = otp;
      await newUser.save();

      res.status(201).json({ message: 'User registered successfully! Please check your WhatsApp for the OTP.' });

    } catch (error) {
      console.error(error);  
      res.status(500).json({ message: 'Error while registering user' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
