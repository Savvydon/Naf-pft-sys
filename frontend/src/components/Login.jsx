// components/Login.jsx
import { useState } from "react";
import { useAuth } from "./AuthContext";

export default function Login() {
  const [svc_no, setSvcNo] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsBusy(true);

    try {
      const response = await fetch(
        "https://naf-pft-sys.onrender.com/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            svc_no: svc_no.trim().toUpperCase(),
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed - check credentials");
      }

      login(data.access_token);
      window.location.reload(); // reload to show form with user info
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "420px",
        margin: "80px auto",
        padding: "24px",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "28px" }}>
        Evaluator Login
      </h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}
          >
            Service Number
          </label>
          <input
            type="text"
            value={svc_no}
            onChange={(e) => setSvcNo(e.target.value)}
            placeholder="NAF26/10102"
            required
            style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label
            style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
          />
        </div>

        {errorMsg && (
          <p style={{ color: "red", marginBottom: "16px" }}>{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={isBusy}
          style={{
            width: "100%",
            padding: "12px",
            background: isBusy ? "#aaa" : "#0d6efd",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: isBusy ? "not-allowed" : "pointer",
          }}
        >
          {isBusy ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
