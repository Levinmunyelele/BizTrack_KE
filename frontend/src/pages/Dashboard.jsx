import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import Layout from "../components/Layout";
// New Icons
import { 
  Banknote, 
  Calendar, 
  CreditCard, 
  Download, 
  Plus, 
  Users, 
  TrendingUp,
  Wallet
} from "lucide-react";

// --- Components ---

function Card({ title, value, icon: Icon, colorClass }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className="text-2xl font-bold mt-2 text-gray-900">{value}</div>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
      <div className="flex justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}

function formatKsh(n) {
  const num = Number(n || 0);
  return `KSh ${num.toLocaleString("en-KE")}`;
}

// Helper for greeting
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// ---------- Modal Component (Reused) ----------
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onMouseDown={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all scale-100">
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>
        <div className="p-6">{children}</div>
        <div className="px-6 py-4 bg-gray-50 border-t">{footer}</div>
      </div>
    </div>
  );
}

// ---------- Record Sale Modal (Kept Logic, Improved UI) ----------
function RecordSaleModal({ open, onClose, customers, onCustomerCreated, onSaleCreated }) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [customerId, setCustomerId] = useState("");
  const [savingSale, setSavingSale] = useState(false);
  const [saleError, setSaleError] = useState("");

  // Customer Add States
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setPaymentMethod("mpesa");
    setCustomerId("");
    setSaleError("");
    setShowAddCustomer(false);
  }, [open]);

  const customerOptions = useMemo(() => customers || [], [customers]);

  async function createSale(e) {
    e.preventDefault();
    setSaleError("");
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return setSaleError("Invalid amount");
    
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
      setSaleError("Failed. Try again.");
    } finally {
      setSavingSale(false);
    }
  }

  async function createCustomer(e) {
    e.preventDefault();
    if (!custName.trim()) return;
    setSavingCustomer(true);
    try {
      const res = await api.post("/customers", { name: custName.trim(), phone: custPhone.trim() || null });
      onCustomerCreated?.(res.data);
      if (res?.data?.id) setCustomerId(String(res.data.id));
      setShowAddCustomer(false);
      setCustName("");
      setCustPhone("");
    } catch {
      alert("Failed to add customer");
    } finally {
      setSavingCustomer(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Record New Sale"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
          <button 
            type="submit" 
            form="sale-form" 
            disabled={savingSale}
            className="px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 disabled:opacity-70"
          >
            {savingSale ? "Saving..." : "Confirm Sale"}
          </button>
        </div>
      }
    >
      <form id="sale-form" onSubmit={createSale} className="space-y-4">
        {saleError && <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{saleError}</div>}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">KSh</span>
            <input 
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="0.00"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-xl outline-none focus:border-black"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
            >
              <option value="mpesa">M-Pesa</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
            </select>
          </div>
          
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
             <select 
               className="w-full p-2 border border-gray-300 rounded-xl outline-none focus:border-black"
               value={customerId}
               onChange={e => setCustomerId(e.target.value)}
             >
               <option value="">Guest / Walk-in</option>
               {customerOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
             <button type="button" onClick={() => setShowAddCustomer(!showAddCustomer)} className="text-xs text-blue-600 font-medium mt-1 hover:underline">+ New Customer</button>
          </div>
        </div>

        {showAddCustomer && (
          <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
             <div className="text-sm font-semibold text-blue-800">New Customer Details</div>
             <input className="w-full p-2 border rounded-lg text-sm" placeholder="Name" value={custName} onChange={e => setCustName(e.target.value)} />
             <input className="w-full p-2 border rounded-lg text-sm" placeholder="Phone (Optional)" value={custPhone} onChange={e => setCustPhone(e.target.value)} />
             <button type="button" onClick={createCustomer} disabled={savingCustomer} className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700">
               {savingCustomer ? "Saving..." : "Save Customer"}
             </button>
          </div>
        )}
      </form>
    </Modal>
  );
}

// ---------- Main Dashboard ----------
export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [range, setRange] = useState("7d");
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  async function load() {
    try {
      const [meRes, sumRes, custRes] = await Promise.all([
        api.get("/users/me"),
        api.get(`/sales/summary?range=${range}`),
        api.get("/customers"),
      ]);
      setMe(meRes.data);
      setSummary(sumRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  }

  useEffect(() => { load(); }, [range]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/sales/export?range=${range}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_${range}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { alert("Download failed"); }
    finally { setExporting(false); }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                {me ? `${getGreeting()}, ${me.name.split(' ')[0]}! 👋` : "Welcome back"}
              </h1>
              <p className="text-gray-500 mt-1">Here is what is happening with your business.</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Download size={18} />
                {exporting ? "Exporting..." : "Export CSV"}
              </button>
              <button 
                onClick={() => setSaleModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
              >
                <Plus size={18} />
                Record Sale
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-xl w-fit shadow-sm">
            {[
              { key: "today", label: "Today" },
              { key: "7d", label: "Last 7 Days" },
              { key: "30d", label: "Last 30 Days" },
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  range === r.key 
                    ? "bg-black text-white shadow-md" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Stats Grid */}
          {!summary ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <CardSkeleton /><CardSkeleton /><CardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card 
                title="Total Sales" 
                value={formatKsh(range === 'today' ? summary.today_total : range === '7d' ? summary.week_total : summary.month_total)} 
                icon={Wallet}
                colorClass="bg-emerald-100 text-emerald-600"
              />
              <Card 
                title="Orders" 
                value={(summary.payments || []).reduce((acc, p) => acc + p.count, 0)} 
                icon={Banknote}
                colorClass="bg-blue-100 text-blue-600"
              />
              <Card 
                title="Best Day" 
                value={summary.best_day ? `${summary.best_day.day}` : "-"} 
                icon={TrendingUp}
                colorClass="bg-violet-100 text-violet-600"
              />
            </div>
          )}

          {/* Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Payments Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><CreditCard size={20} /></div>
                <h2 className="font-bold text-gray-900">Payment Channels</h2>
              </div>
              <div className="space-y-4">
                 {(summary?.payments || []).length === 0 && <div className="text-gray-400 text-center py-4">No data available</div>}
                 {(summary?.payments || []).map(p => (
                   <div key={p.method} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="capitalize font-medium text-gray-700">{p.method}</div>
                        <span className="text-xs px-2 py-1 bg-white rounded border text-gray-500">{p.count} orders</span>
                      </div>
                      <div className="font-bold text-gray-900">{formatKsh(p.total)}</div>
                   </div>
                 ))}
              </div>
            </div>

            {/* Customers Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-pink-100 rounded-lg text-pink-600"><Users size={20} /></div>
                <h2 className="font-bold text-gray-900">Top Customers</h2>
              </div>
              <div className="space-y-4">
                 {(summary?.top_customers || []).length === 0 && <div className="text-gray-400 text-center py-4">No data available</div>}
                 {(summary?.top_customers || []).map((c, i) => (
                   <div key={c.customer_id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-black group-hover:text-white transition-colors">
                           {i + 1}
                         </div>
                         <div>
                           <div className="font-medium text-gray-900">{c.name}</div>
                           <div className="text-xs text-gray-500">{c.orders} orders</div>
                         </div>
                      </div>
                      <div className="font-semibold text-gray-900">{formatKsh(c.total_spent)}</div>
                   </div>
                 ))}
              </div>
            </div>

          </div>
          
          <RecordSaleModal 
            open={saleModalOpen} 
            onClose={() => setSaleModalOpen(false)}
            customers={customers}
            onCustomerCreated={newCust => setCustomers(prev => [newCust, ...prev])}
            onSaleCreated={load}
          />
        </div>
      </div>
    </Layout>
  );
}