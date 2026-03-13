import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import "../styles/superadmin.css";

export default function SuperAdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [svc_no, setSvcNo] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        "https://naf-pft-sys.onrender.com/superadmin/login",
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

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      if (data.role !== "super_admin") {
        throw new Error("Unauthorized");
      }

      login(data.access_token);
      navigate("/superadmin/dashboard");
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <h2>Super Admin Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Service Number"
          value={svc_no}
          onChange={(e) => setSvcNo(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
