// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import PhysicalFitness from "./components/PhysicalFitness.jsx";
// import Results from "./components/Results.jsx";

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<PhysicalFitness />} />
//         <Route path="/PhysicalFitness" element={<PhysicalFitness />} />
//         <Route path="/results" element={<Results />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;



// import { Routes, Route } from "react-router-dom";
// import PhysicalFitness from "./components/PhysicalFitness.jsx";
// import Results from "./components/Results.jsx";

// export default function App() {
//   return (
//     <Routes>
//       <Route path="/" element={<PhysicalFitness />} />
//       <Route path="/results" element={<Results />} />
//     </Routes>
//   );
// }

// // import { BrowserRouter, Routes, Route } from "react-router-dom";
// // import PhysicalFitness from "./components/PhysicalFitness.jsx";
// // import Results from "./components/Results.jsx";

// // export default function App() {
// //   return (
// //     <BrowserRouter basename="/PhysicalFitness">
// //       <Routes>
// //         <Route path="/" element={<PhysicalFitness />} />
// //         <Route path="/results" element={<Results />} />
// //       </Routes>
// //     </BrowserRouter>
// //   );
// // }

import { Routes, Route, Navigate } from "react-router-dom";
import PhysicalFitness from "./components/PhysicalFitness.jsx";
import Results from "./components/Results.jsx";

export default function App() {
  return (
    <Routes>
      {/* Redirect root to /PhysicalFitness */}
      <Route path="/" element={<Navigate to="/PhysicalFitness" replace />} />

      {/* Main pages */}
      <Route path="/PhysicalFitness" element={<PhysicalFitness />} />
      <Route path="/PhysicalFitness/results" element={<Results />} />

      {/* Catch-all: redirect any unknown routes to home */}
      <Route path="*" element={<Navigate to="/PhysicalFitness" replace />} />
    </Routes>
  );
}