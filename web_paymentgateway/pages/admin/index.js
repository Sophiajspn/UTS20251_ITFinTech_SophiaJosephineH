// pages/admin/index.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

// ---------- Small UI helpers ----------
function Badge({ tone = "gray", children }) {
  const map = {
    gray: "bg-gray-100 text-gray-700 ring-gray-200",
    green: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    yellow: "bg-amber-100 text-amber-700 ring-amber-200",
    pink: "bg-pink-100 text-pink-700 ring-pink-200",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${map[tone] || map.gray}`}>
      {children}
    </span>
  );
}

export default function AdminDashboard() {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [range, setRange] = useState("day");
  const [sales, setSales] = useState({ labels: [], amounts: [], counts: [] });

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    stock: "",
    image: "", // <- pakai image, bukan imageUrl
  });

  const [err, setErr] = useState("");

  // ================== LOGOUT ==================
  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      router.push("/login");
    } catch (e) {
      console.error("Logout error:", e);
    }
  }

  // ================== ORDERS ==================
  async function loadOrders() {
    try {
      const q = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/admin/orders${q}`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Gagal load orders");
      setOrders(json.orders || []);
    } catch (e) {
      setErr(String(e.message));
    }
  }

  // ================== SALES ==================
  async function loadSales() {
    try {
      const res = await fetch(`/api/admin/analytics/sales?range=${range}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Gagal load sales");
      setSales(json);
    } catch (e) {
      setErr(String(e.message));
    }
  }

  const chartData = useMemo(
    () => ({
      labels: sales.labels,
      datasets: [
        {
          label: "Omset (Rp)",
          data: sales.amounts,
          borderWidth: 3,
          tension: 0.35,
        },
      ],
    }),
    [sales]
  );

  // ================== PRODUCTS ==================
  async function loadProducts() {
    try {
      const res = await fetch(`/api/admin/products`, { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Gagal load products");
      setProducts(json.products || []);
    } catch (e) {
      setErr(String(e.message));
    }
  }

  async function saveProduct(e) {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      };
      const res = await fetch(`/api/admin/products`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // image ikut terkirim
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Gagal simpan produk");
      setForm({ name: "", sku: "", price: "", stock: "", image: "" });
      loadProducts();
    } catch (e) {
      setErr(String(e.message));
    }
  }

  // ================== EFFECTS ==================
  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  useEffect(() => {
    loadSales();
  }, [range]);

  useEffect(() => {
    loadProducts();
  }, []);

  // ================== UI ==================
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">
      {/* Topbar */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/50 bg-white/70 border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-pink-500/90 grid place-items-center text-white font-bold">A</div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {err && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-sm ring-1 ring-rose-100">
            {err}
          </div>
        )}

        {/* Quick stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white/70 backdrop-blur p-5 ring-1 ring-pink-100 shadow-sm">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-semibold mt-1">{orders.length}</p>
          </div>
          <div className="rounded-2xl bg-white/70 backdrop-blur p-5 ring-1 ring-pink-100 shadow-sm">
            <p className="text-sm text-gray-500">Range</p>
            <p className="text-2xl font-semibold mt-1">{range === "day" ? "Per Hari" : "Per Bulan"}</p>
          </div>
          <div className="rounded-2xl bg-white/70 backdrop-blur p-5 ring-1 ring-pink-100 shadow-sm">
            <p className="text-sm text-gray-500">Total Produk</p>
            <p className="text-2xl font-semibold mt-1">{products.length}</p>
          </div>
        </section>

        {/* A. ORDERS */}
        <section className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-pink-100 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold">Checkout List</h2>
            <div className="flex gap-2">
              <select
                className="border rounded-xl px-3 py-2 bg-white/70 focus:outline-none focus:ring-2 focus:ring-pink-300"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="waiting">Waiting Payment</option>
                <option value="paid">Lunas</option>
              </select>
              <button
                onClick={loadOrders}
                className="px-4 py-2 bg-white/60 ring-1 ring-pink-100 rounded-xl hover:bg-pink-50 transition"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-pink-100 text-gray-500">
                  <th className="py-3">Tanggal</th>
                  <th className="py-3">User</th>
                  <th className="py-3">Items</th>
                  <th className="py-3">Total</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-b border-pink-50 hover:bg-pink-50/50 transition-colors">
                    <td className="py-3">{new Date(o.createdAt).toLocaleString()}</td>
                    <td className="py-3">{o.userEmail}</td>
                    <td className="py-3">
                      {o.items?.map((it) => (
                        <div key={it.productId}>
                          {it.name} × {it.qty}
                        </div>
                      ))}
                    </td>
                    <td className="py-3">Rp {Number(o.total || 0).toLocaleString("id-ID")}</td>
                    <td className="py-3">
                      {o.status === "waiting" ? (
                        <Badge tone="yellow">Waiting Payment</Badge>
                      ) : (
                        <Badge tone="green">Lunas</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      Belum ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* B. ANALYTICS */}
        <section className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-pink-100 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold">Analytics Omset</h2>
            <div className="flex gap-2">
              <select
                className="border rounded-xl px-3 py-2 bg-white/70 focus:outline-none focus:ring-2 focus:ring-pink-300"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              >
                <option value="day">Per Hari</option>
                <option value="month">Per Bulan</option>
              </select>
              <button
                onClick={loadSales}
                className="px-4 py-2 bg-white/60 ring-1 ring-pink-100 rounded-xl hover:bg-pink-50 transition"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-b from-white to-pink-50 p-3">
            <Line data={chartData} />
          </div>
        </section>

        {/* C. PRODUCTS (Add + List) */}
        <section className="rounded-3xl bg-white/80 backdrop-blur ring-1 ring-pink-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Produk List</h2>

          <form onSubmit={saveProduct} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
            <input
              className="border rounded-xl px-3 py-2 bg-white/70 focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="border rounded-xl px-3 py-2 bg-white/70 focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
            <input
              className="border rounded-xl px-3 py-2 bg-white/70 focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="Price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <input
              className="border rounded-xl px-3 py-2 bg-white/70 focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="Stock"
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
            <input
              className="border rounded-xl px-3 py-2 bg-white/70 focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="Image URL"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
            <div className="md:col-span-5">
              <button className="px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition">
                Add Product
              </button>
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-pink-100 text-gray-500">
                  <th className="py-3">Name</th>
                  <th className="py-3">SKU</th>
                  <th className="py-3">Price</th>
                  <th className="py-3">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className="border-b border-pink-50 hover:bg-pink-50/50 transition-colors">
                    <td className="py-3 flex items-center gap-3">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-pink-100"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-pink-100 ring-1 ring-pink-100 grid place-items-center text-pink-700 text-xs">
                          No Img
                        </div>
                      )}
                      <span>{p.name}</span>
                    </td>
                    <td className="py-3">{p.sku}</td>
                    <td className="py-3">Rp {Number(p.price || 0).toLocaleString("id-ID")}</td>
                    <td className="py-3">{p.stock}</td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      Belum ada produk
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

import { requireAdmin } from "../../lib/requireAdmin";
export async function getServerSideProps({ req }) {
  const gate = await requireAdmin(req);
  if (!gate.ok) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: {} };
}
