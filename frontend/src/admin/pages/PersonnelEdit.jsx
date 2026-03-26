import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../styles/PersonnelEdit.css";

// Define ranks
const RANKS = [
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

const API_BASE = "https://naf-pft-sys-1.onrender.com";

export default function PersonnelEdit({ fromSuperAdmin = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin =
    fromSuperAdmin || location.pathname.includes("/superadmin/");

  const [formData, setFormData] = useState({
    year: "",
    full_name: "",
    rank: "",
    svc_no: "",
    unit: "",
    email: "",
    date: "",
    appointment: "",
    height: "",
    weight_current: "",
    age: "",
    sex: "",
    cardio_cage: "",
    step_up_value: "",
    push_up_value: "",
    sit_up_value: "",
    chin_up_value: "",
    sit_reach_value: "",
    evaluator_name: "",
    evaluator_rank: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch record
  useEffect(() => {
    async function fetchRecord() {
      try {
        setLoading(true);

        const endpoint = isSuperAdmin
          ? `${API_BASE}/superadmin/pft-results/${id}`
          : `${API_BASE}/api/pft-results/${id}`;

        const response = await fetch(endpoint, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch record: ${response.status}`);
        }

        const data = await response.json();

        // Fix date format for input[type="date"]
        if (data.date) {
          data.date = data.date.split("T")[0];
        }

        setFormData(data);
      } catch (err) {
        setError(err.message || "Could not load record");
      } finally {
        setLoading(false);
      }
    }

    fetchRecord();
  }, [id, isSuperAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Prepare update data - only send changed fields with proper types
      const updateData = {};

      const fieldsToUpdate = [
        "year",
        "full_name",
        "rank",
        "svc_no",
        "email",
        "unit",
        "date",
        "appointment",
        "height",
        "weight_current",
        "age",
        "sex",
        "cardio_cage",
        "step_up_value",
        "push_up_value",
        "sit_up_value",
        "chin_up_value",
        "sit_reach_value",
        "notes",
      ];

      fieldsToUpdate.forEach((field) => {
        const value = formData[field];
        if (value !== undefined && value !== null && value !== "") {
          // Convert numeric fields
          if (
            [
              "year",
              "age",
              "cardio_cage",
              "step_up_value",
              "push_up_value",
              "sit_up_value",
              "chin_up_value",
            ].includes(field)
          ) {
            updateData[field] = parseInt(value) || 0;
          } else if (
            ["height", "weight_current", "sit_reach_value"].includes(field)
          ) {
            updateData[field] = parseFloat(value) || 0;
          } else {
            updateData[field] = value;
          }
        }
      });

      console.log("[EDIT] Sending update:", updateData);

      const endpoint = isSuperAdmin
        ? `${API_BASE}/superadmin/pft-results/${id}`
        : `${API_BASE}/api/pft-results/${id}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.detail || `Failed to update: ${response.status}`,
        );
      }

      // Get the updated record with recomputed values
      const updatedRecord = await response.json();

      console.log("[EDIT] Received updated record:", updatedRecord);

      alert("Record updated successfully! All scores have been recomputed.");

      // Navigate to view the updated record with the new data
      if (isSuperAdmin) {
        navigate(`/superadmin/pft-results/${id}`, { state: updatedRecord });
      } else {
        navigate(`/admin/personnel/${id}`, { state: updatedRecord });
      }
    } catch (err) {
      console.error("[EDIT ERROR]", err);
      setError(err.message || "Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isSuperAdmin) {
      navigate(`/superadmin/pft-results/${id}`);
    } else {
      navigate(`/admin/personnel/${id}`);
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
        <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "8px" }}>
          Note: Changing physical test values will automatically recompute all
          scores, grades, and prescriptions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="edit-form-grid">
        <div>
          <label>Year:</label>
          <input
            name="year"
            type="number"
            value={formData.year}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Full Name:</label>
          <input
            name="full_name"
            type="text"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Rank:</label>
          <select
            name="rank"
            value={formData.rank}
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
            value={formData.svc_no}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Email:</label>
          <input
            name="email"
            type="text"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Unit:</label>
          <input
            name="unit"
            type="text"
            value={formData.unit}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Date:</label>
          <input
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Appointment:</label>
          <input
            name="appointment"
            type="text"
            value={formData.appointment}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Height (m):</label>
          <input
            name="height"
            type="number"
            step="0.01"
            value={formData.height}
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
            value={formData.weight_current}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Age:</label>
          <input
            name="age"
            type="number"
            value={formData.age}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Sex:</label>
          <select
            name="sex"
            value={formData.sex}
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
            value={formData.cardio_cage}
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
            value={formData.step_up_value}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>1-Minute Push-Up:</label>
          <input
            name="push_up_value"
            type="number"
            value={formData.push_up_value}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>1-Minute Sit-Up:</label>
          <input
            name="sit_up_value"
            type="number"
            value={formData.sit_up_value}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Chin-Up:</label>
          <input
            name="chin_up_value"
            type="number"
            value={formData.chin_up_value}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Sit & Reach (cm):</label>
          <input
            name="sit_reach_value"
            type="number"
            value={formData.sit_reach_value}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Evaluator Name:</label>
          <input
            name="evaluator_name"
            type="text"
            value={formData.evaluator_name}
            disabled
            style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
          />
        </div>

        <div>
          <label>Evaluator Rank:</label>
          <input
            name="evaluator_rank"
            type="text"
            value={formData.evaluator_rank}
            disabled
            style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
          />
        </div>

        <div className="full-width">
          <label>Notes / Remarks:</label>
          <textarea
            name="notes"
            value={formData.notes || ""}
            onChange={handleChange}
            rows={4}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={saving}>
            {saving ? "Saving & Recomputing..." : "Save Changes"}
          </button>

          <button
            type="button"
            className="cancel-btn"
            onClick={handleCancel}
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
