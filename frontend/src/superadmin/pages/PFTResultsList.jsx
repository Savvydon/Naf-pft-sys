import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/superadmin.css";

export default function PFTResultsList() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("pft_token");

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await fetch("https://naf-pft-sys-1.onrender.com/superadmin/pft-results", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to fetch results");
      
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this result?")) return;
    
    try {
      const res = await fetch(`https://naf-pft-sys-1.onrender.com/superadmin/pft-results/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Delete failed");
      
      setResults(results.filter(r => r.id !== id));
      alert("Result deleted successfully");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const viewDetails = (id) => {
    navigate(`/superadmin/pft-results/${id}`);
  };

  if (loading) return <div className="loading">Loading results...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="superadmin-container">
      <h2>All PFT Results</h2>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Service No</th>
            <th>Year</th>
            <th>Grade</th>
            <th>Evaluator</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.full_name}</td>
              <td>{r.svc_no}</td>
              <td>{r.year}</td>
              <td>{r.grade}</td>
              <td>{r.evaluator_name} ({r.evaluator_rank})</td>
              <td className="actions">
                <button onClick={() => viewDetails(r.id)} className="view-btn">View</button>
                <button onClick={() => navigate(`/superadmin/pft-results/${r.id}/edit`)} className="edit-btn">Edit</button>
                <button onClick={() => handleDelete(r.id)} className="delete-btn">Delete</button>
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