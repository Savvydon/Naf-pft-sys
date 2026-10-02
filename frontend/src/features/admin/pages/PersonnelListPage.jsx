import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAdminData } from "../hooks/useAdminData.jsx";
import AdminHeader from "../components/AdminHeader.jsx";
import AdminSidebar from "../components/AdminSidebar.jsx";
import PersonnelTable from "../components/PersonnelTable.jsx";
import Pagination from "../components/Pagination.jsx";
import "../styles/Admin.css";

export default function PersonnelListPage() {
  const { personnel, loading, error, search } = useAdminData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(Math.max(1, parseInt(searchParams.get("page"), 10) || 1));
  const [searchText, setSearchText] = useState(searchParams.get("q") || "");
  const itemsPerPage = 10;

  const handlePageChange = (newPage) => {
    setPage(newPage);
    const next = new URLSearchParams(searchParams);
    next.set("page", String(newPage));
    setSearchParams(next);
  };

  const handleSearch = async (value) => {
    setSearchText(value);
    const next = new URLSearchParams(searchParams);
    next.set("page", "1");
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    setSearchParams(next);
    setPage(1);
    await search(value);
  };

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(personnel.length / itemsPerPage));
    if (page > totalPages) {
      setPage(totalPages);
      const next = new URLSearchParams(searchParams);
      next.set("page", String(totalPages));
      setSearchParams(next);
    }
  }, [personnel.length, page, searchParams, setSearchParams]);

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = personnel.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(personnel.length / itemsPerPage);

  const handleViewPersonnel = (id) => {
    navigate(`/admin/personnel/${id}`, {
      state: { returnTo: `${window.location.pathname}${window.location.search}` },
    });
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <AdminHeader />
        <div className="list-header">
          <div>
            <h3>Personnel Records</h3>
            <p className="record-subtitle">One personnel record per service number, with complete PFT history.</p>
          </div>
          <div className="list-meta">
            {loading ? "Loading records..." : `${personnel.length} personnel record${personnel.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        <div className="personnel-search-bar">
          <input
            type="search"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, service number, rank, unit, appointment or year"
            aria-label="Search personnel"
          />
        </div>

        {error ? <div className="error">{error}</div> : null}
        {loading ? (
          <div className="loading-skeleton"><div className="skeleton-row" /><div className="skeleton-row" /><div className="skeleton-row" /></div>
        ) : personnel.length === 0 ? (
          <div className="empty-state"><p>No personnel records found.</p></div>
        ) : (
          <>
            <PersonnelTable data={paginatedData} onView={handleViewPersonnel} />
            {totalPages > 1 && <Pagination page={page} setPage={handlePageChange} totalPages={totalPages} />}
          </>
        )}
      </div>
    </div>
  );
}
