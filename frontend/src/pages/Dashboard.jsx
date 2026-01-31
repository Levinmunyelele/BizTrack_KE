// Dashboard.jsx (Record Sale Modal + quick action)
// Drop this into your Dashboard file and wire the <RecordSaleModal ... /> at the bottom.
// Assumes you already have `api` (axios instance) and Tailwind set up.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import Layout from "../components/Layout";

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32 mt-3" />
    </div>
  );
}

function formatKsh(n) {
  const num = Number(n || 0);
  return `KSh ${num.toLocaleString("en-KE")}`;
}

// ---------- Modal (no external libs) ----------
function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onMouseDown={onClose}
        aria-hidden="true"
      />
      {/* dialog */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg bg-white rounded-2xl shadow-xl border"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-4 border-b flex items-start justify-between">
            <div>
              <div className="text-lg font-semibold">{title}</div>
              <div className="text-sm text-gray-600">
                Enter sale details and save.
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-gray-600 hover:bg-gray-100"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          <div className="px-5 py-4">{children}</div>

          <div className="px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Record Sale Modal ----------
function RecordSaleModal({
  open,
  onClose,
  customers,
  onCustomerCreated,
  onSaleCreated,
}) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [customerId, setCustomerId] = useState("");

  const [savingSale, setSavingSale] = useState(false);
  const [saleError, setSaleError] = useState("");

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [custError, setCustError] = useState("");

  // reset when opening
  useEffect(() => {
    if (!open) return;
    setAmount("");
    setPaymentMethod("mpesa");
    setCustomerId("");
    setSaleError("");
    setShowAddCustomer(false);
    setCustName("");
    setCustPhone("");
    setCustError("");
    setSavingSale(false);
    setSavingCustomer(false);
  }, [open]);

  const customerOptions = useMemo(() => customers || [], [customers]);

  async function createSale(e) {
    e.preventDefault();
    setSaleError("");

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setSaleError("Amount must be a valid number greater than 0.");
      return;
    }

    setSavingSale(true);
    try {
      await api.post("/sales", {
        amount: amt,
        payment_method: paymentMethod,
        customer_id: customerId ? Number(customerId) : null,
      });
      onSaleCreated?.();
      onClose?.();
    } catch (err) {
      setSaleError("Failed to record sale. Please try again.");
    } finally {
      setSavingSale(false);
    }
  }

  async function createCustomer(e) {
    e.preventDefault();
    setCustError("");

    if (!custName.trim()) {
      setCustError("Customer name is required.");
      return;
    }

    setSavingCustomer(true);
    try {
      const res = await api.post("/customers", {
        name: custName.trim(),
        phone: custPhone.trim() || null,
      });
      onCustomerCreated?.(res.data);

      // auto-select new customer (if API returns {id,...})
      if (res?.data?.id) setCustomerId(String(res.data.id));

      setShowAddCustomer(false);
      setCustName("");
      setCustPhone("");
    } catch (err) {
      setCustError("Failed to add customer. Please try again.");
    } finally {
      setSavingCustomer(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Record Sale"
      onClose={savingSale || savingCustomer ? undefined : onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={savingSale || savingCustomer}
            className="rounded-lg border bg-white px-4 py-2 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="sale-form"
            disabled={savingSale || savingCustomer}
            className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-60"
          >
            {savingSale ? "Saving..." : "Save Sale"}
          </button>
        </div>
      }
    >
      {/* SALE FORM */}
      <form id="sale-form" onSubmit={createSale} className="space-y-3">
        {saleError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg">
            {saleError}
          </div>
        )}

        <div>
          <label className="text-sm text-gray-700">Amount (KSh)</label>
          <input
            className="mt-1 w-full border rounded-lg p-2"
            placeholder="e.g. 1500"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-700">Payment method</label>
            <select
              className="mt-1 w-full border rounded-lg p-2"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="mpesa">mpesa</option>
              <option value="cash">cash</option>
              <option value="card">card</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700">Customer (optional)</label>
            <select
              className="mt-1 w-full border rounded-lg p-2"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">No customer</option>
              {customerOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowAddCustomer((v) => !v)}
              className="mt-2 text-sm underline text-gray-700 hover:text-black"
            >
              {showAddCustomer ? "Hide" : "+ Add new customer"}
            </button>
          </div>
        </div>
      </form>

      {/* ADD CUSTOMER (inline) */}
      {showAddCustomer && (
        <form
          onSubmit={createCustomer}
          className="mt-4 p-4 border rounded-xl bg-gray-50 space-y-3"
        >
          <div className="font-medium">New Customer</div>

          {custError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg">
              {custError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-700">Name</label>
              <input
                className="mt-1 w-full border rounded-lg p-2"
                placeholder="Customer name"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-700">Phone (optional)</label>
              <input
                className="mt-1 w-full border rounded-lg p-2"
                placeholder="+2547..."
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={savingCustomer}
              className="rounded-lg border bg-white px-4 py-2 disabled:opacity-60"
            >
              {savingCustomer ? "Adding..." : "Add Customer"}
            </button>
            <span className="text-sm text-gray-600">
              It will auto-select after creation.
            </span>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ---------- Dashboard ----------
export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [range, setRange] = useState("7d"); // UI only for now
  const [saleModalOpen, setSaleModalOpen] = useState(false);

  const navigate = useNavigate();

  async function load() {
    setError("");
    try {
      const [meRes, sumRes, customersRes] = await Promise.all([
        api.get("/users/me"),
        api.get("/sales/summary"), // later: api.get(`/sales/summary?range=${range}`)
        api.get("/customers"),
      ]);
      setMe(meRes.data);
      setSummary(sumRes.data);
      setCustomers(customersRes.data);
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

  // When a customer is created in modal, update local list immediately
  function handleCustomerCreated(newCustomer) {
    if (!newCustomer?.id) return;
    setCustomers((prev) => {
      const exists = prev.some((c) => c.id === newCustomer.id);
      if (exists) return prev;
      return [newCustomer, ...prev];
    });
  }

  // After sale created, refresh analytics
  async function handleSaleCreated() {
    await load();
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

          <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
            <div className="flex gap-2">
              {[
                { key: "today", label: "Today" },
                { key: "7d", label: "7 Days" },
                { key: "30d", label: "30 Days" },
              ].map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    range === r.key ? "bg-black text-white" : "bg-white"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSaleModalOpen(true)}
                className="rounded-lg bg-black text-white px-4 py-2"
              >
                + Record Sale
              </button>
              <button
                onClick={() => alert("Wire export here")}
                className="rounded-lg border bg-white px-4 py-2"
              >
                Export CSV
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg">
              {error}
            </div>
          )}

          {!summary ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-white rounded-2xl shadow p-4">
                  <Skeleton className="h-5 w-28" />
                  <div className="mt-4 space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow p-4">
                  <Skeleton className="h-5 w-36" />
                  <div className="mt-4 space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <Card title="Today Total" value={formatKsh(summary.today_total)} />
                <Card title="Week Total" value={formatKsh(summary.week_total)} />
                <Card title="Month Total" value={formatKsh(summary.month_total)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-white rounded-2xl shadow p-4">
                  <h2 className="font-semibold">Payments</h2>
                  <div className="mt-3 space-y-2">
                    {(summary.payments || []).map((p) => (
                      <div
                        key={p.method}
                        className="flex items-center justify-between border rounded-lg p-3"
                      >
                        <div className="capitalize">{p.method}</div>
                        <div className="text-gray-700">
                          {p.count} • {formatKsh(p.total)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-4">
                  <h2 className="font-semibold">Top Customers</h2>
                  <div className="mt-3 space-y-2">
                    {(summary.top_customers || []).length === 0 ? (
                      <div className="text-gray-600">No customer sales yet.</div>
                    ) : (
                      (summary.top_customers || []).map((c) => (
                        <div
                          key={c.customer_id}
                          className="flex items-center justify-between border rounded-lg p-3"
                        >
                          <div>{c.name}</div>
                          <div className="text-gray-700">
                            {c.orders} orders • {formatKsh(c.total_spent)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    Best day:{" "}
                    {summary.best_day
                      ? `${summary.best_day.day} • ${formatKsh(summary.best_day.total)}`
                      : "N/A"}
                  </div>
                </div>
              </div>
            </>
          )}

          <RecordSaleModal
            open={saleModalOpen}
            onClose={() => setSaleModalOpen(false)}
            customers={customers}
            onCustomerCreated={handleCustomerCreated}
            onSaleCreated={handleSaleCreated}
          />
        </div>
      </div>
    </Layout>
  );
}
