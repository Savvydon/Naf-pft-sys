import "../styles/Admin.css";

export default function Pagination({ page, setPage, totalPages }) {
  return (
    <div className="pagination">
      <button 
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={page === 1}
      >
        Prev
      </button>

      <span>Page {page} of {totalPages}</span>

      <button 
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
}

// import "../styles/Admin.css";
// export default function Pagination({ page, setPage }) {
//   return (
//     <div className="pagination">
//       <button onClick={() => setPage((p) => p + 1)}>Prev</button>

//       <span>Page {page}</span>

//       <button onClick={() => setPage((p) => Math.max(p - 1, 1))}>Next</button>
//     </div>
//   );
// }
