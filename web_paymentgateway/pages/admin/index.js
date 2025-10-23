import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function AdminDashboard() {
  const router = useRouter();
  // Ganti ini dengan cara kamu ambil user saat ini; sementara hardcode header
  const adminHeaders = { "x-user-email": typeof window !== "undefined" ? localStorage.getItem("adminEmail") || "" : "" , "Content-Type":"application/json" };

  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [range, setRange] = useState("day");
  const [sales, setSales] = useState({ labels: [], amounts: [], counts: [] });

  // Products
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", sku: "", price: "", stock: "", imageUrl: "" });
  const [editingId, setEditingId] = useState(null);

  // -------- ORDERS --------
  async function loadOrders() {
    const q = statusFilter ? `?status=${statusFilter}` : "";
    const res = await fetch(`/api/admin/orders${q}`, { headers: adminHeaders });
    const json = await res.json();
    setOrders(json.orders || []);
  }
  async function updateOrderStatus(id, status) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({ status })
    });
    loadOrders();
  }

  // -------- SALES --------
  async function loadSales() {
    const res = await fetch(`/api/admin/analytics/sales?range=${range}`, { headers: adminHeaders });
    const json = await res.json();
    setSales(json);
  }
  const chartData = useMemo(() => ({
    labels: sales.labels,
    datasets: [
      { label: "Omset (Rp)", data: sales.amounts }
    ]
  }), [sales]);

  // -------- PRODUCTS --------
  async function loadProducts() {
    const res = await fetch(`/api/admin/products`, { headers: adminHeaders });
    const json = await res.json();
    setProducts(json.products || []);
  }
  async function saveProduct(e) {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
    if (editingId) {
      await fetch(`/api/admin/products/${editingId}`, {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify(payload)
      });
      setEditingId(null);
    } else {
      await fetch(`/api/admin/products`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify(payload)
      });
    }
    setForm({ name: "", sku: "", price: "", stock: "", imageUrl: "" });
    loadProducts();
  }
  async function editProduct(p) {
    setEditingId(p._id);
    setForm({ name: p.name, sku: p.sku, price: p.price, stock: p.stock, imageUrl: p.imageUrl || "" });
  }
  async function deleteProduct(id) {
    await fetch(`/api/admin/products/${id}`, { method: "DELETE", headers: adminHeaders });
    loadProducts();
  }

  useEffect(() => { loadOrders(); }, [statusFilter]);
  useEffect(() => { loadSales(); }, [range]);
  useEffect(() => { loadProducts(); }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        {/* A. ORDERS */}
        <section className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Checkout List</h2>
            <div className="flex gap-2">
              <select className="border rounded px-3 py-2" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="waiting">Waiting Payment</option>
                <option value="paid">Lunas</option>
              </select>
              <button onClick={loadOrders} className="px-3 py-2 border rounded">Refresh</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Tanggal</th>
                  <th className="py-2">User</th>
                  <th className="py-2">Items</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o=>(
                  <tr key={o._id} className="border-b">
                    <td className="py-2">{new Date(o.createdAt).toLocaleString()}</td>
                    <td className="py-2">{o.userEmail}</td>
                    <td className="py-2">
                      {o.items?.map(it=>(
                        <div key={it.productId}>{it.name} × {it.qty}</div>
                      ))}
                    </td>
                    <td className="py-2">Rp {o.total.toLocaleString("id-ID")}</td>
                    <td className="py-2 capitalize">{o.status === "waiting" ? "Waiting Payment" : "Lunas"}</td>
                    <td className="py-2 flex gap-2">
                      {o.status !== "paid" && (
                        <button onClick={()=>updateOrderStatus(o._id,"paid")} className="px-3 py-1 rounded bg-green-500 text-white">Mark Paid</button>
                      )}
                      {o.status !== "waiting" && (
                        <button onClick={()=>updateOrderStatus(o._id,"waiting")} className="px-3 py-1 rounded bg-yellow-500 text-white">Mark Waiting</button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length===0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-gray-500">Belum ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* B. ANALYTICS */}
        <section className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Analytics Omset</h2>
            <div className="flex gap-2">
              <select className="border rounded px-3 py-2" value={range} onChange={e=>setRange(e.target.value)}>
                <option value="day">Per Hari</option>
                <option value="month">Per Bulan</option>
              </select>
              <button onClick={loadSales} className="px-3 py-2 border rounded">Refresh</button>
            </div>
          </div>
          <Line data={chartData} />
        </section>

        {/* C. PRODUCTS CRUD */}
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Produk (CRUD)</h2>

          <form onSubmit={saveProduct} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
            <input className="border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
            <input className="border rounded px-3 py-2" placeholder="SKU" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} />
            <input className="border rounded px-3 py-2" placeholder="Price" type="number" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} />
            <input className="border rounded px-3 py-2" placeholder="Stock" type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} />
            <input className="border rounded px-3 py-2" placeholder="Image URL" value={form.imageUrl} onChange={e=>setForm({...form, imageUrl:e.target.value})} />
            <div className="md:col-span-5 flex gap-2">
              <button className="px-4 py-2 bg-pink-500 text-white rounded">{editingId ? "Update" : "Add"}</button>
              {editingId && <button type="button" className="px-4 py-2 border rounded" onClick={()=>{setEditingId(null);setForm({name:"",sku:"",price:"",stock:"",imageUrl:""});}}>Cancel</button>}
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Name</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Stock</th>
                  <th className="py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p=>(
                  <tr key={p._id} className="border-b">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2">{p.sku}</td>
                    <td className="py-2">Rp {p.price.toLocaleString("id-ID")}</td>
                    <td className="py-2">{p.stock}</td>
                    <td className="py-2 flex gap-2">
                      <button onClick={()=>editProduct(p)} className="px-3 py-1 rounded bg-yellow-500 text-white">Edit</button>
                      <button onClick={()=>deleteProduct(p._id)} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
                    </td>
                  </tr>
                ))}
                {products.length===0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-gray-500">Belum ada produk</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
