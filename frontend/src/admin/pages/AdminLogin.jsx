import { useState } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../services/adminApi";

export default function AdminLogin() {
  const [svc_no, setSvcNo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [rank, setRank] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const ranks = [
    "Air Craftman",
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
      console.log("[LOGIN] Starting admin login...");

      const data = await loginAdmin({
        svc_no: svc_no.trim().toUpperCase(),
        password,
        full_name: fullName.trim(),
        rank,
      });

      console.log(
        "[LOGIN] Success, token received:",
        data.access_token ? "YES" : "NO",
      );
      console.log("[LOGIN] Role:", data.role);

      // Save token before navigating
      login(data.access_token, {
        role: data.role,
        full_name: data.full_name,
        rank: data.rank,
      });

      console.log("[LOGIN] Token saved, navigating to dashboard...");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      console.error("[LOGIN ERROR]", err);
      setErrorMsg(err.message || "Authentication failed");
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
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "16px", position: "relative" }}>
          <label style={{ fontWeight: "600" }}>Password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px 40px 10px 10px" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "10px",
              top: "70%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
              color: "#198754",
            }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: "600" }}>Full Name</label>
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
          <label style={{ fontWeight: "600" }}>Rank</label>
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
          <div
            style={{
              color: "#dc3545",
              marginBottom: "15px",
              padding: "10px",
              background: "#f8d7da",
              borderRadius: "4px",
            }}
          >
            <strong>Error:</strong> {errorMsg}
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
