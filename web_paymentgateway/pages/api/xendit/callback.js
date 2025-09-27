export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    // (Disarankan) verifikasi token callback dari Xendit
    const token = req.headers["x-callback-token"];
    if (process.env.XENDIT_CALLBACK_TOKEN && token !== process.env.XENDIT_CALLBACK_TOKEN) {
      console.warn("Invalid callback token");
      return res.status(401).json({ ok: false });
    }

    const evt = req.body; // Xendit kirim JSON
    console.log("XENDIT CALLBACK RECEIVED:", JSON.stringify(evt));

    // Ambil status dari beberapa kemungkinan field
    const status =
      (evt.status || evt.payment_status || evt.data?.status || "").toString().toUpperCase();

    if (status === "PAID") {
      const id = evt.id || evt.invoice_id || evt.data?.id;
      console.log("LUNAS:", id || "(no id)");
      // TODO: update DB kamu ke status 'paid'
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Callback error:", e);
    return res.status(500).json({ ok: false });
  }
}
