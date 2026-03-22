import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/superadmin.css";

const API_BASE = "https://naf-pft-sys-1.onrender.com";

export default function AdminsList() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/admins`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch admins");

      const data = await res.json();
      setAdmins(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, svcNo) => {
    if (!window.confirm(`Are you sure you want to delete admin ${svcNo}?`))
      return;

    try {
      const res = await fetch(`${API_BASE}/superadmin/admins/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete failed");

      setAdmins(admins.filter((a) => a.id !== id));
      alert("Admin deleted successfully");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="loading">Loading admins...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="superadmin-container">
      <div className="page-header">
        <h2>Admins Management</h2>
        <button
          onClick={() => navigate("/superadmin/admins/create")}
          className="create-btn"
        >
          + Create Admin
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Rank</th>
            <th>Service Number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((a) => (
            <tr key={a.id}>
              <td>{a.full_name}</td>
              <td>{a.rank}</td>
              <td>{a.svc_no}</td>
              <td className="actions">
                <button
                  onClick={() => handleDelete(a.id, a.svc_no)}
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

// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "../styles/superadmin.css";

// export default function AdminsList() {
//   const [admins, setAdmins] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();
//   const token = localStorage.getItem("pft_token");

//   useEffect(() => {
//     fetchAdmins();
//   }, []);

//   const fetchAdmins = async () => {
//     try {
//       const res = await fetch(
//         "https://naf-pft-sys-1.onrender.com/superadmin/admins",
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         },
//       );

//       if (!res.ok) throw new Error("Failed to fetch admins");

//       const data = await res.json();
//       setAdmins(data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (id, svcNo) => {
//     if (!window.confirm(`Are you sure you want to delete admin ${svcNo}?`))
//       return;

//     try {
//       const res = await fetch(
//         `https://naf-pft-sys-1.onrender.com/superadmin/admins/${id}`,
//         {
//           method: "DELETE",
//           headers: { Authorization: `Bearer ${token}` },
//         },
//       );

//       if (!res.ok) throw new Error("Delete failed");

//       setAdmins(admins.filter((a) => a.id !== id));
//       alert("Admin deleted successfully");
//     } catch (err) {
//       alert("Error: " + err.message);
//     }
//   };

//   // const viewDetails = (id) => {
//   //   navigate(`/superadmin/admins/${id}`);
//   // };

//   if (loading) return <div className="loading">Loading admins...</div>;
//   if (error) return <div className="error">Error: {error}</div>;

//   return (
//     <div className="superadmin-container">
//       <div className="page-header">
//         <h2>Admins Management</h2>
//         <button
//           onClick={() => navigate("/superadmin/admins/create")}
//           className="create-btn"
//         >
//           + Create Admin
//         </button>
//       </div>

//       <table className="data-table">
//         <thead>
//           <tr>
//             <th>Name</th>
//             <th>Rank</th>
//             <th>Service Number</th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {admins.map((a) => (
//             <tr key={a.id}>
//               <td>{a.full_name}</td>
//               <td>{a.rank}</td>
//               <td>{a.svc_no}</td>
//               <td className="actions">
//                 {/* <button onClick={() => viewDetails(a.id)} className="view-btn">View</button> */}
//                 <button
//                   onClick={() => handleDelete(a.id, a.svc_no)}
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
