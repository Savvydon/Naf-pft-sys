import { useState } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://naf-pft-sys-1.onrender.com";

export default function SuperAdminLogin() {
  const [svc_no, setSvcNo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsBusy(true);

    try {
      const response = await fetch(`${API_BASE}/superadmin/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          svc_no: svc_no.trim().toUpperCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Super Admin login failed");
      }

      // Save token and user data
      login(data.access_token, {
        role: data.role,
        full_name: data.full_name,
        rank: data.rank,
      });

      navigate("/superadmin/dashboard", { replace: true });
    } catch (err) {
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
        style={{ textAlign: "center", marginBottom: "28px", color: "#003366" }}
      >
        NAF PFT Super Admin Login
      </h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontWeight: "600" }}>Service Number</label>
          <input
            type="text"
            value={svc_no}
            onChange={(e) => setSvcNo(e.target.value)}
            placeholder="NAF09/23345"
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
              color: "#003366",
            }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
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
            background: isBusy ? "#aaa" : "#003366",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: isBusy ? "not-allowed" : "pointer",
          }}
        >
          {isBusy ? "Authenticating..." : "Super Admin Login"}
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
          Evaluator Login
        </a>{" "}
        |
        <a href="/admin/login" style={{ color: "#0d6efd", marginLeft: "10px" }}>
          Admin Login
        </a>
      </p>
    </div>
  );
}

