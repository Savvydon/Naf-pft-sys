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

  if (!currentUser || currentUser.role !== "super_admin") {
    return <Navigate to="/superadmin/login" replace />;
  }

  return <Outlet />;
}
