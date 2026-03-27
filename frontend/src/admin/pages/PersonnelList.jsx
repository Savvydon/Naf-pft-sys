import { useState, useEffect } from "react";
import { useAdminData } from "../hooks/useAdminData";

import AdminHeader from "../components/AdminHeader";
import AdminSidebar from "../components/AdminSidebar";
import PersonnelTable from "../components/PersonnelTable";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";

import "../styles/Admin.css";

export default function PersonnelList() {
  const { personnel, loading, removePersonnel, search } = useAdminData();

  const [page, setPage] = useState(1);

  // Reset to page 1 when personnel data changes (after search)
  useEffect(() => {
    setPage(1);
  }, [personnel.length]);

  const itemsPerPage = 10;
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = personnel.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(personnel.length / itemsPerPage);

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-content">
        <AdminHeader />

        <div className="list-header">
          <h3>Personnel Records</h3>
          <div className="list-meta">
            {loading ? (
              <span>Loading records...</span>
            ) : (
              <span>
                {personnel.length === 0
                  ? "No records found"
                  : `${personnel.length} record${personnel.length !== 1 ? "s" : ""}`}
              </span>
            )}
          </div>
        </div>

        {/* Safe manual search - no twitching risk */}
        <SearchBar onSearch={search} />

        {loading ? (
          <div className="loading-skeleton">
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        ) : personnel.length === 0 ? (
          <div className="empty-state">
            <p>No personnel records found.</p>
          </div>
        ) : (
          <>
            <PersonnelTable data={paginatedData} onDelete={removePersonnel} />

            {totalPages > 1 && (
              <Pagination
                page={page}
                setPage={setPage}
                totalPages={totalPages}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
