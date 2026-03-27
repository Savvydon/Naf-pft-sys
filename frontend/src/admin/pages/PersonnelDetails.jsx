import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import Header from "../../components/results/Header";
import PersonalInfo from "../../components/results/PersonalInfo";
import StatusGroups from "../../components/results/StatusGroups";
import OverallRecommendation from "../../components/results/OverallRecommendation";

import "../../styles/Results.css";
import "../styles/Admin.css";

const API_BASE = "https://naf-pft-sys-1.onrender.com";

export default function PersonnelDetails({ fromSuperAdmin = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin =
    fromSuperAdmin || location.pathname.includes("/superadmin/");

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const resultsRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const endpoint = isSuperAdmin
        ? `${API_BASE}/superadmin/pft-results/${id}`
        : `${API_BASE}/api/pft-results/${id}`;

      const response = await fetch(endpoint, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load record: ${response.status}`);
      }

      const data = await response.json();
      console.log("[DETAILS] Loaded record:", data);
      setPerson(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state && location.state.id) {
      console.log("[DETAILS] Using state from navigation:", location.state);
      setPerson(location.state);
      setLoading(false);
    } else {
      loadData();
    }
  }, [id, isSuperAdmin, location.state]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this record permanently?")) return;

    try {
      const endpoint = isSuperAdmin
        ? `${API_BASE}/superadmin/pft-results/${id}`
        : `${API_BASE}/api/pft-results/${id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      if (isSuperAdmin) {
        navigate("/superadmin/pft-results");
      } else {
        navigate("/admin/personnel");
      }
    } catch (err) {
      alert("Delete failed: " + (err.message || "Unknown error"));
    }
  };

  // ---------- GENERATE PDF - EXACT WIDTH MATCH ----------
  const generatePDF = async (forEmail = false) => {
    const input = resultsRef.current;
    if (!input) return null;

    // Save original styles
    const originalStyles = {
      position: input.style.position,
      top: input.style.top,
      left: input.style.left,
      width: input.style.width,
      maxWidth: input.style.maxWidth,
      margin: input.style.margin,
      transform: input.style.transform,
    };

    // Fix: Set exact width to match webpage (A4 width in pixels at 96 DPI)
    const A4_WIDTH_MM = 210;
    const MM_TO_PX = 3.779527559;
    const targetWidthPx = Math.floor(A4_WIDTH_MM * MM_TO_PX); // ~794px

    // Reset and set fixed width
    input.style.position = "relative";
    input.style.top = "0";
    input.style.left = "0";
    input.style.margin = "0";
    input.style.transform = "none";
    input.style.width = targetWidthPx + "px";
    input.style.maxWidth = targetWidthPx + "px";

    input.classList.add("pdf-mode");

    // Wait for layout to settle
    await new Promise((r) => setTimeout(r, 600));

    try {
      // Capture at exact width
      const canvas = await html2canvas(input, {
        scale: forEmail ? 1.2 : 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: targetWidthPx,
        windowWidth: targetWidthPx,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: -window.scrollY,
      });

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Small margins
      const marginX = 5;
      const marginY = 5;
      const usableWidth = pageWidth - marginX * 2;
      const usableHeight = pageHeight - marginY * 2;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate exact ratio to fit width perfectly
      const pdfImgWidth = usableWidth;
      const pdfImgHeight = (imgHeight * usableWidth) / imgWidth;

      // If content fits on one page
      if (pdfImgHeight <= usableHeight) {
        const imgData = canvas.toDataURL("image/jpeg", forEmail ? 0.7 : 0.9);
        pdf.addImage(
          imgData,
          "JPEG",
          marginX,
          marginY,
          pdfImgWidth,
          pdfImgHeight,
        );
      } else {
        // Multi-page with exact width preservation
        let positionY = marginY;
        let sourceY = 0;
        const pageHeightPx = (usableHeight * imgWidth) / pdfImgWidth;

        while (sourceY < imgHeight) {
          if (sourceY > 0) {
            pdf.addPage();
            positionY = marginY;
          }

          const sliceHeight = Math.min(pageHeightPx, imgHeight - sourceY);
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = imgWidth;
          tempCanvas.height = sliceHeight;

          const ctx = tempCanvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            imgWidth,
            sliceHeight,
            0,
            0,
            imgWidth,
            sliceHeight,
          );

          const imgData = tempCanvas.toDataURL(
            "image/jpeg",
            forEmail ? 0.7 : 0.9,
          );
          const slicePdfHeight = (sliceHeight * pdfImgWidth) / imgWidth;

          pdf.addImage(
            imgData,
            "JPEG",
            marginX,
            positionY,
            pdfImgWidth,
            slicePdfHeight,
          );

          sourceY += sliceHeight;
        }
      }

      return pdf;
    } finally {
      // Restore original styles
      Object.assign(input.style, originalStyles);
      input.classList.remove("pdf-mode");
    }
  };

  // ---------- DOWNLOAD PDF ----------
  const downloadPDF = async () => {
    try {
      const pdf = await generatePDF(false);
      if (!pdf) return;
      pdf.save(
        `NAF_PFT_${person.svc_no || "RESULT"}_${person.year || "Unknown"}.pdf`,
      );
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // ---------- SEND EMAIL ----------
  const sendEmail = async () => {
    if (isSending) return;

    if (!person?.email) {
      alert("No email address found for this record.");
      return;
    }

    setIsSending(true);

    try {
      console.log("=== Admin/Super Admin Send Email clicked ===");
      console.log("Sending to:", person.email);
      console.log("Personnel name:", person.full_name);

      const pdf = await generatePDF(true);
      if (!pdf) throw new Error("Failed to generate PDF");

      const pdfBlob = pdf.output("blob");

      console.log("PDF Blob size:", pdfBlob.size, "bytes");

      if (pdfBlob.size > 4.5 * 1024 * 1024) {
        alert("PDF is too large for email. Please download and send manually.");
        setIsSending(false);
        return;
      }

      const formData = new FormData();
      formData.append("email", person.email);
      formData.append("file", pdfBlob, "NAF_PFT_Report.pdf");
      formData.append("personnel_name", person.full_name || "");

      const res = await fetch(`${API_BASE}/send-report-pdf`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errText = errData.detail || (await res.text());
        console.error("Server error:", res.status, errText);
        throw new Error(`Server error: ${res.status} - ${errText}`);
      }

      const data = await res.json();
      console.log("Email sent successfully:", data);
      alert("Report sent successfully to " + person.email);
    } catch (err) {
      console.error("Send email failed:", err);
      alert("Failed to send email: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    if (isSuperAdmin) {
      navigate("/superadmin/pft-results");
    } else {
      navigate("/admin/personnel");
    }
  };

  const handleEdit = () => {
    if (isSuperAdmin) {
      navigate(`/superadmin/pft-results/${id}/edit`);
    } else {
      navigate(`/admin/personnel/${id}/edit`);
    }
  };

  if (loading) return <p className="loading-text">Loading record...</p>;
  if (error) return <p className="error">Error: {error}</p>;
  if (!person) return <p className="not-found">Record not found</p>;

  return (
    <div className="admin-container">
      <div ref={resultsRef} className="results">
        <Header />
        <PersonalInfo state={person} />
        <StatusGroups state={person} />
        <OverallRecommendation state={person} />
      </div>

      <div className="admin-actions-container">
        <button className="back-btn" onClick={handleBack}>
          ← Back to List
        </button>
        <button className="edit-btn" onClick={handleEdit}>
          Edit Record
        </button>
        <button className="delete-btn" onClick={handleDelete}>
          Delete Record
        </button>
        <button className="btn pdf-btn" onClick={downloadPDF}>
          Download as PDF
        </button>
        <button
          className="btn email-btn"
          onClick={sendEmail}
          disabled={isSending}
        >
          {isSending ? "Sending..." : "Send to Email"}
        </button>
      </div>
    </div>
  );
}
