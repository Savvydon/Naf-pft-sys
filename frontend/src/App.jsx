import { BrowserRouter, Routes, Route } from "react-router-dom";
import PhysicalFitness from "./components/PhysicalFitness.jsx";
import Results from "./components/Results.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PhysicalFitness />} />
        <Route path="/PhysicalFitness" element={<PhysicalFitness />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;



// // import { Routes, Route } from "react-router-dom";
// // import PhysicalFitness from "./components/PhysicalFitness.jsx";
// // import Results from "./components/Results.jsx";

// // export default function App() {
// //   return (
// //     <Routes>
// //       <Route path="/" element={<PhysicalFitness />} />
// //       <Route path="/results" element={<Results />} />
// //     </Routes>
// //   );
// // }

// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import PhysicalFitness from "./components/PhysicalFitness.jsx";
// import Results from "./components/Results.jsx";

// export default function App() {
//   return (
//     <BrowserRouter basename="/PhysicalFitness">
//       <Routes>
//         <Route path="/" element={<PhysicalFitness />} />
//         <Route path="/results" element={<Results />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

