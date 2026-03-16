import { useState } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../services/adminApi";

export default function AdminLogin() {
  const [svc_no, setSvcNo] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rank, setRank] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const ranks = [
    "Air Man",
    "Air Woman",
    "Lance Corporal",
    "Corporal",
    "Sergeant",
    "Flight Sergeant",
    "Warrant Officer",
    "Master Warrant Officer",
    "Air Warrant Officer",
    "Flying Officer",
    "Flight Lieutenant",
    "Squadron Leader",
    "Wing Commander",
    "Group Captain",
    "Air Commodore",
    "Air Vice Marshal",
    "Vice Marshal",
    "Air Chief Marshal",
    "Marshal of the Air Force",
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setDebugInfo("");
    setIsBusy(true);

    try {
      console.log("[LOGIN] Starting admin login...");

      const data = await loginAdmin({
        svc_no: svc_no.trim().toUpperCase(),
        password,
        full_name: fullName.trim(),
        rank,
      });

      console.log("[LOGIN] Success, saving token...");
      login(data.access_token);

      console.log("[LOGIN] Redirecting to dashboard...");
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("[LOGIN ERROR]", err);
      setErrorMsg(err.message || "Authentication failed");
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "120px auto",
        padding: "24px",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h2
        style={{ textAlign: "center", marginBottom: "28px", color: "#198754" }}
      >
        NAF PFT Admin Login
      </h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: "600" }}>Service Number</label>
          <input
            type="text"
            value={svc_no}
            onChange={(e) => setSvcNo(e.target.value)}
            placeholder="NAF/26/10102"
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: "600" }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: "600" }}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: "600" }}>Rank</label>
          <select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">Select Rank</option>
            {ranks.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {errorMsg && (
          <div
            style={{
              color: "#dc3545",
              marginBottom: "15px",
              fontSize: "0.9em",
              padding: "10px",
              background: "#f8d7da",
              borderRadius: "4px",
            }}
          >
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        {debugInfo && (
          <div
            style={{
              color: "#0c5460",
              marginBottom: "15px",
              fontSize: "0.8em",
              padding: "8px",
              background: "#d1ecf1",
              borderRadius: "4px",
              fontFamily: "monospace",
            }}
          >
            {debugInfo}
          </div>
        )}

        <button
          type="submit"
          disabled={isBusy}
          style={{
            width: "100%",
            padding: "12px",
            background: isBusy ? "#aaa" : "#198754",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: isBusy ? "not-allowed" : "pointer",
            fontWeight: "600",
          }}
        >
          {isBusy ? "Authenticating..." : "Admin Login"}
        </button>
      </form>

      <p
        style={{
          marginTop: "20px",
          fontSize: "0.85em",
          color: "#666",
          textAlign: "center",
        }}
      >
        <a href="/login" style={{ color: "#0d6efd" }}>
          Main Login
        </a>{" "}
        |
        <a
          href="/superadmin/login"
          style={{ color: "#0d6efd", marginLeft: "10px" }}
        >
          Super Admin Login
        </a>
      </p>
    </div>
  );
}

// // AdminLogin.jsx
// import { useState } from "react";
// import { useAuth } from "../../AuthContext";
// import { useNavigate } from "react-router-dom";

// export default function AdminLogin() {
//   const [svc_no, setSvcNo] = useState("");
//   const [password, setPassword] = useState("");
//   const [errorMsg, setErrorMsg] = useState("");
//   const [isBusy, setIsBusy] = useState(false);

//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setErrorMsg("");
//     setIsBusy(true);

//     try {
//       const res = await fetch("https://naf-pft-sys.onrender.com/admin/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ svc_no: svc_no.trim().toUpperCase(), password }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.detail || "Login failed");
//       }

//       if (data.role !== "admin") {
//         throw new Error("Unauthorized: Not an admin");
//       }

//       login(data.access_token); // token saved in AuthContext
//       navigate("/admin/dashboard"); // redirect to dashboard
//     } catch (err) {
//       setErrorMsg(err.message);
//     } finally {
//       setIsBusy(false);
//     }
//   };

//   return (
//     <div
//       style={{
//         maxWidth: 400,
//         margin: "100px auto",
//         padding: 24,
//         border: "1px solid #ddd",
//         borderRadius: 8,
//       }}
//     >
//       <h2 style={{ textAlign: "center" }}>Admin Login</h2>
//       <form onSubmit={handleLogin}>
//         <div style={{ marginBottom: 16 }}>
//           <label>Service Number</label>
//           <input
//             type="text"
//             value={svc_no}
//             onChange={(e) => setSvcNo(e.target.value)}
//             required
//             style={{ width: "100%", padding: 10 }}
//           />
//         </div>
//         <div style={{ marginBottom: 16 }}>
//           <label>Password</label>
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             style={{ width: "100%", padding: 10 }}
//           />
//         </div>
//         {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
//         <button
//           type="submit"
//           disabled={isBusy}
//           style={{
//             width: "100%",
//             padding: 12,
//             background: "#0d6efd",
//             color: "#fff",
//             border: "none",
//             borderRadius: 6,
//             cursor: "pointer",
//           }}
//         >
//           {isBusy ? "Signing in..." : "Login"}
//         </button>
//       </form>
//     </div>
//   );
// }
