import { useState } from "react";
import { useRouter } from "next/router"; // Import useRouter untuk redirect

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // Untuk menampilkan pesan setelah registrasi
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !name || !phone) {
      setError("All fields are required");
      return;
    }

    const emailDomain = email.split('@')[1];
    let role = "customer"; 
    if (emailDomain === "domain.com") { 
      role = "admin"; 
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone, password, role }), 
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message); 
        setTimeout(() => {
          router.push("/verify");
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (error) {
      setError("Error while registering");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-100 via-pink-200 to-pink-300 flex items-center justify-center">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-8">Register</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {message && <div className="mb-4 text-green-500">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-gray-600">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-600">
              Email
            </label>
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
            <label htmlFor="phone" className="text-sm font-medium text-gray-600">
              Phone
            </label>
            <input
              type="text"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="Enter your phone"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-pink-500 text-white rounded-lg text-lg font-semibold hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            Register
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-pink-500 hover:underline">
              Login here
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
