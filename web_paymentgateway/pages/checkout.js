import { useEffect, useState } from "react";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [checkoutId, setCheckoutId] = useState(null);
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);

  useEffect(()=>{
    const saved = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(saved);
  },[]);

  async function createCheckout() {
    const r = await fetch("/api/checkout", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ items: cart })
    });
    const data = await r.json();
    setCheckoutId(data.checkoutId);
  }

  async function payNow() {
    if (!checkoutId) await createCheckout();
    const id = checkoutId || (await (await fetch("/api/checkout", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ items: cart })
    })).json()).checkoutId;

    const r = await fetch("/api/payment", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ checkoutId: id })
    });
    const data = await r.json();
    if (data.invoice_url) {
      // kosongkan cart, lalu redirect ke halaman pembayaran Xendit
      localStorage.removeItem("cart");
      window.location.href = data.invoice_url;
    } else {
      alert("Gagal membuat invoice");
    }
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Checkout</h1>

      {cart.length === 0 ? <p>Cart kosong.</p> : (
        <>
          <ul className="divide-y">
            {cart.map(i=>(
              <li key={i._id} className="py-2 flex justify-between">
                <span>{i.name} x {i.qty}</span>
                <span>Rp {(i.price*i.qty).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between font-semibold">
            <span>Total</span>
            <span>Rp {total.toLocaleString()}</span>
          </div>

          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 border rounded" onClick={createCheckout}>
              Save Checkout
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={payNow}>
              Bayar
            </button>
          </div>
          {checkoutId && <p className="mt-2 text-sm">Checkout ID: {checkoutId}</p>}
        </>
      )}
    </main>
  );
}
