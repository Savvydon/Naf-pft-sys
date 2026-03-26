// import { useNavigate } from "react-router-dom";

// export default function PersonnelTable({ data, onDelete }) {
//   const navigate = useNavigate();

//   return (
//     <table className="data-table">
//       <thead>
//         <tr>
//           <th>S/N</th>
//           <th>DB ID</th>
//           <th>Name</th>
//           <th>Service No</th>
//           <th>Year</th>
//           <th>Grade</th>
//           <th>Evaluator</th>
//           <th>Actions</th>
//         </tr>
//       </thead>
//       <tbody>
//         {data.map((person, index) => (
//           <tr key={person.id}>
//             {/* Sequential Number */}
//             <td>
//               <strong>{index + 1}</strong>
//             </td>
//             {/* Actual Database ID - muted/smaller */}
//             <td>
//               <span style={{ color: "#999", fontSize: "0.85em" }}>
//                 #{person.id}
//               </span>
//             </td>
//             <td>{person.full_name}</td>
//             <td>{person.svc_no}</td>
//             <td>{person.year}</td>
//             <td>{person.grade}</td>
//             <td>
//               {person.evaluator_name} ({person.evaluator_rank})
//             </td>
//             <td className="actions">
//               <button
//                 onClick={() => navigate(`/admin/personnel/${person.id}`)}
//                 className="view-btn"
//               >
//                 View
//               </button>
//               <button
//                 onClick={() => navigate(`/admin/personnel/${person.id}/edit`)}
//                 className="edit-btn"
//               >
//                 Edit
//               </button>
//               <button
//                 onClick={() => {
//                   if (window.confirm("Delete this record?")) {
//                     onDelete(person.id);
//                   }
//                 }}
//                 className="delete-btn"
//               >
//                 Delete
//               </button>
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }

import { useState } from "react";
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

        <SearchBar onSearch={search} />

        {loading ? (
          <div className="loading-skeleton">
            <p>Loading personnel data...</p>
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

// // import { useState } from "react";
// // import { useAdminData } from "../hooks/useAdminData";

// // import AdminHeader from "../components/AdminHeader";
// // import AdminSidebar from "../components/AdminSidebar";
// // import PersonnelTable from "../components/PersonnelTable";
// // import SearchBar from "../components/SearchBar";
// // import Pagination from "../components/Pagination"; // ← assuming you have this

// // import "../styles/Admin.css";

// // export default function PersonnelList() {
// //   const { personnel, loading, removePersonnel, search } = useAdminData();

// //   // Add local page state (you'll need to modify useAdminData hook too)
// //   const [page, setPage] = useState(1);

// //   // You can slice data locally for now (simple pagination)
// //   const itemsPerPage = 10;
// //   const startIndex = (page - 1) * itemsPerPage;
// //   const paginatedData = personnel.slice(startIndex, startIndex + itemsPerPage);
// //   const totalPages = Math.ceil(personnel.length / itemsPerPage);

// //   return (
// //     <div className="admin-layout">
// //       <AdminSidebar />

// //       <div className="admin-content">
// //         <AdminHeader />

// //         <div className="list-header">
// //           <h3>Personnel Records</h3>
// //           <div className="list-meta">
// //             {loading ? (
// //               <span>Loading records...</span>
// //             ) : (
// //               <span>
// //                 {personnel.length === 0
// //                   ? "No records found"
// //                   : `${personnel.length} record${personnel.length !== 1 ? 's' : ''}`}
// //               </span>
// //             )}
// //           </div>
// //         </div>

// //         <SearchBar onSearch={search} />

// //         {loading ? (
// //           <div className="loading-skeleton">
// //             <p>Loading personnel data...</p>
// //             {/* Optional: show 5 fake rows as skeleton */}
// //             <div className="skeleton-row" />
// //             <div className="skeleton-row" />
// //             <div className="skeleton-row" />
// //           </div>
// //         ) : personnel.length === 0 ? (
// //           <div className="empty-state">
// //             <p>No personnel records found.</p>
// //             {search ? <p>Try a different service number or clear the search.</p> : null}
// //           </div>
// //         ) : (
// //           <>
// //             <PersonnelTable
// //               data={paginatedData}
// //               onDelete={removePersonnel}
// //             />

// //             {totalPages > 1 && (
// //               <Pagination
// //                 page={page}
// //                 setPage={setPage}
// //                 totalPages={totalPages} // optional prop if you want to show 1/5 etc.
// //               />
// //             )}
// //           </>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }
