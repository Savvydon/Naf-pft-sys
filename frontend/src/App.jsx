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
