// ============ FIXED AdminDetails.jsx ============
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
      setLoading(true);
      const res = await fetch(`${API_BASE}/superadmin/admins/${id}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Failed to fetch (status ${res.status})`,
        );
      }

      const result = await res.json();
      console.log("Admin details fetched:", result); // Debug log
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

  // FIXED: Ensure certificates array exists
  const certificates = data.certificates || [];
  const certificatesCount = data.certificates_count || certificates.length || 0;

  return (
    <div className="superadmin-container">
      <h2>Admin Details</h2>

      {/* Admin Info Card */}
      <div className="details-card">
        <h3>{data.admin?.full_name || "Unknown"}</h3>
        <p>
          <strong>Service Number:</strong> {data.admin?.svc_no || "N/A"}
        </p>
        <p>
          <strong>Rank:</strong> {data.admin?.rank || "N/A"}
        </p>
        <p>
          <strong>Email:</strong> {data.admin?.email || "N/A"}
        </p>
        <p>
          <strong>Role:</strong> {data.admin?.role || "admin"}
        </p>
        <p>
          <strong>Total Certificates Issued:</strong>
          <span
            className={`badge ${certificatesCount > 0 ? "active" : "zero"}`}
            style={{ marginLeft: "10px" }}
          >
            {certificatesCount}
          </span>
        </p>
      </div>

      {/* Certificates Issued History */}
      <h3>Certificates Issued History</h3>
      {certificates.length === 0 ? (
        <div className="empty-state">
          <p>No certificates issued yet.</p>
        </div>
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
            {certificates.map((cert, index) => (
              <tr key={cert.id}>
                <td>
                  <strong>{index + 1}</strong>
                </td>
                <td>{cert.certificate_number || "N/A"}</td>
                <td>{cert.personnel_name || "N/A"}</td>
                <td>{cert.personnel_svc_no || "N/A"}</td>
                <td>{cert.personnel_rank || "N/A"}</td>
                <td>{cert.personnel_unit || "N/A"}</td>
                <td>
                  <span
                    className={`status-badge ${cert.status?.toLowerCase().replace(" ", "") || "issued"}`}
                  >
                    {cert.status || "Issued"}
                  </span>
                </td>
                <td>
                  {cert.created_at
                    ? new Date(cert.created_at).toLocaleDateString()
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        onClick={() => navigate("/superadmin/admins")}
        className="back-btn"
      >
        ← Back to Admins
      </button>
    </div>
  );
}
