import { connectDB } from "@/lib/db";
import Checkout from "@/models/Checkout";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { checkoutId } = req.body;
  if (!checkoutId) return res.status(400).json({ ok:false, error:"checkoutId required" });

  await connectDB();
  const co = await Checkout.findById(checkoutId);
  if (!co) return res.status(404).json({ ok:false, error:"checkout not found" });

  // create invoice ke Xendit (REST)
  const resp = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Basic Auth: username = secret key, password kosong
      Authorization: "Basic " + Buffer.from(process.env.XENDIT_SECRET + ":").toString("base64"),
    },
    body: JSON.stringify({
      external_id: checkoutId,
      amount: co.total,
      payer_email: "customer@example.com",
      description: "Checkout " + checkoutId,
      success_redirect_url: process.env.APP_BASE_URL + "/payment?status=success&cid=" + checkoutId,
      failure_redirect_url: process.env.APP_BASE_URL + "/payment?status=failed&cid=" + checkoutId,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) return res.status(500).json({ ok:false, error:data.message || "xendit error" });

  res.json({ ok:true, invoice_id:data.id, invoice_url:data.invoice_url });
}
