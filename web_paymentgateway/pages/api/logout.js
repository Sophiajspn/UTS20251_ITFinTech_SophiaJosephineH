// pages/api/logout.js
import { serialize } from "cookie";

export default function handler(req, res) {
  // Hapus cookie 'token' dengan set maxAge = 0
  res.setHeader(
    "Set-Cookie",
    serialize("token", "", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false, // true kalau pakai HTTPS
      maxAge: 0, // hapus langsung
    })
  );
  return res.status(200).json({ message: "Logged out" });
}
