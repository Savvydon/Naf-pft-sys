// components/PhysicalFitnessForm.jsx
import { useAuth } from "../AuthContext";

export function PhysicalFitnessForm({
  formData,
  handleChange,
  handleSubmit,
  ranks,
}) {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        Loading evaluator information...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      {/* ------------------ FORM FIELDS ------------------ */}
      <div>
        <label>Year:</label>
        <input
          name="year"
          type="number"
          placeholder="Year"
          value={formData.year}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Full Name:</label>
        <input
          name="fullName"
          type="text"
          value={formData.fullName}
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
          {ranks.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Service Number:</label>
        <input
          name="svcNo"
          type="text"
          value={formData.svcNo}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Unit:</label>
        <input
          name="unit"
          type="text"
          placeholder="Enter Unit"
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
          placeholder="Enter Appointment Name"
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
          placeholder="Height (m)"
          value={formData.height}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Weight (kg):</label>
        <input
          name="weight"
          type="number"
          step="0.01"
          placeholder="Weight (kg)"
          value={formData.weight}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Email:</label>
        <input
          name="email"
          type="email"
          placeholder="Enter email address"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Age:</label>
        <input
          name="age"
          type="number"
          placeholder="Age"
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
          name="cardioCage"
          value={formData.cardioCage}
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
          name="stepUp"
          type="number"
          placeholder="3 Minutes Step-Up"
          value={formData.stepUp}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>1-Minute Push-Up:</label>
        <input
          name="pushUp"
          type="number"
          placeholder="1 Minute Push-Up"
          value={formData.pushUp}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Sit-Up:</label>
        <input
          name="sitUp"
          type="number"
          placeholder="1 Minute Sit-Up"
          value={formData.sitUp}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Chin-Up:</label>
        <input
          name="chinUp"
          type="number"
          placeholder="Chin-Up"
          value={formData.chinUp}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Sit & Reach (cm):</label>
        <input
          name="sitReach"
          type="number"
          placeholder="Sit and Reach (cm)"
          value={formData.sitReach}
          onChange={handleChange}
          required
        />
      </div>

      {/* ---------------- Evaluator Fields ---------------- */}
      <div>
        <label>Evaluator Name:</label>
        <input
          name="evaluatorName"
          type="text"
          value={currentUser?.full_name || ""}
          readOnly
          disabled
          style={{
            backgroundColor: "#f0f0f0",
            cursor: "not-allowed",
            color: "#333",
          }}
        />
      </div>

      <div>
        <label>Evaluator Rank:</label>
        <input
          name="evaluatorRank"
          type="text"
          value={currentUser?.rank || ""}
          readOnly
          disabled
          style={{
            backgroundColor: "#f0f0f0",
            cursor: "not-allowed",
            color: "#333",
          }}
        />
      </div>

      <button type="submit" className="submit-btn">
        Submit Form
      </button>
    </form>
  );
}
