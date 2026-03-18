import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import "../styles/superadmin.css";

export default function SuperAdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [svc_no, setSvcNo] = useState("NAF09/22119");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ✅ show/hide password
  const [errorMsg, setErrorMsg] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isBusy) return;

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
        },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Login failed");
      if (data.role !== "super_admin")
        throw new Error("Unauthorized - Super Admin access only");

      // ✅ Update token & current user immediately
      login(data.access_token, data);

      // ✅ Small delay to ensure state update
      setTimeout(() => navigate("/superadmin/dashboard"), 50);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      className="superadmin-login"
      style={{ maxWidth: 420, margin: "80px auto", padding: "20px" }}
    >
      <h2
        style={{ color: "#003366", textAlign: "center", marginBottom: "30px" }}
      >
        NAF PFT Super Admin
      </h2>

      <div
        style={{
          background: "#e7f3ff",
          border: "1px solid #003366",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "25px",
          fontSize: "0.9em",
        }}
      >
        <strong style={{ color: "#003366" }}>System Credentials:</strong>
        <div style={{ marginTop: "8px", fontFamily: "monospace" }}>
          <div>
            Service Number: <strong>NAF09/22119</strong>
          </div>
          <div>
            Password: <strong>Super-Admin-2026</strong>
          </div>
        </div>
      </div>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}
          >
            Service Number
          </label>
          <input
            type="text"
            value={svc_no}
            onChange={(e) => setSvcNo(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "5px",
              border: "1px solid #ddd",
            }}
          />
        </div>

        <div style={{ marginBottom: "20px", position: "relative" }}>
          <label
            style={{ display: "block", marginBottom: "5px", fontWeight: "600" }}
          >
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"} // ✅ toggle
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px 40px 12px", // space for toggle button
              borderRadius: "5px",
              border: "1px solid #ddd",
            }}
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
              color: "#003366",
            }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {errorMsg && (
          <p
            style={{
              color: "#dc3545",
              marginBottom: "15px",
              fontSize: "0.9em",
              textAlign: "center",
            }}
          >
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
            fontWeight: "600",
          }}
        >
          {isBusy ? "Authenticating..." : "Login as Super Admin"}
        </button>
      </form>

      <div style={{ marginTop: "25px", textAlign: "center" }}>
        <a href="/login" style={{ color: "#003366", marginRight: "15px" }}>
          Evaluator Login
        </a>
        <span style={{ color: "#ccc" }}>|</span>
        <a href="/admin/login" style={{ color: "#003366", marginLeft: "15px" }}>
          Admin Login
        </a>
      </div>
    </div>
  );
}
