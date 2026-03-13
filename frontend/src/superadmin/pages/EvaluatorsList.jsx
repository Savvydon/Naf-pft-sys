import { useEffect, useState } from "react";

export default function EvaluatorsList() {
  const [evaluators, setEvaluators] = useState([]);

  useEffect(() => {
    fetch("https://naf-pft-sys.onrender.com/superadmin/evaluators")
      .then((res) => res.json())
      .then((data) => setEvaluators(data));
  }, []);

  return (
    <div>
      <h2>Evaluators</h2>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Rank</th>
            <th>Service Number</th>
            <th>Evaluations</th>
          </tr>
        </thead>

        <tbody>
          {evaluators.map((e) => (
            <tr key={e.id}>
              <td>{e.full_name}</td>
              <td>{e.rank}</td>
              <td>{e.svc_no}</td>
              <td>{e.evaluations_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
