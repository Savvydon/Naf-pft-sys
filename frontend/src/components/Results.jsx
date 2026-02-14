import { useLocation, useNavigate } from "react-router-dom";
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import Header from "./results/Header";
import PersonalInfo from "./results/PersonalInfo";
import StatusGroups from "./results/StatusGroups";
import ActionButtons from "./results/ActionButtons";


import "../styles/Results.css";

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const resultsRef = useRef(null);

  if (!state) {
    return <p>No result available</p>;
  }

  const downloadPDF = async () => {
    const input = resultsRef.current;
    if (!input) return;

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const canvas = await html2canvas(input, {
        scale: 3,
        dpi: 300,
        letterRendering: true,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 8;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`NAF_PFT_${state.svc_no || state.full_name?.replace(/\s+/g, "_") || "result"}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  

  const goToHome = () => {
    navigate("/");
  };

  return (
    <>
      <div className="results" ref={resultsRef}>
        <Header />
        <PersonalInfo state={state} />
        <StatusGroups state={state} />
      </div>

      <ActionButtons
        onDownload={downloadPDF}  
        onHome={goToHome}
      />
    </>
  );
}