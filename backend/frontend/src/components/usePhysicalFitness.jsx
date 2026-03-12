// frontend/src/components/usePhysicalFitness.jsx
import { useState, useCallback } from "react";
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
    sex: "",
    date: "",
    height: "",
    weight: "",
    cardioCage: "",
    stepUp: "",
    pushUp: "",
    sitUp: "",
    chinUp: "",
    sitReach: "",
    evaluatorName: "",
    evaluatorRank: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    if (name === "svcNo") {
      let cleaned = value
        .trim()
        .replace(/\s+/g, "")
        .replace(/[^a-zA-Z0-9/]/gi, "")
        .toUpperCase();

      if (!cleaned.startsWith("NAF")) {
        cleaned = "NAF" + cleaned;
      }

      cleaned = cleaned.replace(/\/+/g, "/");

      setFormData((prev) => ({ ...prev, svcNo: cleaned }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const parseNumber = useCallback((val) => {
    if (val === "" || val == null) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (isSubmitting) return;
      setIsSubmitting(true);

      try {
        let svcNo = (formData.svcNo || "").trim();
        svcNo = svcNo.replace(/\/+$/, "");

        if (!svcNo.startsWith("NAF") || svcNo.length < 5) {
          alert(
            "Service Number must start with 'NAF' and be at least 5 characters.",
          );
          return;
        }

        const year = parseNumber(formData.year);
        if (!year || year < 2000 || year > 2100) {
          alert("Year must be between 2000 and 2100.");
          return;
        }

        // ── FIXED: encode the full svcNo including slash ──
        const encodedSvcNo = encodeURIComponent(svcNo);
        const checkUrl = `/api/exists/${encodedSvcNo}/${year}`;

        // console.log("Final svcNo:", svcNo);
        // console.log("Encoded svcNo:", encodedSvcNo);
        // console.log("Exists check URL:", checkUrl);

        const checkRes = await fetch(checkUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!checkRes.ok) {
          const errorText = await checkRes.text().catch(() => "No response");
          throw new Error(
            `Check failed (HTTP ${checkRes.status}) - ${errorText}`,
          );
        }

        const checkData = await checkRes.json();

        if (checkData.exists === true) {
          alert(`Record already exists for ${svcNo} in ${year}.`);
          return;
        }

        const payload = {
          year,
          full_name: (formData.fullName || "").trim(),
          rank: formData.rank || "",
          svc_no: svcNo,
          unit: (formData.unit || "").trim(),
          email: (formData.email || "").trim(),
          appointment: (formData.appointment || "").trim(),
          age: parseNumber(formData.age),
          sex: (formData.sex || "").toLowerCase(),
          date: formData.date || "",
          height: parseNumber(formData.height),
          weight: parseNumber(formData.weight),
          cardio_cage: parseNumber(formData.cardioCage),
          step_up: parseNumber(formData.stepUp) ?? 0,
          push_up: parseNumber(formData.pushUp) ?? 0,
          sit_up: parseNumber(formData.sitUp) ?? 0,
          chin_up: parseNumber(formData.chinUp) ?? 0,
          sit_reach: parseNumber(formData.sitReach) ?? 0,
          evaluator_name: (formData.evaluatorName || "").trim(),
          evaluator_rank: formData.evaluatorRank || "",
        };

        const result = await computeFitness(payload);

        sessionStorage.setItem("naf_pft_result", JSON.stringify(result));
        navigate("/results", { state: result });
      } catch (error) {
        alert(error.message || "Failed to submit. Check console for details.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, navigate, isSubmitting, parseNumber],
  );

  return {
    formData,
    handleChange,
    handleSubmit,
    ranks,
    isSubmitting,
  };
}
