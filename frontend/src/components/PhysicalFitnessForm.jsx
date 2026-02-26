export function PhysicalFitnessForm({
  formData,
  handleChange,
  handleSubmit,
  ranks,
}) {
  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <div>
        <label>Year:</label>
        <input name="year" type="number" placeholder="Year" onChange={handleChange} required />
      </div>

      <div>
        <label>Full Name:</label>
        <input name="fullName" type="text" onChange={handleChange} required />
      </div>

      <div>
        <label>Rank:</label>
        <select name="rank" onChange={handleChange} required>
          <option value="">Select Rank</option>
          {ranks.map((r) => (
            <option key={r}>{r}</option>
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
        <input name="unit" type="text" placeholder="Enter Unit" onChange={handleChange} required />
      </div>

      <div>
        <label>Date:</label>
        <input name="date" type="date" onChange={handleChange} required />
      </div>

      <div>
        <label>Appointment:</label>
        <input name="appointment" type="text" placeholder="Enter Appointment Name" onChange={handleChange} required />
      </div>

      <div>
        <label>Height (m):</label>
        <input name="height" type="number" placeholder="Height (m)" step="0.01" onChange={handleChange} required />
      </div>

      <div>
        <label>Weight (kg):</label>
        <input name="weight" type="number" placeholder="Weight (kg)" step="0.01" onChange={handleChange} required />
      </div>

      <div>
        <label>Email:</label>
        <input name="email" type="email" placeholder="enter your email address" onChange={handleChange} required />
      </div>

      <div>
        <label>Age:</label>
        <input name="age" type="number" placeholder="Age" onChange={handleChange} required />
      </div>

      <div>
        <label>Sex:</label>
        <select name="sex" onChange={handleChange} required>
          <option value="">Select Sex</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      {/* ✅ CARDIO CAGE INPUT */}
      <div>
        <label>Cardio Cage:</label>
        <select name="cardioCage" onChange={handleChange} required>
          <option value="">Select Cage</option>
          <option value="1">Cage 1</option>
          <option value="2">Cage 2</option>
          <option value="3">Cage 3</option>
        </select>
      </div>

      <div>
        <label>3-Minute Step-Up:</label>
        <input name="stepUp" type="number" placeholder="3 Minutes Step-Up" onChange={handleChange} required />
      </div>

      <div>
        <label>1-Minute Push-Up:</label>
        <input name="pushUp" type="number" placeholder="1 Minute Push-Up" onChange={handleChange} required />
      </div>

      <div>
        <label>Sit-Up:</label>
        <input name="sitUp" type="number" placeholder="1 Minute Sit-Up" onChange={handleChange} required />
      </div>

      <div>
        <label>Chin-Up:</label>
        <input name="chinUp" type="number" placeholder="Chin-Up" onChange={handleChange} required />
      </div>

      <div>
        <label>Sit & Reach (cm):</label>
        <input name="sitReach" type="number" placeholder="Sit and Reach(cm)" onChange={handleChange} required />
      </div>

      <div>
        <label>Evaluator Name:</label>
        <input name="evaluatorName" type="text" placeholder="Enter evaluator's name"  onChange={handleChange} required />
      </div>

      <div>
        <label>Evaluator Rank:</label>
        <select name="evaluatorRank" onChange={handleChange} required>
          <option value="">Select Rank</option>
          {ranks.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="submit-btn">
        Submit Form
      </button>
    </form>
  );
}