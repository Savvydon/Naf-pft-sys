import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/superadmin.css";

export default function EvaluatorsList() {
  const [evaluators, setEvaluators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("pft_token");

  useEffect(() => {
    fetchEvaluators();
  }, []);

  const fetchEvaluators = async () => {
    try {
      const res = await fetch("https://naf-pft-sys-1.onrender.com/superadmin/evaluators", {
        headers: { Authorization: `Bearer ${token}` }
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

  const handleDelete = async (id, svcNo) => {
    if (!window.confirm(`Are you sure you want to delete evaluator ${svcNo}?`)) return;
    
    try {
      const res = await fetch(`https://naf-pft-sys-1.onrender.com/superadmin/evaluators/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Delete failed");
      
      setEvaluators(evaluators.filter(e => e.id !== id));
      alert("Evaluator deleted successfully");
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
        <button onClick={() => navigate("/superadmin/evaluators/create")} className="create-btn">
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
                <span className={`badge ${e.evaluations_count > 0 ? 'active' : 'zero'}`}>
                  {e.evaluations_count}
                </span>
              </td>
              <td className="actions">
                <button onClick={() => viewDetails(e.id)} className="view-btn">View</button>
                <button onClick={() => handleDelete(e.id, e.svc_no)} className="delete-btn">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <button onClick={() => navigate("/superadmin/dashboard")} className="back-btn">
        ← Back to Dashboard
      </button>
    </div>
  );
}