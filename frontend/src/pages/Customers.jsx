import { useEffect, useState, useMemo } from "react";
import Layout from "../components/Layout";
import api from "../api/client";
import { Search, Plus, Phone, User, Loader2 } from "lucide-react";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const res = await api.get("/customers");
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function addCustomer(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/customers", { name, phone });
      setName(""); setPhone(""); setIsFormOpen(false);
      await load();
    } catch {
      alert("Failed to add");
    } finally {
      setSubmitting(false);
    }
  }

  // Filter logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.phone && c.phone.includes(searchTerm))
    );
  }, [customers, searchTerm]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:bg-gray-800 transition-all active:scale-95"
          >
            <Plus size={18} /> {isFormOpen ? "Cancel" : "Add Customer"}
          </button>
        </div>

        {/* Add Form (Collapsible) */}
        {isFormOpen && (
          <form onSubmit={addCustomer} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-top-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 ml-1">Full Name</label>
                <input className="w-full mt-1 p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-black/5" placeholder="e.g. John Doe" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 ml-1">Phone Number</label>
                <input className="w-full mt-1 p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-black/5" placeholder="07..." value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button disabled={submitting} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {submitting ? "Saving..." : "Save Customer"}
              </button>
            </div>
          </form>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-black transition-colors"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
             <div className="p-8 flex justify-center text-gray-400"><Loader2 className="animate-spin" /></div>
          ) : filteredCustomers.length === 0 ? (
             <div className="p-8 text-center text-gray-500">No customers found.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredCustomers.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    {/* Dynamic Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      <div className="text-sm text-gray-500">{c.phone || "No phone"}</div>
                    </div>
                  </div>
                  
                  {/* Call Button (Works on mobile) */}
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-all">
                      <Phone size={20} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}