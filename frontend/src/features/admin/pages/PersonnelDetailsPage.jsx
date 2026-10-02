import { API_BASE } from "../../../config/env.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "../../evaluator/components/results/ResultsHeader.jsx";
import PersonalInfo from "../../evaluator/components/results/PersonalInfo.jsx";
import StatusGroups from "../../evaluator/components/results/StatusGroups.jsx";
import OverallRecommendation from "../../evaluator/components/results/OverallRecommendation.jsx";
import { getPersonnelRecord } from "../services/adminApi.js";
import "../../../styles/Results.css";
import "../styles/Admin.css";

export default function PersonnelDetailsPage({ fromSuperAdmin = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = fromSuperAdmin || location.pathname.includes("/superadmin/");

  const [record, setRecord] = useState(null);
  const [selectedId, setSelectedId] = useState(Number(id));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const resultsRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const endpoint = isSuperAdmin
        ? `${API_BASE}/superadmin/personnel-record/${id}`
        : `${API_BASE}/api/personnel-record/${id}`;
      const response = await fetch(endpoint, { credentials: "include" });
      if (!response.ok) throw new Error(`Failed to load personnel record: ${response.status}`);
      const data = await response.json();
      setRecord(data);
      const requested = data.evaluations?.find((e) => e.id === Number(id));
      setSelectedId(requested ? Number(id) : data.evaluations?.[0]?.id);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load personnel record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id, isSuperAdmin]);

  const selected = useMemo(
    () => record?.evaluations?.find((e) => e.id === selectedId) || record?.evaluations?.[0],
    [record, selectedId],
  );

  const returnTo = location.state?.returnTo || (isSuperAdmin ? "/superadmin/pft-results" : "/admin/personnel");

  const generatePDF = async (forEmail = false) => {
    const input = resultsRef.current;
    if (!input) return null;
    const original = {
      position: input.style.position, top: input.style.top, left: input.style.left,
      width: input.style.width, maxWidth: input.style.maxWidth, minWidth: input.style.minWidth,
      margin: input.style.margin, transform: input.style.transform,
    };
    const width = 900;
    input.style.position = "absolute";
    input.style.top = "0";
    input.style.left = "0";
    input.style.margin = "0";
    input.style.transform = "none";
    input.style.width = `${width}px`;
    input.style.maxWidth = `${width}px`;
    input.style.minWidth = `${width}px`;
    input.classList.add("pdf-mode");
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const canvas = await html2canvas(input, {
        scale: forEmail ? 2 : 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        width,
        windowWidth: width,
        x: 0, y: 0, scrollX: 0, scrollY: 0,
      });
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const marginX = 5;
      const marginY = 2;
      const usableWidth = pageWidth - marginX * 2;
      const usableHeight = pageHeight - marginY * 2;
      const pdfHeight = (canvas.height * usableWidth) / canvas.width;
      const image = canvas.toDataURL("image/jpeg", forEmail ? 0.85 : 0.95);
      if (pdfHeight <= usableHeight) {
        pdf.addImage(image, "JPEG", marginX, marginY, usableWidth, pdfHeight);
      } else {
        const sourcePageHeight = (usableHeight * canvas.width) / usableWidth;
        let sourceY = 0;
        while (sourceY < canvas.height) {
          if (sourceY > 0) pdf.addPage();
          const sliceHeight = Math.min(sourcePageHeight, canvas.height - sourceY);
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = sliceHeight;
          const ctx = slice.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, slice.width, slice.height);
          ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
          const sliceImage = slice.toDataURL("image/jpeg", forEmail ? 0.85 : 0.95);
          const slicePdfHeight = (sliceHeight * usableWidth) / canvas.width;
          pdf.addImage(sliceImage, "JPEG", marginX, marginY, usableWidth, slicePdfHeight);
          sourceY += sliceHeight;
        }
      }
      return pdf;
    } finally {
      Object.assign(input.style, original);
      input.classList.remove("pdf-mode");
    }
  };

  const downloadPDF = async () => {
    try {
      const pdf = await generatePDF(false);
      if (pdf) pdf.save(`NAF_PFT_${selected?.svc_no || "RESULT"}_${selected?.year || "Unknown"}.pdf`);
    } catch (err) {
      alert(`Failed to generate PDF: ${err.message}`);
    }
  };

  const sendEmail = async () => {
    if (!selected?.email) return alert("No email address is available for this personnel record.");
    if (isSending) return;
    setIsSending(true);
    try {
      const pdf = await generatePDF(true);
      const blob = pdf.output("blob");
      if (blob.size > 4.5 * 1024 * 1024) throw new Error("PDF is too large for email. Please download it and send it manually.");
      const formData = new FormData();
      formData.append("email", selected.email);
      formData.append("file", blob, "NAF_PFT_Report.pdf");
      formData.append("personnel_name", selected.full_name || "");
      const response = await fetch(`${API_BASE}/send-report-pdf`, { method: "POST", credentials: "include", body: formData });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Server error: ${response.status}`);
      }
      alert(`Report sent successfully to ${selected.email}`);
    } catch (err) {
      alert(`Failed to send email: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const openCertificate = () => {
    const base = isSuperAdmin ? "/superadmin/pft-results" : "/admin/personnel";
    navigate(`${base}/${selected.id}/certificate`, { state: { returnTo: location.pathname + location.search } });
  };

  const editEvaluation = () => {
    const base = isSuperAdmin ? "/superadmin/pft-results" : "/admin/personnel";
    navigate(`${base}/${selected.id}/edit`, { state: { returnTo: location.pathname + location.search } });
  };

  if (loading) return <p className="loading-text">Loading personnel record...</p>;
  if (error) return <p className="error">Error: {error}</p>;
  if (!record || !selected) return <p className="not-found">Personnel record not found.</p>;

  return (
    <div className="admin-container personnel-record-page">
      <div className="personnel-profile-card">
        <div>
          <p className="record-eyebrow">PERSONNEL RECORD</p>
          <h2>{record.profile.full_name || "Unnamed Personnel"}</h2>
          <div className="personnel-profile-meta">
            <span><strong>Service No:</strong> {record.profile.svc_no}</span>
            <span><strong>Rank:</strong> {record.profile.rank || "—"}</span>
            <span><strong>Unit:</strong> {record.profile.unit || "—"}</span>
            <span><strong>Appointment:</strong> {record.profile.appointment || "—"}</span>
            <span><strong>Sex:</strong> {record.profile.sex || "—"}</span>
            <span><strong>Email:</strong> {record.profile.email || "—"}</span>
          </div>
        </div>
        <div className="personnel-history-summary">
          <strong>{record.profile.evaluation_count}</strong>
          <span>PFT Evaluations</span>
        </div>
      </div>

      <section className="evaluation-history-section">
        <div className="section-heading">
          <div>
            <h3>Physical Fitness Evaluation History</h3>
            <p>Select a year to view the complete evaluation recorded for that period.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="personnel-table evaluation-history-table">
            <thead>
              <tr>
                <th>Year</th><th>Date</th><th>Score</th><th>Grade</th><th>Evaluator</th><th>Admin</th><th>Certificate</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {record.evaluations.map((evaluation) => (
                <tr key={evaluation.id} className={selected.id === evaluation.id ? "selected-evaluation" : ""}>
                  <td><strong>{evaluation.year}</strong></td>
                  <td>{evaluation.date || "—"}</td>
                  <td>{evaluation.aggregate ?? "—"}</td>
                  <td><span className="grade-badge">{evaluation.grade || "—"}</span></td>
                  <td>{evaluation.evaluator_name || "—"}</td>
                  <td>{evaluation.admin_id ? `Admin #${evaluation.admin_id}` : "Legacy"}</td>
                  <td>{evaluation.certificate?.exists ? evaluation.certificate.number : "Not issued"}</td>
                  <td><button className="view-btn" onClick={() => setSelectedId(evaluation.id)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div ref={resultsRef} className="results selected-evaluation-report">
        <div className="selected-evaluation-banner">
          <strong>Selected Evaluation: {selected.year}</strong>
          <span>Score {selected.aggregate ?? "—"} · {selected.grade || "—"}</span>
        </div>
        <Header />
        <PersonalInfo state={selected} />
        <StatusGroups state={selected} />
        <OverallRecommendation state={selected} />
      </div>

      <div className="admin-actions-container personnel-record-actions">
        <button className="back-btn" onClick={() => navigate(returnTo)}>Back to Personnel</button>
        <button className="edit-btn" onClick={editEvaluation}>Edit {selected.year} Evaluation</button>
        {selected.certificate?.exists ? (
          <button className="view-cert-btn" onClick={openCertificate}>View Certificate</button>
        ) : (
          <button className="issue-btn" onClick={openCertificate}>Issue Certificate</button>
        )}
        <button className="btn pdf-btn" onClick={downloadPDF}>Download Evaluation PDF</button>
        <button className="btn email-btn" onClick={sendEmail} disabled={isSending}>{isSending ? "Sending..." : "Send Evaluation"}</button>
      </div>
    </div>
  );
}
