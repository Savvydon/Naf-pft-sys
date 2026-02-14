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
        <input
          name="year"
          type="number"
          placeholder="Year"
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Full Name:</label>
        <input
          name="fullName"
          type="text"
          placeholder="Enter Name"
          onChange={handleChange}
          required
        />
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
          placeholder="NAF123abc"
          required
        />
      </div>
      <div>
        <label>Unit:</label>
        <input
          name="unit"
          type="text"
          placeholder="Enter Unit"
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Date:</label>
        <input type="date" name="date" onChange={handleChange} required />
      </div>
      <div>
        <label>Appointment:</label>
        <input
          name="appointment"
          type="text"
          placeholder="Enter Appointment Name"
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
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Phone Number:</label>
        <input
          name="phone"
          type="tel"
          placeholder="Phone Number"
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Email:</label>
        <input
          name="email"
          type="email"
          placeholder="Email"
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
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Sex:</label>
        <select name="sex" onChange={handleChange} required>
          <option value="">Sex</option>
          <option>Male</option>
          <option>Female</option>
        </select>
      </div>
      <div>
        <label>Cardio Type:</label>
        <select name="cardioType" onChange={handleChange} required>
          <option value="">Cardio Type</option>
          <option>Walk</option>
          <option>Jog</option>
        </select>
      </div>
      <div>
        <label>Cardio Minutes:</label>
        <input
          name="cardioMinutes"
          type="number"
          placeholder="Cardio Minutes"
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Cardio Seconds:</label>
        <input
          name="cardioSeconds"
          type="number"
          placeholder="Cardio Seconds"
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>3 Minutes Step-Up:</label>
        <input
          name="stepUp"
          type="number"
          placeholder="3 Minutes Step-Up"
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>1 Minute Push-Up:</label>
        <input
          name="pushUp"
          type="number"
          placeholder="1 Minute Push-Up"
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Sit-Up:</label>
        <input
          name="sitUp"
          type="number"
          placeholder="Sit-Up"
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
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Sit and Reach (cm):</label>
        <input
          name="sitReach"
          type="number"
          placeholder="Sit and Reach(cm)"
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit" className="submit-btn">
        {" "}
        Submit Form{" "}
      </button>
    </form>
  );
}
