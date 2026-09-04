import { NAF_RANKS } from "../../../constants/ranks.js";
import { API_BASE } from "../../../config/env.js";
import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/superadmin.css";




export default function EvaluatorsListPage() {
  const [evaluators, setEvaluators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", rank: "", svc_no: "" });
  const [savingId, setSavingId] = useState(null);
  const [statusId, setStatusId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvaluators();
  }, []);

  const fetchEvaluators = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/superadmin/evaluators`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.detail || "Failed to fetch evaluators");
      setEvaluators(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (evaluator) => {
    setEditingId(evaluator.id);
    setEditForm({
      full_name: evaluator.full_name || "",
      rank: evaluator.rank || "",
      svc_no: evaluator.svc_no || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ full_name: "", rank: "", svc_no: "" });
  };

  const saveEdit = async (id) => {
    if (!editForm.full_name.trim() || !editForm.rank.trim() || !editForm.svc_no.trim()) {
      alert("Name, rank and service number are required.");
      return;
    }

    try {
      setSavingId(id);
      const res = await fetch(`${API_BASE}/superadmin/evaluators/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editForm.full_name.trim(),
          rank: editForm.rank.trim(),
          svc_no: editForm.svc_no.trim().toUpperCase(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to update evaluator");

      setEvaluators((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
      cancelEdit();
      alert("Evaluator details updated successfully.");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const toggleStatus = async (evaluator) => {
    const action = evaluator.is_active ? "make this evaluator ineligible" : "make this evaluator eligible";
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    try {
      setStatusId(evaluator.id);
      const res = await fetch(`${API_BASE}/superadmin/evaluators/${evaluator.id}/toggle-status`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to change evaluator status");

      setEvaluators((prev) =>
        prev.map((item) => (item.id === evaluator.id ? { ...item, is_active: data.is_active } : item)),
      );
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setStatusId(null);
    }
  };

  const handleDelete = async (id, svcNo) => {
    if (!window.confirm(`Are you sure you want to delete evaluator ${svcNo}? Historical records should normally be preserved by making the evaluator ineligible instead.`)) return;

    try {
      const res = await fetch(`${API_BASE}/superadmin/evaluators/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Delete failed");

      setEvaluators((prev) => prev.filter((e) => e.id !== id));
      alert("Evaluator deleted successfully");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const viewDetails = (id) => navigate(`/superadmin/evaluators/${id}`);

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

      <p style={{ marginBottom: "16px", color: "#555" }}>
        Reassigning an evaluator changes only where <strong>new</strong> work is stored. Historical PFT records remain with the admin recorded when they were created.
      </p>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Rank</th>
            <th>Service Number</th>
            {/* <th>Current Admin</th> */}
            <th>Status</th>
            <th>Evaluations Done</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {evaluators.map((evaluator) => (
            <tr key={evaluator.id}>
              {editingId === evaluator.id ? (
                <>
                  <td>
                    <input
                      value={editForm.full_name}
                      onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))}
                    />
                  </td>
                  <td>
                    <select
                      value={editForm.rank}
                      onChange={(e) => setEditForm((p) => ({ ...p, rank: e.target.value }))}
                    >
                      <option value="">Select Rank</option>
                      {NAF_RANKS.map((rank) => <option key={rank} value={rank}>{rank}</option>)}
                    </select>
                  </td>
                  <td>
                    <input
                      value={editForm.svc_no}
                      onChange={(e) => setEditForm((p) => ({ ...p, svc_no: e.target.value }))}
                    />
                  </td>
                </>
              ) : (
                <>
                  <td>{evaluator.full_name}</td>
                  <td>{evaluator.rank}</td>
                  <td>{evaluator.svc_no}</td>
                </>
              )}

              {/* <td>{evaluator.assigned_admin_name || "Unassigned"}</td> */}
              <td>
                <span
                  className={`badge ${evaluator.is_active ? "active" : "zero"}`}
                  style={{ background: evaluator.is_active ? "#d4edda" : "#f8d7da", color: evaluator.is_active ? "#155724" : "#721c24" }}
                >
                  {evaluator.is_active ? "Eligible" : "Ineligible"}
                </span>
              </td>
              <td>
                <span className={`badge ${evaluator.evaluations_count > 0 ? "active" : "zero"}`}>
                  {evaluator.evaluations_count}
                </span>
              </td>
              <td className="actions">
                {editingId === evaluator.id ? (
                  <>
                    <button onClick={() => saveEdit(evaluator.id)} className="view-btn" disabled={savingId === evaluator.id}>
                      {savingId === evaluator.id ? "Saving..." : "Save"}
                    </button>
                    <button onClick={cancelEdit} className="back-btn" disabled={savingId === evaluator.id}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => viewDetails(evaluator.id)} className="view-btn">View</button>
                    <button onClick={() => startEdit(evaluator)} className="view-btn">Edit</button>
                    <button
                      onClick={() => toggleStatus(evaluator)}
                      className="view-btn"
                      disabled={statusId === evaluator.id}
                      style={{ background: evaluator.is_active ? "#dc3545" : "#28a745" }}
                    >
                      {statusId === evaluator.id ? "Updating..." : evaluator.is_active ? "Make Ineligible" : "Make Eligible"}
                    </button>
                    <button onClick={() => handleDelete(evaluator.id, evaluator.svc_no)} className="delete-btn">Delete</button>
                  </>
                )}
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
