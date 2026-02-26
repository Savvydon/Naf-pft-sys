import { Routes, Route } from "react-router-dom";
import PhysicalFitness from "./components/PhysicalFitness.jsx";
import Results from "./components/Results.jsx";

export default function App() {
  return (
    <Routes>
      {/* Home page */}
      <Route path="/" element={<PhysicalFitness />} />

      {/* Results page */}
      <Route path="/results" element={<Results />} />
    </Routes>
  );
}