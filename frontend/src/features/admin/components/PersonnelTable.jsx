import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Admin.css";

export default function PersonnelTable({ data, onView }) {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;

  return (
    <div className="personnel-table-container">
      <div className="list-meta personnel-list-caption">
        {data.length ? `Showing ${data.length} personnel record${data.length !== 1 ? "s" : ""}` : "No records found"}
      </div>
      <div className="table-scroll">
        <table className="personnel-table organized-personnel-table">
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, index) => (
              <tr key={p.svc_no || p.id}>
                <td><strong>{index + 1}</strong></td>
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
                <td className="actions-cell">
                  <button className="view-btn" onClick={() => onView(p.id)}>View Record</button>
                  <button className="edit-btn" onClick={() => navigate(`/admin/personnel/${p.id}/edit`, { state: { returnTo } })}>Latest Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
