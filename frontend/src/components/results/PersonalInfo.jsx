export default function PersonalInfo({ state }) {
  return (
    <>
      <p>
        <b>Year:</b> {state.year || "N/A"}
      </p>
      <p>
        <b>Full name:</b> {state.full_name || "N/A"}
      </p>
      <p>
        <b>Rank:</b> {state.rank || "N/A"}
      </p>
      <p>
        <b>Service No:</b> {state.svc_no || "N/A"}
      </p>
      <p>
        <b>Unit:</b> {state.unit || "N/A"}
      </p>
      <p>
        <b>Email:</b> {state.email || "NIL"}
      </p>
      <p>
        <b>Appointment:</b> {state.appointment || "N/A"}
      </p>
      <p>
        <b>Age:</b> {state.age || "N/A"}
      </p>
      <p>
        <b>Sex:</b> {state.sex || "N/A"}
      </p>
      <p>
        <b>Date:</b> {state.date || "N/A"}
      </p>
      <p>
        <b>Height:</b> {state.height || "N/A"}
      </p>
      <p>
        <b>Cardio Type:</b> {state.cardio_type || "N/A"}
      </p>
    </>
  );
}
