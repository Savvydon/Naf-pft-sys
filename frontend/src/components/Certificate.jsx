import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import airForceLogo from "../assets/airforce.png";
import seal from "../assets/seal.png";
import aocSignatureImg from "../assets/signature.png";
import sportsSignatureImg from "../assets/signature.png";

import "../styles/Certificate.css";
import { 
  createCertificate, 
  getCertificateByPFT, 
  checkCertificateExists,
  getNextCertificateNumber
} from "../services/certificateApi.js";

const API_BASE = "https://naf-pft-sys-1.onrender.com";

export default function Certificate({ fromSuperAdmin = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const certRef = useRef(null);
  
  // Use ref to track if initialization has happened
  const initialized = useRef(false);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Editable fields
  const [rankAndName, setRankAndName] = useState("");
  const [participatedIn, setParticipatedIn] = useState("");
  const [confirmed, setConfirmed] = useState("");
  const [atLocation, setAtLocation] = useState("");
  const [issuedDay, setIssuedDay] = useState("");
  const [issuedMonth, setIssuedMonth] = useState("");
  const [issuedYear, setIssuedYear] = useState("");

  // Certificate Number - now controlled by backend
  const [certNumber, setCertNumber] = useState("");
  const [fullCertNumber, setFullCertNumber] = useState("");

  // Save certificate states
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [existingCert, setExistingCert] = useState(null);

  const isSuperAdmin =
    fromSuperAdmin || location.pathname.includes("/superadmin/");

  // Generate watermark array
  const watermarkArray = Array.from({ length: 250 }, (_, i) => i);

  // Initialize certificate - CHECK FOR EXISTING FIRST, then get next number from backend
  useEffect(() => {
    if (initialized.current) return;
    
    const initCertificate = async () => {
      initialized.current = true;
      
      try {
        // Step 1: Check if certificate already exists for this PFT result
        const existing = await checkCertificateExists(id);
        
        if (existing.exists) {
          // Certificate exists - fetch full details
          const certDetails = await getCertificateByPFT(id);
          setExistingCert(certDetails);
          setIsSaved(true);
          
          // Use the EXISTING certificate number from database
          const fullNum = certDetails.certificate_number;
          setFullCertNumber(fullNum);
          const numberPart = fullNum.split("HQ")[1];
          setCertNumber(numberPart);
          
          // Pre-fill form fields
          setRankAndName(`${certDetails.personnel_rank || ""} ${certDetails.personnel_name || ""}`.trim());
          setParticipatedIn(certDetails.participated_in || "");
          setConfirmed(certDetails.status === "fit" ? "Fit" : 
                        certDetails.status === "not fit" ? "Not Fit" : 
                        certDetails.status === "excused" ? "Excused" : "");
          setAtLocation(certDetails.location || "");
          setIssuedDay(certDetails.issued_day || "");
          setIssuedMonth(certDetails.issued_month || "");
          setIssuedYear(certDetails.issued_year?.slice(-2) || "");
          
          console.log("[CERTIFICATE] Loaded existing certificate:", fullNum);
          return;
        }
        
        // Step 2: No existing certificate - get next number from BACKEND
        const nextNumData = await getNextCertificateNumber();
        const fullNumber = nextNumData.next_certificate_number;
        setFullCertNumber(fullNumber);
        const numberPart = fullNumber.split("HQ")[1];
        setCertNumber(numberPart);
        
        console.log("[CERTIFICATE] Got next certificate number from backend:", fullNumber);

        // Set default date values
        const now = new Date();
        const days = [
          "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th",
          "11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th", "20th",
          "21st", "22nd", "23rd", "24th", "25th", "26th", "27th", "28th", "29th", "30th", "31st",
        ];
        const months = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December",
        ];

        setIssuedDay(days[now.getDate() - 1] || `${now.getDate()}th`);
        setIssuedMonth(months[now.getMonth()]);
        setIssuedYear(now.getFullYear().toString().slice(-2));
        
      } catch (err) {
        console.error("[CERTIFICATE] Initialization error:", err);
        // Fallback: generate locally if backend fails
        const fallbackNum = "054991";
        setCertNumber(fallbackNum);
        setFullCertNumber(`NAF/786/HQ${fallbackNum}`);
        alert("Warning: Could not get certificate number from server. Using fallback.");
      }
    };
    
    initCertificate();
  }, [id]);

  // Fetch PFT record
  useEffect(() => {
    const endpoint = isSuperAdmin
      ? `${API_BASE}/superadmin/pft-results/${id}`
      : `${API_BASE}/api/pft-results/${id}`;

    fetch(endpoint, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setResult(data);
        // Only set rankAndName if not already set from existing certificate
        setRankAndName(prev => prev || `${data.rank || ""} ${data.full_name || ""}`.trim());
        setLoading(false);
      })
      .catch(() => {
        alert("Failed to load record for certificate");
        navigate(isSuperAdmin ? "/superadmin/pft-results" : "/admin/personnel");
      });
  }, [id, isSuperAdmin, navigate]);

  // ============ SAVE CERTIFICATE TO DATABASE ============
  const saveCertificate = async () => {
    if (!confirmed) {
      alert("Please select a status (Fit, Not Fit, or Excused)");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const certificateData = {
        pft_result_id: parseInt(id),
        participated_in: participatedIn,
        status: confirmed.toLowerCase(),
        location: atLocation,
        issued_day: issuedDay,
        issued_month: issuedMonth,
        issued_year: "20" + issuedYear,
      };

      const savedCert = await createCertificate(certificateData);
      console.log("Certificate saved:", savedCert);
      
      // Update with the ACTUAL number from server
      const actualFullNumber = savedCert.certificate_number;
      setFullCertNumber(actualFullNumber);
      setCertNumber(actualFullNumber.split("HQ")[1]);
      
      setIsSaved(true);
      setExistingCert(savedCert);
      alert(`Certificate saved successfully!\nNumber: ${actualFullNumber}`);
      
      return savedCert;
    } catch (err) {
      console.error("Save failed:", err);
      setSaveError(err.message);
      
      // Check if error is due to duplicate/certificate already exists
      if (err.message?.includes("already exists")) {
        alert("A certificate already exists for this record. Reloading page...");
        window.location.reload();
      } else {
        alert("Failed to save certificate: " + err.message);
      }
      
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // ============ GENERATE PDF FOR DOWNLOAD ============
  const generatePDF = async () => {
    const input = certRef.current;
    if (!input) return;

    const originalStyles = {
      transform: input.style.transform,
      width: input.style.width,
      maxWidth: input.style.maxWidth,
      height: input.style.height,
      overflow: input.style.overflow,
    };

    input.style.transform = "none";
    input.style.width = "850px";
    input.style.maxWidth = "850px";
    input.style.height = "auto";
    input.style.overflow = "visible";
    input.classList.add("pdf-mode");

    await new Promise((r) => setTimeout(r, 500));

    try {
      const contentHeight = input.scrollHeight;

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FAF9F6",
        width: 850,
        height: contentHeight,
        windowWidth: 850,
        windowHeight: contentHeight,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > pageHeight - 20) {
        const scaleFactor = (pageHeight - 20) / imgHeight;
        const finalWidth = imgWidth * scaleFactor;
        const finalHeight = imgHeight * scaleFactor;
        const xOffset = (pageWidth - finalWidth) / 2;
        pdf.addImage(imgData, "JPEG", xOffset, 10, finalWidth, finalHeight);
      } else {
        const yOffset = (pageHeight - imgHeight) / 2;
        pdf.addImage(imgData, "JPEG", 10, yOffset, imgWidth, imgHeight);
      }

      pdf.save(
        `NAF_PFT_Certificate_${result?.svc_no || "PERSONNEL"}_${certNumber}.pdf`,
      );
    } finally {
      Object.assign(input.style, originalStyles);
      input.classList.remove("pdf-mode");
    }
  };

  // ============ SEND CERTIFICATE VIA EMAIL ============
  const sendCertificate = async () => {
    if (!result?.email) {
      alert("No email address found for this personnel.");
      return;
    }

    setIsSending(true);

    const input = certRef.current;
    if (!input) {
      setIsSending(false);
      return;
    }

    const originalStyles = {
      transform: input.style.transform,
      width: input.style.width,
      maxWidth: input.style.maxWidth,
      height: input.style.height,
      overflow: input.style.overflow,
    };

    try {
      input.style.transform = "none";
      input.style.width = "850px";
      input.style.maxWidth = "850px";
      input.style.height = "auto";
      input.style.overflow = "visible";
      input.classList.add("pdf-mode");

      await new Promise((r) => setTimeout(r, 500));

      const contentHeight = input.scrollHeight;

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FAF9F6",
        width: 850,
        height: contentHeight,
        windowWidth: 850,
        windowHeight: contentHeight,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > pageHeight - 20) {
        const scaleFactor = (pageHeight - 20) / imgHeight;
        const finalWidth = imgWidth * scaleFactor;
        const finalHeight = imgHeight * scaleFactor;
        const xOffset = (pageWidth - finalWidth) / 2;
        pdf.addImage(imgData, "JPEG", xOffset, 10, finalWidth, finalHeight);
      } else {
        const yOffset = (pageHeight - imgHeight) / 2;
        pdf.addImage(imgData, "JPEG", 10, yOffset, imgWidth, imgHeight);
      }

      const pdfBlob = pdf.output("blob");

      if (pdfBlob.size > 4.5 * 1024 * 1024) {
        alert("Certificate PDF is too large for email. Please download and send manually.");
        return;
      }

      const formData = new FormData();
      formData.append("email", result.email);
      formData.append("file", pdfBlob, `NAF_PFT_Certificate_${certNumber}.pdf`);
      formData.append("personnel_name", result.full_name || "");
      formData.append("certificate_type", "pft_certificate");
      formData.append("certificate_number", fullCertNumber || `NAF/786/HQ${certNumber}`);

      const res = await fetch(`${API_BASE}/send-certificate-pdf`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to send email");

      alert(`Certificate sent successfully to ${result.email}`);
    } catch (err) {
      console.error(err);
      alert("Failed to send certificate: " + err.message);
    } finally {
      Object.assign(input.style, originalStyles);
      input.classList.remove("pdf-mode");
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

  if (loading)
    return <div className="loading-text">Loading certificate...</div>;
  if (!result) return <div className="error">Record not found</div>;

  return (
    <div className="certificate-page">
      {/* Form Section */}
      <div className="certificate-form">
        <h2>Issue PFT Certificate</h2>
        <p className="form-subtitle">
          {isSaved ? "Certificate has been issued" : "Fill in the certificate details below"}
        </p>

        <div className="form-group">
          <label>Certificate Number</label>
          <input
            type="text"
            value={fullCertNumber || `NAF/786/HQ${certNumber}`}
            readOnly
            className="readonly"
          />
        </div>

        <div className="form-group">
          <label>Rank & Name *</label>
          <input
            type="text"
            value={rankAndName}
            onChange={(e) => setRankAndName(e.target.value)}
            placeholder="e.g. Flying Officer John Doe"
            readOnly={isSaved}
            style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
          />
        </div>

        <div className="form-group">
          <label>Participated In *</label>
          <input
            type="text"
            value={participatedIn}
            onChange={(e) => setParticipatedIn(e.target.value)}
            placeholder="e.g. NAF Annual PFT 2026"
            readOnly={isSaved}
            style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
          />
        </div>

        <div className="form-group">
          <label>Confirmation Status *</label>
          <div className="checkbox-group">
            {["Fit", "Not Fit", "Excused"].map((status) => (
              <label key={status} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={confirmed === status}
                  onChange={() => !isSaved && setConfirmed(status)}
                  disabled={isSaved}
                />
                <span>{status}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>At (Location) *</label>
          <input
            type="text"
            value={atLocation}
            onChange={(e) => setAtLocation(e.target.value)}
            placeholder="e.g. NAF Base Abuja"
            readOnly={isSaved}
            style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Day</label>
            <input
              type="text"
              value={issuedDay}
              onChange={(e) => setIssuedDay(e.target.value)}
              readOnly={isSaved}
              style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
            />
          </div>
          <div className="form-group">
            <label>Month</label>
            <input
              type="text"
              value={issuedMonth}
              onChange={(e) => setIssuedMonth(e.target.value)}
              readOnly={isSaved}
              style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
            />
          </div>
          <div className="form-group">
            <label>Year (20__)</label>
            <input
              type="text"
              value={issuedYear}
              onChange={(e) => setIssuedYear(e.target.value)}
              maxLength="2"
              readOnly={isSaved}
              style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
            />
          </div>
        </div>

        <div className="form-actions">
          <button onClick={handleBack} className="btn back-btn">
            ← Back
          </button>
          
          {!isSaved && (
            <button 
              onClick={saveCertificate} 
              className="btn save-btn"
              disabled={isSaving}
              style={{background: '#0b3d91'}}
            >
              {isSaving ? 'Saving...' : 'Save Certificate'}
            </button>
          )}

          <button 
            onClick={async () => {
              if (!isSaved) {
                const saved = await saveCertificate();
                if (!saved) return;
              }
              generatePDF();
            }} 
            className="btn pdf-btn"
            disabled={isSaving}
          >
            Download PDF
          </button>
          
          <button
            onClick={async () => {
              if (!isSaved) {
                const saved = await saveCertificate();
                if (!saved) return;
              }
              sendCertificate();
            }}
            className="btn email-btn"
            disabled={isSending || isSaving}
          >
            {isSending ? "Sending..." : "Send to Email"}
          </button>
        </div>
        
        {isSaved && (
          <p style={{ 
            marginTop: "10px", 
            color: "#28a745", 
            fontSize: "0.9rem",
            textAlign: "center",
            fontWeight: "600"
          }}>
            ✓ This certificate has been saved. Fields are locked to prevent accidental changes.
          </p>
        )}
      </div>

      {/* Certificate Preview */}
      <div className="certificate-preview">
        <h3>Preview</h3>

        <div ref={certRef} className="certificate-wrapper">
          <div className="border-outer"></div>
          <div className="border-inner"></div>

          <div className="watermark-layer">
            {watermarkArray.map((_, index) => (
              <div key={index} className="watermark-text">
                NIGERIAN AIR FORCE
              </div>
            ))}
          </div>

          <div className="certificate-content">
            <div className="cert-number-section">
              <div className="cert-number-full">
                {fullCertNumber || `NAF/786/HQ${certNumber}`}
              </div>
              <div className="cert-number-note">
                (To identify the Comds/053 NAF CAMP)
              </div>
            </div>

            <div className="cert-logo">
              <img src={airForceLogo} alt="Nigerian Air Force" />
            </div>

            <h1 className="cert-main-title">
              NAF PHYSICAL FITNESS TEST CERTIFICATE
            </h1>
            <p className="cert-presented-to">Presented to</p>

            <div className="cert-fields">
              <div className="cert-row three-cols">
                <div className="cert-field">
                  <span className="field-label">Rank &amp; Name</span>
                  <span className="field-line">
                    {rankAndName || "_______________________"}
                  </span>
                </div>
                <div className="cert-field">
                  <span className="field-label">Svc No.</span>
                  <span className="field-line">
                    {result.svc_no || "_______________________"}
                  </span>
                </div>
                <div className="cert-field">
                  <span className="field-label">Unit</span>
                  <span className="field-line">
                    {result.unit || "_______________________"}
                  </span>
                </div>
              </div>

              <div className="cert-row">
                <div className="cert-field full">
                  <span className="field-label">Participated in:</span>
                  <span className="field-line">{participatedIn || ""}</span>
                </div>
              </div>

              <div className="cert-row confirmation-row">
                <span className="field-label">and Confirmed:</span>
                <div className="confirmation-boxes">
                  <div
                    className={`conf-box ${confirmed === "Fit" ? "checked" : ""}`}
                  >
                    <span>Fit</span>
                    <div className="box"></div>
                  </div>
                  <div
                    className={`conf-box ${confirmed === "Not Fit" ? "checked" : ""}`}
                  >
                    <span>Not Fit</span>
                    <div className="box"></div>
                  </div>
                  <div
                    className={`conf-box ${confirmed === "Excused" ? "checked" : ""}`}
                  >
                    <span>Excused</span>
                    <div className="box"></div>
                  </div>
                </div>
              </div>

              <div className="cert-row">
                <div className="cert-field full">
                  <span className="field-label">At</span>
                  <span className="field-line">{atLocation || ""}</span>
                </div>
              </div>

              <div className="cert-row issued-row">
                <span className="issued-text">
                  Issued on{" "}
                  <span className="issued-line">
                    {issuedDay || "__________"}
                  </span>{" "}
                  day of{" "}
                  <span className="issued-line">
                    {issuedMonth || "__________"}
                  </span>{" "}
                  20<span className="issued-line">{issuedYear || "____"}</span>
                </span>
              </div>
            </div>

            <div className="cert-bottom">
              <div className="signature-block">
                <div className="signature-line">
                  <img src={aocSignatureImg} alt="AOC Signature" />
                </div>
                <div className="signature-label">
                  AOC/Comd (Sign &amp; Date)
                </div>
              </div>

              <div className="seal-block">
                <img src={seal} alt="Official Seal" />
              </div>

              <div className="signature-block">
                <div className="signature-line">
                  <img
                    src={sportsSignatureImg}
                    alt="Sports Officer Signature"
                  />
                </div>
                <div className="signature-label">
                  Sports Offr (Sign &amp; Date)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// import { useEffect, useState, useRef } from "react";
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";

// import airForceLogo from "../assets/airforce.png";
// import seal from "../assets/seal.png";
// import aocSignatureImg from "../assets/signature.png";
// import sportsSignatureImg from "../assets/signature.png";

// import "../styles/Certificate.css";
// import { createCertificate, getCertificateByPFT, checkCertificateExists } from "../services/certificateApi.js";

// const API_BASE = "https://naf-pft-sys-1.onrender.com";

// export default function Certificate({ fromSuperAdmin = false }) {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const certRef = useRef(null);
  
//   // Use ref to track if initialization has happened (prevents double increment in Strict Mode)
//   const initialized = useRef(false);

//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [isSending, setIsSending] = useState(false);

//   // Editable fields
//   const [rankAndName, setRankAndName] = useState("");
//   const [participatedIn, setParticipatedIn] = useState("");
//   const [confirmed, setConfirmed] = useState("");
//   const [atLocation, setAtLocation] = useState("");
//   const [issuedDay, setIssuedDay] = useState("");
//   const [issuedMonth, setIssuedMonth] = useState("");
//   const [issuedYear, setIssuedYear] = useState("");

//   // Certificate Number - starts at 054991
//   const [certNumber, setCertNumber] = useState("");

//   // Save certificate states
//   const [isSaving, setIsSaving] = useState(false);
//   const [saveError, setSaveError] = useState(null);
//   const [isSaved, setIsSaved] = useState(false);
//   const [existingCert, setExistingCert] = useState(null);

//   const isSuperAdmin =
//     fromSuperAdmin || location.pathname.includes("/superadmin/");

//   // Generate watermark array - 250 items to fill the certificate
//   const watermarkArray = Array.from({ length: 250 }, (_, i) => i);

//   // Initialize certificate number and date - CHECK FOR EXISTING CERTIFICATE FIRST
//   useEffect(() => {
//     // Prevent double execution in React Strict Mode
//     if (initialized.current) return;
    
//     const initCertificate = async () => {
//       initialized.current = true;
      
//       // First, check if a certificate already exists for this PFT result
//       try {
//         const existing = await checkCertificateExists(id);
        
//         if (existing.exists) {
//           // Certificate exists - fetch full details
//           const certDetails = await getCertificateByPFT(id);
//           setExistingCert(certDetails);
//           setIsSaved(true);
          
//           // Extract certificate number from the full number (NAF/786/HQ054991 -> 054991)
//           const fullNumber = certDetails.certificate_number;
//           const numberPart = fullNumber.split("HQ")[1];
//           setCertNumber(numberPart);
          
//           // Pre-fill form fields with existing data
//           setRankAndName(`${certDetails.personnel_rank || ""} ${certDetails.personnel_name || ""}`.trim());
//           setParticipatedIn(certDetails.participated_in || "");
//           setConfirmed(certDetails.status === "fit" ? "Fit" : 
//                         certDetails.status === "not fit" ? "Not Fit" : 
//                         certDetails.status === "excused" ? "Excused" : "");
//           setAtLocation(certDetails.location || "");
//           setIssuedDay(certDetails.issued_day || "");
//           setIssuedMonth(certDetails.issued_month || "");
//           setIssuedYear(certDetails.issued_year?.slice(-2) || ""); // Convert "2026" to "26"
          
//           console.log("[CERTIFICATE] Loaded existing certificate:", fullNumber);
//           return; // Don't generate new number
//         }
//       } catch (err) {
//         console.log("[CERTIFICATE] No existing certificate found or error checking:", err);
//       }
      
//       // No existing certificate - generate new number
//       let lastNo = parseInt(localStorage.getItem("lastCertNo") || "54990");
//       const nextNo = (lastNo + 1).toString().padStart(6, "0");
//       setCertNumber(nextNo);
//       localStorage.setItem("lastCertNo", nextNo);

//       const now = new Date();
//       const days = [
//         "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th",
//         "11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th", "20th",
//         "21st", "22nd", "23rd", "24th", "25th", "26th", "27th", "28th", "29th", "30th", "31st",
//       ];
//       const months = [
//         "January", "February", "March", "April", "May", "June",
//         "July", "August", "September", "October", "November", "December",
//       ];

//       setIssuedDay(days[now.getDate() - 1] || `${now.getDate()}th`);
//       setIssuedMonth(months[now.getMonth()]);
//       setIssuedYear(now.getFullYear().toString().slice(-2));
      
//       console.log("[CERTIFICATE] Generated new certificate number:", nextNo);
//     };
    
//     initCertificate();
//   }, [id]);

//   // Fetch record
//   useEffect(() => {
//     const endpoint = isSuperAdmin
//       ? `${API_BASE}/superadmin/pft-results/${id}`
//       : `${API_BASE}/api/pft-results/${id}`;

//     fetch(endpoint, { credentials: "include" })
//       .then((res) => res.json())
//       .then((data) => {
//         setResult(data);
//         // Only set rankAndName if not already set from existing certificate
//         setRankAndName(prev => prev || `${data.rank || ""} ${data.full_name || ""}`.trim());
//         setLoading(false);
//       })
//       .catch(() => {
//         alert("Failed to load record for certificate");
//         navigate(isSuperAdmin ? "/superadmin/pft-results" : "/admin/personnel");
//       });
//   }, [id, isSuperAdmin, navigate]);

//   // ============ SAVE CERTIFICATE TO DATABASE ============
//   const saveCertificate = async () => {
//     if (!confirmed) {
//       alert("Please select a status (Fit, Not Fit, or Excused)");
//       return;
//     }

//     setIsSaving(true);
//     setSaveError(null);

//     try {
//       const certificateData = {
//         pft_result_id: parseInt(id),
//         participated_in: participatedIn,
//         status: confirmed.toLowerCase(), // "fit", "not fit", or "excused"
//         location: atLocation,
//         issued_day: issuedDay,
//         issued_month: issuedMonth,
//         issued_year: "20" + issuedYear, // Convert "26" to "2026"
//       };

//       const savedCert = await createCertificate(certificateData);
//       console.log("Certificate saved:", savedCert);
      
//       setCertNumber(savedCert.certificate_number.split("HQ")[1]); // Update with server number
//       setIsSaved(true);
//       setExistingCert(savedCert);
//       alert(`Certificate saved successfully!\nNumber: ${savedCert.certificate_number}`);
      
//       return savedCert;
//     } catch (err) {
//       console.error("Save failed:", err);
//       setSaveError(err.message);
//       alert("Failed to save certificate: " + err.message);
//       return null;
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // ============ GENERATE PDF FOR DOWNLOAD ============
//   const generatePDF = async () => {
//     const input = certRef.current;
//     if (!input) return;

//     // Save original styles
//     const originalStyles = {
//       transform: input.style.transform,
//       width: input.style.width,
//       maxWidth: input.style.maxWidth,
//       height: input.style.height,
//       overflow: input.style.overflow,
//     };

//     // Remove transform and set exact dimensions for capture
//     input.style.transform = "none";
//     input.style.width = "850px";
//     input.style.maxWidth = "850px";
//     input.style.height = "auto";
//     input.style.overflow = "visible";
//     input.classList.add("pdf-mode");

//     await new Promise((r) => setTimeout(r, 500));

//     try {
//       // Get the actual content height
//       const contentHeight = input.scrollHeight;

//       const canvas = await html2canvas(input, {
//         scale: 2,
//         useCORS: true,
//         backgroundColor: "#FAF9F6",
//         width: 850,
//         height: contentHeight,
//         windowWidth: 850,
//         windowHeight: contentHeight,
//       });

//       const pdf = new jsPDF("p", "mm", "a4");
//       const imgData = canvas.toDataURL("image/jpeg", 0.95);

//       // Calculate dimensions to fit content exactly
//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();
//       const imgWidth = pageWidth - 20;
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;

//       // If content is taller than page, scale to fit
//       if (imgHeight > pageHeight - 20) {
//         const scaleFactor = (pageHeight - 20) / imgHeight;
//         const finalWidth = imgWidth * scaleFactor;
//         const finalHeight = imgHeight * scaleFactor;
//         const xOffset = (pageWidth - finalWidth) / 2;
//         pdf.addImage(imgData, "JPEG", xOffset, 10, finalWidth, finalHeight);
//       } else {
//         // Center vertically if shorter than page
//         const yOffset = (pageHeight - imgHeight) / 2;
//         pdf.addImage(imgData, "JPEG", 10, yOffset, imgWidth, imgHeight);
//       }

//       pdf.save(
//         `NAF_PFT_Certificate_${result?.svc_no || "PERSONNEL"}_${certNumber}.pdf`,
//       );
//     } finally {
//       // Restore original styles
//       Object.assign(input.style, originalStyles);
//       input.classList.remove("pdf-mode");
//     }
//   };

//   // ============ FIXED: SEND CERTIFICATE VIA EMAIL ============
//   const sendCertificate = async () => {
//     if (!result?.email) {
//       alert("No email address found for this personnel.");
//       return;
//     }

//     setIsSending(true);

//     // Save original styles at the start
//     const input = certRef.current;
//     if (!input) {
//       setIsSending(false);
//       return;
//     }

//     const originalStyles = {
//       transform: input.style.transform,
//       width: input.style.width,
//       maxWidth: input.style.maxWidth,
//       height: input.style.height,
//       overflow: input.style.overflow,
//     };

//     try {
//       // FIXED: Use same style setup as generatePDF
//       input.style.transform = "none";
//       input.style.width = "850px";
//       input.style.maxWidth = "850px";
//       input.style.height = "auto";
//       input.style.overflow = "visible";
//       input.classList.add("pdf-mode");

//       await new Promise((r) => setTimeout(r, 500));

//       // Get the actual content height
//       const contentHeight = input.scrollHeight;

//       // FIXED: Use same parameters as generatePDF
//       const canvas = await html2canvas(input, {
//         scale: 2, // FIXED: was 1.5, now 2 to match generatePDF
//         useCORS: true,
//         backgroundColor: "#FAF9F6",
//         width: 850, // FIXED: was 794, now 850
//         height: contentHeight,
//         windowWidth: 850, // FIXED: was 794, now 850
//         windowHeight: contentHeight,
//       });

//       const pdf = new jsPDF("p", "mm", "a4");
//       const imgData = canvas.toDataURL("image/jpeg", 0.95); // FIXED: was 0.8, now 0.95

//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();
//       const imgWidth = pageWidth - 20;
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;

//       if (imgHeight > pageHeight - 20) {
//         const scaleFactor = (pageHeight - 20) / imgHeight;
//         const finalWidth = imgWidth * scaleFactor;
//         const finalHeight = imgHeight * scaleFactor;
//         const xOffset = (pageWidth - finalWidth) / 2;
//         pdf.addImage(imgData, "JPEG", xOffset, 10, finalWidth, finalHeight);
//       } else {
//         const yOffset = (pageHeight - imgHeight) / 2;
//         pdf.addImage(imgData, "JPEG", 10, yOffset, imgWidth, imgHeight);
//       }

//       const pdfBlob = pdf.output("blob");

//       if (pdfBlob.size > 4.5 * 1024 * 1024) {
//         alert(
//           "Certificate PDF is too large for email. Please download and send manually.",
//         );
//         return;
//       }

//       const formData = new FormData();
//       formData.append("email", result.email);
//       formData.append("file", pdfBlob, `NAF_PFT_Certificate_${certNumber}.pdf`);
//       formData.append("personnel_name", result.full_name || "");
//       formData.append("certificate_type", "pft_certificate");
//       // Include the certificate number so backend can store it
//       formData.append("certificate_number", `NAF/786/HQ${certNumber}`);

//       const res = await fetch(`${API_BASE}/send-certificate-pdf`, {
//         method: "POST",
//         credentials: "include",
//         body: formData,
//       });

//       if (!res.ok) throw new Error("Failed to send email");

//       alert(`Certificate sent successfully to ${result.email}`);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to send certificate: " + err.message);
//     } finally {
//       // FIXED: Always restore original styles
//       Object.assign(input.style, originalStyles);
//       input.classList.remove("pdf-mode");
//       setIsSending(false);
//     }
//   };

//   const handleBack = () => {
//     if (isSuperAdmin) {
//       navigate("/superadmin/pft-results");
//     } else {
//       navigate("/admin/personnel");
//     }
//   };

//   if (loading)
//     return <div className="loading-text">Loading certificate...</div>;
//   if (!result) return <div className="error">Record not found</div>;

//   return (
//     <div className="certificate-page">
//       {/* Form Section */}
//       <div className="certificate-form">
//         <h2>Issue PFT Certificate</h2>
//         <p className="form-subtitle">
//           {isSaved ? "Certificate has been issued" : "Fill in the certificate details below"}
//         </p>

//         <div className="form-group">
//           <label>Certificate Number</label>
//           <input
//             type="text"
//             value={`NAF/786/HQ${certNumber}`}
//             readOnly
//             className="readonly"
//           />
//         </div>

//         <div className="form-group">
//           <label>Rank & Name *</label>
//           <input
//             type="text"
//             value={rankAndName}
//             onChange={(e) => setRankAndName(e.target.value)}
//             placeholder="e.g. Flying Officer John Doe"
//             readOnly={isSaved} // Lock fields if already saved
//             style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
//           />
//         </div>

//         <div className="form-group">
//           <label>Participated In *</label>
//           <input
//             type="text"
//             value={participatedIn}
//             onChange={(e) => setParticipatedIn(e.target.value)}
//             placeholder="e.g. NAF Annual PFT 2026"
//             readOnly={isSaved}
//             style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
//           />
//         </div>

//         <div className="form-group">
//           <label>Confirmation Status *</label>
//           <div className="checkbox-group">
//             {["Fit", "Not Fit", "Excused"].map((status) => (
//               <label key={status} className="checkbox-label">
//                 <input
//                   type="checkbox"
//                   checked={confirmed === status}
//                   onChange={() => !isSaved && setConfirmed(status)}
//                   disabled={isSaved}
//                 />
//                 <span>{status}</span>
//               </label>
//             ))}
//           </div>
//         </div>

//         <div className="form-group">
//           <label>At (Location) *</label>
//           <input
//             type="text"
//             value={atLocation}
//             onChange={(e) => setAtLocation(e.target.value)}
//             placeholder="e.g. NAF Base Abuja"
//             readOnly={isSaved}
//             style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
//           />
//         </div>

//         <div className="form-row">
//           <div className="form-group">
//             <label>Day</label>
//             <input
//               type="text"
//               value={issuedDay}
//               onChange={(e) => setIssuedDay(e.target.value)}
//               readOnly={isSaved}
//               style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
//             />
//           </div>
//           <div className="form-group">
//             <label>Month</label>
//             <input
//               type="text"
//               value={issuedMonth}
//               onChange={(e) => setIssuedMonth(e.target.value)}
//               readOnly={isSaved}
//               style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
//             />
//           </div>
//           <div className="form-group">
//             <label>Year (20__)</label>
//             <input
//               type="text"
//               value={issuedYear}
//               onChange={(e) => setIssuedYear(e.target.value)}
//               maxLength="2"
//               readOnly={isSaved}
//               style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
//             />
//           </div>
//         </div>

//         <div className="form-actions">
//           <button onClick={handleBack} className="btn back-btn">
//             ← Back
//           </button>
          
//           {/* NEW: Save button - only show if not saved */}
//           {!isSaved && (
//             <button 
//               onClick={saveCertificate} 
//               className="btn save-btn"
//               disabled={isSaving}
//               style={{background: '#0b3d91'}}
//             >
//               {isSaving ? 'Saving...' : 'Save Certificate'}
//             </button>
//           )}

//           <button 
//             onClick={async () => {
//               if (!isSaved) {
//                 const saved = await saveCertificate();
//                 if (!saved) return;
//               }
//               generatePDF();
//             }} 
//             className="btn pdf-btn"
//             disabled={isSaving}
//           >
//             Download PDF
//           </button>
          
//           <button
//             onClick={async () => {
//               if (!isSaved) {
//                 const saved = await saveCertificate();
//                 if (!saved) return;
//               }
//               sendCertificate();
//             }}
//             className="btn email-btn"
//             disabled={isSending || isSaving}
//           >
//             {isSending ? "Sending..." : "Send to Email"}
//           </button>
//         </div>
        
//         {isSaved && (
//           <p style={{ 
//             marginTop: "10px", 
//             color: "#28a745", 
//             fontSize: "0.9rem",
//             textAlign: "center",
//             fontWeight: "600"
//           }}>
//             ✓ This certificate has been saved. Fields are locked to prevent accidental changes.
//           </p>
//         )}
//       </div>

//       {/* Certificate Preview */}
//       <div className="certificate-preview">
//         <h3>Preview</h3>

//         {/* Certificate with actual border elements for perfect PDF capture */}
//         <div ref={certRef} className="certificate-wrapper">
//           {/* Outer Blue Border - Actual HTML element */}
//           <div className="border-outer"></div>

//           {/* Inner Gold Border - Actual HTML element */}
//           <div className="border-inner"></div>

//           {/* Watermark Layer - Repeating pattern */}
//           <div className="watermark-layer">
//             {watermarkArray.map((_, index) => (
//               <div key={index} className="watermark-text">
//                 NIGERIAN AIR FORCE
//               </div>
//             ))}
//           </div>

//           {/* Certificate Content */}
//           <div className="certificate-content">
//             {/* Certificate Number - Top Right */}
//             <div className="cert-number-section">
//               <div className="cert-number-full">
//                 NAF/786/HQ<span className="cert-num-value">{certNumber}</span>
//               </div>
//               <div className="cert-number-note">
//                 (To identify the Comds/053 NAF CAMP)
//               </div>
//             </div>

//             {/* NAF Logo */}
//             <div className="cert-logo">
//               <img src={airForceLogo} alt="Nigerian Air Force" />
//             </div>

//             {/* Title */}
//             <h1 className="cert-main-title">
//               NAF PHYSICAL FITNESS TEST CERTIFICATE
//             </h1>
//             <p className="cert-presented-to">Presented to</p>

//             {/* Fields */}
//             <div className="cert-fields">
//               {/* Row 1: Rank & Name, Svc No, Unit */}
//               <div className="cert-row three-cols">
//                 <div className="cert-field">
//                   <span className="field-label">Rank &amp; Name</span>
//                   <span className="field-line">
//                     {rankAndName || "_______________________"}
//                   </span>
//                 </div>
//                 <div className="cert-field">
//                   <span className="field-label">Svc No.</span>
//                   <span className="field-line">
//                     {result.svc_no || "_______________________"}
//                   </span>
//                 </div>
//                 <div className="cert-field">
//                   <span className="field-label">Unit</span>
//                   <span className="field-line">
//                     {result.unit || "_______________________"}
//                   </span>
//                 </div>
//               </div>

//               {/* Row 2: Participated in */}
//               <div className="cert-row">
//                 <div className="cert-field full">
//                   <span className="field-label">Participated in:</span>
//                   <span className="field-line">{participatedIn || ""}</span>
//                 </div>
//               </div>

//               {/* Row 3: Confirmation checkboxes */}
//               <div className="cert-row confirmation-row">
//                 <span className="field-label">and Confirmed:</span>
//                 <div className="confirmation-boxes">
//                   <div
//                     className={`conf-box ${confirmed === "Fit" ? "checked" : ""}`}
//                   >
//                     <span>Fit</span>
//                     <div className="box"></div>
//                   </div>
//                   <div
//                     className={`conf-box ${confirmed === "Not Fit" ? "checked" : ""}`}
//                   >
//                     <span>Not Fit</span>
//                     <div className="box"></div>
//                   </div>
//                   <div
//                     className={`conf-box ${confirmed === "Excused" ? "checked" : ""}`}
//                   >
//                     <span>Excused</span>
//                     <div className="box"></div>
//                   </div>
//                 </div>
//               </div>

//               {/* Row 4: At */}
//               <div className="cert-row">
//                 <div className="cert-field full">
//                   <span className="field-label">At</span>
//                   <span className="field-line">{atLocation || ""}</span>
//                 </div>
//               </div>

//               {/* Row 5: Issued on */}
//               <div className="cert-row issued-row">
//                 <span className="issued-text">
//                   Issued on{" "}
//                   <span className="issued-line">
//                     {issuedDay || "__________"}
//                   </span>{" "}
//                   day of{" "}
//                   <span className="issued-line">
//                     {issuedMonth || "__________"}
//                   </span>{" "}
//                   20<span className="issued-line">{issuedYear || "____"}</span>
//                 </span>
//               </div>
//             </div>

//             {/* Bottom Section: Signatures and Seal */}
//             <div className="cert-bottom">
//               <div className="signature-block">
//                 <div className="signature-line">
//                   <img src={aocSignatureImg} alt="AOC Signature" />
//                 </div>
//                 <div className="signature-label">
//                   AOC/Comd (Sign &amp; Date)
//                 </div>
//               </div>

//               <div className="seal-block">
//                 <img src={seal} alt="Official Seal" />
//               </div>

//               <div className="signature-block">
//                 <div className="signature-line">
//                   <img
//                     src={sportsSignatureImg}
//                     alt="Sports Officer Signature"
//                   />
//                 </div>
//                 <div className="signature-label">
//                   Sports Offr (Sign &amp; Date)
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }





// import { useEffect, useState, useRef } from "react";
// import { useParams, useNavigate, useLocation } from "react-router-dom";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";

// import airForceLogo from "../assets/airforce.png";
// import seal from "../assets/seal.png";
// import aocSignatureImg from "../assets/signature.png";
// import sportsSignatureImg from "../assets/signature.png";

// import "../styles/Certificate.css";
// import { 
//   createCertificate, 
//   getCertificateByPFT, 
//   checkCertificateExists,
//   getNextCertificateNumber
// } from "../services/certificateApi.js";

// const API_BASE = "https://naf-pft-sys-1.onrender.com";

// export default function Certificate({ fromSuperAdmin = false }) {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const certRef = useRef(null);
  
//   // Use ref to track if initialization has happened
//   const initialized = useRef(false);

//   const [result, setResult] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [isSending, setIsSending] = useState(false);

//   // Editable fields
//   const [rankAndName, setRankAndName] = useState("");
//   const [participatedIn, setParticipatedIn] = useState("");
//   const [confirmed, setConfirmed] = useState("");
//   const [atLocation, setAtLocation] = useState("");
//   const [issuedDay, setIssuedDay] = useState("");
//   const [issuedMonth, setIssuedMonth] = useState("");
//   const [issuedYear, setIssuedYear] = useState("");

//   // Certificate Number - now controlled by backend
//   const [certNumber, setCertNumber] = useState("");
//   const [fullCertNumber, setFullCertNumber] = useState("");

//   // Save certificate states
//   const [isSaving, setIsSaving] = useState(false);
//   const [saveError, setSaveError] = useState(null);
//   const [isSaved, setIsSaved] = useState(false);
//   const [existingCert, setExistingCert] = useState(null);

//   const isSuperAdmin =
//     fromSuperAdmin || location.pathname.includes("/superadmin/");

//   // Generate watermark array
//   const watermarkArray = Array.from({ length: 250 }, (_, i) => i);

//   // Initialize certificate - CHECK FOR EXISTING FIRST, then get next number from backend
//   useEffect(() => {
//     if (initialized.current) return;
    
//     const initCertificate = async () => {
//       initialized.current = true;
      
//       try {
//         // Step 1: Check if certificate already exists for this PFT result
//         const existing = await checkCertificateExists(id);
        
//         if (existing.exists) {
//           // Certificate exists - fetch full details
//           const certDetails = await getCertificateByPFT(id);
//           setExistingCert(certDetails);
//           setIsSaved(true);
          
//           // Use the EXISTING certificate number from database
//           const fullNum = certDetails.certificate_number;
//           setFullCertNumber(fullNum);
//           const numberPart = fullNum.split("HQ")[1];
//           setCertNumber(numberPart);
          
//           // Pre-fill form fields
//           setRankAndName(`${certDetails.personnel_rank || ""} ${certDetails.personnel_name || ""}`.trim());
//           setParticipatedIn(certDetails.participated_in || "");
//           setConfirmed(certDetails.status === "fit" ? "Fit" : 
//                         certDetails.status === "not fit" ? "Not Fit" : 
//                         certDetails.status === "excused" ? "Excused" : "");
//           setAtLocation(certDetails.location || "");
//           setIssuedDay(certDetails.issued_day || "");
//           setIssuedMonth(certDetails.issued_month || "");
//           setIssuedYear(certDetails.issued_year?.slice(-2) || "");
          
//           console.log("[CERTIFICATE] Loaded existing certificate:", fullNum);
//           return;
//         }
        
//         // Step 2: No existing certificate - get next number from BACKEND
//         const nextNumData = await getNextCertificateNumber();
//         const fullNumber = nextNumData.next_certificate_number;
//         setFullCertNumber(fullNumber);
//         const numberPart = fullNumber.split("HQ")[1];
//         setCertNumber(numberPart);
        
//         console.log("[CERTIFICATE] Got next certificate number from backend:", fullNumber);

//         // Set default date values
//         const now = new Date();
//         const days = [
//           "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th",
//           "11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th", "20th",
//           "21st", "22nd", "23rd", "24th", "25th", "26th", "27th", "28th", "29th", "30th", "31st",
//         ];
//         const months = [
//           "January", "February", "March", "April", "May", "June",
//           "July", "August", "September", "October", "November", "December",
//         ];

//         setIssuedDay(days[now.getDate() - 1] || `${now.getDate()}th`);
//         setIssuedMonth(months[now.getMonth()]);
//         setIssuedYear(now.getFullYear().toString().slice(-2));
        
//       } catch (err) {
//         console.error("[CERTIFICATE] Initialization error:", err);
//         // Fallback: generate locally if backend fails
//         const fallbackNum = "054991";
//         setCertNumber(fallbackNum);
//         setFullCertNumber(`NAF/786/HQ${fallbackNum}`);
//         alert("Warning: Could not get certificate number from server. Using fallback.");
//       }
//     };
    
//     initCertificate();
//   }, [id]);

//   // Fetch PFT record
//   useEffect(() => {
//     const endpoint = isSuperAdmin
//       ? `${API_BASE}/superadmin/pft-results/${id}`
//       : `${API_BASE}/api/pft-results/${id}`;

//     fetch(endpoint, { credentials: "include" })
//       .then((res) => res.json())
//       .then((data) => {
//         setResult(data);
//         // Only set rankAndName if not already set from existing certificate
//         setRankAndName(prev => prev || `${data.rank || ""} ${data.full_name || ""}`.trim());
//         setLoading(false);
//       })
//       .catch(() => {
//         alert("Failed to load record for certificate");
//         navigate(isSuperAdmin ? "/superadmin/pft-results" : "/admin/personnel");
//       });
//   }, [id, isSuperAdmin, navigate]);

//   // ============ SAVE CERTIFICATE TO DATABASE ============
//   const saveCertificate = async () => {
//     if (!confirmed) {
//       alert("Please select a status (Fit, Not Fit, or Excused)");
//       return;
//     }

//     setIsSaving(true);
//     setSaveError(null);

//     try {
//       const certificateData = {
//         pft_result_id: parseInt(id),
//         participated_in: participatedIn,
//         status: confirmed.toLowerCase(),
//         location: atLocation,
//         issued_day: issuedDay,
//         issued_month: issuedMonth,
//         issued_year: "20" + issuedYear,
//       };

//       const savedCert = await createCertificate(certificateData);
//       console.log("Certificate saved:", savedCert);
      
//       // Update with the ACTUAL number from server
//       const actualFullNumber = savedCert.certificate_number;
//       setFullCertNumber(actualFullNumber);
//       setCertNumber(actualFullNumber.split("HQ")[1]);
      
//       setIsSaved(true);
//       setExistingCert(savedCert);
//       alert(`Certificate saved successfully!\nNumber: ${actualFullNumber}`);
      
//       return savedCert;
//     } catch (err) {
//       console.error("Save failed:", err);
//       setSaveError(err.message);
      
//       // Check if error is due to duplicate/certificate already exists
//       if (err.message?.includes("already exists")) {
//         alert("A certificate already exists for this record. Reloading page...");
//         window.location.reload();
//       } else {
//         alert("Failed to save certificate: " + err.message);
//       }
      
//       return null;
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // ============ GENERATE PDF FOR DOWNLOAD ============
//   const generatePDF = async () => {
//     const input = certRef.current;
//     if (!input) return;

//     const originalStyles = {
//       transform: input.style.transform,
//       width: input.style.width,
//       maxWidth: input.style.maxWidth,
//       height: input.style.height,
//       overflow: input.style.overflow,
//     };

//     input.style.transform = "none";
//     input.style.width = "850px";
//     input.style.maxWidth = "850px";
//     input.style.height = "auto";
//     input.style.overflow = "visible";
//     input.classList.add("pdf-mode");

//     await new Promise((r) => setTimeout(r, 500));

//     try {
//       const contentHeight = input.scrollHeight;

//       const canvas = await html2canvas(input, {
//         scale: 2,
//         useCORS: true,
//         backgroundColor: "#FAF9F6",
//         width: 850,
//         height: contentHeight,
//         windowWidth: 850,
//         windowHeight: contentHeight,
//       });

//       const pdf = new jsPDF("p", "mm", "a4");
//       const imgData = canvas.toDataURL("image/jpeg", 0.95);

//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();
//       const imgWidth = pageWidth - 20;
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;

//       if (imgHeight > pageHeight - 20) {
//         const scaleFactor = (pageHeight - 20) / imgHeight;
//         const finalWidth = imgWidth * scaleFactor;
//         const finalHeight = imgHeight * scaleFactor;
//         const xOffset = (pageWidth - finalWidth) / 2;
//         pdf.addImage(imgData, "JPEG", xOffset, 10, finalWidth, finalHeight);
//       } else {
//         const yOffset = (pageHeight - imgHeight) / 2;
//         pdf.addImage(imgData, "JPEG", 10, yOffset, imgWidth, imgHeight);
//       }

//       pdf.save(
//         `NAF_PFT_Certificate_${result?.svc_no || "PERSONNEL"}_${certNumber}.pdf`,
//       );
//     } finally {
//       Object.assign(input.style, originalStyles);
//       input.classList.remove("pdf-mode");
//     }
//   };

//   // ============ SEND CERTIFICATE VIA EMAIL ============
//   const sendCertificate = async () => {
//     if (!result?.email) {
//       alert("No email address found for this personnel.");
//       return;
//     }

//     setIsSending(true);

//     const input = certRef.current;
//     if (!input) {
//       setIsSending(false);
//       return;
//     }

//     const originalStyles = {
//       transform: input.style.transform,
//       width: input.style.width,
//       maxWidth: input.style.maxWidth,
//       height: input.style.height,
//       overflow: input.style.overflow,
//     };

//     try {
//       input.style.transform = "none";
//       input.style.width = "850px";
//       input.style.maxWidth = "850px";
//       input.style.height = "auto";
//       input.style.overflow = "visible";
//       input.classList.add("pdf-mode");

//       await new Promise((r) => setTimeout(r, 500));

//       const contentHeight = input.scrollHeight;

//       const canvas = await html2canvas(input, {
//         scale: 2,
//         useCORS: true,
//         backgroundColor: "#FAF9F6",
//         width: 850,
//         height: contentHeight,
//         windowWidth: 850,
//         windowHeight: contentHeight,
//       });

//       const pdf = new jsPDF("p", "mm", "a4");
//       const imgData = canvas.toDataURL("image/jpeg", 0.95);

//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();
//       const imgWidth = pageWidth - 20;
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;

//       if (imgHeight > pageHeight - 20) {
//         const scaleFactor = (pageHeight - 20) / imgHeight;
//         const finalWidth = imgWidth * scaleFactor;
//         const finalHeight = imgHeight * scaleFactor;
//         const xOffset = (pageWidth - finalWidth) / 2;
//         pdf.addImage(imgData, "JPEG", xOffset, 10, finalWidth, finalHeight);
//       } else {
//         const yOffset = (pageHeight - imgHeight) / 2;
//         pdf.addImage(imgData, "JPEG", 10, yOffset, imgWidth, imgHeight);
//       }

//       const pdfBlob = pdf.output("blob");

//       if (pdfBlob.size > 4.5 * 1024 * 1024) {
//         alert("Certificate PDF is too large for email. Please download and send manually.");
//         return;
//       }

//       const formData = new FormData();
//       formData.append("email", result.email);
//       formData.append("file", pdfBlob, `NAF_PFT_Certificate_${certNumber}.pdf`);
//       formData.append("personnel_name", result.full_name || "");
//       formData.append("certificate_type", "pft_certificate");
//       formData.append("certificate_number", fullCertNumber || `NAF/786/HQ${certNumber}`);

//       const res = await fetch(`${API_BASE}/send-certificate-pdf`, {
//         method: "POST",
//         credentials: "include",
//         body: formData,
//       });

//       if (!res.ok) throw new Error("Failed to send email");

//       alert(`Certificate sent successfully to ${result.email}`);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to send certificate: " + err.message);
//     } finally {
//       Object.assign(input.style, originalStyles);
//       input.classList.remove("pdf-mode");
//       setIsSending(false);
//     }
//   };

//   const handleBack = () => {
//     if (isSuperAdmin) {
//       navigate("/superadmin/pft-results");
//     } else {
//       navigate("/admin/personnel");
//     }
//   };

//   if (loading)
//     return <div className="loading-text">Loading certificate...</div>;
//   if (!result) return <div className="error">Record not found</div>;

//   return (
//     <div className="certificate-page">
//       {/* Form Section */}
//       <div className="certificate-form">
//         <h2>Issue PFT Certificate</h2>
//         <p className="form-subtitle">
//           {isSaved ? "Certificate has been issued" : "Fill in the certificate details below"}
//         </p>

//         <div className="form-group">
//           <label>Certificate Number</label>
//           <input
//             type="text"
//             value={fullCertNumber || `NAF/786/HQ${certNumber}`}
//             readOnly
//             className="readonly"
//           />
//         </div>

//         <div className="form-group">
//           <label>Rank & Name *</label>
//           <input
//             type="text"
//             value={rankAndName}
//             onChange={(e) => setRankAndName(e.target.value)}
//             placeholder="e.g. Flying Officer John Doe"
//             readOnly={isSaved}
//             style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
//           />
//         </div>

//         <div className="form-group">
//           <label>Participated In *</label>
//           <input
//             type="text"
//             value={participatedIn}
//             onChange={(e) => setParticipatedIn(e.target.value)}
//             placeholder="e.g. NAF Annual PFT 2026"
//             readOnly={isSaved}
//             style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
//           />
//         </div>

//         <div className="form-group">
//           <label>Confirmation Status *</label>
//           <div className="checkbox-group">
//             {["Fit", "Not Fit", "Excused"].map((status) => (
//               <label key={status} className="checkbox-label">
//                 <input
//                   type="checkbox"
//                   checked={confirmed === status}
//                   onChange={() => !isSaved && setConfirmed(status)}
//                   disabled={isSaved}
//                 />
//                 <span>{status}</span>
//               </label>
//             ))}
//           </div>
//         </div>

//         <div className="form-group">
//           <label>At (Location) *</label>
//           <input
//             type="text"
//             value={atLocation}
//             onChange={(e) => setAtLocation(e.target.value)}
//             placeholder="e.g. NAF Base Abuja"
//             readOnly={isSaved}
//             style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
//           />
//         </div>

//         <div className="form-row">
//           <div className="form-group">
//             <label>Day</label>
//             <input
//               type="text"
//               value={issuedDay}
//               onChange={(e) => setIssuedDay(e.target.value)}
//               readOnly={isSaved}
//               style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
//             />
//           </div>
//           <div className="form-group">
//             <label>Month</label>
//             <input
//               type="text"
//               value={issuedMonth}
//               onChange={(e) => setIssuedMonth(e.target.value)}
//               readOnly={isSaved}
//               style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
//             />
//           </div>
//           <div className="form-group">
//             <label>Year (20__)</label>
//             <input
//               type="text"
//               value={issuedYear}
//               onChange={(e) => setIssuedYear(e.target.value)}
//               maxLength="2"
//               readOnly={isSaved}
//               style={isSaved ? { backgroundColor: "#f0f0f0" } : {}}
//             />
//           </div>
//         </div>

//         <div className="form-actions">
//           <button onClick={handleBack} className="btn back-btn">
//             ← Back
//           </button>
          
//           {!isSaved && (
//             <button 
//               onClick={saveCertificate} 
//               className="btn save-btn"
//               disabled={isSaving}
//               style={{background: '#0b3d91'}}
//             >
//               {isSaving ? 'Saving...' : 'Save Certificate'}
//             </button>
//           )}

//           <button 
//             onClick={async () => {
//               if (!isSaved) {
//                 const saved = await saveCertificate();
//                 if (!saved) return;
//               }
//               generatePDF();
//             }} 
//             className="btn pdf-btn"
//             disabled={isSaving}
//           >
//             Download PDF
//           </button>
          
//           <button
//             onClick={async () => {
//               if (!isSaved) {
//                 const saved = await saveCertificate();
//                 if (!saved) return;
//               }
//               sendCertificate();
//             }}
//             className="btn email-btn"
//             disabled={isSending || isSaving}
//           >
//             {isSending ? "Sending..." : "Send to Email"}
//           </button>
//         </div>
        
//         {isSaved && (
//           <p style={{ 
//             marginTop: "10px", 
//             color: "#28a745", 
//             fontSize: "0.9rem",
//             textAlign: "center",
//             fontWeight: "600"
//           }}>
//             ✓ This certificate has been saved. Fields are locked to prevent accidental changes.
//           </p>
//         )}
//       </div>

//       {/* Certificate Preview */}
//       <div className="certificate-preview">
//         <h3>Preview</h3>

//         <div ref={certRef} className="certificate-wrapper">
//           <div className="border-outer"></div>
//           <div className="border-inner"></div>

//           <div className="watermark-layer">
//             {watermarkArray.map((_, index) => (
//               <div key={index} className="watermark-text">
//                 NIGERIAN AIR FORCE
//               </div>
//             ))}
//           </div>

//           <div className="certificate-content">
//             <div className="cert-number-section">
//               <div className="cert-number-full">
//                 {fullCertNumber || `NAF/786/HQ${certNumber}`}
//               </div>
//               <div className="cert-number-note">
//                 (To identify the Comds/053 NAF CAMP)
//               </div>
//             </div>

//             <div className="cert-logo">
//               <img src={airForceLogo} alt="Nigerian Air Force" />
//             </div>

//             <h1 className="cert-main-title">
//               NAF PHYSICAL FITNESS TEST CERTIFICATE
//             </h1>
//             <p className="cert-presented-to">Presented to</p>

//             <div className="cert-fields">
//               <div className="cert-row three-cols">
//                 <div className="cert-field">
//                   <span className="field-label">Rank &amp; Name</span>
//                   <span className="field-line">
//                     {rankAndName || "_______________________"}
//                   </span>
//                 </div>
//                 <div className="cert-field">
//                   <span className="field-label">Svc No.</span>
//                   <span className="field-line">
//                     {result.svc_no || "_______________________"}
//                   </span>
//                 </div>
//                 <div className="cert-field">
//                   <span className="field-label">Unit</span>
//                   <span className="field-line">
//                     {result.unit || "_______________________"}
//                   </span>
//                 </div>
//               </div>

//               <div className="cert-row">
//                 <div className="cert-field full">
//                   <span className="field-label">Participated in:</span>
//                   <span className="field-line">{participatedIn || ""}</span>
//                 </div>
//               </div>

//               <div className="cert-row confirmation-row">
//                 <span className="field-label">and Confirmed:</span>
//                 <div className="confirmation-boxes">
//                   <div
//                     className={`conf-box ${confirmed === "Fit" ? "checked" : ""}`}
//                   >
//                     <span>Fit</span>
//                     <div className="box"></div>
//                   </div>
//                   <div
//                     className={`conf-box ${confirmed === "Not Fit" ? "checked" : ""}`}
//                   >
//                     <span>Not Fit</span>
//                     <div className="box"></div>
//                   </div>
//                   <div
//                     className={`conf-box ${confirmed === "Excused" ? "checked" : ""}`}
//                   >
//                     <span>Excused</span>
//                     <div className="box"></div>
//                   </div>
//                 </div>
//               </div>

//               <div className="cert-row">
//                 <div className="cert-field full">
//                   <span className="field-label">At</span>
//                   <span className="field-line">{atLocation || ""}</span>
//                 </div>
//               </div>

//               <div className="cert-row issued-row">
//                 <span className="issued-text">
//                   Issued on{" "}
//                   <span className="issued-line">
//                     {issuedDay || "__________"}
//                   </span>{" "}
//                   day of{" "}
//                   <span className="issued-line">
//                     {issuedMonth || "__________"}
//                   </span>{" "}
//                   20<span className="issued-line">{issuedYear || "____"}</span>
//                 </span>
//               </div>
//             </div>

//             <div className="cert-bottom">
//               <div className="signature-block">
//                 <div className="signature-line">
//                   <img src={aocSignatureImg} alt="AOC Signature" />
//                 </div>
//                 <div className="signature-label">
//                   AOC/Comd (Sign &amp; Date)
//                 </div>
//               </div>

//               <div className="seal-block">
//                 <img src={seal} alt="Official Seal" />
//               </div>

//               <div className="signature-block">
//                 <div className="signature-line">
//                   <img
//                     src={sportsSignatureImg}
//                     alt="Sports Officer Signature"
//                   />
//                 </div>
//                 <div className="signature-label">
//                   Sports Offr (Sign &amp; Date)
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }