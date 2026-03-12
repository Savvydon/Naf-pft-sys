// import { Routes, Route, Navigate } from "react-router-dom";
// import PhysicalFitness from "./components/PhysicalFitness";
// import Results from "./components/Results";
// import AdminLogin from "./admin/pages/AdminLogin";
// import AdminDashboard from "./admin/pages/AdminDashboard";
// import PersonnelList from "./admin/pages/PersonnelList";
// import PersonnelDetails from "./admin/pages/PersonnelDetails";
// import PersonnelEdit from "./admin/pages/PersonnelEdit.jsx";

// export default function App() {
//   return (
//     <Routes>
//       {/* Public */}
//       <Route path="/" element={<PhysicalFitness />} />
//       <Route path="/results" element={<Results />} />

//       <Route path="/admin/login" element={<AdminLogin />} />
//       <Route path="/admin/dashboard" element={<AdminDashboard />} />
//       <Route path="/admin/personnel" element={<PersonnelList />} />
//       <Route path="/admin/personnel/:id" element={<PersonnelDetails />} />
//       <Route path="/admin/personnel/:id/edit" element={<PersonnelEdit />} />
//     </Routes>
//   );
// }

import { Routes, Route, Navigate } from "react-router-dom";
import PhysicalFitness from "./components/PhysicalFitness";
import Results from "./components/Results";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import PersonnelList from "./admin/pages/PersonnelList";
import PersonnelDetails from "./admin/pages/PersonnelDetails";
import PersonnelEdit from "./admin/pages/PersonnelEdit.jsx";
import { useAuth } from "./components/AuthContext";

// Protected route wrapper for evaluator pages
function EvaluatorProtectedRoute({ children }) {
  const { token, authLoading } = useAuth();

  if (authLoading) {
    return <div>Loading authentication...</div>; // or a spinner component
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Redirect logged-in users away from login page
function EvaluatorLoginRedirect({ children }) {
  const { token } = useAuth();

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public / unprotected routes (admin pages open for now) */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/personnel" element={<PersonnelList />} />
      <Route path="/admin/personnel/:id" element={<PersonnelDetails />} />
      <Route path="/admin/personnel/:id/edit" element={<PersonnelEdit />} />

      {/* Evaluator login page */}
      <Route
        path="/login"
        element={
          <EvaluatorLoginRedirect>
            <AdminLogin /> {/* Reuse your evaluator login component */}
          </EvaluatorLoginRedirect>
        }
      />

      {/* Protected evaluator pages */}
      <Route element={<EvaluatorProtectedRoute />}>
        <Route path="/" element={<PhysicalFitness />} />
        <Route path="/results" element={<Results />} />
      </Route>

      {/* Catch-all redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
