export default function StatusGroups({ state }) {
  return (
    <>
      <h3>Body weight Status</h3>
      <div className="personal-info">
        <p>
          <b>Current Weight:</b> {state.weight_current || "NIL"}
        </p>
        <p>
          <b>Ideal Weight:</b> {state.weight_ideal || "NIL"}
        </p>
        <p>
          <b>Excess Weight:</b> {state.weight_excess}
        </p>
        <p>
          <b>Weight deficit:</b> {state.weight_deficit || "NIL"}
        </p>
        <p>
          <b>Weight status:</b> {state.weight_status || "NIL"}
        </p>
      </div>

      <h3>Body Mass Index Status</h3>
      <div className="personal-info">
        <p>
          <b>Current BMI:</b> {state.bmi_current || "NIL"}
        </p>
        <p>
          <b>Ideal BMI:</b> {"18 - 24.9"}
        </p>
        <p>
          <b>Excess BMI:</b> {state.bmi_excess}
        </p>
        <p>
          <b>BMI deficit:</b> {state.bmi_deficit || "NIL"}
        </p>
        <p>
          <b>BMI status:</b> {state.bmi_status || "NIL"}
        </p>
      </div>

      <h3>Cardiovascular Endurance Status</h3>
      <div className="personal-info">
        <p>
          <b>Time Taken:</b> {state.cardio_time || "NIL"}
        </p>
        <p>
          <b>Ideal Time:</b> {state.cardio_ideal || "NIL"}
        </p>
        <p>
          <b>Cardio status:</b> {state.cardio_status || "NIL"}
        </p>
      </div>

      <h3>Cardiovascular Endurance (step-up) Status</h3>
      <div className="personal-info">
        <p>
          <b>Numbers of step-ups:</b> {state.step_up_value || "NIL"}
        </p>
        <p>
          <b>Ideal step-up:</b> {state.step_up_ideal || "NIL"}
        </p>
        <p>
          <b>Optimum step-up:</b> {state.step_up_optimum || "NIL"}
        </p>
        <p>
          <b>Step-up Status:</b> {state.step_up_status || "NIL"}
        </p>
      </div>

      <h3>Muscular Strength (Push-Up) Status</h3>
      <div className="personal-info">
        <p>
          <b>Numbers of Push-up:</b> {state.push_up_value || "NIL"}
        </p>
        <p>
          <b>Ideal Push-up:</b> {state.push_up_ideal || "NIL"}
        </p>
        <p>
          <b>Shortfall:</b> {state.push_up_shortfall || "NIL"}
        </p>
        <p>
          <b>Status:</b> {state.push_up_status || "NIL"}
        </p>
      </div>

      <h3>Muscular Endurance (Sit-Up) Status</h3>
      <div className="personal-info">
        <p>
          <b>Numbers of sit-up:</b> {state.sit_up_value || "NIL"}
        </p>
        <p>
          <b>Ideal sit-up:</b> {state.sit_up_ideal || "NIL"}
        </p>
        <p>
          <b>Excess sit-up:</b> {state.sit_up_excess || "NIL"}
        </p>
        <p>
          <b>Sit-up status:</b> {state.sit_up_status || "NIL"}
        </p>
      </div>

      <h3>Muscular Endurance 2 (Chin-Up) Status</h3>
      <div className="personal-info">
        <p>
          <b>Numbers of chin-up:</b> {state.chin_up_value || "NIL"}
        </p>
        <p>
          <b>Ideal chin-up:</b> {state.chin_up_ideal || "NIL"}
        </p>
        <p>
          <b>Chin-up deficit:</b> {state.chin_up_deficit || "NIL"}
        </p>
        <p>
          <b>Chin-up status:</b> {state.chin_up_status || "NIL"}
        </p>
      </div>

      <h3>Sit and Reach (Flexibility) Status</h3>
      <div className="personal-info">
        <p>
          <b>Numbers of sit and reach:</b> {state.sit_reach_value || "NIL"}
        </p>
        <p>
          <b>Ideal sit and reach:</b> {state.sit_reach_ideal || "NIL"}
        </p>
        <p>
          <b>Sit and reach deficit:</b> {state.sit_reach_deficit || "NIL"}
        </p>
        <p>
          <b>Sit and reach status:</b> {state.sit_reach_status || "NIL"}
        </p>
      </div>

      <h3>Performance and Remarks</h3>
      <div className="personal-info">
        <p>
          <b>Aggregate:</b> {state.aggregate || "NIL"}
        </p>
        <p>
          <b>Performance Remark:</b> {state.grade || "NIL"}
        </p>
      </div>

      <h3>Prescription</h3>
      <p>
        <b>Recommended duration:</b> {state.prescription_duration || "NIL"}
      </p>
      <p>
        <b>Recommended numbers of days:</b> {state.prescription_days || "NIL"}
      </p>
      <p>
        <b>Recommended activities:</b> {state.recommended_activity || "NIL"}
      </p>
    </>
  );
}
