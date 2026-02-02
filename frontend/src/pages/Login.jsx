import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { Loader2, Lock, Mail } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("levin@test.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 -z-10" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10">
        // Inside the return of Login.jsx
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black text-white mb-4 shadow-xl">
            <span className="font-bold text-xl">BZ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            BizTrack KE
          </h1>
          <p className="text-gray-500 mt-2">
            Sign in to manage your business analytics
          </p>
        </div>
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2">
            <span className="text-lg">!</span> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 ml-1">
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-3.5 text-gray-400"
                size={20}
              />
              <input
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-3.5 text-gray-400"
                size={20}
              />
              <input
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full py-3.5 bg-black text-white rounded-xl font-semibold shadow-lg hover:bg-gray-900 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
          </button>
        </form>
        <div className="mt-8 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <span className="text-black font-semibold cursor-pointer hover:underline">
            Contact Admin
          </span>
        </div>
      </div>
    </div>
  );
}
