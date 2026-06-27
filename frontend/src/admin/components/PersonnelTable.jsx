import "../styles/Admin.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { checkCertificateExists } from "../../services/certificateApi";

// Pagination Component
const Pagination = ({ page, setPage, totalPages }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(
      <button
        key={i}
        onClick={() => setPage(i)}
        className={`page-btn ${page === i ? "active" : ""}`}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="pagination">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        className="page-btn"
      >
        ← Prev
      </button>
      {pages}
      <button
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
        className="page-btn"
      >
        Next →
      </button>
    </div>
  );
};

export default function PersonnelTable({ data, onDelete }) {
  const navigate = useNavigate();
  const [certStatus, setCertStatus] = useState({});
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState(data);
  const [loadingCerts, setLoadingCerts] = useState(false);

  const itemsPerPage = 10;

  // Update filtered data when data prop changes
  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  // Filter data when search changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredData(data);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = data.filter(
        (p) =>
          p.full_name?.toLowerCase().includes(query) ||
          p.svc_no?.toLowerCase().includes(query) ||
          p.year?.toString().includes(query) ||
          p.grade?.toLowerCase().includes(query) ||
          p.sex?.toLowerCase().includes(query),
      );
      setFilteredData(filtered);
    }
    setPage(1);
  }, [searchQuery, data]);

  // FIXED: Check certificate status with better error handling and loading state
  const checkCertificates = useCallback(async () => {
    if (!data || data.length === 0) return;

    setLoadingCerts(true);
    const newCertStatus = {};

    // Check all certificates in parallel for better performance
    await Promise.all(
      data.map(async (p) => {
        try {
          const result = await checkCertificateExists(p.id);
          newCertStatus[p.id] = result;
        } catch (err) {
          console.error(`Failed to check certificate for ${p.id}:`, err);
          newCertStatus[p.id] = { exists: false };
        }
      }),
    );

    setCertStatus(newCertStatus);
    setLoadingCerts(false);
  }, [data]);

  // Check certificates when data changes
  useEffect(() => {
    checkCertificates();
  }, [checkCertificates]);

  const handleIssue = (id) => {
    navigate(`/admin/personnel/${id}/certificate`);
  };

  const handleViewCert = (certId) => {
    // Find the personnel ID that has this certificate
    const personnelId = Object.keys(certStatus).find(
      (key) => certStatus[key].certificate_id === certId,
    );
    if (personnelId) {
      navigate(`/admin/personnel/${personnelId}/certificate`);
    }
  };

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="personnel-table-container">
      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name, service no, year, grade, or gender..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      {/* List Meta */}
      <div className="list-meta">
        {filteredData.length === 0 ? (
          <span>No records found</span>
        ) : (
          <span>
            Showing {startIndex + 1}–
            {Math.min(startIndex + itemsPerPage, filteredData.length)} of{" "}
            {filteredData.length} record{filteredData.length !== 1 ? "s" : ""}
            {loadingCerts && " (checking certificates...)"}
          </span>
        )}
      </div>

      {filteredData.length === 0 ? (
        <div className="empty-state">
          <p>No personnel records found.</p>
        </div>
      ) : (
        <>
          <table className="personnel-table">
            <thead>
              <tr>
                <th>S/N</th>
                {/* <th>ID</th> */}
                <th>Name</th>
                <th>Gender</th>
                <th>Service No</th>
                <th>Year</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Certificate</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((p, index) => {
                const certInfo = certStatus[p.id];
                const hasCert = certInfo?.exists;

                return (
                  <tr key={p.id}>
                    <td>
                      <strong>{startIndex + index + 1}</strong>
                    </td>
                    {/* <td>
                      <span style={{ color: "#999", fontSize: "0.85em" }}>
                        #{p.id}
                      </span>
                    </td> */}
                    <td>{p.full_name}</td>
                    <td>{p.sex}</td>
                    <td>{p.svc_no}</td>
                    <td>{p.year}</td>
                    <td>{p.aggregate}</td>
                    <td>{p.grade}</td>
                    <td>
                      {hasCert ? (
                        <span
                          className="cert-badge issued"
                          onClick={() =>
                            handleViewCert(certInfo.certificate_id)
                          }
                          style={{ cursor: "pointer" }}
                          title={`Certificate: ${certInfo.certificate_number}`}
                        >
                          ✓ {certInfo.certificate_number}
                        </span>
                      ) : (
                        <span className="cert-badge none">—</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="view-btn"
                        onClick={() => navigate(`/admin/personnel/${p.id}`)}
                      >
                        View
                      </button>

                      <button
                        className="edit-btn"
                        onClick={() =>
                          navigate(`/admin/personnel/${p.id}/edit`)
                        }
                      >
                        Edit
                      </button>

                      {hasCert ? (
                        <button
                          className="view-cert-btn"
                          onClick={() =>
                            handleViewCert(certInfo.certificate_id)
                          }
                        >
                          View Cert
                        </button>
                      ) : (
                        <button
                          className="issue-btn"
                          onClick={() => handleIssue(p.id)}
                        >
                          Issue Cert
                        </button>
                      )}

                      <button
                        className="delete-btn"
                        onClick={() => onDelete(p.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <Pagination page={page} setPage={setPage} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}