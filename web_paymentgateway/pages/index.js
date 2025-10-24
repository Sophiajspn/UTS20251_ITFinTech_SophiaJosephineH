import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const UI_CATEGORIES = ["All", "Dessert", "Beverage", "Main Course", "Appetizer"];

function normalizeCategory(raw = "") {
  const v = String(raw).toLowerCase();
  if (/dessert|cake|sweet|pudding|cookie/.test(v)) return "Dessert";
  if (/beverage|drink|coffee|tea|juice|milk/.test(v)) return "Beverage";
  if (/main\s?course|meal|food|rice|pasta|noodle|burger|ayam|steak/.test(v))
    return "Main Course";
  if (/appetizer|starter|snack|side/.test(v)) return "Appetizer";
  return "Main Course";
}

export default function Home({ userFromSSR }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");

  // tampilkan nama user (pakai email sebagai placeholder); bisa diganti kalau kamu simpan display name di DB
  const [userName, setUserName] = useState(userFromSSR?.email || "");
  const router = useRouter();

  // --- helpers cart ---
  const saveCart = (next) => {
    setCart(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(next));
    }
  };
  const getQty = (id) => cart.find((i) => i._id === id)?.qty || 0;

  const addToCart = (p) => {
    const found = cart.find((i) => i._id === p._id);
    const next = found
      ? cart.map((i) => (i._id === p._id ? { ...i, qty: i.qty + 1 } : i))
      : [...cart, { _id: p._id, name: p.name, price: Number(p.price) || 0, qty: 1 }];
    saveCart(next);
  };

  const inc = (p) => {
    const next = cart.map((i) =>
      i._id === p._id ? { ...i, qty: i.qty + 1 } : i
    );
    saveCart(next);
  };

  const dec = (p) => {
    const found = cart.find((i) => i._id === p._id);
    if (!found) return;
    const newQty = found.qty - 1;
    const next =
      newQty > 0
        ? cart.map((i) => (i._id === p._id ? { ...i, qty: newQty } : i))
        : cart.filter((i) => i._id !== p._id);
    saveCart(next);
  };

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((list) =>
        setProducts(list.map((p) => ({ ...p, uiCat: normalizeCategory(p.category) })))
      );
    const saved = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(saved);

    const nameLS = localStorage.getItem("userName");
    if (nameLS && !userFromSSR?.email) setUserName(nameLS);
  }, [userFromSSR?.email]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + Number(i.price || 0) * i.qty, 0);

  const filtered = products.filter((p) => {
    const catOk = activeCat === "All" || p.uiCat === activeCat;
    const qOk =
      !query ||
      p.name?.toLowerCase().includes(query.toLowerCase()) ||
      p.category?.toLowerCase().includes(query.toLowerCase());
    return catOk && qOk;
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (_) {}
    // bersihkan data UI lokal jika ada
    localStorage.removeItem("userName");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-pink-100 via-pink-50 to-pink-200" />

      {/* HEADER */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍩</span>
            <h1 className="text-lg font-bold">BONOYA CAFE</h1>
          </div>
          {/* Menampilkan Nama Pengguna */}
          {userName && (
            <span className="text-sm font-semibold">Welcome, {userName}!</span>
          )}
          {/* Tombol Logout */}
          <button
            onClick={handleLogout}
            className="ml-4 px-4 py-1.5 text-sm font-medium text-white bg-red-500 rounded-full hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* Search */}
        <div className="mx-auto max-w-3xl px-4 pb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu..."
            className="w-full rounded-full border bg-white px-4 py-2 shadow-sm text-sm outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>

        {/* Filter */}
        <div className="mx-auto max-w-6xl px-4 pb-2 overflow-x-auto">
          <div className="flex gap-2">
            {UI_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={
                  "px-3 py-1.5 rounded-full text-xs border transition whitespace-nowrap " +
                  (activeCat === cat
                    ? "bg-black text-white border-black"
                    : "bg-white text-neutral-700 hover:bg-neutral-100")
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-6">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-neutral-500">Menu tidak ditemukan</div>
        ) : (
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => {
              const qty = getQty(p._id);
              return (
                <article
                  key={p._id}
                  className="flex flex-col overflow-hidden rounded-2xl bg-white shadow hover:shadow-lg transition"
                >
                  <div className="aspect-square w-full overflow-hidden">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-white to-rose-50" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-sm font-semibold">{p.name}</h3>
                    <p className="text-xs text-neutral-500">{p.category}</p>
                    <div className="mt-2 font-semibold text-rose-600">
                      Rp {Number(p.price).toLocaleString()}
                    </div>

                    {/* Add / Stepper */}
                    {qty === 0 ? (
                      <button
                        onClick={() => addToCart(p)}
                        className="mt-auto w-full rounded-lg bg-rose-500 px-3 py-2 text-sm font-medium text-white hover:bg-rose-600"
                      >
                        Add +
                      </button>
                    ) : (
                      <div className="mt-auto grid grid-cols-3 items-center gap-2">
                        <button
                          onClick={() => dec(p)}
                          className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-neutral-50"
                          aria-label={`Kurangi ${p.name}`}
                        >
                          −
                        </button>
                        <div className="text-center text-sm font-semibold">
                          {qty}
                        </div>
                        <button
                          onClick={() => inc(p)}
                          className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-600"
                          aria-label={`Tambah ${p.name}`}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-500">Cart total</div>
            <div className="text-lg font-bold">Rp {cartTotal.toLocaleString()}</div>
          </div>
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center rounded-full bg-black px-6 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Go to Checkout →
          </Link>
        </div>
      </footer>
    </div>
  );
}

export async function getServerSideProps({ req }) {
  const token = req.cookies?.token || null;

  if (!token) {
    return { props: { userFromSSR: null } };
  }

  try {
    const jwt = require("jsonwebtoken"); 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "admin") {
      return { redirect: { destination: "/admin", permanent: false } };
    }

    return {
      props: {
        userFromSSR: {
          email: decoded.email,
          role: decoded.role,
          userId: decoded.userId,
        },
      },
    };
  } catch {
    return { props: { userFromSSR: null } };
  }
}
