import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";

export default function EvaluatorsList() {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvaluators = async () => {
    try {
      const res = await fetch(
        "https://naf-pft-sys-1.onrender.com/superadmin/evaluators",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to load evaluators");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvaluator = async (svc_no) => {
    if (!window.confirm(`Delete evaluator ${svc_no}?`)) return;
    try {
      const res = await fetch(
        `https://naf-pft-sys-1.onrender.com/superadmin/users/${svc_no}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Delete failed");
      loadEvaluators();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    loadEvaluators();
  }, []);

  if (loading) return <p>Loading evaluators...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Evaluators</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={{ padding: 12, border: "1px solid #ddd" }}>Name</th>
            <th style={{ padding: 12, border: "1px solid #ddd" }}>Rank</th>
            <th style={{ padding: 12, border: "1px solid #ddd" }}>
              Service No
            </th>
            <th style={{ padding: 12, border: "1px solid #ddd" }}>
              Evaluations
            </th>
            <th style={{ padding: 12, border: "1px solid #ddd" }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((ev) => (
            <tr key={ev.svc_no}>
              <td style={{ padding: 12, border: "1px solid #ddd" }}>
                {ev.full_name}
              </td>
              <td style={{ padding: 12, border: "1px solid #ddd" }}>
                {ev.rank}
              </td>
              <td style={{ padding: 12, border: "1px solid #ddd" }}>
                {ev.svc_no}
              </td>
              <td
                style={{
                  padding: 12,
                  border: "1px solid #ddd",
                  textAlign: "center",
                }}
              >
                {ev.evaluations_count}
              </td>
              <td
                style={{
                  padding: 12,
                  border: "1px solid #ddd",
                  textAlign: "center",
                }}
              >
                <button
                  onClick={() => deleteEvaluator(ev.svc_no)}
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

// export default function EvaluatorsList() {
//   const [evaluators, setEvaluators] = useState([]);

//   useEffect(() => {
//     fetch("https://naf-pft-sys-1.onrender.com/superadmin/evaluators")
//       .then((res) => res.json())
//       .then((data) => setEvaluators(data));
//   }, []);

//   return (
//     <div>
//       <h2>Evaluators</h2>

//       <table>
//         <thead>
//           <tr>
//             <th>Name</th>
//             <th>Rank</th>
//             <th>Service Number</th>
//             <th>Evaluations</th>
//           </tr>
//         </thead>

//         <tbody>
//           {evaluators.map((e) => (
//             <tr key={e.id}>
//               <td>{e.full_name}</td>
//               <td>{e.rank}</td>
//               <td>{e.svc_no}</td>
//               <td>{e.evaluations_count}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }
