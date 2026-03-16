// // AdminProtectedRoute.jsx
// import { useAuth } from "../../components/AuthContext";
// import { Navigate } from "react-router-dom";

// export default function AdminProtectedRoute({ children }) {
//   const { currentUser, authLoading } = useAuth();

//   if (authLoading) return <div>Loading...</div>;

//   if (!currentUser || currentUser.role !== "admin") {
//     return <Navigate to="/admin/login" replace />;
//   }

//   return children;
// }

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

  if (!currentUser || currentUser.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
