// frontend/src/App.jsx
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Evaluator Pages
import PhysicalFitness from "./components/PhysicalFitness";
import Results from "./components/Results";
import Login from "./components/Login";

// Admin Pages
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminAnalytics from "./admin/pages/Analytics";
import PersonnelList from "./admin/pages/PersonnelList";
import PersonnelDetails from "./admin/pages/PersonnelDetails";
import PersonnelEdit from "./admin/pages/PersonnelEdit";

// Super Admin Pages
import SuperAdminLogin from "./superadmin/pages/SuperAdminLogin";
import SuperAdminDashboard from "./superadmin/pages/SuperAdminDashboard";
import SuperAdminAnalytics from "./superadmin/pages/Analytics";
import EvaluatorsList from "./superadmin/pages/EvaluatorsList";
import AdminsList from "./superadmin/pages/AdminsList";
import CreateEvaluator from "./superadmin/pages/CreateEvaluator";
import CreateAdmin from "./superadmin/pages/CreateAdmin";
import EvaluatorDetails from "./superadmin/pages/EvaluatorDetails";
import AdminDetails from "./superadmin/pages/AdminDetails";
import PFTResultsList from "./superadmin/pages/PFTResultsList";

// Certificate Page
import Certificate from "./components/Certificate";

// Protected Route Components
import AdminProtectedRoute from "./admin/components/AdminProtectedRoute";
import SuperAdminProtectedRoute from "./superadmin/components/SuperAdminProtectedRoute";

// ✅ MODIFIED: EvaluatorProtectedRoute - Only allows evaluators
function EvaluatorProtectedRoute() {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return <div style={{ textAlign: "center", marginTop: "50px" }}>Authenticating...</div>;
  }

  // Must be logged in AND role must be exactly "evaluator"
  if (!currentUser || currentUser.role !== "evaluator") {
    // Redirect admins to admin dashboard, super admins to superadmin dashboard
    if (currentUser?.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (currentUser?.role === "super_admin") {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    // Not logged in or unknown role -> login
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// ✅ MODIFIED: Redirect logged-in users away from login pages (role-aware)
function EvaluatorLoginRedirect({ children }) {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return <div style={{ textAlign: "center", marginTop: "50px" }}>Authenticating...</div>;
  }

  if (currentUser) {
    if (currentUser.role === "super_admin") {
      return <Navigate to="/superadmin/dashboard" replace />;
    } else if (currentUser.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (currentUser.role === "evaluator") {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

// Main App Routes
export default function App() {
  return (
    <Routes>
      {/* ====================== SUPER ADMIN ROUTES ====================== */}
      <Route
        path="/superadmin/login"
        element={
          <EvaluatorLoginRedirect>
            <SuperAdminLogin />
          </EvaluatorLoginRedirect>
        }
      />

      <Route element={<SuperAdminProtectedRoute />}>
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/analytics" element={<SuperAdminAnalytics />} />
        <Route path="/superadmin/evaluators" element={<EvaluatorsList />} />
        <Route path="/superadmin/evaluators/create" element={<CreateEvaluator />} />
        <Route path="/superadmin/evaluators/:id" element={<EvaluatorDetails />} />
        <Route path="/superadmin/admins" element={<AdminsList />} />
        <Route path="/superadmin/admins/create" element={<CreateAdmin />} />
        <Route path="/superadmin/admins/:id" element={<AdminDetails />} />
        <Route path="/superadmin/pft-results" element={<PFTResultsList />} />

        {/* Personnel / Result Detail & Edit */}
        <Route path="/superadmin/pft-results/:id" element={<PersonnelDetails fromSuperAdmin={true} />} />
        <Route path="/superadmin/pft-results/:id/edit" element={<PersonnelEdit fromSuperAdmin={true} />} />

        {/* CERTIFICATE ROUTE - SUPER ADMIN */}
        <Route
          path="/superadmin/pft-results/:id/certificate"
          element={<Certificate fromSuperAdmin={true} />}
        />
      </Route>

      {/* ====================== ADMIN ROUTES ====================== */}
      <Route
        path="/admin/login"
        element={
          <EvaluatorLoginRedirect>
            <AdminLogin />
          </EvaluatorLoginRedirect>
        }
      />

      <Route element={<AdminProtectedRoute />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/personnel" element={<PersonnelList />} />

        {/* Personnel / Result Detail & Edit */}
        <Route path="/admin/personnel/:id" element={<PersonnelDetails fromSuperAdmin={false} />} />
        <Route path="/admin/personnel/:id/edit" element={<PersonnelEdit fromSuperAdmin={false} />} />

        {/* CERTIFICATE ROUTE - ADMIN */}
        <Route
          path="/admin/personnel/:id/certificate"
          element={<Certificate fromSuperAdmin={false} />}
        />
      </Route>

      {/* ====================== EVALUATOR ROUTES (RESTRICTED) ====================== */}
      <Route
        path="/login"
        element={
          <EvaluatorLoginRedirect>
            <Login />
          </EvaluatorLoginRedirect>
        }
      />

      {/* ✅ MODIFIED: Only evaluators can access these routes */}
      <Route element={<EvaluatorProtectedRoute />}>
        <Route path="/" element={<PhysicalFitness />} />
        <Route path="/results" element={<Results />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}