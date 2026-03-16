import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";

export default function SuperAdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [svc_no, setSvcNo] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        "https://naf-pft-sys-1.onrender.com/superadmin/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            svc_no: svc_no.trim().toUpperCase(),
            password,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Login failed");
      }

      const data = await res.json();

      if (data.role !== "super_admin") {
        throw new Error("Unauthorized");
      }

      login(data.access_token);
      navigate("/superadmin/dashboard");
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "80px auto",
        padding: 24,
        border: "1px solid #ddd",
        borderRadius: 8,
      }}
    >
      <h2>Super Admin Login Control</h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 16 }}>
          <label>Service Number</label>
          <input
            type="text"
            placeholder="SUPERADMIN/001"
            value={svc_no}
            onChange={(e) => setSvcNo(e.target.value)}
            required
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Password</label>
          <input
            type="password"
            placeholder="Super@NAF2026"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            background: "#0d6efd",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}

// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../AuthContext";
// import "../styles/superadmin.css";

// export default function SuperAdminLogin() {
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const [svc_no, setSvcNo] = useState("");
//   const [password, setPassword] = useState("");
//   const [errorMsg, setErrorMsg] = useState("");

//   const handleLogin = async (e) => {
//     e.preventDefault();

//     try {
//       const res = await fetch(
//         "https://naf-pft-sys-1.onrender.com/superadmin/login",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             svc_no: svc_no.trim().toUpperCase(),
//             password,
//           }),
//         },
//       );

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.detail || "Login failed");
//       }

//       if (data.role !== "super_admin") {
//         throw new Error("Unauthorized");
//       }

//       login(data.access_token);
//       navigate("/superadmin/dashboard");
//     } catch (err) {
//       setErrorMsg(err.message);
//     }
//   };

//   return (
//     <div style={{ maxWidth: 420, margin: "80px auto" }}>
//       <h2>Super Admin Login</h2>

//       <form onSubmit={handleLogin}>
//         <input
//           type="text"
//           placeholder="Service Number"
//           value={svc_no}
//           onChange={(e) => setSvcNo(e.target.value)}
//           required
//         />

//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />

//         {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

//         <button type="submit">Login</button>
//       </form>
//     </div>
//   );
// }
