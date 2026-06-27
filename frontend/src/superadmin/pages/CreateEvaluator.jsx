// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "../styles/superadmin.css";

// const API_BASE = "https://naf-pft-sys-1.onrender.com";

// export default function CreateEvaluator() {
//   const [formData, setFormData] = useState({
//     svc_no: "NAF",
//     full_name: "",
//     rank: "",
//     password: "",
//     confirm_password: "",
//   });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const ranks = [
//     "Air CraftMan",
//     "Air Craftwoman",
//     "Lance Corporal",
//     "Corporal",
//     "Sergeant",
//     "Flight Sergeant",
//     "Warrant Officer",
//     "Master Warrant Officer",
//     "Air Warrant Officer",
//     "Flying Officer",
//     "Flight Lieutenant",
//     "Squadron Leader",
//     "Wing Commander",
//     "Group Captain",
//     "Air Commodore",
//     "Air Vice Marshal",
//     "Vice Marshal",
//     "Air Chief Marshal",
//     "Marshal of the Air Force",
//   ];

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     if (name === "svc_no") {
//       let cleaned = value.toUpperCase().replace(/[^A-Z0-9/]/g, "");
//       if (!cleaned.startsWith("NAF")) cleaned = "NAF" + cleaned;
//       setFormData({ ...formData, [name]: cleaned });
//     } else {
//       setFormData({ ...formData, [name]: value });
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (formData.password !== formData.confirm_password) {
//       setError("Passwords do not match");
//       return;
//     }

//     if (formData.password.length < 6) {
//       setError("Password must be at least 6 characters");
//       return;
//     }

//     setLoading(true);

//     try {
//       const res = await fetch(`${API_BASE}/superadmin/evaluators`, {
//         method: "POST",
//         credentials: "include",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           svc_no: formData.svc_no,
//           full_name: formData.full_name,
//           rank: formData.rank,
//           password: formData.password,
//           role: "evaluator",
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.detail || "Failed to create evaluator");
//       }

//       alert("Evaluator created successfully!");
//       navigate("/superadmin/evaluators");
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="superadmin-container">
//       <h2>Create New Evaluator</h2>

//       <form onSubmit={handleSubmit} className="create-form">
//         {error && <div className="error-message">{error}</div>}

//         <div className="form-group">
//           <label>Service Number</label>
//           <input
//             type="text"
//             name="svc_no"
//             value={formData.svc_no}
//             onChange={handleChange}
//             required
//           />
//         </div>

//         <div className="form-group">
//           <label>Full Name</label>
//           <input
//             type="text"
//             name="full_name"
//             value={formData.full_name}
//             onChange={handleChange}
//             required
//           />
//         </div>

//         <div className="form-group">
//           <label>Rank</label>
//           <select
//             name="rank"
//             value={formData.rank}
//             onChange={handleChange}
//             required
//           >
//             <option value="">Select Rank</option>
//             {ranks.map((r) => (
//               <option key={r} value={r}>
//                 {r}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="form-group">
//           <label>Password</label>
//           <input
//             type="password"
//             name="password"
//             value={formData.password}
//             onChange={handleChange}
//             required
//           />
//         </div>

//         <div className="form-group">
//           <label>Confirm Password</label>
//           <input
//             type="password"
//             name="confirm_password"
//             value={formData.confirm_password}
//             onChange={handleChange}
//             required
//           />
//         </div>

//         <div className="form-actions">
//           <button
//             type="button"
//             onClick={() => navigate("/superadmin/evaluators")}
//             className="cancel-btn"
//           >
//             Cancel
//           </button>
//           <button type="submit" disabled={loading} className="submit-btn">
//             {loading ? "Creating..." : "Create Evaluator"}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }



import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/superadmin.css";

const API_BASE = "https://naf-pft-sys-1.onrender.com";

export default function CreateEvaluator() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState({
    svc_no: "",
    full_name: "",
    rank: "",
    password: "",
    confirm_password: "",
    assigned_admin_id: "", // NEW: Admin assignment
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch admins for dropdown
  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/admins`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        svc_no: formData.svc_no.trim().toUpperCase(),
        full_name: formData.full_name.trim(),
        rank: formData.rank.trim(),
        password: formData.password,
        role: "evaluator",
        assigned_admin_id: formData.assigned_admin_id
          ? parseInt(formData.assigned_admin_id)
          : null,
      };

      const res = await fetch(`${API_BASE}/superadmin/evaluators`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to create evaluator");
      }

      alert(
        `Evaluator created successfully!\n\n` +
          `Name: ${data.full_name}\n` +
          `Service No: ${data.svc_no}\n` +
          `Rank: ${data.rank}\n` +
          `Assigned Admin: ${
            data.assigned_admin_id
              ? admins.find((a) => a.id === data.assigned_admin_id)?.full_name ||
                "Admin ID " + data.assigned_admin_id
              : "None (unassigned)"
          }`
      );

      navigate("/superadmin/evaluators");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="superadmin-container">
      <h2>Create New Evaluator</h2>

      {error && (
        <div
          style={{
            background: "#f8d7da",
            color: "#721c24",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-form">
        <div className="form-group">
          <label>Service Number *</label>
          <input
            type="text"
            name="svc_no"
            value={formData.svc_no}
            onChange={handleChange}
            placeholder="e.g. NAF/26/10102"
            required
          />
        </div>

        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="e.g. John Doe"
            required
          />
        </div>

        <div className="form-group">
          <label>Rank *</label>
          <input
            type="text"
            name="rank"
            value={formData.rank}
            onChange={handleChange}
            placeholder="e.g. Air Commodore"
            required
          />
        </div>

        <div className="form-group">
          <label>Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            required
          />
        </div>

        <div className="form-group">
          <label>Confirm Password *</label>
          <input
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            placeholder="Re-enter password"
            required
          />
        </div>

        {/* NEW: Admin Assignment Dropdown */}
        <div className="form-group">
          <label>Assign to Admin (Optional)</label>
          <select
            name="assigned_admin_id"
            value={formData.assigned_admin_id}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "1rem",
            }}
          >
            <option value="">-- Select an Admin --</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.full_name} ({admin.rank}) - {admin.svc_no}
              </option>
            ))}
          </select>
          <small style={{ color: "#6c757d", display: "block", marginTop: "4px" }}>
            If left unselected, the evaluator will not be assigned to any admin yet.
            You can assign later from the Evaluators List.
          </small>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="create-btn"
            disabled={loading}
            style={{
              padding: "12px 24px",
              background: loading ? "#aaa" : "#0b3d91",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1rem",
            }}
          >
            {loading ? "Creating..." : "Create Evaluator"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/superadmin/evaluators")}
            className="cancel-btn"
            style={{
              padding: "12px 24px",
              background: "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1rem",
              marginLeft: "10px",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}