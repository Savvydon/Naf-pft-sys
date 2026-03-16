import { useState } from "react";
import { useAuth } from "../../AuthContext";
import "../styles/superadmin.css";

export default function SuperAdminDashboard() {
  const { token } = useAuth();
  const [form, setForm] = useState({
    svc_no: "",
    full_name: "",
    rank: "",
    password: "",
    type: "evaluator",
  });
  const [msg, setMsg] = useState("");

  const createUser = async () => {
    setMsg("");
    const endpoint =
      form.type === "evaluator"
        ? "/superadmin/create-evaluator"
        : "/superadmin/create-admin";

    try {
      const res = await fetch(`https://naf-pft-sys-1.onrender.com${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Creation failed");
      }

      const data = await res.json();
      setMsg(
        `${form.type.charAt(0).toUpperCase() + form.type.slice(1)} created: ${data.svc_no}`,
      );
      setForm({
        svc_no: "",
        full_name: "",
        rank: "",
        password: "",
        type: "evaluator",
      });
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>Super Admin Dashboard</h1>

      <div
        style={{
          margin: "30px 0",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <h3>Create New User</h3>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        >
          <option value="evaluator">Evaluator</option>
          <option value="admin">Admin</option>
        </select>
        <input
          placeholder="Service Number"
          value={form.svc_no}
          onChange={(e) => setForm({ ...form, svc_no: e.target.value })}
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginBottom: 12,
          }}
        />
        <input
          placeholder="Full Name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginBottom: 12,
          }}
        />
        <input
          placeholder="Rank"
          value={form.rank}
          onChange={(e) => setForm({ ...form, rank: e.target.value })}
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginBottom: 12,
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={{
            display: "block",
            width: "100%",
            padding: 10,
            marginBottom: 12,
          }}
        />
        <button
          onClick={createUser}
          style={{
            padding: "10px 20px",
            background: "#0d6efd",
            color: "white",
            border: "none",
            borderRadius: 6,
          }}
        >
          Create {form.type}
        </button>
        {msg && (
          <p
            style={{
              marginTop: 16,
              color: msg.includes("failed") ? "red" : "green",
            }}
          >
            {msg}
          </p>
        )}
      </div>

      <ul style={{ lineHeight: 2 }}>
        <li>
          <a href="/superadmin/evaluators">
            View Evaluators (with evaluation counts)
          </a>
        </li>
        <li>
          <a href="/superadmin/admins">View Admins</a>
        </li>
        <li>
          <a href="/admin/personnel">View / Manage All Personnel Records</a>
        </li>
      </ul>
    </div>
  );
}

// import { Link } from "react-router-dom";
// import "../styles/superadmin.css";

// export default function SuperAdminDashboard() {
//   return (
//     <div style={{ padding: "40px" }}>
//       <h1>Super Admin Dashboard</h1>

//       <ul>
//         <li>
//           <Link to="/superadmin/evaluators">View Evaluators</Link>
//         </li>

//         <li>
//           <Link to="/superadmin/admins">View Admins</Link>
//         </li>

//         <li>
//           <Link to="/admin/personnel">View All Personnel Records</Link>
//         </li>
//       </ul>
//     </div>
//   );
// }
