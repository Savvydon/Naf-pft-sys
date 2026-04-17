// import { useAuth } from "../../AuthContext";
// import { Navigate, Outlet } from "react-router-dom";
// import "../styles/superadmin.css";

// export default function SuperAdminProtectedRoute() {
//   const { currentUser, authLoading } = useAuth();

//   if (authLoading) {
//     return (
//       <div style={{ textAlign: "center", marginTop: "50px" }}>
//         Authenticating...
//       </div>
//     );
//   }

//   if (!currentUser || currentUser.role !== "super_admin") {
//     return <Navigate to="/superadmin/login" replace />;
//   }

//   return <Outlet />;
// }


// frontend/src/superadmin/components/SuperAdminProtectedRoute.jsx
import { useAuth } from "../../AuthContext";
import { Navigate, Outlet } from "react-router-dom";
import "../styles/superadmin.css";

export default function SuperAdminProtectedRoute() {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        Authenticating...
      </div>
    );
  }

  // ✅ EXACT ROLE CHECK: Only "super_admin" role can access superadmin routes
  // Regular admins should NOT access superadmin routes
  if (!currentUser || currentUser.role !== "super_admin") {
    // Redirect based on actual role
    if (currentUser?.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (currentUser?.role === "evaluator") {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/superadmin/login" replace />;
  }

  return <Outlet />;
}