import { useEffect, useState } from "react";

export default function Home() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetch("/api/products").then(r=>r.json()).then(setItems);
  }, []);

  function addToCart(p) {
    setCart(prev => {
      const found = prev.find(i => i._id === p._id);
      if (found) return prev.map(i => i._id===p._id ? {...i, qty:i.qty+1} : i);
      return [...prev, {...p, qty:1}];
    });
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Select Items</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(p => (
          <div key={p._id} className="border rounded-lg p-4">
            <div className="font-medium">{p.name}</div>
            <div className="text-sm opacity-70">{p.category}</div>
            <div className="mt-2 font-semibold">Rp {p.price.toLocaleString()}</div>
            <button className="mt-3 px-3 py-2 border rounded" onClick={()=>addToCart(p)}>
              Add
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t pt-4">
        <h2 className="font-semibold mb-2">Cart</h2>
        {cart.length === 0 ? <p>Empty</p> : (
          <ul className="space-y-2">
            {cart.map(i=>(
              <li key={i._id} className="flex justify-between">
                <span>{i.name} x {i.qty}</span>
                <span>Rp {(i.price*i.qty).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
