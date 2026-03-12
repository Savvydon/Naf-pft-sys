import "../styles/Admin.css";
import { useNavigate } from "react-router-dom";
import "../styles/Admin.css";

export default function PersonnelTable({ data, onDelete }) {
  const navigate = useNavigate();

  return (
    <table className="personnel-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Gender</th>
          <th>Service No</th>
          <th>Year</th>
          <th>Score</th>
          <th>Grade</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {data.map((p) => (
          <tr key={p.id}>
            <td>{p.id}</td>
            <td>{p.full_name}</td>
            <td>{p.sex}</td>
            <td>{p.svc_no}</td>
            <td>{p.year}</td>
            <td>{p.aggregate}</td>
            <td>{p.grade}</td>

            <td className="actions-cell">
              <button
                className="view-btn"
                onClick={() => navigate(`/admin/personnel/${p.id}`)}
              >
                View
              </button>

              <button
                className="edit-btn"
                onClick={() => navigate(`/admin/personnel/${p.id}/edit`)}
              >
                Edit
              </button>

              <button
                className="delete-btn"
                onClick={() => onDelete(p.id)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}