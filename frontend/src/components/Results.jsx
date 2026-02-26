// importing libraries
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import Header from "./results/Header";
import PersonalInfo from "./results/PersonalInfo";
import StatusGroups from "./results/StatusGroups";
import ActionButtons from "./results/ActionButtons";
import OverallRecommendation from "./results/OverallRecommendation";

import "../styles/Results.css";

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultsRef = useRef(null);

  const state =
    location.state ||
    JSON.parse(sessionStorage.getItem("naf_pft_result"));

  // ✅ Redirect to home on refresh
  useEffect(() => {
    if (!state) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  if (!state) return null;

  const downloadPDF = async () => {
    const input = resultsRef.current;
    if (!input) return;

    try {
      input.classList.add("pdf-mode");
      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(input, {
        scale: 2,
        backgroundColor: "#ffffff",
        windowWidth: 924,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 15;
      const marginY = 20;
      const usableWidth = pageWidth - marginX * 2;
      const ratio = usableWidth / canvas.width;
      const pageCanvasHeight =
        (pageHeight - marginY * 2) / ratio;

      let renderedHeight = 0;

      while (renderedHeight < canvas.height) {
        const sliceHeight = Math.min(
          pageCanvasHeight,
          canvas.height - renderedHeight
        );

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = sliceHeight;

        const ctx = tempCanvas.getContext("2d");
        ctx.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        pdf.addImage(
          tempCanvas.toDataURL("image/png"),
          "PNG",
          marginX,
          marginY,
          usableWidth,
          sliceHeight * ratio
        );

        renderedHeight += sliceHeight;
        if (renderedHeight < canvas.height) pdf.addPage();
      }

      pdf.save(
        `NAF_PFT_${state.svc_no || "RESULT"}.pdf`
      );

      input.classList.remove("pdf-mode");
    } catch (e) {
      console.error(e);
    }
  };
//This is your email function sir
  const sendEmail = async () => {
    try {
      const response = await fetch(
        // "https://naf-pft-sys.onrender.com/send-report",
        "https://localost:8000/send"
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: state.email,
            report_data: state,
          }),
        }
      );
      if (!response.ok) throw new error ("Failed");
      alert("Report sent successfully!");
    } catch (err){
      alert("Failed to send report.");
    }
  };
//Function to navigatee to home
  const goToHome = () => {
    sessionStorage.removeItem("naf_pft_result");
    navigate("/", { replace: true });
  };

  return (
    <>
      <div className="results" ref={resultsRef}>
        <Header />
        <PersonalInfo state={state} />
        <StatusGroups state={state} />
        <OverallRecommendation state={state} />
      </div>

      <ActionButtons
        onDownload={downloadPDF}
        onHome={goToHome}
        sendMail={sendEmail}
      />
    </>
  );
}