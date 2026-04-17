// frontend/src/admin/pages/AdminDashboard.jsx
import AdminHeader from "../components/AdminHeader";
import AdminSidebar from "../components/AdminSidebar";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/Admin.css";

const API_BASE = "https://naf-pft-sys-1.onrender.com";

export default function AdminDashboard() {
  const { logout, currentUser } = useAuth(); // ✅ Get currentUser from auth context
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-content">
        <AdminHeader />

        {/* Logout Button */}
        <div style={{ textAlign: "right", marginBottom: "20px" }}>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 16px",
              background: "#c0392b",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Logout
          </button>
        </div>

        {/* ✅ NEW: Welcome section with admin name */}
        <div className="dashboard-welcome" style={{ marginBottom: "30px" }}>
          <h3>Welcome, {currentUser?.full_name || "Admin"}! to the NAF PFT Admin System.</h3>
          <p>
            <strong>Rank:</strong> {currentUser?.rank || "N/A"} | {" "}
            <strong>Role:</strong> Administrator
          </p>
          <p style={{ marginTop: "10px", color: "#6c757d" }}>
            You are logged in as an Admin. You can manage personnel records, view analytics, 
            and issue certificates.
          </p>
        </div>
      </div>
    </div>
  );
}