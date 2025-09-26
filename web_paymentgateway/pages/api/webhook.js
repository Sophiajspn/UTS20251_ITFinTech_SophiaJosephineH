import { connectDB } from "@/lib/db";
import Checkout from "@/models/Checkout";

export const config = { api: { bodyParser: false } }; // terima raw body

function readRawBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk });
    req.on("end", () => resolve(data));
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  // (opsional) verifikasi token callback
  const token = req.headers["x-callback-token"];
  if (process.env.XENDIT_WEBHOOK_TOKEN && token !== process.env.XENDIT_WEBHOOK_TOKEN) {
    return res.status(401).end();
  }

  const raw = await readRawBody(req);
  const event = JSON.parse(raw || "{}");

  try {
    await connectDB();
    if (event.status === "PAID" && event.external_id) {
      await Checkout.findByIdAndUpdate(event.external_id, { status: "LUNAS" });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok:false, error:e.message });
  }
}
