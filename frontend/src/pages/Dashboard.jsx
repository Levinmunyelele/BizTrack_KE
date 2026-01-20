import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import Layout from "../components/Layout";

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function load() {
    setError("");
    try {
      const [meRes, sumRes] = await Promise.all([
        http.get("/users/me"),
        http.get("/sales/summary"),
      ]);
      setMe(meRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      setError("Session expired. Please login again.");
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }

  return (
    <Layout>
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-gray-600">
              {me ? `Signed in as ${me.name} (${me.role})` : "Loading..."}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border bg-white px-4 py-2"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg">
            {error}
          </div>
        )}

        {!summary ? (
          <div className="mt-6 text-gray-600">Loading analytics...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <Card title="Today Total" value={`KSh ${summary.today_total}`} />
              <Card title="Week Total" value={`KSh ${summary.week_total}`} />
              <Card title="Month Total" value={`KSh ${summary.month_total}`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="font-semibold">Payments</h2>
                <div className="mt-3 space-y-2">
                  {summary.payments.map((p) => (
                    <div
                      key={p.method}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="capitalize">{p.method}</div>
                      <div className="text-gray-700">
                        {p.count} • KSh {p.total}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="font-semibold">Top Customers</h2>
                <div className="mt-3 space-y-2">
                  {summary.top_customers.length === 0 ? (
                    <div className="text-gray-600">No customer sales yet.</div>
                  ) : (
                    summary.top_customers.map((c) => (
                      <div
                        key={c.customer_id}
                        className="flex items-center justify-between border rounded-lg p-3"
                      >
                        <div>{c.name}</div>
                        <div className="text-gray-700">
                          {c.orders} orders • KSh {c.total_spent}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  Best day:{" "}
                  {summary.best_day
                    ? `${summary.best_day.day} • KSh ${summary.best_day.total}`
                    : "N/A"}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </Layout>
  );
}
