import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Receipt, LogOut, Menu, X, ChevronRight, Briefcase } from "lucide-react";

export default function Layout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function logout() {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Sales History", path: "/sales", icon: Receipt },
    { name: "Customers", path: "/customers", icon: Users },
    { name: "Manage Team", path: "/staff", icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-64 bg-black text-white fixed h-full z-20 shadow-xl">
        {/* Brand Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black font-black text-lg shadow-lg shadow-white/10">
              BZ
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">BizTrack KE</h1>
              <span className="text-xs text-gray-500 font-medium">Business Analytics</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-white text-black font-semibold shadow-md translate-x-1" 
                    : "text-gray-400 hover:bg-gray-900 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={isActive ? "text-black" : "text-gray-500 group-hover:text-white"} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight size={16} className="text-gray-400" />}
              </NavLink>
            );
          })}
        </nav>

        {/* User / Logout Section */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl w-full transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>


      {/* ================= MOBILE HEADER ================= */}
      <div className="md:hidden fixed top-0 w-full bg-white z-30 px-4 py-3 flex items-center justify-between border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-black rounded-lg text-white flex items-center justify-center text-xs font-bold">BZ</div>
           <span className="font-bold text-gray-900 text-lg">BizTrack KE</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg active:scale-95 transition-transform"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* ================= MOBILE MENU OVERLAY ================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="absolute top-[60px] left-0 w-full bg-white border-b border-gray-100 shadow-xl p-4 flex flex-col gap-2 animate-in slide-in-from-top-2"
            onClick={e => e.stopPropagation()}
          >
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `flex items-center gap-4 p-4 rounded-xl text-lg font-medium transition-colors ${
                  isActive ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <item.icon size={22} />
                {item.name}
              </NavLink>
            ))}
            <div className="h-px bg-gray-100 my-2" />
            <button 
              onClick={logout}
              className="flex items-center gap-4 p-4 text-red-600 font-medium hover:bg-red-50 rounded-xl"
            >
              <LogOut size={22} /> Sign Out
            </button>
          </div>
        </div>
      )}


      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="mt-16 md:mt-0 p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}