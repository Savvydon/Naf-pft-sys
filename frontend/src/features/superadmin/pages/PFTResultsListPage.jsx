import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE } from "../../../config/env.js";
import "../styles/superadmin.css";

export default function PFTResultsListPage({ adminMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const page = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);
  const itemsPerPage = 10;

  const fetchPersonnel = async (search = "") => {
    try {
      setLoading(true);
      const suffix = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const endpoint = `${API_BASE}${adminMode ? "/api/personnel" : "/superadmin/personnel"}${suffix}`;
      const response = await fetch(endpoint, { credentials: "include" });
      if (!response.ok) throw new Error(`Failed to fetch personnel: ${response.status}`);
      setPersonnel(await response.json());
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load personnel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPersonnel(query); }, [adminMode]);

  const handleSearch = (value) => {
    setQuery(value);
    const next = new URLSearchParams(searchParams);
    next.set("page", "1");
    if (value.trim()) next.set("q", value.trim()); else next.delete("q");
    setSearchParams(next);
    fetchPersonnel(value);
  };

  const totalPages = Math.max(1, Math.ceil(personnel.length / itemsPerPage));
  const paginated = useMemo(() => personnel.slice((page - 1) * itemsPerPage, page * itemsPerPage), [personnel, page]);

  const goPage = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  if (loading) return <div className="loading">Loading personnel records...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="superadmin-container">
      <h2>{adminMode ? "PFT Results" : "PFT Results"}</h2>
      <p className="record-subtitle">One personnel record per service number, containing the complete PFT evaluation history.</p>
      <div className="search-container">
        <input
          type="search"
          placeholder="Search by name, service number, rank, unit or year"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {paginated.length === 0 ? (
        <div className="empty-state"><p>No personnel records found.</p></div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="data-table organized-personnel-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Personnel</th>
                  <th>Service No</th>
                  <th>Unit</th>
                  <th>Latest PFT</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Evaluations</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, index) => (
                  <tr key={p.svc_no}>
                    <td><strong>{(page - 1) * itemsPerPage + index + 1}</strong></td>
                    <td>
                      <div className="personnel-name-cell">
                        <strong>{p.full_name || "—"}</strong>
                        <span>{p.rank || "—"}{p.sex ? ` · ${p.sex}` : ""}</span>
                      </div>
                    </td>
                    <td>{p.svc_no}</td>
                    <td>{p.unit || "—"}</td>
                    <td>{p.latest_year || "—"}</td>
                    <td>{p.latest_aggregate ?? "—"}</td>
                    <td><span className="grade-badge">{p.latest_grade || "—"}</span></td>
                    <td>
                      <span className="evaluation-count-badge">{p.evaluation_count}</span>
                      <small className="years-inline">{p.years?.join(", ")}</small>
                    </td>
                    <td>
                      <button className="view-btn" onClick={() => navigate(`${adminMode ? "/admin/pft-results" : "/superadmin/pft-results"}/${p.id}`, { state: { returnTo: `${location.pathname}${location.search}` } })}>View Record</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page === 1} onClick={() => goPage(page - 1)}>Prev</button>
              <span className="page-btn active">{page} / {totalPages}</span>
              <button className="page-btn" disabled={page === totalPages} onClick={() => goPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
