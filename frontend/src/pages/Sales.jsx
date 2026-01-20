import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import http from "../api/http";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [amount, setAmount] = useState("");
  const [payment_method, setPaymentMethod] = useState("mpesa");
  const [customer_id, setCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [salesRes, customersRes] = await Promise.all([
      http.get("/sales"),
      http.get("/customers"),
    ]);
    setSales(salesRes.data);
    setCustomers(customersRes.data);
  }

  useEffect(() => {
    load().catch(() => setError("Failed to load sales"));
  }, []);

  async function addSale(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await http.post("/sales", {
        amount: Number(amount),
        payment_method,
        customer_id: customer_id ? Number(customer_id) : null,
      });
      setAmount("");
      setCustomerId("");
      await load();
    } catch {
      setError("Failed to record sale");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <h2 className="text-2xl font-semibold">Sales</h2>

      {error && <div className="mt-3 text-red-700 bg-red-50 p-3 rounded-lg">{error}</div>}

      <form onSubmit={addSale} className="mt-4 bg-white rounded-2xl shadow p-4 grid gap-3 md:grid-cols-4">
        <input
          className="border rounded-lg p-2"
          placeholder="Amount (KSh)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <select
          className="border rounded-lg p-2"
          value={payment_method}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="mpesa">mpesa</option>
          <option value="cash">cash</option>
          <option value="card">card</option>
        </select>

        <select
          className="border rounded-lg p-2"
          value={customer_id}
          onChange={(e) => setCustomerId(e.target.value)}
        >
          <option value="">No customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          disabled={loading}
          className="bg-black text-white px-4 rounded-lg disabled:opacity-60"
        >
          {loading ? "Saving..." : "Record Sale"}
        </button>
      </form>

      <div className="mt-4 bg-white rounded-2xl shadow p-4">
        {sales.length === 0 ? (
          <div className="text-gray-600">No sales recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {sales.map((s) => (
              <div key={s.id} className="flex justify-between border rounded-lg p-3">
                <div>
                  <div className="font-medium">KSh {s.amount}</div>
                  <div className="text-sm text-gray-600">
                    {s.payment_method} • customer_id: {s.customer_id ?? "—"}
                  </div>
                </div>
                <div className="text-sm text-gray-600">#{s.id}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
