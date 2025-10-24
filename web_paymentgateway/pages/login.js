import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie"; // optional tapi berguna untuk auto redirect kalau sudah login

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ⬇️ Optional: kalau user sudah punya cookie token, langsung redirect
  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      router.replace("/"); // kalau mau bisa cek role di API /api/me
    }
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // penting agar cookie JWT tersimpan
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.message || "Login gagal");
        setLoading(false);
        return;
      }

      // Ambil role dari response API
      const role = data?.user?.role;
      console.log("ROLE:", role);

      if (role === "admin") {
        await router.replace("/admin");
        return;
      } else if (role === "customer") {
        await router.replace("/"); // ⬅️ ke pages/index.js
        return;
      } else {
        setError("Role tidak dikenali");
        return;
      }
    } catch (err) {
      console.error("Error saat login:", err);
      setError("Server error, coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-100 via-pink-200 to-pink-300 flex items-center justify-center">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-8">
          Login
        </h2>

        {error && <div className="mb-4 text-red-500">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-pink-300"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-pink-300"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a href="/register" className="text-pink-500 hover:underline">
            Register here
          </a>
        </div>
      </div>
    </div>
  );
}
