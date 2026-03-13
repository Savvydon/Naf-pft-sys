import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

import PhysicalFitness from "./components/PhysicalFitness";
import Results from "./components/Results";
import Login from "./components/Login";

import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import PersonnelList from "./admin/pages/PersonnelList";
import PersonnelDetails from "./admin/pages/PersonnelDetails";
import PersonnelEdit from "./admin/pages/PersonnelEdit";
import AdminProtectedRoute from "./admin/components/AdminProtectedRoute";

import SuperAdminLogin from "./superadmin/pages/SuperAdminLogin";
import SuperAdminDashboard from "./superadmin/pages/SuperAdminDashboard";
import EvaluatorsList from "./superadmin/pages/EvaluatorsList";
import AdminsList from "./superadmin/pages/AdminsList";
import SuperAdminProtectedRoute from "./superadmin/components/SuperAdminProtectedRoute";

// -----------------------------
// Protected Evaluator Route
// -----------------------------
function EvaluatorProtectedRoute() {
  const { token, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        Authenticating...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// -----------------------------
// Redirect logged-in evaluators away from login
// -----------------------------
function EvaluatorLoginRedirect({ children }) {
  const { token } = useAuth();

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// -----------------------------
// APP ROUTES
// -----------------------------
export default function App() {
  return (
    <Routes>
      {/* ================================= */}
      {/* SUPER ADMIN ROUTES */}
      {/* ================================= */}

      <Route path="/superadmin/login" element={<SuperAdminLogin />} />

      <Route element={<SuperAdminProtectedRoute />}>
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />

        <Route path="/superadmin/evaluators" element={<EvaluatorsList />} />

        <Route path="/superadmin/admins" element={<AdminsList />} />
      </Route>

      {/* ================================= */}
      {/* ADMIN ROUTES */}
      {/* ================================= */}

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route element={<AdminProtectedRoute />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        <Route path="/admin/personnel" element={<PersonnelList />} />

        <Route path="/admin/personnel/:id" element={<PersonnelDetails />} />

        <Route path="/admin/personnel/:id/edit" element={<PersonnelEdit />} />
      </Route>

      {/* ================================= */}
      {/* EVALUATOR LOGIN */}
      {/* ================================= */}

      <Route
        path="/login"
        element={
          <EvaluatorLoginRedirect>
            <Login />
          </EvaluatorLoginRedirect>
        }
      />

      {/* ================================= */}
      {/* EVALUATOR ROUTES */}
      {/* ================================= */}

      <Route element={<EvaluatorProtectedRoute />}>
        <Route path="/" element={<PhysicalFitness />} />

        <Route path="/results" element={<Results />} />
      </Route>

      {/* ================================= */}
      {/* FALLBACK */}
      {/* ================================= */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
