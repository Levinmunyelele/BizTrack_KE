import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/client";   

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await api.get("/customers");
    setCustomers(res.data);
  }

  useEffect(() => {
    load().catch(() => setError("Failed to load customers"));
  }, []);

  async function addCustomer(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/customers", { name, phone });
      setName("");
      setPhone("");
      await load();
    } catch {
      setError("Failed to add customer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <h2 className="text-2xl font-semibold">Customers</h2>

      {error && <div className="mt-3 text-red-700 bg-red-50 p-3 rounded-lg">{error}</div>}

      <form onSubmit={addCustomer} className="mt-4 bg-white rounded-2xl shadow p-4 flex gap-3">
        <input
          className="border rounded-lg p-2 flex-1"
          placeholder="Customer name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="border rounded-lg p-2 w-56"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button
          disabled={loading}
          className="bg-black text-white px-4 rounded-lg disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </form>

      <div className="mt-4 bg-white rounded-2xl shadow p-4">
        {customers.length === 0 ? (
          <div className="text-gray-600">No customers yet.</div>
        ) : (
          <div className="space-y-2">
            {customers.map((c) => (
              <div key={c.id} className="flex justify-between border rounded-lg p-3">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-gray-600">{c.phone || "—"}</div>
                </div>
                <div className="text-sm text-gray-600">#{c.id}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
