import { NAF_RANKS } from "../../../constants/ranks.js";
import { API_BASE } from "../../../config/env.js";
import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/superadmin.css";




export default function AdminsListPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", rank: "", svc_no: "" });
  const [savingId, setSavingId] = useState(null);
  const [statusId, setStatusId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/superadmin/admins`, {
        credentials: "include",
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.detail || "Failed to fetch admins");

      setAdmins(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (admin) => {
    setEditingId(admin.id);
    setEditForm({
      full_name: admin.full_name || "",
      rank: admin.rank || "",
      svc_no: admin.svc_no || "",
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
      const res = await fetch(`${API_BASE}/superadmin/admins/${id}`, {
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
      if (!res.ok) throw new Error(data.detail || "Failed to update admin");

      setAdmins((prev) => prev.map((admin) => (admin.id === id ? { ...admin, ...data } : admin)));
      cancelEdit();
      alert("Admin details updated successfully.");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const toggleStatus = async (admin) => {
    const action = admin.is_active ? "make this admin ineligible" : "make this admin eligible";
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    try {
      setStatusId(admin.id);
      const res = await fetch(`${API_BASE}/superadmin/admins/${admin.id}/toggle-status`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Failed to change admin status");

      setAdmins((prev) =>
        prev.map((item) => (item.id === admin.id ? { ...item, is_active: data.is_active } : item)),
      );
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setStatusId(null);
    }
  };

  const handleDelete = async (id, svcNo) => {
    if (!window.confirm(`Are you sure you want to delete admin ${svcNo}? Historical records should normally be preserved by making the admin ineligible instead.`)) return;

    try {
      const res = await fetch(`${API_BASE}/superadmin/admins/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || "Delete failed");

      setAdmins((prev) => prev.filter((a) => a.id !== id));
      alert("Admin deleted successfully");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const viewDetails = (id) => navigate(`/superadmin/admins/${id}`);

  if (loading) return <div className="loading">Loading admins...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="superadmin-container">
      <div className="page-header">
        <h2>Admins Management</h2>
        <button onClick={() => navigate("/superadmin/admins/create")} className="create-btn">
          + Create Admin
        </button>
      </div>

      <p style={{ marginBottom: "16px", color: "#555" }}>
        <strong>Eligible</strong> accounts can log in. <strong>Ineligible</strong> accounts cannot access the system.
        Changing an admin's name or rank does not rewrite historical certificates or PFT ownership records.
      </p>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Rank</th>
            <th>Service Number</th>
            <th>Status</th>
            <th>Certificates Issued</th>
            <th>Assigned Evaluators</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.id}>
              {editingId === admin.id ? (
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
                  <td>{admin.full_name}</td>
                  <td>{admin.rank}</td>
                  <td>{admin.svc_no}</td>
                </>
              )}

              <td>
                <span
                  className={`badge ${admin.is_active ? "active" : "zero"}`}
                  style={{ background: admin.is_active ? "#d4edda" : "#f8d7da", color: admin.is_active ? "#155724" : "#721c24" }}
                >
                  {admin.is_active ? "Eligible" : "Ineligible"}
                </span>
              </td>
              <td>
                <span className={`badge ${admin.certificates_count > 0 ? "active" : "zero"}`}>
                  {admin.certificates_count || 0}
                </span>
              </td>
              <td>{admin.assigned_evaluators_count || 0}</td>
              <td className="actions">
                {editingId === admin.id ? (
                  <>
                    <button onClick={() => saveEdit(admin.id)} className="view-btn" disabled={savingId === admin.id}>
                      {savingId === admin.id ? "Saving..." : "Save"}
                    </button>
                    <button onClick={cancelEdit} className="back-btn" disabled={savingId === admin.id}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => viewDetails(admin.id)} className="view-btn">View</button>
                    <button onClick={() => startEdit(admin)} className="view-btn">Edit</button>
                    <button
                      onClick={() => toggleStatus(admin)}
                      className="view-btn"
                      disabled={statusId === admin.id}
                      style={{ background: admin.is_active ? "#dc3545" : "#28a745" }}
                    >
                      {statusId === admin.id ? "Updating..." : admin.is_active ? "Make Ineligible" : "Make Eligible"}
                    </button>
                    <button onClick={() => handleDelete(admin.id, admin.svc_no)} className="delete-btn">Delete</button>
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
