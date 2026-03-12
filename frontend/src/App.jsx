// import { Routes, Route } from "react-router-dom";
// import PhysicalFitness from "./components/PhysicalFitness.jsx";
// import Results from "./components/Results.jsx";

// export default function App() {
//   return (
//     <Routes>
//       {/* Home page */}
//       <Route path="/" element={<PhysicalFitness />} />

//       {/* Results page */}
//       <Route path="/results" element={<Results />} />
//     </Routes>
//   );
// }

// import { Routes, Route, Navigate } from "react-router-dom";

// // User-facing pages (your original components)
// import PhysicalFitness from "./components/PhysicalFitness.jsx";
// import Results from "./components/Results.jsx";
// import "./styles/Admin.css";

// // Admin section
// import AdminLayout from "./Admin/components/AdminLayout.jsx";
// import Dashboard from "./Admin/pages/Dashboard.jsx";
// import ResultsList from "./Admin/pages/ResultsList.jsx";
// import Members from "./Admin/pages/Members.jsx";
// import Units from "./Admin/pages/Units.jsx";
// import Settings from "./Admin/pages/Settings.jsx";

// export default function App() {
//   return (
//     <Routes>
//       {/* ────────────────────────────────────────────────
//           Public / User-facing routes
//       ──────────────────────────────────────────────── */}
//       <Route path="/" element={<PhysicalFitness />} />
//       <Route path="/results" element={<Results />} />

//       {/* ────────────────────────────────────────────────
//           Admin routes — all wrapped in AdminLayout
//       ──────────────────────────────────────────────── */}
//       <Route path="/admin" element={<AdminLayout />}>
//         {/* Dashboard is the default page when going to /admin */}
//         <Route index element={<Dashboard />} />
//         <Route path="results" element={<ResultsList />} />
//         <Route path="members" element={<Members />} />
//         <Route path="units" element={<Units />} />
//         <Route path="settings" element={<Settings />} />

//         {/* Optional: redirect any unknown admin sub-path back to dashboard */}
//         <Route path="*" element={<Navigate to="/admin" replace />} />
//       </Route>

//       {/* Optional: 404 catch-all (you can make a nice NotFound page later) */}
//       <Route
//         path="*"
//         element={
//           <div style={{ padding: "4rem", textAlign: "center" }}>
//             <h1>404 - Page Not Found</h1>
//             <p>Sorry, the page you're looking for doesn't exist.</p>
//           </div>
//         }
//       />
//     </Routes>
//   );
// }

// // src/App.jsx
// import { Routes, Route } from "react-router-dom";
// import PhysicalFitness from "./components/PhysicalFitness.jsx";
// import Results from "./components/Results.jsx";
// import AdminRoutes from "./admin/AdminRoutes.jsx";

// export default function App() {
//   return (
//     <Routes>
//       {/* User-facing PFT form */}
//       <Route path="/" element={<PhysicalFitness />} />

//       {/* User-facing results page */}
//       <Route path="/results" element={<Results />} />

//       {/* Admin section (all admin routes) */}
//       <Route path="/admin/*" element={<AdminRoutes />} />
//     </Routes>
//   );
// }

// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import PhysicalFitness from "./components/PhysicalFitness";
import Results from "./components/Results";
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import PersonnelList from "./admin/pages/PersonnelList";
import PersonnelDetails from "./admin/pages/PersonnelDetails";
import PersonnelEdit from "./admin/pages/PersonnelEdit.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PhysicalFitness />} />
      <Route path="/results" element={<Results />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/personnel" element={<PersonnelList />} />
<Route path="/admin/personnel/:id" element={<PersonnelDetails />} />
<Route path="/admin/personnel/:id/edit" element={<PersonnelEdit />} />
    </Routes>
  );
}
