import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";

export default function AdminsList() {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAdmins = async () => {
    try {
      const res = await fetch(
        "https://naf-pft-sys-1.onrender.com/superadmin/admins",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to load admins");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAdmin = async (svc_no) => {
    if (!window.confirm(`Delete admin ${svc_no}?`)) return;
    try {
      const res = await fetch(
        `https://naf-pft-sys-1.onrender.com/superadmin/users/${svc_no}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Delete failed");
      loadAdmins();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  if (loading) return <p>Loading admins...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admins</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={{ padding: 12, border: "1px solid #ddd" }}>Name</th>
            <th style={{ padding: 12, border: "1px solid #ddd" }}>Rank</th>
            <th style={{ padding: 12, border: "1px solid #ddd" }}>
              Service No
            </th>
            <th style={{ padding: 12, border: "1px solid #ddd" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((a) => (
            <tr key={a.svc_no}>
              <td style={{ padding: 12, border: "1px solid #ddd" }}>
                {a.full_name}
              </td>
              <td style={{ padding: 12, border: "1px solid #ddd" }}>
                {a.rank}
              </td>
              <td style={{ padding: 12, border: "1px solid #ddd" }}>
                {a.svc_no}
              </td>
              <td
                style={{
                  padding: 12,
                  border: "1px solid #ddd",
                  textAlign: "center",
                }}
              >
                <button
                  onClick={() => deleteAdmin(a.svc_no)}
                  style={{
                    color: "red",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// import { useEffect, useState } from "react";

// export default function AdminsList() {
//   const [admins, setAdmins] = useState([]);

//   useEffect(() => {
//     fetch("https://naf-pft-sys-1.onrender.com/superadmin/admins")
//       .then((res) => res.json())
//       .then((data) => setAdmins(data));
//   }, []);

//   return (
//     <div>
//       <h2>Admins</h2>

//       <table>
//         <thead>
//           <tr>
//             <th>Name</th>
//             <th>Rank</th>
//             <th>Service Number</th>
//           </tr>
//         </thead>

//         <tbody>
//           {admins.map((a) => (
//             <tr key={a.id}>
//               <td>{a.full_name}</td>
//               <td>{a.rank}</td>
//               <td>{a.svc_no}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }
