import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/client";
import { Plus, Trash2, Shield, User } from "lucide-react";

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 1. Fetch the list of staff when page loads
  async function load() {
    try {
      const res = await api.get("/users/staff");
      setStaff(res.data);
    } catch (err) {
      console.error(err);
      // If the backend says "403 Forbidden", it means a Staff member tried to open this page
      if (err.response?.status === 403) {
          alert("Access Denied. Only the Owner can manage staff.");
          window.location.href = "/";
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

 async function addStaff(e) {
    e.preventDefault();
    setError(""); // Clear previous errors
    
    try {
      await api.post("/users/staff", {
        name: name,
        email: email,
        password: password,
        role: "staff"  // <--- ADD THIS LINE! This fixes the 422 error.
      });
      
      // Success! Clear form and reload list
      setName(""); 
      setEmail(""); 
      setPassword(""); 
      setIsFormOpen(false);
      await load(); 
      alert("Staff member added successfully!");

    } catch (err) {
      console.error("Error adding staff:", err);

      // --- CRASH PREVENTION FIX ---
      // This prevents the "White Screen" if the error is an Object/Array
      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
         // If backend returns a list of validation errors (standard FastAPI 422)
         // ex: msg "field required" for "role"
         const firstError = detail[0];
         setError(`${firstError.msg}: ${firstError.loc.join(".")}`);
      } else if (typeof detail === 'object') {
         setError(JSON.stringify(detail)); // Convert object to string to avoid crash
      } else {
         setError(detail || "Failed to add staff.");
      }
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Team</h2>
            <p className="text-gray-500">Create accounts for your employees.</p>
          </div>
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-xl font-medium"
          >
            <Plus size={18} /> {isFormOpen ? "Cancel" : "Add Staff"}
          </button>
        </div>

        {/* --- ADD STAFF FORM --- */}
        {isFormOpen && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8 animate-in slide-in-from-top-2">
            <h3 className="font-bold text-lg mb-4">New Staff Details</h3>
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-4 text-sm">{error}</div>}
            
            <form onSubmit={addStaff} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                <input className="w-full mt-1 p-2 border rounded-lg" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. John Kamau" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
                <input className="w-full mt-1 p-2 border rounded-lg" value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="john@biz.com" required />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Assign Password</label>
                <input className="w-full mt-1 p-2 border rounded-lg" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Create a password for them (e.g. Welcome123)" required />
                <p className="text-xs text-gray-500 mt-1">Tell your staff member this password so they can log in.</p>
              </div>
              
              <div className="md:col-span-2 flex justify-end mt-2">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- STAFF LIST --- */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-sm text-gray-600 font-semibold">Name</th>
                <th className="p-4 text-sm text-gray-600 font-semibold">Email</th>
                <th className="p-4 text-sm text-gray-600 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.length === 0 ? (
                <tr><td colSpan="3" className="p-8 text-center text-gray-500">No staff added yet.</td></tr>
              ) : (
                staff.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {user.name.charAt(0)}
                      </div>
                      {user.name}
                    </td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 uppercase tracking-wide">
                        <User size={12} /> Staff
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}