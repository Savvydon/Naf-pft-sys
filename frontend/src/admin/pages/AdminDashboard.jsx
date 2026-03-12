import AdminHeader from "../components/AdminHeader";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/Admin.css";
export default function AdminDashboard() {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-content">
        <AdminHeader />

        <h3>Dashboard</h3>

        <p>Welcome to the NAF PFT Admin System.</p>
      </div>
    </div>
  );
}
