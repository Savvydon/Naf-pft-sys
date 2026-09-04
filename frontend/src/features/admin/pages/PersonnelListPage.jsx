import React from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAdminData } from "../hooks/useAdminData.jsx";

import AdminHeader from "../components/AdminHeader.jsx";
import AdminSidebar from "../components/AdminSidebar.jsx";
import PersonnelTable from "../components/PersonnelTable.jsx";
import Pagination from "../components/Pagination.jsx";

import "../styles/Admin.css";

export default function PersonnelListPage() {
  const { personnel, loading, removePersonnel, search } = useAdminData();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read page from URL, default to 1
  const pageFromUrl = parseInt(searchParams.get("page"), 10);
  const [page, setPage] = useState(
    !isNaN(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1
  );

  // Sync URL when page changes
  const handlePageChange = (newPage) => {
    setPage(newPage);
    setSearchParams({ page: newPage.toString() });
  };

  // Reset to page 1 when personnel data changes (after search/delete)
  // BUT only if the data length actually changed meaningfully (search)
  useEffect(() => {
    // If search results changed, reset to page 1
    if (searchParams.get("page") && parseInt(searchParams.get("page"), 10) > 1) {
      // Only reset if we're coming from a search operation, not navigation back
      // Actually, let's just reset when personnel length changes and we're beyond bounds
    }
    const currentTotalPages = Math.ceil(personnel.length / itemsPerPage);
    if (page > currentTotalPages && currentTotalPages > 0) {
      setPage(1);
      setSearchParams({ page: "1" });
    }
  }, [personnel.length]);

  // Ensure URL stays in sync when component mounts
  useEffect(() => {
    if (searchParams.get("page") !== page.toString()) {
      setSearchParams({ page: page.toString() });
    }
  }, []);

  const itemsPerPage = 10;
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedData = personnel.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(personnel.length / itemsPerPage);

  // Handle navigation to detail pages with return state
  const handleViewPersonnel = (id) => {
    navigate(`/personnel/${id}`, { 
      state: { fromPage: page } 
    });
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <div className="admin-content">
        <AdminHeader />

        <div className="list-header">
          <h3>Personnel Record</h3>
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
            <PersonnelTable 
              data={paginatedData} 
              onDelete={removePersonnel}
              onView={handleViewPersonnel}
            />

            {totalPages > 1 && (
              <Pagination
                page={page}
                setPage={handlePageChange}
                totalPages={totalPages}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
