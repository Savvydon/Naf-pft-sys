import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import "../styles/Results.css";

export default function ResultButtons() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultsRef = useRef(null);

  // Safely restore state
  const stored = sessionStorage.getItem("naf_pft_result");
  const state = location.state || (stored ? JSON.parse(stored) : null);

  // Redirect if no result data
  useEffect(() => {
    if (!state) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  if (!state) return null;

  // ---------------- PDF DOWNLOAD ----------------
  const downloadPDF = async () => {
    const input = resultsRef.current;
    if (!input) return;

    try {
      input.classList.add("pdf-mode");

      // Allow styles to update
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

      // Make filename safe (remove /)
      const safeSvcNo = (state.svc_no || "RESULT").replace(/\//g, "-");

      pdf.save(`NAF_PFT_${safeSvcNo}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF.");
    } finally {
      input.classList.remove("pdf-mode");
    }
  };

  // ---------------- SEND EMAIL ----------------
  const sendEmail = async () => {
    try {
      const res = await fetch("https://naf-pft-sys.onrender.com/send-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: state.email,
          report_data: state,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Email failed");
      }

      alert("Report sent successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to send report.");
    }
  };

  // ---------------- BACK TO HOME ----------------
  const goToHome = () => {
    sessionStorage.removeItem("naf_pft_result");
    navigate("/", { replace: true });
  };

  return (
    <div className="result-buttons-container" ref={resultsRef}>
      <div className="result-buttons">
        <button onClick={downloadPDF} className="btn-download">
          Download PDF
        </button>

        <button onClick={sendEmail} className="btn-email">
          Send Email
        </button>

        <button onClick={goToHome} className="btn-home">
          Back to Home
        </button>
      </div>
    </div>
  );
}
