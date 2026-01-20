import { useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";

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
      const res = await http.post("/auth/login", { email, password });
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
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-semibold">BizTrack KE</h1>
        <p className="text-gray-600 mt-1">Sign in to continue</p>

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-gray-700">Email</label>
            <input
              className="mt-1 w-full border rounded-lg p-3 focus:outline-none focus:ring"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-700">Password</label>
            <input
              className="mt-1 w-full border rounded-lg p-3 focus:outline-none focus:ring"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-lg bg-black text-white p-3 font-medium disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
