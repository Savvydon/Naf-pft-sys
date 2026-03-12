import { usePhysicalFitness } from "./usePhysicalFitness";
import { PhysicalFitnessForm } from "./PhysicalFitnessForm";
import airForce from "../assets/airforce.png";
import "../styles/PhysicalFitness.css";

export default function PhysicalFitness() {
  const { formData, handleChange, handleSubmit, ranks } = usePhysicalFitness();

  return (
    <div className="page">
      <div className="form-container">
        <div className="header">
          <img src={airForce} alt="NAF Logo" />
          <h1>
            NIGERIAN AIR FORCE ANNUAL PHYSICAL FITNESS TEST INTERPRETATION FORM
          </h1>
        </div>
        <PhysicalFitnessForm
          formData={formData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          ranks={ranks}
        />
        <p style={{ textAlign: "center" }}>
          &copy; {new Date().getFullYear()} Nigeria Air Force – Official Use
          Only
        </p>
      </div>
    </div>
  );
}
