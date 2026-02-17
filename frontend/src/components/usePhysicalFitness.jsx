import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { computeFitness } from "../services/api";

export function usePhysicalFitness() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    year: "",
    fullName: "",
    rank: "",
    svcNo: "NAF",
    unit: "",
    email: "",
    appointment: "",
    age: "",
    sex: "male",
    date: "",
    height: "",
    weight: "",
    cardioMinutes: "",
    cardioSeconds: "",
    stepUp: "",
    pushUp: "",
    sitUp: "",
    chinUp: "",
    sitReach: "",
    evaluatorName: "",
    evaluatorRank: "",
  });

  const ranks = [
    "Air Man",
    "Air Woman",
    "Lance Corporal",
    "Corporal",
    "Sergeant",
    "Flight Sergeant",
    "Warrant Officer",
    "Master Warrant Officer",
    "Air Warrant Officer",
    "Flying Officer",
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "svcNo") {
      const cleaned = value.replace(/\s/g, "").replace(/[^a-zA-Z0-9]/g, "");
      const formatted = cleaned.startsWith("NAF") ? cleaned : `NAF${cleaned}`;
      return setFormData((prev) => ({ ...prev, svcNo: formatted }));
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      year: formData.year,
      full_name: formData.fullName,
      rank: formData.rank,
      svc_no: formData.svcNo,
      unit: formData.unit,
      email: formData.email,
      appointment: formData.appointment,
      age: Number(formData.age),
      sex: formData.sex?.toLowerCase() || "male",
      date: new Date(formData.date).toISOString().split("T")[0],
      height: Number(formData.height),
      weight: Number(formData.weight),
      cardio_minutes: Number(formData.cardioMinutes),
      cardio_seconds: Number(formData.cardioSeconds),
      step_up: Number(formData.stepUp),
      push_up: Number(formData.pushUp),
      sit_up: Number(formData.sitUp),
      chin_up: Number(formData.chinUp),
      sit_reach: Number(formData.sitReach),
      evaluator_name: formData.evaluatorName,
      evaluator_rank: formData.evaluatorRank,
    };

    const result = await computeFitness(payload);
    navigate("/results", { state: result });
  };

  return { formData, handleChange, handleSubmit, ranks };
}
