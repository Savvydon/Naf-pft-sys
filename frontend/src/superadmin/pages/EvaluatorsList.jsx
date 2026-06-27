// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "../styles/superadmin.css";

// const API_BASE = "https://naf-pft-sys-1.onrender.com";

// export default function EvaluatorsList() {
//   const [evaluators, setEvaluators] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     fetchEvaluators();
//   }, []);

//   const fetchEvaluators = async () => {
//     try {
//       const res = await fetch(`${API_BASE}/superadmin/evaluators`, {
//         credentials: "include",
//       });

//       if (!res.ok) throw new Error("Failed to fetch evaluators");

//       const data = await res.json();
//       setEvaluators(data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (id, svcNo) => {
//     if (!window.confirm(`Are you sure you want to delete evaluator ${svcNo}?`))
//       return;

//     try {
//       const res = await fetch(`${API_BASE}/superadmin/evaluators/${id}`, {
//         method: "DELETE",
//         credentials: "include",
//       });

//       if (!res.ok) throw new Error("Delete failed");

//       setEvaluators(evaluators.filter((e) => e.id !== id));
//       alert("Evaluator deleted successfully");
//     } catch (err) {
//       alert("Error: " + err.message);
//     }
//   };

//   const viewDetails = (id) => {
//     navigate(`/superadmin/evaluators/${id}`);
//   };

//   if (loading) return <div className="loading">Loading evaluators...</div>;
//   if (error) return <div className="error">Error: {error}</div>;

//   return (
//     <div className="superadmin-container">
//       <div className="page-header">
//         <h2>Evaluators Management</h2>
//         <button
//           onClick={() => navigate("/superadmin/evaluators/create")}
//           className="create-btn"
//         >
//           + Create Evaluator
//         </button>
//       </div>

//       <table className="data-table">
//         <thead>
//           <tr>
//             <th>Name</th>
//             <th>Rank</th>
//             <th>Service Number</th>
//             <th>Evaluations Done</th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {evaluators.map((e) => (
//             <tr key={e.id}>
//               <td>{e.full_name}</td>
//               <td>{e.rank}</td>
//               <td>{e.svc_no}</td>
//               <td>
//                 <span
//                   className={`badge ${
//                     e.evaluations_count > 0 ? "active" : "zero"
//                   }`}
//                 >
//                   {e.evaluations_count}
//                 </span>
//               </td>
//               <td className="actions">
//                 <button onClick={() => viewDetails(e.id)} className="view-btn">
//                   View
//                 </button>
//                 <button
//                   onClick={() => handleDelete(e.id, e.svc_no)}
//                   className="delete-btn"
//                 >
//                   Delete
//                 </button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>

//       <button
//         onClick={() => navigate("/superadmin/dashboard")}
//         className="back-btn"
//       >
//         ← Back to Dashboard
//       </button>
//     </div>
//   );
// }



import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/superadmin.css";

const API_BASE = "https://naf-pft-sys-1.onrender.com";

export default function EvaluatorsList() {
  const [evaluators, setEvaluators] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvaluators();
    fetchAdmins();
  }, []);

  const fetchEvaluators = async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/evaluators`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch evaluators");

      const data = await res.json();
      setEvaluators(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/admins`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch admins");
      const data = await res.json();
      setAdmins(data);
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    }
  };

  const handleDelete = async (id, svcNo) => {
    if (!window.confirm(`Are you sure you want to delete evaluator ${svcNo}?`))
      return;

    try {
      const res = await fetch(`${API_BASE}/superadmin/evaluators/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete failed");

      setEvaluators(evaluators.filter((e) => e.id !== id));
      alert("Evaluator deleted successfully");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleAssign = async (evaluatorId, adminId) => {
    if (!adminId) return;
    setAssigning(evaluatorId);

    try {
      const res = await fetch(`${API_BASE}/superadmin/assign-evaluator`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluator_id: evaluatorId, admin_id: parseInt(adminId) }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Assignment failed");
      }

      alert("Evaluator assigned successfully!");
      fetchEvaluators();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassign = async (evaluatorId) => {
    if (!window.confirm("Remove this evaluator from their assigned admin?")) return;

    try {
      const res = await fetch(`${API_BASE}/superadmin/unassign-evaluator/${evaluatorId}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Unassignment failed");

      alert("Evaluator unassigned successfully!");
      fetchEvaluators();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const viewDetails = (id) => {
    navigate(`/superadmin/evaluators/${id}`);
  };

  if (loading) return <div className="loading">Loading evaluators...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="superadmin-container">
      <div className="page-header">
        <h2>Evaluators Management</h2>
        <button
          onClick={() => navigate("/superadmin/evaluators/create")}
          className="create-btn"
        >
          + Create Evaluator
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Rank</th>
            <th>Service Number</th>
            <th>Evaluations Done</th>
            <th>Assigned Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {evaluators.map((e) => (
            <tr key={e.id}>
              <td>{e.full_name}</td>
              <td>{e.rank}</td>
              <td>{e.svc_no}</td>
              <td>
                <span
                  className={`badge ${
                    e.evaluations_count > 0 ? "active" : "zero"
                  }`}
                >
                  {e.evaluations_count}
                </span>
              </td>
              <td>
                {e.assigned_admin_id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="badge active">{e.assigned_admin_name}</span>
                    <button
                      onClick={() => handleUnassign(e.id)}
                      className="delete-btn"
                      style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                      title="Remove assignment"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <select
                    value=""
                    onChange={(ev) => handleAssign(e.id, ev.target.value)}
                    disabled={assigning === e.id}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "0.85rem",
                    }}
                  >
                    <option value="">{assigning === e.id ? "Assigning..." : "Assign to Admin..."}</option>
                    {admins.map((admin) => (
                      <option key={admin.id} value={admin.id}>
                        {admin.full_name} ({admin.svc_no})
                      </option>
                    ))}
                  </select>
                )}
              </td>
              <td className="actions">
                <button onClick={() => viewDetails(e.id)} className="view-btn">
                  View
                </button>
                <button
                  onClick={() => handleDelete(e.id, e.svc_no)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={() => navigate("/superadmin/dashboard")}
        className="back-btn"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}