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

  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "super_admin")
  ) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

// import { useAuth } from "../../AuthContext";
// import { Navigate, Outlet } from "react-router-dom";

// export default function AdminProtectedRoute() {
//   const { currentUser, authLoading } = useAuth();

//   if (authLoading) {
//     return (
//       <div style={{ textAlign: "center", marginTop: "50px" }}>
//         Authenticating...
//       </div>
//     );
//   }

//   if (!currentUser || currentUser.role !== "admin") {
//     return <Navigate to="/admin/login" replace />;
//   }

//   return <Outlet />;
// }
