import { useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

export default function Login() {
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
      // Use loginUser directly - no auto-registration
      // Evaluators must be created by Super Admin
      const data = await loginUser({
        svc_no: svc_no.trim().toUpperCase(),
        password,
        full_name: fullName.trim(),
        rank,
      });

      // Check if user is actually an evaluator
      if (data.role !== "evaluator") {
        throw new Error("This login is for Evaluators only. Please use the Admin or Super Admin login pages.");
      }

      // Save token
      login(data.access_token);
      
      // Redirect to evaluation form
      window.location.href = "/";
    } catch (err) {
      // Provide clearer error messages
      let message = err.message || "Authentication failed";
      
      if (message.includes("not registered")) {
        message = "Service number not found. Please contact your Super Admin to create an account.";
      } else if (message.includes("Name does not match")) {
        message = "Full name does not match our records.";
      } else if (message.includes("Rank does not match")) {
        message = "Rank does not match our records.";
      } else if (message.includes("Incorrect password")) {
        message = "Incorrect password.";
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
        NAF PFT Evaluator Login
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
            background: isBusy ? "#aaa" : "#0d6efd",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: isBusy ? "not-allowed" : "pointer",
          }}
        >
          {isBusy ? "Authenticating..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: "20px", fontSize: "0.85em", color: "#666", textAlign: "center" }}>
        Evaluators must be registered by the Super Admin.<br/>
        <a href="/admin/login" style={{ color: "#0d6efd" }}>Admin Login</a> | 
        <a href="/superadmin/login" style={{ color: "#0d6efd" }}> Super Admin Login</a>
      </p>
    </div>
  );
}

// import { useState } from "react";
// import { useAuth } from "../AuthContext";
// import { useNavigate } from "react-router-dom";
// import { loginOrRegister } from "../services/api";

// export default function Login() {
//   const [svc_no, setSvcNo] = useState("");
//   const [password, setPassword] = useState("");
//   const [fullName, setFullName] = useState("");
//   const [rank, setRank] = useState("");
//   const [errorMsg, setErrorMsg] = useState("");
//   const [isBusy, setIsBusy] = useState(false);

//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const ranks = [
//     "Air Man",
//     "Air Woman",
//     "Lance Corporal",
//     "Corporal",
//     "Sergeant",
//     "Flight Sergeant",
//     "Warrant Officer",
//     "Master Warrant Officer",
//     "Air Warrant Officer",
//     "Flying Officer",
//     "Flight Lieutenant",
//     "Squadron Leader",
//     "Wing Commander",
//     "Group Captain",
//     "Air Commodore",
//     "Air Vice Marshal",
//     "Vice Marshal",
//     "Air Chief Marshal",
//     "Marshal of the Air Force",
//   ];

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setErrorMsg("");
//     setIsBusy(true);

//     try {
//       const data = await loginOrRegister({
//         svc_no: svc_no.trim().toUpperCase(),
//         password,
//         full_name: fullName.trim(),
//         rank,
//       });

//       // Save token
//       login(data.access_token);

//       // reload to allow AuthContext to fetch user
//       window.location.href = "/";
//     } catch (err) {
//       setErrorMsg(err.message || "Authentication failed");
//     } finally {
//       setIsBusy(false);
//     }
//   };

//   return (
//     <div
//       style={{
//         maxWidth: "480px",
//         margin: "120px auto",
//         padding: "24px",
//         border: "1px solid #ddd",
//         borderRadius: "8px",
//       }}
//     >
//       <h2 style={{ textAlign: "center", marginBottom: "28px" }}>
//         Evaluator Login / Registration
//       </h2>

//       <form onSubmit={handleLogin}>
//         <div style={{ marginBottom: "16px" }}>
//           <label>Service Number</label>
//           <input
//             type="text"
//             value={svc_no}
//             onChange={(e) => setSvcNo(e.target.value)}
//             placeholder="NAF26/10102"
//             required
//             style={{ width: "100%", padding: "10px" }}
//           />
//         </div>

//         <div style={{ marginBottom: "16px" }}>
//           <label>Password</label>
//           <input
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             style={{ width: "100%", padding: "10px" }}
//           />
//         </div>

//         <div style={{ marginBottom: "16px" }}>
//           <label>Full Name</label>
//           <input
//             type="text"
//             value={fullName}
//             onChange={(e) => setFullName(e.target.value)}
//             placeholder="John Doe"
//             required
//             style={{ width: "100%", padding: "10px" }}
//           />
//         </div>

//         <div style={{ marginBottom: "16px" }}>
//           <label>Rank</label>
//           <select
//             value={rank}
//             onChange={(e) => setRank(e.target.value)}
//             required
//             style={{ width: "100%", padding: "10px" }}
//           >
//             <option value="">Select Rank</option>
//             {ranks.map((r) => (
//               <option key={r} value={r}>
//                 {r}
//               </option>
//             ))}
//           </select>
//         </div>

//         {errorMsg && (
//           <p style={{ color: "red", marginBottom: "10px" }}>{errorMsg}</p>
//         )}

//         <button
//           type="submit"
//           disabled={isBusy}
//           style={{
//             width: "100%",
//             padding: "12px",
//             background: isBusy ? "#aaa" : "#0d6efd",
//             color: "#fff",
//             border: "none",
//             borderRadius: "6px",
//             cursor: isBusy ? "not-allowed" : "pointer",
//           }}
//         >
//           {isBusy ? "Processing..." : "Login / Register"}
//         </button>
//       </form>
//     </div>
//   );
// }
