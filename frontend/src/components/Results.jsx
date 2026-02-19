// importing libraries
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

// importing stylesheet
import "../styles/Results.css";

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultsRef = useRef(null);

  // ✅ Restore data after refresh
  const state =
    location.state || JSON.parse(sessionStorage.getItem("naf_pft_result"));

  if (!state) {
    return <p>No result available</p>;
  }

  // Function for downloading pdf
  const downloadPDF = async () => {
    const input = resultsRef.current;
    if (!input) return;

    try {
      // Force desktop layout for PDF
      input.classList.add("pdf-mode");
      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 924, // force desktop width
      });

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginX = 15;
      const marginY = 20;

      const usableWidth = pageWidth - marginX * 2;
      const usableHeight = pageHeight - marginY * 2;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = usableWidth / imgWidth;
      const pageCanvasHeight = usableHeight / ratio;

      // Header & Footer
      const addHeaderFooter = () => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(150, 0, 0);

        pdf.text("RESTRICTED", pageWidth / 2, 10, { align: "center" });
        pdf.text("RESTRICTED", pageWidth / 2, pageHeight - 8, {
          align: "center",
        });
      };

      let renderedHeight = 0;

      while (renderedHeight < imgHeight) {
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
          renderedHeight,
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

        addHeaderFooter();
        renderedHeight += sourceHeight;

        if (renderedHeight < imgHeight) {
          pdf.addPage();
        }
      }

      pdf.save(
        `NAF_PFT_${
          state.svc_no || state.full_name?.replace(/\s+/g, "_") || "result"
        }.pdf`,
      );

      input.classList.remove("pdf-mode");
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  // Your email code sir
  const sendEmail = async () => {
    try {
      const response = await fetch(
        "https://naf-pft-sys.onrender.com/send-report",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: state.email,
            report_data: state,
          }),
        },
      );

      if (!response.ok) throw new Error();
      alert("Report sent successfully!");
    } catch {
      alert("Failed to send report.");
    }
  };

  // ===================== NAVIGATING TO HOME PAGE =====================
  const goToHome = () => {
    sessionStorage.removeItem("naf_pft_result");
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
