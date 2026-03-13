import { useEffect, useState } from "react";

export default function AdminsList() {
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    fetch("https://naf-pft-sys.onrender.com/superadmin/admins")
      .then((res) => res.json())
      .then((data) => setAdmins(data));
  }, []);

  return (
    <div>
      <h2>Admins</h2>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Rank</th>
            <th>Service Number</th>
          </tr>
        </thead>

        <tbody>
          {admins.map((a) => (
            <tr key={a.id}>
              <td>{a.full_name}</td>
              <td>{a.rank}</td>
              <td>{a.svc_no}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
