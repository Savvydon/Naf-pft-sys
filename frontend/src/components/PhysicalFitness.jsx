import { usePhysicalFitness } from "./usePhysicalFitness";
import { PhysicalFitnessForm } from "./PhysicalFitnessForm";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import airForce from "../assets/airforce.png";
import "../styles/PhysicalFitness.css";

const API_BASE = "https://naf-pft-sys-1.onrender.com";

export default function PhysicalFitness() {
  const { formData, handleChange, handleSubmit, ranks } = usePhysicalFitness();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    logout();
    navigate("/login");
  };

  return (
    <div className="page">
      <div
        className="form-container"
        style={{ position: "relative", paddingTop: "40px" }}
      >
        {/* Logout button top-right */}
        <button
          onClick={handleLogout}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            padding: "8px 16px",
            background: "#dc3545",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          Logout
        </button>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img src={airForce} alt="NAF Logo" style={{ height: "60px" }} />
        </div>

        {/* Title */}
        <h1
          style={{
            textAlign: "center",
            fontSize: "1.2rem",
            marginBottom: "30px",
          }}
        >
          NIGERIAN AIR FORCE ANNUAL PHYSICAL FITNESS TEST INTERPRETATION FORM
        </h1>

        {/* Physical Fitness Form */}
        <PhysicalFitnessForm
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          ranks={ranks}
        />

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: "30px" }}>
          &copy; {new Date().getFullYear()} Nigeria Air Force – Official Use
          Only
        </p>
      </div>
    </div>
  );
}

// import { usePhysicalFitness } from "./usePhysicalFitness";
// import { PhysicalFitnessForm } from "./PhysicalFitnessForm";
// import { useAuth } from "../AuthContext";
// import { useNavigate } from "react-router-dom";
// import airForce from "../assets/airforce.png";
// import "../styles/PhysicalFitness.css";

// export default function PhysicalFitness() {
//   const { formData, handleChange, handleSubmit, ranks } = usePhysicalFitness();
//   const { logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout(); // clears token and current user
//     navigate("/login"); // redirect to Login.jsx
//   };

//   return (
//     <div className="page">
//       <div
//         className="form-container"
//         style={{ position: "relative", paddingTop: "40px" }}
//       >
//         {/* Logout button top-right */}
//         <button
//           onClick={handleLogout}
//           style={{
//             position: "absolute",
//             top: "20px",
//             right: "20px",
//             padding: "8px 16px",
//             background: "#dc3545",
//             color: "#fff",
//             border: "none",
//             borderRadius: "5px",
//             cursor: "pointer",
//             fontWeight: 600,
//             fontSize: "0.9rem",
//           }}
//         >
//           Logout
//         </button>

//         {/* Logo */}
//         <div style={{ textAlign: "center", marginBottom: "20px" }}>
//           <img src={airForce} alt="NAF Logo" style={{ height: "60px" }} />
//         </div>

//         {/* Title */}
//         <h1
//           style={{
//             textAlign: "center",
//             fontSize: "1.2rem",
//             marginBottom: "30px",
//           }}
//         >
//           NIGERIAN AIR FORCE ANNUAL PHYSICAL FITNESS TEST INTERPRETATION FORM
//         </h1>

//         {/* Physical Fitness Form */}
//         <PhysicalFitnessForm
//           formData={formData}
//           handleChange={handleChange}
//           handleSubmit={handleSubmit}
//           ranks={ranks}
//         />

//         {/* Footer */}
//         <p style={{ textAlign: "center", marginTop: "30px" }}>
//           &copy; {new Date().getFullYear()} Nigeria Air Force – Official Use
//           Only
//         </p>
//       </div>
//     </div>
//   );
// }

// // components/PhysicalFitness.jsx
// import { usePhysicalFitness } from "./usePhysicalFitness";
// import { PhysicalFitnessForm } from "./PhysicalFitnessForm";
// import airForce from "../assets/airforce.png";
// import "../styles/PhysicalFitness.css";

// export default function PhysicalFitness() {
//   const { formData, handleChange, handleSubmit, ranks } = usePhysicalFitness();

//   return (
//     <div className="page">
//       <div className="form-container">
//         <div className="header">
//           <img src={airForce} alt="NAF Logo" />
//           <h1>
//             NIGERIAN AIR FORCE ANNUAL PHYSICAL FITNESS TEST INTERPRETATION FORM
//           </h1>
//         </div>

//         <PhysicalFitnessForm
//           formData={formData}
//           handleChange={handleChange}
//           handleSubmit={handleSubmit}
//           ranks={ranks}
//         />

//         <p style={{ textAlign: "center" }}>
//           &copy; {new Date().getFullYear()} Nigeria Air Force – Official Use
//           Only
//         </p>
//       </div>
//     </div>
//   );
// }
