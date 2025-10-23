import { useState } from "react";
import { useRouter } from "next/router";

export default function Verify() {
  const [otp, setOtp] = useState(""); // State untuk menyimpan OTP yang dimasukkan
  const [error, setError] = useState(""); // State untuk error
  const [message, setMessage] = useState(""); // State untuk pesan sukses
  const router = useRouter(); // Gunakan router untuk redirect

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp) {
      setError("OTP is required");
      return;
    }

    try {
      const response = await fetch("/api/verify-otp", { // Mengirim request ke API untuk verifikasi OTP
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message); // Pesan dari API (misalnya "Account successfully verified!")
        setTimeout(() => {
          router.push("/login"); // Redirect ke halaman login setelah OTP berhasil diverifikasi
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (error) {
      setError("Error while verifying OTP");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-100 via-pink-200 to-pink-300 flex items-center justify-center">
      <div className="w-full max-w-sm p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-8">Verify OTP</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {message && <div className="mb-4 text-green-500">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="otp" className="text-sm font-medium text-gray-600">
              Enter OTP
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="Enter the OTP sent to your WhatsApp"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-pink-500 text-white rounded-lg text-lg font-semibold hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            Verify OTP
          </button>
        </form>
      </div>
    </div>
  );
}
