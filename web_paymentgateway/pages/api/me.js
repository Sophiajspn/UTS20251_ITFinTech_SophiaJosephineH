import jwt from "jsonwebtoken";

export default function handler(req, res) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(200).json({ authenticated: false, user: null });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({
      authenticated: true,
      user: { email: decoded.email, role: decoded.role, userId: decoded.userId },
    });
  } catch {
    return res.status(200).json({ authenticated: false, user: null });
  }
}
