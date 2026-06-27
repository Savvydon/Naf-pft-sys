import { useAuth } from "../../AuthContext";
import { Navigate, Outlet } from "react-router-dom";

export default function AdminProtectedRoute() {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        Authenticating...
      </div>
    );
  }

  // ✅ EXACT ROLE CHECK: Only "admin" role can access admin routes
  // Super admins should NOT access admin routes - they have their own
  if (!currentUser || currentUser.role !== "admin") {
    // Redirect based on actual role
    if (currentUser?.role === "super_admin") {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    if (currentUser?.role === "evaluator") {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}