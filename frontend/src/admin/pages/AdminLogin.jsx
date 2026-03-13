// AdminLogin.jsx
import { useState } from "react";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [svc_no, setSvcNo] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsBusy(true);

    try {
      const res = await fetch("https://naf-pft-sys.onrender.com/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ svc_no: svc_no.trim().toUpperCase(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      if (data.role !== "admin") {
        throw new Error("Unauthorized: Not an admin");
      }

      login(data.access_token); // token saved in AuthContext
      navigate("/admin/dashboard"); // redirect to dashboard
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "100px auto",
        padding: 24,
        border: "1px solid #ddd",
        borderRadius: 8,
      }}
    >
      <h2 style={{ textAlign: "center" }}>Admin Login</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 16 }}>
          <label>Service Number</label>
          <input
            type="text"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 10 }}
          />
        </div>
        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
        <button
          type="submit"
          disabled={isBusy}
          style={{
            width: "100%",
            padding: 12,
            background: "#0d6efd",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {isBusy ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
