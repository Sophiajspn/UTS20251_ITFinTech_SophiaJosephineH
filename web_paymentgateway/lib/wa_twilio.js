import twilio from "twilio";

let client = null;

function getClient() {
  if (client) return client;

  const sid   = (process.env.TWILIO_SID || "").trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  const from  = (process.env.TWILIO_WHATSAPP_NUMBER || "").trim();

  // 🔍 Masked logs (cek env yang TERBACA runtime)
  console.log("[TW ENV] SID starts:", sid.slice(0, 2), "ends:", sid.slice(-6));
  console.log("[TW ENV] TOKEN len:", token.length);
  console.log("[TW ENV] FROM:", from);

  if (!sid || !sid.startsWith("AC")) {
    throw new Error("Invalid TWILIO_SID (must start with 'AC'). Check .env.local");
  }
  if (!token) {
    throw new Error("Missing TWILIO_AUTH_TOKEN. Check .env.local");
  }
  if (!from) {
    throw new Error("Missing TWILIO_WHATSAPP_NUMBER. Check .env.local");
  }

  client = twilio(sid, token);
  return client;
}

/** Ubah 08xx / +62xx → whatsapp:+62xx */
export function toWhatsAppE164(phone) {
  const p = String(phone || "").replace(/\D/g, "");
  if (!p) throw new Error("No phone provided");
  if (p.startsWith("62")) return `whatsapp:+${p}`;
  if (p.startsWith("0"))  return `whatsapp:+62${p.slice(1)}`;
  if (p.startsWith("8"))  return `whatsapp:+62${p}`;
  return `whatsapp:+${p}`;
}

/** Kirim WhatsApp via Twilio (free-form; untuk sandbox/24h window) */
export async function sendWaText({ to, body }) {
  try {
    const cli  = getClient();
    const from = `whatsapp:${(process.env.TWILIO_WHATSAPP_NUMBER || "").trim()}`;

    console.log("TWILIO FROM:", from);
    console.log("TWILIO TO:", to, "BODY:", String(body || "").slice(0, 60));

    const msg = await cli.messages.create({ from, to, body });
    console.log("WA sent ✅:", msg.sid);
    return msg.sid;
  } catch (err) {
    console.error("WA send error ❌:", {
      message: err.message,
      code: err.code,
      status: err.status,
      moreInfo: err.moreInfo,
    });
    throw err; // biar caller bisa handle
  }
}