import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import PhysicalFitness from "./components/PhysicalFitness";
import Results from "./components/Results";
import Login from "./components/Login";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminAnalytics from "./admin/pages/Analytics";
import PersonnelList from "./admin/pages/PersonnelList";
import PersonnelDetails from "./admin/pages/PersonnelDetails";
import PersonnelEdit from "./admin/pages/PersonnelEdit";
import AdminProtectedRoute from "./admin/components/AdminProtectedRoute";
import SuperAdminLogin from "./superadmin/pages/SuperAdminLogin";
import SuperAdminDashboard from "./superadmin/pages/SuperAdminDashboard";
import SuperAdminAnalytics from "./superadmin/pages/Analytics";
import EvaluatorsList from "./superadmin/pages/EvaluatorsList";
import AdminsList from "./superadmin/pages/AdminsList";
import SuperAdminProtectedRoute from "./superadmin/components/SuperAdminProtectedRoute";
import CreateEvaluator from "./superadmin/pages/CreateEvaluator";
import CreateAdmin from "./superadmin/pages/CreateAdmin";
import EvaluatorDetails from "./superadmin/pages/EvaluatorDetails";
import PFTResultsList from "./superadmin/pages/PFTResultsList";

// Protected Evaluator Route
function EvaluatorProtectedRoute() {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        Authenticating...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// Redirect logged-in evaluators away from login
function EvaluatorLoginRedirect({ children }) {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        Authenticating...
      </div>
    );
  }

  if (currentUser) {
    // Redirect based on role
    if (currentUser.role === "super_admin") {
      return <Navigate to="/superadmin/dashboard" replace />;
    } else if (currentUser.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

// APP ROUTES
export default function App() {
  return (
    <Routes>
      {/* SUPER ADMIN ROUTES */}
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
        <Route
          path="/superadmin/evaluators/create"
          element={<CreateEvaluator />}
        />
        <Route
          path="/superadmin/evaluators/:id"
          element={<EvaluatorDetails />}
        />
        <Route path="/superadmin/admins" element={<AdminsList />} />
        <Route path="/superadmin/admins/create" element={<CreateAdmin />} />
        <Route path="/superadmin/pft-results" element={<PFTResultsList />} />
        <Route
          path="/superadmin/pft-results/:id"
          element={<PersonnelDetails fromSuperAdmin={true} />}
        />
        <Route
          path="/superadmin/pft-results/:id/edit"
          element={<PersonnelEdit fromSuperAdmin={true} />}
        />
      </Route>

      {/* ADMIN ROUTES */}
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
        <Route
          path="/admin/personnel/:id"
          element={<PersonnelDetails fromSuperAdmin={false} />}
        />
        <Route
          path="/admin/personnel/:id/edit"
          element={<PersonnelEdit fromSuperAdmin={false} />}
        />
      </Route>

      {/* EVALUATOR LOGIN */}
      <Route
        path="/login"
        element={
          <EvaluatorLoginRedirect>
            <Login />
          </EvaluatorLoginRedirect>
        }
      />

      {/* EVALUATOR ROUTES */}
      <Route element={<EvaluatorProtectedRoute />}>
        <Route path="/" element={<PhysicalFitness />} />
        <Route path="/results" element={<Results />} />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
