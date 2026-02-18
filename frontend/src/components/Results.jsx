//importing libraries
import { useLocation, useNavigate } from "react-router-dom";
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// importing components
import Header from "./results/Header";
import PersonalInfo from "./results/PersonalInfo";
import StatusGroups from "./results/StatusGroups";
import ActionButtons from "./results/ActionButtons";
import OverallRecommendation from "./results/OverallRecommendation";

//importing stylesheet
import "../styles/Results.css";

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const resultsRef = useRef(null);

  if (!state) {
    return <p>No result available</p>;
  }
  //function for downloading the result page to pdf
  const downloadPDF = async () => {
    const input = resultsRef.current;
    if (!input) return;

    try {
      // force desktop layout
      input.classList.add("pdf-mode");
      //Allowing browser to reflow layout
      await new Promise((resolve) => setTimeout(resolve, 400));

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 924, // Force desktop width
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 15;
      const marginY = 15;

      const usableWidth = pageWidth - marginX * 2;
      const usableHeight = pageHeight - marginY * 2;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = usableWidth / imgWidth;
      const pageCanvasHeight = usableHeight / ratio;

      let renderedHeight = 0;

      while (renderedHeight < imgHeight) {
        const sourceY = renderedHeight;
        const sourceHeight = Math.min(
          pageCanvasHeight,
          imgHeight - renderedHeight,
        );

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = imgWidth;
        tempCanvas.height = sourceHeight;

        const ctx = tempCanvas.getContext("2d");
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          imgWidth,
          sourceHeight,
          0,
          0,
          imgWidth,
          sourceHeight,
        );

        const pageImage = tempCanvas.toDataURL("image/png");

        pdf.addImage(
          pageImage,
          "PNG",
          marginX,
          marginY,
          usableWidth,
          sourceHeight * ratio,
        );

        renderedHeight += sourceHeight;

        if (renderedHeight < imgHeight) {
          pdf.addPage();
        }
      }

      pdf.save(
        `NAF_PFT_${state.svc_no || state.full_name?.replace(/\s+/g, "_") || "result"}.pdf`,
      );
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  // This is your email function sir
  const sendEmail = async () => {
    try {
      const response = await fetch("http://localhost:8000/send-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: state.email,
          report_data: state,
        }),
      });

      if (!response.ok) throw new Error("Failed");

      alert("Report sent successfully!");
    } catch (err) {
      alert("Failed to send report.");
    }
  };
  // function for navigating to the form page
  const goToHome = () => {
    navigate("/");
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
