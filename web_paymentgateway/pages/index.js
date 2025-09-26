import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetch("/api/products").then(r=>r.json()).then(setProducts);
    const saved = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(saved);
  }, []);

  function addToCart(p) {
    const next = (() => {
      const f = cart.find(i => i._id === p._id);
      if (f) return cart.map(i => i._id===p._id ? {...i, qty:i.qty+1} : i);
      return [...cart, { _id:p._id, name:p.name, price:p.price, qty:1 }];
    })();
    setCart(next);
    localStorage.setItem("cart", JSON.stringify(next));
  }

  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Select Items</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map(p => (
          <div key={p._id} className="border rounded-lg p-4 shadow">
            <h2 className="font-semibold">{p.name}</h2>
            <p className="text-sm opacity-70">{p.category}</p>
            <p className="mt-2 font-bold">Rp {p.price.toLocaleString()}</p>
            <button className="mt-3 px-3 py-2 bg-blue-600 text-white rounded" onClick={()=>addToCart(p)}>
              Add
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Cart total: Rp {total.toLocaleString()}</div>
          <Link href="/checkout" className="px-4 py-2 bg-black text-white rounded">
            Go to Checkout
          </Link>
        </div>
    </div>
    </main>
  );
}
