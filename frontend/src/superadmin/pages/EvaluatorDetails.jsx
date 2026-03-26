import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import Header from "../../components/results/Header";
import PersonalInfo from "../../components/results/PersonalInfo";
import StatusGroups from "../../components/results/StatusGroups";
import OverallRecommendation from "../../components/results/OverallRecommendation";

// import "../../styles/Results.css";
// import "../styles/Admin.css";

import "../../superadmin/styles/superadmin.css";

const API_BASE = "https://naf-pft-sys-1.onrender.com";

export default function PersonnelDetails({ fromSuperAdmin = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if coming from super admin based on URL or prop
  const isSuperAdmin =
    fromSuperAdmin || location.pathname.includes("/superadmin/");

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Ref to capture the result section for PDF
  const resultsRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);

      const endpoint = isSuperAdmin
        ? `${API_BASE}/superadmin/pft-results/${id}`
        : `${API_BASE}/api/pft-results/${id}`;

      console.log("[DETAILS] Fetching from:", endpoint);
      console.log("[DETAILS] isSuperAdmin:", isSuperAdmin);

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
      console.log("[DETAILS] Email field:", data.email); // DEBUG: Check if email exists
      setPerson(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we have state from navigation (after edit)
    if (location.state && location.state.id) {
      console.log("[DETAILS] Using state from navigation:", location.state);
      setPerson(location.state);
      setLoading(false);
    } else {
      // Otherwise fetch from API
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

      // Navigate back to appropriate list
      if (isSuperAdmin) {
        navigate("/superadmin/pft-results");
      } else {
        navigate("/admin/personnel");
      }
    } catch (err) {
      alert("Delete failed: " + (err.message || "Unknown error"));
    }
  };

  // ---------- GENERATE PDF - REDUCED SIZE FOR EMAIL ----------
  const generatePDF = async (forEmail = false) => {
    const input = resultsRef.current;
    if (!input) return null;

    input.classList.add("pdf-mode");
    await new Promise((r) => setTimeout(r, 300));

    // Use much lower scale for email to keep size under 5MB
    const scale = forEmail ? 0.8 : 1.5;

    const canvas = await html2canvas(input, {
      scale: scale,
      backgroundColor: "#ffffff",
      windowWidth: 924,
      imageTimeout: 0,
      useCORS: true,
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

      // Use JPEG with lower quality for smaller file size
      const imgData = tempCanvas.toDataURL("image/jpeg", forEmail ? 0.6 : 0.9);

      pdf.addImage(
        imgData,
        "JPEG",
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

  // ---------- DOWNLOAD PDF - HIGH QUALITY ----------
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

  // ---------- SEND EMAIL - WITH PDF ATTACHMENT ----------
  const sendEmail = async () => {
    if (isSending) return;

    // DEBUG: Check if email exists
    console.log("[EMAIL DEBUG] Person object:", person);
    console.log("[EMAIL DEBUG] Email field:", person?.email);

    if (!person?.email) {
      alert("No email address found for this record. Email field is missing.");
      return;
    }

    setIsSending(true);

    try {
      console.log("=== Admin/Super Admin Send Email clicked ===");
      console.log("Sending to:", person.email);
      console.log("Is Super Admin:", isSuperAdmin);

      // Generate LOW QUALITY PDF for email
      const pdf = await generatePDF(true);
      if (!pdf) throw new Error("Failed to generate PDF");

      const pdfBlob = pdf.output("blob");

      console.log("PDF Blob size:", pdfBlob.size, "bytes");

      // Check size limit
      if (pdfBlob.size > 4.5 * 1024 * 1024) {
        alert("PDF is too large for email. Please download and send manually.");
        setIsSending(false);
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append("email", person.email);
      formData.append("file", pdfBlob, "NAF_PFT_Report.pdf");

      const res = await fetch(`${API_BASE}/send-report-pdf`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      console.log("[EMAIL DEBUG] Response status:", res.status);

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

  // Handle back navigation based on user type
  const handleBack = () => {
    if (isSuperAdmin) {
      navigate("/superadmin/pft-results");
    } else {
      navigate("/admin/personnel");
    }
  };

  // Handle edit navigation based on user type
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
      {/* The part we want to capture as PDF */}
      <div ref={resultsRef} className="results">
        <Header />
        <PersonalInfo state={person} />
        <StatusGroups state={person} />
        <OverallRecommendation state={person} />
      </div>

      {/* Admin + extra actions */}
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

// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import "../styles/superadmin.css";

// export default function EvaluatorDetails() {
//   const { id } = useParams();
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();
//   const token = localStorage.getItem("pft_token");

//   useEffect(() => {
//     fetchDetails();
//   }, [id]);

//   const fetchDetails = async () => {
//     try {
//       const res = await fetch(`https://naf-pft-sys-1.onrender.com/superadmin/evaluators/${id}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       if (!res.ok) throw new Error("Failed to fetch evaluator details");

//       const result = await res.json();
//       setData(result);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div className="loading">Loading...</div>;
//   if (error) return <div className="error">Error: {error}</div>;
//   if (!data) return <div className="not-found">Evaluator not found</div>;

//   return (
//     <div className="superadmin-container">
//       <h2>Evaluator Details</h2>

//       <div className="details-card">
//         <h3>{data.evaluator.full_name}</h3>
//         <p><strong>Service Number:</strong> {data.evaluator.svc_no}</p>
//         <p><strong>Rank:</strong> {data.evaluator.rank}</p>
//         <p><strong>Total Evaluations:</strong> {data.evaluations_count}</p>
//       </div>

//       <h3>Evaluation History</h3>
//       {data.evaluations.length === 0 ? (
//         <p>No evaluations recorded yet.</p>
//       ) : (
//         <table className="data-table">
//           <thead>
//             <tr>
//               <th>Service No</th>
//               <th>Name</th>
//               <th>Year</th>
//               <th>Grade</th>
//               <th>Date</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.evaluations.map((eval_item) => (
//               <tr key={eval_item.id}>
//                 <td>{eval_item.svc_no}</td>
//                 <td>{eval_item.full_name}</td>
//                 <td>{eval_item.year}</td>
//                 <td>{eval_item.grade}</td>
//                 <td>{new Date(eval_item.created_at).toLocaleDateString()}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}

//       <button onClick={() => navigate("/superadmin/evaluators")} className="back-btn">
//         ← Back to Evaluators
//       </button>
//     </div>
//   );
// }
