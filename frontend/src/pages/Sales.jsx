import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/client";
import { CreditCard, Banknote, Smartphone, Receipt, Calendar, User } from "lucide-react";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get("/sales");
      setSales(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Helper for Payment Icons
  const getMethodIcon = (method) => {
    switch(method) {
      case 'mpesa': return <Smartphone size={18} className="text-green-600" />;
      case 'card': return <CreditCard size={18} className="text-blue-600" />;
      default: return <Banknote size={18} className="text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
        day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-black rounded-xl text-white">
            <Receipt size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sales History</h2>
            <p className="text-gray-500">View all your past transactions</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
             <div className="p-8 text-center text-gray-500">Loading sales...</div>
          ) : sales.length === 0 ? (
             <div className="p-12 text-center flex flex-col items-center">
               <div className="bg-gray-100 p-4 rounded-full mb-3"><Receipt size={32} className="text-gray-400"/></div>
               <p className="text-gray-600">No sales recorded yet.</p>
             </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-sm font-semibold text-gray-600">ID</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Method</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-gray-500 text-sm font-mono">#{s.id}</td>
                    <td className="p-4 font-bold text-gray-900">KSh {s.amount.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-100 w-fit text-sm font-medium capitalize">
                        {getMethodIcon(s.payment_method)}
                        {s.payment_method}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {s.created_at ? formatDate(s.created_at) : "Just now"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}