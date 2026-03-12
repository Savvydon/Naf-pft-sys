import { useNavigate } from "react-router-dom";
import "../styles/Admin.css";
export default function AdminLogin() {
  const navigate = useNavigate();

  const login = (e) => {
    e.preventDefault();

    const username = e.target.username.value;
    const password = e.target.password.value;

    if (username === "admin" && password === "naf123") {
      localStorage.setItem("admin_auth", "true");
      navigate("/admin/dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="admin-login">
      <h2>Admin Login</h2>

      <form onSubmit={login}>
        <input name="username" placeholder="Username" />
        <input name="password" type="password" placeholder="Password" />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
