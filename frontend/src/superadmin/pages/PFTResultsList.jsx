import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/superadmin.css";

const API_BASE = "https://naf-pft-sys-1.onrender.com";

// Pagination component
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
      </button>,
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

// Main component
export default function PFTResultsList() {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredResults(results);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = results.filter(
        (r) =>
          r.full_name?.toLowerCase().includes(query) ||
          r.svc_no?.toLowerCase().includes(query) ||
          r.year?.toString().includes(query) ||
          r.grade?.toLowerCase().includes(query) ||
          r.evaluator_name?.toLowerCase().includes(query),
      );
      setFilteredResults(filtered);
    }
    setPage(1);
  }, [searchQuery, results]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/superadmin/pft-results`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch results");

      const data = await res.json();
      setResults(data);
      setFilteredResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this result?")) return;

    try {
      const res = await fetch(`${API_BASE}/superadmin/pft-results/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete failed");

      const updatedResults = results.filter((r) => r.id !== id);
      setResults(updatedResults);
      setFilteredResults(
        updatedResults.filter(
          (r) =>
            searchQuery.trim() === "" ||
            r.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.svc_no?.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      );

      alert("Result deleted successfully");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const viewDetails = (id) => {
    navigate(`/superadmin/pft-results/${id}`);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = filteredResults.slice(
    startIndex,
    startIndex + itemsPerPage,
  );
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

  if (loading) return <div className="loading">Loading results...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="superadmin-container">
      <h2>All PFT Results</h2>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name, service no, year, grade, or evaluator..."
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      {/* Results count */}
      <div className="list-meta">
        {filteredResults.length === 0 ? (
          <span>No records found</span>
        ) : (
          <span>
            Showing {startIndex + 1}-
            {Math.min(startIndex + itemsPerPage, filteredResults.length)} of{" "}
            {filteredResults.length} result
            {filteredResults.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {filteredResults.length === 0 ? (
        <div className="empty-state">
          <p>No PFT results found.</p>
        </div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>S/N</th>
                <th>DB ID</th>
                <th>Name</th>
                <th>Service No</th>
                <th>Year</th>
                <th>Grade</th>
                <th>Evaluator</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((r, index) => (
                <tr key={r.id}>
                  {/* Sequential Number */}
                  <td>
                    <strong>{(page - 1) * itemsPerPage + index + 1}</strong>
                  </td>
                  {/* Actual Database ID - muted/smaller */}
                  <td>
                    <span style={{ color: "#999", fontSize: "0.85em" }}>
                      #{r.id}
                    </span>
                  </td>
                  <td>{r.full_name}</td>
                  <td>{r.svc_no}</td>
                  <td>{r.year}</td>
                  <td>{r.grade}</td>
                  <td>
                    {r.evaluator_name} ({r.evaluator_rank})
                  </td>
                  <td className="actions">
                    <button
                      onClick={() => viewDetails(r.id)}
                      className="view-btn"
                    >
                      View
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/superadmin/pft-results/${r.id}/edit`)
                      }
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination page={page} setPage={setPage} totalPages={totalPages} />
        </>
      )}

      <button
        onClick={() => navigate("/superadmin/dashboard")}
        className="back-btn"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}
