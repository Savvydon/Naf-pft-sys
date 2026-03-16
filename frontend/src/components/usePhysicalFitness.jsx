// // components/PhysicalFitnessForm.jsx
// import { useAuth } from "./AuthContext";

// export function PhysicalFitnessForm({
//   formData,
//   handleChange,
//   handleSubmit,
//   ranks,
// }) {
//   const { currentUser, authLoading } = useAuth();

//   // Prevent rendering form before auth loads
//   if (authLoading) {
//     return (
//       <div style={{ textAlign: "center", marginTop: "40px" }}>
//         Loading evaluator information...
//       </div>
//     );
//   }

//   return (
//     <form onSubmit={handleSubmit} className="form-grid">
//       <div>
//         <label>Year:</label>
//         <input
//           name="year"
//           type="number"
//           placeholder="Year"
//           value={formData.year}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div>
//         <label>Full Name:</label>
//         <input
//           name="fullName"
//           type="text"
//           value={formData.fullName}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div>
//         <label>Rank:</label>
//         <select
//           name="rank"
//           value={formData.rank}
//           onChange={handleChange}
//           required
//         >
//           <option value="">Select Rank</option>
//           {ranks.map((r) => (
//             <option key={r} value={r}>
//               {r}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div>
//         <label>Service Number:</label>
//         <input
//           name="svcNo"
//           type="text"
//           value={formData.svcNo}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div>
//         <label>Unit:</label>
//         <input
//           name="unit"
//           type="text"
//           placeholder="Enter Unit"
//           value={formData.unit}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div>
//         <label>Date:</label>
//         <input
//           name="date"
//           type="date"
//           value={formData.date}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div>
//         <label>Appointment:</label>
//         <input
//           name="appointment"
//           type="text"
//           placeholder="Enter Appointment Name"
//           value={formData.appointment}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div>
//         <label>Height (m):</label>
//         <input
//           name="height"
//           type="number"
//           step="0.01"
//           placeholder="Height (m)"
//           value={formData.height}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div>
//         <label>Weight (kg):</label>
//         <input
//           name="weight"
//           type="number"
//           step="0.01"
//           placeholder="Weight (kg)"
//           value={formData.weight}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div>
//         <label>Email:</label>
//         <input
//           name="email"
//           type="email"
//           placeholder="Enter email address"
//           value={formData.email}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div>
//         <label>Age:</label>
//         <input
//           name="age"
//           type="number"
//           placeholder="Age"
//           value={formData.age}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div>
//         <label>Sex:</label>
//         <select
//           name="sex"
//           value={formData.sex}
//           onChange={handleChange}
//           required
//         >
//           <option value="">Select Sex</option>
//           <option value="male">Male</option>
//           <option value="female">Female</option>
//         </select>
//       </div>

//       <div>
//         <label>Cardio Cage:</label>
//         <select
//           name="cardioCage"
//           value={formData.cardioCage}
//           onChange={handleChange}
//           required
//         >
//           <option value="">Select Cage</option>
//           <option value="1">Cage 1</option>
//           <option value="2">Cage 2</option>
//           <option value="3">Cage 3</option>
//         </select>
//       </div>

//       <div>
//         <label>3-Minute Step-Up:</label>
//         <input
//           name="stepUp"
//           type="number"
//           placeholder="3 Minutes Step-Up"
//           value={formData.stepUp}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div>
//         <label>1-Minute Push-Up:</label>
//         <input
//           name="pushUp"
//           type="number"
//           placeholder="1 Minute Push-Up"
//           value={formData.pushUp}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div>
//         <label>Sit-Up:</label>
//         <input
//           name="sitUp"
//           type="number"
//           placeholder="1 Minute Sit-Up"
//           value={formData.sitUp}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div>
//         <label>Chin-Up:</label>
//         <input
//           name="chinUp"
//           type="number"
//           placeholder="Chin-Up"
//           value={formData.chinUp}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       <div>
//         <label>Sit & Reach (cm):</label>
//         <input
//           name="sitReach"
//           type="number"
//           placeholder="Sit and Reach (cm)"
//           value={formData.sitReach}
//           onChange={handleChange}
//           required
//         />
//       </div>

//       {/* ---------------- Evaluator Fields ---------------- */}

//       <div>
//         <label>Evaluator Name:</label>
//         <input
//           name="evaluatorName"
//           type="text"
//           value={currentUser?.full_name || ""}
//           readOnly
//           disabled
//           style={{
//             backgroundColor: "#f0f0f0",
//             cursor: "not-allowed",
//             color: "#333",
//           }}
//         />
//       </div>

//       <div>
//         <label>Evaluator Rank:</label>
//         <input
//           name="evaluatorRank"
//           type="text"
//           value={currentUser?.rank || ""}
//           readOnly
//           disabled
//           style={{
//             backgroundColor: "#f0f0f0",
//             cursor: "not-allowed",
//             color: "#333",
//           }}
//         />
//       </div>

//       <button type="submit" className="submit-btn">
//         Submit Form
//       </button>
//     </form>
//   );
// }

// components/usePhysicalFitness.jsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { computeFitness } from "../services/api";

export function usePhysicalFitness() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    fullName: "",
    rank: "",
    svcNo: "NAF",
    unit: "",
    email: "",
    appointment: "",
    age: "",
    sex: "",
    date: new Date().toISOString().split("T")[0],
    height: "",
    weight: "",
    cardioCage: "",
    stepUp: "",
    pushUp: "",
    sitUp: "",
    chinUp: "",
    sitReach: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const ranks = [
    "Air Man",
    "Air Woman",
    "Lance Corporal",
    "Corporal",
    "Sergeant",
    "Flight Sergeant",
    "Warrant Officer",
    "Master Warrant Officer",
    "Air Warrant Officer",
    "Flying Officer",
    "Flight Lieutenant",
    "Squadron Leader",
    "Wing Commander",
    "Group Captain",
    "Air Commodore",
    "Air Vice Marshal",
    "Vice Marshal",
    "Air Chief Marshal",
    "Marshal of the Air Force",
  ];

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    if (name === "svcNo") {
      let cleaned = value
        .trim()
        .replace(/\s+/g, "")
        .replace(/[^a-zA-Z0-9/]/gi, "")
        .toUpperCase();

      if (!cleaned.startsWith("NAF")) cleaned = "NAF" + cleaned;

      cleaned = cleaned.replace(/\/+/g, "/");

      setFormData((prev) => ({ ...prev, svcNo: cleaned }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const parseNumber = useCallback((val) => {
    if (val === "" || val == null) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        const svcNo = (formData.svcNo || "").trim().replace(/\/+$/, "");
        const year = parseNumber(formData.year);

        const payload = {
          year,
          full_name: (formData.fullName || "").trim(),
          rank: formData.rank || "",
          svc_no: svcNo,
          unit: (formData.unit || "").trim(),
          email: (formData.email || "").trim(),
          appointment: (formData.appointment || "").trim(),
          age: parseNumber(formData.age),
          sex: (formData.sex || "").toLowerCase(),
          date: formData.date || "",
          height: parseNumber(formData.height),
          weight: parseNumber(formData.weight),
          cardio_cage: parseNumber(formData.cardioCage),
          step_up: parseNumber(formData.stepUp) ?? 0,
          push_up: parseNumber(formData.pushUp) ?? 0,
          sit_up: parseNumber(formData.sitUp) ?? 0,
          chin_up: parseNumber(formData.chinUp) ?? 0,
          sit_reach: parseNumber(formData.sitReach) ?? 0,
        };

        const result = await computeFitness(payload);

        sessionStorage.setItem("naf_pft_result", JSON.stringify(result));
        navigate("/results", { state: result });
      } catch (error) {
        console.error("Submission error:", error);
        alert(error.message || "Failed to submit. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, navigate, isSubmitting, parseNumber],
  );

  return {
    formData,
    handleChange,
    handleSubmit,
    ranks,
    isSubmitting,
  };
}
