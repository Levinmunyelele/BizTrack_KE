import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { Loader2, Lock, Mail, User, Building } from "lucide-react";

export default function Register() {
  // These keys match your Python Pydantic schema EXACTLY
  const [formData, setFormData] = useState({
    name: "",          // Owner Name
    email: "",         // Owner Email
    password: "",      // Password
    business_name: ""  // Business Name
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Send data to backend
      // Your backend creates the Business + Owner User + returns a token
      const res = await api.post("/auth/register", formData);
      
      // 2. Save token immediately (Auto-login)
      localStorage.setItem("token", res.data.access_token);
      
      // 3. Redirect to Dashboard
      alert("Business created successfully! Welcome.");
      navigate("/"); 
      
    } catch (err) {
      // Handle errors (like "Email already exists")
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black text-white mb-4 shadow-lg">
             <span className="font-bold text-xl">BZ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Account</h1>
          <p className="text-gray-500 mt-2">Start tracking your business today</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Business Name Input */}
          <div>
            <label className="text-sm font-semibold text-gray-700 ml-1">Business Name</label>
            <div className="relative mt-1">
              <Building className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                className="w-full pl-10 p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-black/5 transition-all"
                placeholder="e.g. Levin's Shop"
                value={formData.business_name}
                onChange={e => setFormData({...formData, business_name: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Owner Name Input */}
          <div>
            <label className="text-sm font-semibold text-gray-700 ml-1">Owner Name</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                className="w-full pl-10 p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-black/5 transition-all"
                placeholder="e.g. Levin"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="email"
                className="w-full pl-10 p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-black/5 transition-all"
                placeholder="name@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                type="password"
                className="w-full pl-10 p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-black/5 transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            disabled={loading}
            className="w-full py-3 bg-black text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 disabled:opacity-70 mt-4 transition-transform active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Register Business"}
          </button>
        </form>

        {/* Link to Login */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-black font-semibold hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
}