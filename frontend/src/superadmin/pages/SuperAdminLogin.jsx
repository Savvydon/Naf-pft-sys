import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import "../styles/superadmin.css";

export default function SuperAdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [svc_no, setSvcNo] = useState("NAF09/22119");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsBusy(true);

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
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      if (data.role !== "super_admin") {
        throw new Error("Unauthorized - Super Admin access only");
      }

      login(data.access_token);
      navigate("/superadmin/dashboard");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="superadmin-login" style={{ maxWidth: 420, margin: "80px auto", padding: "20px" }}>
      <h2 style={{ color: "#003366", textAlign: "center", marginBottom: "30px" }}>
        NAF PFT Super Admin
      </h2>
      
      <div style={{ 
        background: "#e7f3ff", 
        border: "1px solid #003366",
        padding: "15px", 
        borderRadius: "8px", 
        marginBottom: "25px",
        fontSize: "0.9em"
      }}>
        <strong style={{ color: "#003366" }}>System Credentials:</strong>
        <div style={{ marginTop: "8px", fontFamily: "monospace" }}>
          <div>Service Number: <strong>NAF09/22119</strong></div>
          <div>Password: <strong>Super-Admin-2026</strong></div>
        </div>
      </div>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>
            Service Number
          </label>
          <input
            type="text"
            value={svc_no}
            onChange={(e) => setSvcNo(e.target.value)}
            required
            style={{ width: "100%", padding: "12px", borderRadius: "5px", border: "1px solid #ddd" }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "12px", borderRadius: "5px", border: "1px solid #ddd" }}
          />
        </div>

        {errorMsg && (
          <p style={{ color: "#dc3545", marginBottom: "15px", fontSize: "0.9em", textAlign: "center" }}>
            {errorMsg}
          </p>
        )}

        <button 
          type="submit" 
          disabled={isBusy}
          style={{
            width: "100%",
            padding: "14px",
            background: isBusy ? "#6c757d" : "#003366",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: isBusy ? "not-allowed" : "pointer",
            fontSize: "1em",
            fontWeight: "600"
          }}
        >
          {isBusy ? "Authenticating..." : "Login as Super Admin"}
        </button>
      </form>

      <div style={{ marginTop: "25px", textAlign: "center" }}>
        <a href="/login" style={{ color: "#003366", marginRight: "15px" }}>Evaluator Login</a>
        <span style={{ color: "#ccc" }}>|</span>
        <a href="/admin/login" style={{ color: "#003366", marginLeft: "15px" }}>Admin Login</a>
      </div>
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
//         "https://naf-pft-sys.onrender.com/superadmin/login",
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
