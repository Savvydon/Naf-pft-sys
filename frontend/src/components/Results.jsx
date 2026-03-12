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
    location.state || JSON.parse(sessionStorage.getItem("naf_pft_result"));

  useEffect(() => {
    if (!state) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  if (!state) return null;

  // ---------- GENERATE PDF ----------
  const generatePDF = async () => {
    const input = resultsRef.current;
    if (!input) return null;

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
    const pageCanvasHeight = (pageHeight - marginY * 2) / ratio;

    let renderedHeight = 0;

    while (renderedHeight < canvas.height) {
      const sliceHeight = Math.min(
        pageCanvasHeight,
        canvas.height - renderedHeight,
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
        sliceHeight,
      );

      pdf.addImage(
        tempCanvas.toDataURL("image/png"),
        "PNG",
        marginX,
        marginY,
        usableWidth,
        sliceHeight * ratio,
      );

      renderedHeight += sliceHeight;

      if (renderedHeight < canvas.height) {
        pdf.addPage();
      }
    }

    input.classList.remove("pdf-mode");

    return pdf;
  };

  // ---------- DOWNLOAD PDF ----------
  const downloadPDF = async () => {
    try {
      const pdf = await generatePDF();
      if (!pdf) return;

      pdf.save(`NAF_PFT_${state.svc_no || "RESULT"}.pdf`);
    } catch (e) {
      console.error("PDF download error:", e);
    }
  };

  // ---------- SEND EMAIL ----------
  const sendEmail = async () => {
    console.log("=== Send Email clicked ===");
    console.log("Sending to:", state.email);
    console.log("Service No:", state.svc_no);
    console.log("Name:", state.full_name);

    try {
      const pdf = await generatePDF();

      if (!pdf) throw new Error("Failed to generate PDF");

      const pdfBlob = pdf.output("blob");

      const formData = new FormData();
      formData.append("email", state.email);
      formData.append("file", pdfBlob, "NAF_PFT_Report.pdf");

      const res = await fetch("https://naf-pft-sys.onrender.com/send-report", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Server error:", errText);
        throw new Error("Email failed");
      }

      alert("Report sent successfully!");
    } catch (err) {
      console.error("Send email failed:", err);
      alert("Failed to send email.");
    }
  };

  // ---------- BACK HOME ----------
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
