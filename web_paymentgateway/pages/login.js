import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (role) => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }), 
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("role", data.role);  

        if (data.role === "admin") {
          router.push("/admin"); 
        } else {
          router.push("/"); 
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Error while logging in");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-100 via-pink-200 to-pink-300 flex items-center justify-center">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-8">Login</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-600">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="Enter your password"
            />
          </div>

          {/* Tombol untuk login sebagai Admin atau Customer */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleLogin("admin")}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Login as Admin
            </button>
            <button
              type="button"
              onClick={() => handleLogin("user")}
              className="w-full py-2 px-4 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              Login as Customer
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600">
            Don't have an account?{" "}
            <a href="/register" className="text-pink-500 hover:underline">
              Register here
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
