import airForce from "../../assets/airforce.png";

export default function Header() {
  return (
    <div className="header">
      <img src={airForce} alt="NAF Logo" className="naf-logo" />
      <h2>NIGERIAN AIR FORCE ANNUAL PHYSICAL FITNESS TEST RESULT</h2>
    </div>
  );
}
