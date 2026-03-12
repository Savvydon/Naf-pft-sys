import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPersonnelById } from "../services/adminApi";
import airForce from "../../assets/airforce.png";
import "../styles/PersonnelEdit.css";

// Define ranks (move to a separate constants file later if you prefer)
const RANKS = [
  "Air Commodore",
  "Group Captain",
  "Wing Commander",
  "Squadron Leader",
  "Flight Lieutenant",
  "Flying Officer",
  "Pilot Officer",
  "Master Warrant Officer",
  "Warrant Officer",
  "Flight Sergeant",
  "Sergeant",
  "Corporal",
  "Lance Corporal",
  "Aircraftman",
  // Add more ranks as needed
];

export default function PersonnelEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch existing record when component mounts
  useEffect(() => {
    async function fetchRecord() {
      try {
        setLoading(true);
        const response = await fetch(`https://naf-pft-sys.onrender.com/api/pft-results/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch record: ${response.status}`);
        }
        const data = await response.json();
        setFormData(data);
      } catch (err) {
        setError(err.message || "Could not load record");
      } finally {
        setLoading(false);
      }
    }

    fetchRecord();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`https://naf-pft-sys.onrender.com/api/pft-results/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to update record");
      }

      alert("Record updated successfully!");
      navigate(`/admin/personnel/${id}`);
    } catch (err) {
      setError(err.message || "Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <p className="loading-text">Loading record...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container">
        <div className="form-error">{error}</div>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="edit-page-header">
        <h2>Edit Personnel Record</h2>
        <p>
          Service No: {formData.svc_no || "—"} • ID: {id}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="edit-form-grid">
        {/* Personal & Identification */}
        <div>
          <label>Year:</label>
          <input
            name="year"
            type="number"
            value={formData.year || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Full Name:</label>
          <input
            name="full_name"
            type="text"
            value={formData.full_name || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Rank:</label>
          <select
            name="rank"
            value={formData.rank || ""}
            onChange={handleChange}
            required
          >
            <option value="">Select Rank</option>
            {RANKS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Service Number:</label>
          <input
            name="svc_no"
            type="text"
            value={formData.svc_no || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Unit:</label>
          <input
            name="unit"
            type="text"
            value={formData.unit || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Date:</label>
          <input
            name="date"
            type="date"
            value={formData.date || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Appointment:</label>
          <input
            name="appointment"
            type="text"
            value={formData.appointment || ""}
            onChange={handleChange}
            required
          />
        </div>

        {/* Physical & Test Data */}
        <div>
          <label>Height (m):</label>
          <input
            name="height"
            type="number"
            step="0.01"
            value={formData.height || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Weight (kg):</label>
          <input
            name="weight_current"
            type="number"
            step="0.1"
            value={formData.weight_current || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Age:</label>
          <input
            name="age"
            type="number"
            value={formData.age || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Sex:</label>
          <select
            name="sex"
            value={formData.sex || ""}
            onChange={handleChange}
            required
          >
            <option value="">Select Sex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label>Cardio Cage:</label>
          <select
            name="cardio_cage"
            value={formData.cardio_cage || ""}
            onChange={handleChange}
            required
          >
            <option value="">Select Cage</option>
            <option value="1">Cage 1</option>
            <option value="2">Cage 2</option>
            <option value="3">Cage 3</option>
          </select>
        </div>

        <div>
          <label>3-Minute Step-Up:</label>
          <input
            name="step_up_value"
            type="number"
            value={formData.step_up_value || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>1-Minute Push-Up:</label>
          <input
            name="push_up_value"
            type="number"
            value={formData.push_up_value || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>1-Minute Sit-Up:</label>
          <input
            name="sit_up_value"
            type="number"
            value={formData.sit_up_value || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Chin-Up:</label>
          <input
            name="chin_up_value"
            type="number"
            value={formData.chin_up_value || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Sit & Reach (cm):</label>
          <input
            name="sit_reach_value"
            type="number"
            value={formData.sit_reach_value || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Evaluator Name:</label>
          <input
            name="evaluator_name"
            type="text"
            value={formData.evaluator_name || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Evaluator Rank:</label>
          <select
            name="evaluator_rank"
            value={formData.evaluator_rank || ""}
            onChange={handleChange}
            required
          >
            <option value="">Select Rank</option>
            {RANKS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Notes – full width */}
        <div className="full-width">
          <label>Notes / Remarks:</label>
          <textarea
            name="notes"
            value={formData.notes || ""}
            onChange={handleChange}
            rows={4}
            placeholder="Any additional comments, observations, or corrections..."
          />
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Cancel
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}
      </form>
    </div>
  );
}