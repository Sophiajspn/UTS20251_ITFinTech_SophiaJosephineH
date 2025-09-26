import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [checkoutId, setCheckoutId] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(saved);
  }, []);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const shipping = 0; // cafe pickup / flat Rp0
  const total = subtotal + shipping;

  async function createCheckout() {
    const r = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart }),
    });
    const data = await r.json();
    setCheckoutId(data.checkoutId);
  }

  async function payNow() {
    if (!checkoutId) await createCheckout();
    const id =
      checkoutId ||
      (await (
        await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cart }),
        })
      ).json()).checkoutId;

    const r = await fetch("/api/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkoutId: id }),
    });
    const data = await r.json();
    if (data.invoice_url) {
      localStorage.removeItem("cart");
      window.location.href = data.invoice_url;
    } else {
      alert("Gagal membuat invoice");
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
                <h2 className="mb-3 border-b pb-3 text-lg font-semibold">Item di Keranjang</h2>

                <ul className="divide-y">
                  {cart.map((i) => (
                    <li key={i._id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3">
                        {/* avatar huruf (kalau ga ada gambar) */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700 font-semibold">
                          {i.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{i.name}</div>
                          <div className="text-xs text-neutral-500">Qty: {i.qty}</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold">Rp {(i.price * i.qty).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Right: Summary */}
            <aside className="md:col-span-1">
              <div className="sticky top-20 rounded-2xl border bg-white p-4 shadow-sm">
                <h2 className="mb-3 border-b pb-3 text-lg font-semibold">Ringkasan</h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Subtotal</span>
                    <span>Rp {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Pengiriman</span>
                    <span>{shipping === 0 ? "Gratis" : `Rp ${shipping.toLocaleString()}`}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t pt-3 font-semibold">
                    <span>Total</span>
                    <span>Rp {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={createCheckout}
                    className="w-full rounded-full border px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                  >
                    Save Checkout
                  </button>
                  <button
                    onClick={payNow}
                    className="w-full rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
                  >
                    Bayar Sekarang
                  </button>
                </div>

                {checkoutId && (
                  <p className="mt-3 truncate text-center text-xs text-neutral-500">
                    Checkout ID: <span className="font-mono">{checkoutId}</span>
                  </p>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
