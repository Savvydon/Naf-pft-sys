import { Link } from "react-router-dom";
import "../styles/superadmin.css";

export default function SuperAdminDashboard() {
  return (
    <div style={{ padding: "40px" }}>
      <h1>Super Admin Dashboard</h1>

      <ul>
        <li>
          <Link to="/superadmin/evaluators">View Evaluators</Link>
        </li>

        <li>
          <Link to="/superadmin/admins">View Admins</Link>
        </li>

        <li>
          <Link to="/admin/personnel">View All Personnel Records</Link>
        </li>
      </ul>
    </div>
  );
}
