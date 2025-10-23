import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../../models/User'; 
import { connectDB } from '../../lib/db';

export default async function handler(req, res) {
  await connectDB();  

  if (req.method === 'POST') {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({ message: 'Login successful', token, role: user.role });

    } catch (error) {
      console.error('Error during login:', error);  
      res.status(500).json({ message: 'Server error. Please try again' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
