import { NavLink, useNavigate } from "react-router-dom";

export default function Layout({ children }) {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg ${isActive ? "bg-black text-white" : "hover:bg-gray-100"}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">BizTrack KE</h1>
          <button onClick={logout} className="border bg-white px-3 py-2 rounded-lg">
            Logout
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <NavLink to="/" className={linkClass} end>Dashboard</NavLink>
          <NavLink to="/customers" className={linkClass}>Customers</NavLink>
          <NavLink to="/sales" className={linkClass}>Sales</NavLink>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
