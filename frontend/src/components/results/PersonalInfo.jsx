export default function PersonalInfo({ state }) {
  return (
    <div className="personal-info">
      <p>
        <b>Year:</b> {state.year || "NIL"}
      </p>
      <p>
        <b>Full name:</b> {state.full_name || "NIL"}
      </p>
      <p>
        <b>Rank:</b> {state.rank || "NIL"}
      </p>
      <p>
        <b>Service No:</b> {state.svc_no || "ILA"}
      </p>
      <p>
        <b>Unit:</b> {state.unit || "NIL"}
      </p>
      <p>
        <b>Email:</b> {state.email || "NIL"}
      </p>
      <p>
        <b>Appointment:</b> {state.appointment || "NIL"}
      </p>
      <p>
        <b>Age:</b> {state.age || "NIL"}
      </p>
      <p>
        <b>Sex:</b> {state.sex || "NIL"}
      </p>
      <p>
        <b>Date:</b> {state.date || "NIL"}
      </p>
      <p>
        <b>Height:</b> {state.height || "N/A"}
      </p>
      <p>
        <b>Cardio Type:</b> {state.cardio_type || "NIL"}
      </p>
    </div>
  );
}
