// pages/api/webhook/xendit.js
import { connectDB } from "@/lib/db";
import Checkout from "@/models/Checkout";
import Payment from "@/models/Payment";
import { sendWaText, toFonnteFormat } from "@/lib/wa_fonnte";

export default async function handler(req, res) {
  // 1. Verifikasi callback token
  const headerToken = req.headers["x-callback-token"];
  const expected = process.env.XENDIT_CB_TOKEN || process.env.XENDIT_WEBHOOK_TOKEN;
  
  if (expected && headerToken !== expected) {
    console.log("❌ Invalid callback token");
    return res.status(401).json({ error: "invalid callback token" });
  }
  
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    await connectDB();

    const payload = req.body || {};
    const d = payload.data && typeof payload.data === "object" ? payload.data : payload;

    const invoiceId = d.id || d.invoice_id;
    const status = String(d.status || "").toUpperCase(); // PENDING | PAID | EXPIRED
    const externalId = d.external_id || d.merchant_external_id;

    console.log("📨 Webhook received:", { invoiceId, status, externalId });

    // Simpan log Payment
    if (invoiceId) {
      await Payment.findOneAndUpdate(
        { invoiceId },
        { status, raw: payload },
        { upsert: true, new: true }
      );
    }

    // --- Cari dokumen checkout ---
    let checkoutDoc = null;

    // 1) Coba lewat invoiceId (paling akurat)
    if (invoiceId) {
      checkoutDoc = await Checkout.findOne({ invoiceId });
    }

    // 2) Fallback: pakai external_id -> buang prefix "checkout-"
    if (!checkoutDoc && externalId) {
      const maybeId = String(externalId).startsWith("checkout-")
        ? String(externalId).slice("checkout-".length)
        : String(externalId);
      
      try {
        checkoutDoc = await Checkout.findById(maybeId);
      } catch (err) {
        console.log("⚠️ Invalid ObjectId:", maybeId);
      }
    }

    if (!checkoutDoc) {
      console.log("⚠️ Checkout not found for:", { invoiceId, externalId });
      return res.json({ ok: true, message: "checkout not found" });
    }

    console.log("✅ Checkout found:", checkoutDoc._id);

    // --- Handle status PAID ---
    if (status === "PAID") {
      // Cek apakah sudah pernah notifikasi
      const alreadyNotified = checkoutDoc.notified?.paid === true;

      if (!alreadyNotified) {
        // Update status + flag notified
        await Checkout.findByIdAndUpdate(checkoutDoc._id, {
          status: "LUNAS",
          "notified.paid": true,
          paidAt: new Date()
        });

        // Kirim WA
        const rawPhone = checkoutDoc.payerPhone || d?.customer?.phone || d?.payer_phone || "";
        const to = rawPhone ? toFonnteFormat(rawPhone) : null;
        const name = checkoutDoc.payerName || d?.customer?.given_names || "Pelanggan";

        if (to) {
          const message = 
            `🎉 Halo *${name}*, pembayaran kamu sudah *BERHASIL*!\n\n` +
            `Pesanan #${checkoutDoc._id} akan segera kami proses.\n\n` +
            `Terima kasih sudah berbelanja di Bonoya Café ☕`;

          await sendWaText({ to, body: message });
          console.log("✅ WA sent to:", to);
        } else {
          console.log("⚠️ No valid phone number:", rawPhone);
        }
      } else {
        console.log("ℹ️ Already notified for PAID status");
      }
    }

    // --- Handle status EXPIRED (opsional) ---
    if (status === "EXPIRED") {
      const alreadyNotified = checkoutDoc.notified?.expired === true;

      if (!alreadyNotified) {
        await Checkout.findByIdAndUpdate(checkoutDoc._id, {
          status: "EXPIRED",
          "notified.expired": true
        });

        const rawPhone = checkoutDoc.payerPhone;
        const to = rawPhone ? toFonnteFormat(rawPhone) : null;
        const name = checkoutDoc.payerName || "Pelanggan";

        if (to) {
          const message = 
            `⏰ Halo *${name}*, invoice pembayaran kamu sudah *KEDALUWARSA*.\n\n` +
            `Silakan buat pesanan baru jika masih ingin order. Terima kasih!`;

          await sendWaText({ to, body: message });
          console.log("✅ Expired notification sent to:", to);
        }
      }
    }

    return res.json({ ok: true });

  } catch (e) {
    console.error("❌ WEBHOOK ERROR:", e);
    // Tetap balas 200 agar Xendit tidak retry terus
    return res.status(200).json({ ok: true, error: e.message });
  }
}