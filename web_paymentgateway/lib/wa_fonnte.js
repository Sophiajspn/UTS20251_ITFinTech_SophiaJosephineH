import axios from "axios";

let fonnteToken = null;

function getToken() {
  if (fonnteToken) return fonnteToken;

  const token = (process.env.FONNTE_TOKEN || "").trim();

  // 🔍 Masked logs (cek env yang TERBACA runtime)
  console.log("[FONNTE ENV] TOKEN starts:", token.slice(0, 4), "ends:", token.slice(-6));
  console.log("[FONNTE ENV] TOKEN len:", token.length);

  if (!token) {
    throw new Error("Missing FONNTE_TOKEN. Check .env.local");
  }
  if (token.length < 10) {
    throw new Error("Invalid FONNTE_TOKEN (too short). Check .env.local");
  }

  fonnteToken = token;
  return fonnteToken;
}

/** Ubah 08xx / +62xx / whatsapp:+62xx → 62xx (format Fonnte) */
export function toFonnteFormat(phone) {
  const p = String(phone || "")
    .replace(/\D/g, "") // hapus semua non-digit
    .replace(/^whatsapp:/, ""); // hapus prefix whatsapp:

  if (!p) throw new Error("No phone provided");
  
  // Normalize ke format 62xxx
  if (p.startsWith("62")) return p;
  if (p.startsWith("0"))  return `62${p.slice(1)}`;
  if (p.startsWith("8"))  return `62${p}`;
  
  return p;
}

/** Kirim WhatsApp via Fonnte */
export async function sendWaText({ to, body }) {
  try {
    const token = getToken();
    const cleanNumber = toFonnteFormat(to);

    console.log("FONNTE TO:", cleanNumber);
    console.log("FONNTE BODY:", String(body || "").slice(0, 60));

    const response = await axios.post(
      "https://api.fonnte.com/send",
      {
        target: cleanNumber,
        message: body,
        countryCode: "62"
      },
      {
        headers: {
          "Authorization": token
        }
      }
    );

    if (response.data.status) {
      console.log("WA sent ✅:", response.data.id || "success");
      console.log("Response:", response.data);
      return response.data.id || response.data;
    } else {
      throw new Error(response.data.reason || "Failed to send message");
    }

  } catch (err) {
    console.error("WA send error ❌:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });
    throw err; // biar caller bisa handle
  }
}

// Helper functions untuk notifikasi pembayaran (opsional)
export async function sendPaymentPending({ to, orderId, amount, paymentUrl }) {
  const body = `🛒 *Pesanan Diterima!*

Halo! Pesanan kamu telah diterima.

📦 Order ID: ${orderId}
💰 Total: Rp ${amount.toLocaleString("id-ID")}

⏰ *Harap selesaikan pembayaran dalam 24 jam*

Link pembayaran: ${paymentUrl}

Terima kasih! 🙏`;

  return await sendWaText({ to, body });
}

export async function sendPaymentSuccess({ to, orderId, amount }) {
  const body = `✅ *Pembayaran Berhasil!*

Yeay! Pembayaran kamu telah diterima.

📦 Order ID: ${orderId}
💰 Total: Rp ${amount.toLocaleString("id-ID")}

Pesanan kamu akan segera diproses. 🎉

Terima kasih sudah berbelanja! 🙏`;

  return await sendWaText({ to, body });
}