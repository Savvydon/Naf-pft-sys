import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/superadmin.css";

const API_BASE = "https://naf-pft-sys-1.onrender.com";

export default function AdminDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/admins/${id}`, {
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

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!data) return <div className="not-found">Admin not found</div>;

  return (
    <div className="superadmin-container">
      <h2>Admin Details</h2>

      {/* Admin Info Card */}
      <div className="details-card">
        <h3>{data.admin?.full_name || data.admin?.username}</h3>
        <p><strong>Service Number:</strong> {data.admin?.svc_no || "N/A"}</p>
        <p><strong>Rank:</strong> {data.admin?.rank || "N/A"}</p>
        <p><strong>Email:</strong> {data.admin?.email || "N/A"}</p>
        <p><strong>Unit:</strong> {data.admin?.unit || "N/A"}</p>
        <p><strong>Total Certificates Issued:</strong> {data.certificates_count || 0}</p>
      </div>

      {/* Certificates Issued History */}
      <h3>Certificates Issued History</h3>
      {data.certificates?.length === 0 ? (
        <p>No certificates issued yet.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Certificate No</th>
              <th>Personnel Name</th>
              <th>Service No</th>
              <th>Rank</th>
              <th>Unit</th>
              <th>Status</th>
              <th>Date Issued</th>
            </tr>
          </thead>
          <tbody>
            {data.certificates?.map((cert, index) => (
              <tr key={cert.id}>
                <td><strong>{index + 1}</strong></td>
                <td>{cert.certificate_number}</td>
                <td>{cert.personnel_name}</td>
                <td>{cert.personnel_svc_no}</td>
                <td>{cert.personnel_rank}</td>
                <td>{cert.personnel_unit}</td>
                <td>
                  <span className={`status-badge ${cert.status?.toLowerCase()}`}>
                    {cert.status || "Issued"}
                  </span>
                </td>
                <td>{new Date(cert.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button onClick={() => navigate("/superadmin/admins")} className="back-btn">
        ← Back to Admins
      </button>
    </div>
  );
}