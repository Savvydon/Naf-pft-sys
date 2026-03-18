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
  const [showPassword, setShowPassword] = useState(false); // ✅ New state for toggle

  const { login } = useAuth();
  const navigate = useNavigate();

  const ranks = [
    "Air CraftMan",
    "Air Craftwoman",
    "Lance Corporal",
    "Corporal",
    "Sergeant",
    "Flight Sergeant",
    "Warrant Officer",
    "Master Warrant Officer",
    "Air Warrant Officer",
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
    setIsBusy(true);

    try {
      const data = await loginUser({
        svc_no: svc_no.trim().toUpperCase(),
        password,
        full_name: fullName.trim(),
        rank,
      });

      // Save token and redirect based on role
      login(data.access_token);

      if (data.role === "super_admin") {
        navigate("/superadmin/dashboard");
      } else if (data.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/"); // Evaluator landing page
      }
    } catch (err) {
      let message = err.message || "Authentication failed";

      if (message.includes("not registered")) {
        message =
          "Service number not found. Please contact your Super Admin to create an account.";
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
        {/* Service Number */}
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

        {/* Password with show/hide toggle */}
        <div style={{ marginBottom: "16px", position: "relative" }}>
          <label>Password</label>
          <input
            type={showPassword ? "text" : "password"} // ✅ toggle input type
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", paddingRight: "60px" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "10px",
              top: "47%",
              padding: "4px 8px",
              border: "none",
              background: "transparent",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.85em",
            }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Full Name */}
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

        {/* Rank */}
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

        {/* Error message */}
        {errorMsg && (
          <p
            style={{
              color: "red",
              marginBottom: "10px",
              fontSize: "0.9em",
            }}
          >
            {errorMsg}
          </p>
        )}

        {/* Login button */}
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

      {/* Links */}
      <p
        style={{
          marginTop: "20px",
          fontSize: "0.85em",
          color: "#666",
          textAlign: "center",
        }}
      >
        <a href="/admin/login" style={{ color: "#0d6efd" }}>
          Admin Login
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
