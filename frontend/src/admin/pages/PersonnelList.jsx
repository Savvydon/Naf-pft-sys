import { useState } from "react";
import { useAdminData } from "../hooks/useAdminData";

import AdminHeader from "../components/AdminHeader";
import AdminSidebar from "../components/AdminSidebar";
import PersonnelTable from "../components/PersonnelTable";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination"; // ← assuming you have this

import "../styles/Admin.css";

export default function PersonnelList() {
  const { personnel, loading, removePersonnel, search } = useAdminData();
  
  // Add local page state (you'll need to modify useAdminData hook too)
  const [page, setPage] = useState(1);
  
  // You can slice data locally for now (simple pagination)
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
                  : `${personnel.length} record${personnel.length !== 1 ? 's' : ''}`}
              </span>
            )}
          </div>
        </div>

        <SearchBar onSearch={search} />

        {loading ? (
          <div className="loading-skeleton">
            <p>Loading personnel data...</p>
            {/* Optional: show 5 fake rows as skeleton */}
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        ) : personnel.length === 0 ? (
          <div className="empty-state">
            <p>No personnel records found.</p>
            {search ? <p>Try a different service number or clear the search.</p> : null}
          </div>
        ) : (
          <>
            <PersonnelTable 
              data={paginatedData} 
              onDelete={removePersonnel} 
            />

            {totalPages > 1 && (
              <Pagination 
                page={page} 
                setPage={setPage} 
                totalPages={totalPages} // optional prop if you want to show 1/5 etc.
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}