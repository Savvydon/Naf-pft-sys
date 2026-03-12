import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { getPersonnelById, deletePersonnel } from "../services/adminApi";
import Header from "../../components/results/Header";
import PersonalInfo from "../../components/results/PersonalInfo";
import StatusGroups from "../../components/results/StatusGroups";
import OverallRecommendation from "../../components/results/OverallRecommendation";

export default function PersonnelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref to capture the result section for PDF
  const resultsRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getPersonnelById(id);
        setPerson(data);
      } catch (err) {
        setError(err.message || "Failed to load record");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this record permanently?")) return;

    try {
      await deletePersonnel(id);
      navigate("/admin/personnel");
    } catch (err) {
      alert("Delete failed: " + (err.message || "Unknown error"));
    }
  };

  // Generate and download PDF
  const downloadPDF = async () => {
    const input = resultsRef.current;
    if (!input) {
      alert("No content to capture");
      return;
    }

    try {
      // Optional: add class to hide admin buttons in PDF
      input.classList.add("pdf-mode");

      await new Promise((resolve) => setTimeout(resolve, 300)); // wait for render

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
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
        if (renderedHeight < canvas.height) pdf.addPage();
      }

      pdf.save(
        `NAF_PFT_${person.svc_no || "RESULT"}_${person.year || "Unknown"}.pdf`,
      );

      input.classList.remove("pdf-mode");
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // Send email report
  const sendEmail = async () => {
    if (!person?.email) {
      alert("No email address found for this record.");
      return;
    }

    try {
      const res = await fetch("https://naf-pft-sys.onrender.com/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: person.email,
          report_data: person,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Email sending failed");
      }

      alert("Report sent successfully to " + person.email);
    } catch (err) {
      alert("Failed to send email: " + (err.message || "Unknown error"));
    }
  };

  if (loading) return <p className="loading-text">Loading record...</p>;
  if (error) return <p className="error">Error: {error}</p>;
  if (!person) return <p className="not-found">Record not found</p>;

  return (
    <div className="admin-container">
      {/* <h2>Personnel Details – {person.full_name || "Unnamed"}</h2> */}

      {/* The part we want to capture as PDF */}
      <div ref={resultsRef} className="result-view-section">
        {/* <h3 className="result-title">Physical Fitness Test Result</h3> */}

        <Header /* add props if needed */ />
        <PersonalInfo state={person} />
        <StatusGroups state={person} />
        <OverallRecommendation state={person} />
      </div>

      {/* Admin + extra actions */}
      <div className="actions">
        <button
          className="back-btn"
          onClick={() => navigate("/admin/personnel")}
        >
          Back to List
        </button>
        <button
          className="edit-btn"
          onClick={() => navigate(`/admin/personnel/${id}/edit`)}
        >
          Edit Record
        </button>
        <button className="delete-btn" onClick={handleDelete}>
          Delete Record
        </button>
        <button className="btn pdf-btn" onClick={downloadPDF}>
          Download as PDF
        </button>
        <button className="btn email-btn" onClick={sendEmail}>
          Send to Email
        </button>
      </div>
    </div>
  );
}
