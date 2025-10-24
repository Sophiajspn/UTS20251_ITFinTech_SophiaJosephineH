import jwt from "jsonwebtoken";

export async function requireAdmin(req) {
  const bearer = req.headers.authorization || "";
  const headerToken = bearer.startsWith("Bearer ") ? bearer.slice(7) : null;
  const cookieToken = req.cookies?.token;
  const token = cookieToken || headerToken;

  if (!token) return { ok: false, status: 401, msg: "Unauthenticated" };

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") {
      return { ok: false, status: 403, msg: "Forbidden — admin only" };
    }
    return { ok: true, user: payload };
  } catch (e) {
    return { ok: false, status: 401, msg: "Unauthenticated" };
  }
}
