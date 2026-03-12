import "../styles/Admin.css";
export default function Pagination({ page, setPage }) {
  return (
    <div className="pagination">

       <button onClick={() => setPage((p) => p + 1)}>Prev</button>
       
       <button onClick={() => setPage((p) => Math.max(p - 1, 1))}>Next</button>
     
    </div>
  );
}
