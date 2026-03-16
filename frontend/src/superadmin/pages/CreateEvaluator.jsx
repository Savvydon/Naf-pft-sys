import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/superadmin.css";

export default function CreateEvaluator() {
  const [formData, setFormData] = useState({
    svc_no: "NAF",
    full_name: "",
    rank: "",
    password: "",
    confirm_password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("pft_token");

  const ranks = [
    "Air Man", "Air Woman", "Lance Corporal", "Corporal", "Sergeant",
    "Flight Sergeant", "Warrant Officer", "Master Warrant Officer",
    "Air Warrant Officer", "Flying Officer", "Flight Lieutenant",
    "Squadron Leader", "Wing Commander", "Group Captain",
    "Air Commodore", "Air Vice Marshal", "Vice Marshal",
    "Air Chief Marshal", "Marshal of the Air Force",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "svc_no") {
      let cleaned = value.toUpperCase().replace(/[^A-Z0-9/]/g, "");
      if (!cleaned.startsWith("NAF")) cleaned = "NAF" + cleaned;
      setFormData({ ...formData, [name]: cleaned });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("https://naf-pft-sys-1.onrender.com/superadmin/evaluators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          svc_no: formData.svc_no,
          full_name: formData.full_name,
          rank: formData.rank,
          password: formData.password,
          role: "evaluator"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to create evaluator");
      }

      alert("Evaluator created successfully!");
      navigate("/superadmin/evaluators");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="superadmin-container">
      <h2>Create New Evaluator</h2>
      
      <form onSubmit={handleSubmit} className="create-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label>Service Number</label>
          <input
            type="text"
            name="svc_no"
            value={formData.svc_no}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Rank</label>
          <select name="rank" value={formData.rank} onChange={handleChange} required>
            <option value="">Select Rank</option>
            {ranks.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate("/superadmin/evaluators")} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Creating..." : "Create Evaluator"}
          </button>
        </div>
      </form>
    </div>
  );
}