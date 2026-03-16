import { Link, useNavigate } from "react-router-dom";
import "../styles/superadmin.css";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("pft_token");
    window.location.href = "/superadmin/login";
  };

  return (
    <div className="superadmin-dashboard">
      <div className="superadmin-header">
        <h1>Super Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>👥 User Management</h3>
          <ul>
            <li>
              <Link to="/superadmin/evaluators">View All Evaluators</Link>
              <p>Create, view details, and delete evaluators</p>
            </li>
            <li>
              <Link to="/superadmin/evaluators/create">Create New Evaluator</Link>
            </li>
            <li>
              <Link to="/superadmin/admins">View All Admins</Link>
              <p>Create, view details, and delete admins</p>
            </li>
            <li>
              <Link to="/superadmin/admins/create">Create New Admin</Link>
            </li>
          </ul>
        </div>

        <div className="dashboard-card">
          <h3>📊 Records Management</h3>
          <ul>
            <li>
              <Link to="/superadmin/pft-results">View All PFT Results</Link>
              <p>View, edit, and delete any fitness test result</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}