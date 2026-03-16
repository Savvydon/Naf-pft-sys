import { Link } from "react-router-dom";
import "../styles/Admin.css";

export default function AdminSidebar() {
  return (
    <div className="admin-sidebar">
      <h3>Admin Panel</h3>
      <nav>
        <Link to="/admin/dashboard">Dashboard</Link>
        <Link to="/admin/personnel">Personnel Records</Link>
      </nav>
    </div>
  );
}

// import { Link } from "react-router-dom";
// import "../styles/Admin.css";
// export default function AdminSidebar() {
//   return (
//     <div className="admin-sidebar">
//       <h3>Admin</h3>

//       <nav>
//         <Link to="/admin/dashboard">Dashboard</Link>
//         <Link to="/admin/personnel">Personnel</Link>
//       </nav>
//     </div>
//   );
// }
