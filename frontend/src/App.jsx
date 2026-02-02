// 1. We removed 'BrowserRouter' from the imports because it is already in main.jsx
import { Routes, Route, Navigate } from "react-router-dom"; 
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Staff from "./pages/Staff";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    // 2. We removed the <BrowserRouter> wrapper here. 
    // The <Routes> tag must be the top-level element here.
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <Sales />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff"
        element={
          <ProtectedRoute>
            <Staff />
          </ProtectedRoute>
        }
      />

      {/* Redirect unknown routes to Dashboard */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}