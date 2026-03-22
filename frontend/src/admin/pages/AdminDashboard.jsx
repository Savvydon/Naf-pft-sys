import AdminHeader from "../components/AdminHeader";
import AdminSidebar from "../components/AdminSidebar";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/Admin.css";

const API_BASE = "https://naf-pft-sys-1.onrender.com";

export default function AdminDashboard() {
  const { logout } = useAuth();
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

        <h3>Dashboard</h3>
        <p>Welcome to the NAF PFT Admin System.</p>
      </div>
    </div>
  );
}

// import AdminHeader from "../components/AdminHeader";
// import AdminSidebar from "../components/AdminSidebar";
// import { useAuth } from "../../AuthContext";
// import { useNavigate } from "react-router-dom";
// import "../styles/Admin.css";

// export default function AdminDashboard() {
//   const { logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout(); // Clear token and user state
//     navigate("/admin/login"); // Redirect to Admin login page
//   };

//   return (
//     <div className="admin-layout">
//       <AdminSidebar />

//       <div className="admin-content">
//         <AdminHeader />

//         {/* Logout Button */}
//         <div style={{ textAlign: "right", marginBottom: "20px" }}>
//           <button
//             onClick={handleLogout}
//             style={{
//               padding: "8px 16px",
//               background: "#c0392b",
//               color: "white",
//               border: "none",
//               borderRadius: "6px",
//               cursor: "pointer",
//               fontWeight: "600",
//             }}
//           >
//             Logout
//           </button>
//         </div>

//         <h3>Dashboard</h3>
//         <p>Welcome to the NAF PFT Admin System.</p>
//       </div>
//     </div>
//   );
// }
