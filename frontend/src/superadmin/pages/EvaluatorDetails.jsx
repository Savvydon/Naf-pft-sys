import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/superadmin.css";

export default function EvaluatorDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("pft_token");

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`https://naf-pft-sys-1.onrender.com/superadmin/evaluators/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to fetch evaluator details");
      
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!data) return <div className="not-found">Evaluator not found</div>;

  return (
    <div className="superadmin-container">
      <h2>Evaluator Details</h2>
      
      <div className="details-card">
        <h3>{data.evaluator.full_name}</h3>
        <p><strong>Service Number:</strong> {data.evaluator.svc_no}</p>
        <p><strong>Rank:</strong> {data.evaluator.rank}</p>
        <p><strong>Total Evaluations:</strong> {data.evaluations_count}</p>
      </div>

      <h3>Evaluation History</h3>
      {data.evaluations.length === 0 ? (
        <p>No evaluations recorded yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Service No</th>
              <th>Name</th>
              <th>Year</th>
              <th>Grade</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.evaluations.map((eval_item) => (
              <tr key={eval_item.id}>
                <td>{eval_item.svc_no}</td>
                <td>{eval_item.full_name}</td>
                <td>{eval_item.year}</td>
                <td>{eval_item.grade}</td>
                <td>{new Date(eval_item.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button onClick={() => navigate("/superadmin/evaluators")} className="back-btn">
        ← Back to Evaluators
      </button>
    </div>
  );
}