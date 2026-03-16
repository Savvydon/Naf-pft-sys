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

  const { login } = useAuth();
  const navigate = useNavigate();

  const ranks = [
    "Air Man", "Air Woman", "Lance Corporal", "Corporal", "Sergeant",
    "Flight Sergeant", "Warrant Officer", "Master Warrant Officer",
    "Air Warrant Officer", "Flying Officer", "Flight Lieutenant",
    "Squadron Leader", "Wing Commander", "Group Captain",
    "Air Commodore", "Air Vice Marshal", "Vice Marshal",
    "Air Chief Marshal", "Marshal of the Air Force",
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsBusy(true);

    try {
      // Use loginAdmin which verifies admin role
      const data = await loginAdmin({
        svc_no: svc_no.trim().toUpperCase(),
        password,
        full_name: fullName.trim(),
        rank,
      });

      // Save token
      login(data.access_token);
      
      // Redirect to admin dashboard
      navigate("/admin/dashboard");
    } catch (err) {
      let message = err.message || "Authentication failed";
      
      if (message.includes("not registered")) {
        message = "Service number not found. Please contact your Super Admin to create an admin account.";
      } else if (message.includes("Name does not match")) {
        message = "Full name does not match our records.";
      } else if (message.includes("Rank does not match")) {
        message = "Rank does not match our records.";
      } else if (message.includes("Incorrect password")) {
        message = "Incorrect password.";
      } else if (message.includes("Admins only")) {
        message = "You are not authorized as an Admin.";
      }
      
      setErrorMsg(message);
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
      <h2 style={{ textAlign: "center", marginBottom: "28px" }}>
        NAF PFT Admin Login
      </h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "16px" }}>
          <label>Service Number</label>
          <input
            type="text"
            value={svc_no}
            onChange={(e) => setSvcNo(e.target.value)}
            placeholder="NAF/26/10102"
            required
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            required
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Rank</label>
          <select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            required
            style={{ width: "100%", padding: "10px" }}
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
          <p style={{ color: "red", marginBottom: "10px", fontSize: "0.9em" }}>
            {errorMsg}
          </p>
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
          }}
        >
          {isBusy ? "Authenticating..." : "Admin Login"}
        </button>
      </form>

      <p style={{ marginTop: "20px", fontSize: "0.85em", color: "#666", textAlign: "center" }}>
        Admins must be registered by the Super Admin.<br/>
        <a href="/login" style={{ color: "#0d6efd" }}>Evaluator Login</a> | 
        <a href="/superadmin/login" style={{ color: "#0d6efd" }}> Super Admin Login</a>
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
