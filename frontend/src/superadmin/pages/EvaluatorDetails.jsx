import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/superadmin.css";

const API_BASE = "https://naf-pft-sys-1.onrender.com";

export default function EvaluatorDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("pft_token");

  useEffect(() => {
    fetchDetails();
    fetchAdmins();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/superadmin/evaluators/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to fetch (status ${res.status})`);
      }

      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/admins`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    }
  };

  const handleUnassign = async () => {
    if (!window.confirm("Remove this evaluator from their current admin?")) return;

    try {
      setAssigning(true);
      const res = await fetch(`${API_BASE}/superadmin/unassign-evaluator/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Unassignment failed");
      }

      setActionMsg("Evaluator unassigned successfully!");
      fetchDetails(); // Refresh data
      setTimeout(() => setActionMsg(""), 3000);
    } catch (err) {
      setActionMsg("Error: " + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleReassign = async (adminId) => {
    if (!adminId) return;
    if (!window.confirm("Reassign this evaluator to the selected admin?")) return;

    try {
      setAssigning(true);
      const res = await fetch(`${API_BASE}/superadmin/assign-evaluator`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ evaluator_id: parseInt(id), admin_id: parseInt(adminId) })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Reassignment failed");
      }

      setActionMsg("Evaluator reassigned successfully!");
      fetchDetails(); // Refresh data
      setTimeout(() => setActionMsg(""), 3000);
    } catch (err) {
      setActionMsg("Error: " + err.message);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!data) return <div className="not-found">Evaluator not found</div>;

  const evaluator = data.evaluator || {};
  const assignedAdmin = data.assigned_admin || null;
  const evaluations = data.evaluations || [];

  // Filter out currently assigned admin from dropdown
  const availableAdmins = admins.filter(a => a.id !== assignedAdmin?.id);

  return (
    <div className="superadmin-container">
      <h2>Evaluator Details</h2>

      {/* Action Message */}
      {actionMsg && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "6px",
            background: actionMsg.startsWith("Error") ? "#f8d7da" : "#d4edda",
            color: actionMsg.startsWith("Error") ? "#721c24" : "#155724",
            border: `1px solid ${actionMsg.startsWith("Error") ? "#f5c6cb" : "#c3e6cb"}`,
          }}
        >
          {actionMsg}
        </div>
      )}

      <div className="details-card">
        <h3>{evaluator.full_name || "Unknown"}</h3>
        <p><strong>Service Number:</strong> {evaluator.svc_no || "N/A"}</p>
        <p><strong>Rank:</strong> {evaluator.rank || "N/A"}</p>
        <p><strong>Total Evaluations:</strong> {data.evaluations_count || 0}</p>

        {/* Assigned Admin Info */}
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #ddd" }}>
          <p><strong>Assigned Admin:</strong></p>
          {assignedAdmin ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span className="badge active">
                {assignedAdmin.full_name} ({assignedAdmin.rank}) — {assignedAdmin.svc_no}
              </span>
              <button
                onClick={handleUnassign}
                disabled={assigning}
                className="delete-btn"
                style={{ padding: "6px 12px", fontSize: "0.85rem" }}
              >
                {assigning ? "Processing..." : "✕ Cancel Assignment"}
              </button>
            </div>
          ) : (
            <div>
              <span className="badge zero" style={{ marginRight: "10px" }}>
                Not Assigned
              </span>
            </div>
          )}
        </div>

        {/* Reassign Section */}
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #ddd" }}>
          <p><strong>Reassign to Another Admin:</strong></p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            <select
              onChange={(e) => handleReassign(e.target.value)}
              disabled={assigning || availableAdmins.length === 0}
              defaultValue=""
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                fontSize: "0.95rem",
                minWidth: "250px",
              }}
            >
              <option value="">
                {availableAdmins.length === 0
                  ? "No other admins available"
                  : "-- Select New Admin --"}
              </option>
              {availableAdmins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.full_name} ({admin.rank}) — {admin.svc_no}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <h3>Evaluation History</h3>
      {evaluations.length === 0 ? (
        <p>No evaluations recorded yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Service No</th>
              <th>Name</th>
              <th>Rank</th>        {/* ← NEW */}
              <th>Unit</th>        {/* ← NEW */}
              <th>Year</th>
              <th>Grade</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((eval_item, index) => (
              <tr key={eval_item.id}>
                <td><strong>{index + 1}</strong></td>
                <td>{eval_item.svc_no}</td>
                <td>{eval_item.full_name}</td>
                <td>{eval_item.rank || "N/A"}</td>      {/* ← NEW */}
                <td>{eval_item.unit || "N/A"}</td>      {/* ← NEW */}
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