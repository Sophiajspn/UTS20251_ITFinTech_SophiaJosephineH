import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [checkoutId, setCheckoutId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(saved);
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0),
    [cart]
  );
  const shipping = 0; // cafe pickup / flat Rp0
  const total = subtotal + shipping;

  function isEmailValid(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function isPhoneValid(v) {
    // terima 08xxxx atau +62xxxx, panjang 10–15 digit setelah normalisasi
    const digits = String(v || "").replace(/\D/g, "");
    if (!digits) return false;
    const normalized = digits.startsWith("62")
      ? digits
      : digits.startsWith("0")
      ? `62${digits.slice(1)}`
      : digits.startsWith("8")
      ? `62${digits}`
      : digits;
    return normalized.length >= 10 && normalized.length <= 15;
  }

  async function createCheckout() {
    if (!email) return alert("Masukkan email dulu ya!");
    if (!isEmailValid(email)) return alert("Format email tidak valid.");
    if (!phone) return alert("Masukkan nomor WhatsApp kamu.");
    if (!isPhoneValid(phone)) return alert("Nomor WhatsApp tidak valid.");
    if (cart.length === 0) return alert("Keranjang masih kosong.");

    setSaving(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          payerEmail: email,
          payerPhone: phone,
          payerName: name || undefined,
        }),
      });
      const data = await r.json();

      if (!r.ok) {
        return alert(data?.message || "Gagal menyimpan checkout");
      }

      setCheckoutId(data.checkoutId || null);
      // ✅ Pesan lebih jelas untuk Fonnte
      alert("Checkout tersimpan ✅\nNotifikasi WhatsApp sedang dikirim...");
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan checkout");
    } finally {
      setSaving(false);
    }
  }

  async function payNow() {
    if (!email) return alert("Masukkan email dulu ya!");
    if (!isEmailValid(email)) return alert("Format email tidak valid.");
    if (!phone) return alert("Masukkan nomor WhatsApp kamu.");
    if (!isPhoneValid(phone)) return alert("Nomor WhatsApp tidak valid.");
    if (cart.length === 0) return alert("Keranjang masih kosong.");

    setPaying(true);
    try {
      // panggil endpoint yang sama: simpan checkout + buat invoice Xendit
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          payerEmail: email,
          payerPhone: phone,
          payerName: name || undefined,
        }),
      });
      const data = await r.json();

      if (!r.ok || !data.invoiceUrl) {
        return alert(data?.message || "Gagal membuat invoice");
      }

      // bersihkan keranjang & redirect ke halaman pembayaran Xendit
      localStorage.removeItem("cart");
      window.location.href = data.invoiceUrl;
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat membuat invoice");
    } finally {
      setPaying(false);
    }
  }

  return (
    <main className="min-h-screen">
      {/* pastel pink bg */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-pink-100 via-pink-50 to-pink-200" />

      <div className="mx-auto max-w-5xl px-5 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Checkout</h1>
          <Link href="/" className="text-sm text-rose-600 hover:underline">
            ← Kembali belanja
          </Link>
        </div>

        {cart.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
            <p className="text-neutral-600">Keranjang masih kosong.</p>
            <Link
              href="/"
              className="mt-4 inline-flex rounded-full bg-rose-500 px-5 py-2 text-sm font-medium text-white hover:bg-rose-600"
            >
              Mulai pilih menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Left: Items */}
            <section className="md:col-span-2">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <h2 className="mb-3 border-b pb-3 text-lg font-semibold">
                  Item di Keranjang
                </h2>

                <ul className="divide-y">
                  {cart.map((i) => (
                    <li
                      key={i._id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        {/* avatar huruf (kalau ga ada gambar) */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-semibold">
                          {i.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{i.name}</div>
                          <div className="text-xs text-neutral-500">
                            Qty: {i.qty}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        Rp {(Number(i.price) * Number(i.qty)).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Right: Summary */}
            <aside className="md:col-span-1">
              <div className="sticky top-20 rounded-2xl border bg-white p-4 shadow-sm">
                <h2 className="mb-3 border-b pb-3 text-lg font-semibold">
                  Ringkasan
                </h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Subtotal</span>
                    <span>Rp {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Pengiriman</span>
                    <span>
                      {shipping === 0
                        ? "Gratis"
                        : `Rp ${shipping.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t pt-3 font-semibold">
                    <span>Total</span>
                    <span>Rp {total.toLocaleString()}</span>
                  </div>

                  {/* Email input */}
                  <div className="pt-3">
                    <label className="text-xs text-neutral-600">
                      Email Pembeli <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contoh: kamu@gmail.com"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {/* Nama (opsional) */}
                  <div className="pt-3">
                    <label className="text-xs text-neutral-600">
                      Nama (opsional)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="contoh: Sophia"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {/* Nomor WhatsApp */}
                  <div className="pt-3">
                    <label className="text-xs text-neutral-600">
                      Nomor WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="081234567890"
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <p className="mt-1 text-[11px] text-neutral-500">
                      💬 Notifikasi pesanan & pembayaran akan dikirim via WhatsApp
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={createCheckout}
                    disabled={saving || paying}
                    className={`w-full rounded-full border px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 transition-colors`}
                  >
                    {saving ? "Menyimpan..." : "💾 Save Checkout"}
                  </button>
                  <button
                    onClick={payNow}
                    disabled={paying || saving}
                    className={`w-full rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors`}
                  >
                    {paying ? "Membuat Invoice..." : "💳 Bayar Sekarang"}
                  </button>
                </div>

                {checkoutId && (
                  <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-2">
                    <p className="text-center text-xs text-green-700">
                      ✅ Checkout berhasil!
                    </p>
                    <p className="mt-1 truncate text-center text-[10px] text-neutral-500">
                      ID: <span className="font-mono">{checkoutId}</span>
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}