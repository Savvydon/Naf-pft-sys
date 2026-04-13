import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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
  const [resultData, setResultData] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const state = location.state;
    if (!state) {
      navigate("/", { replace: true });
      return;
    }
    setResultData(state);
  }, [location.state, navigate]);

  if (!resultData) return null;

  // ---------- GENERATE PDF - EXACT WIDTH MATCH ----------
  // const generatePDF = async (forEmail = false) => {
  //   const input = resultsRef.current;
  //   if (!input) return null;

  //   // Save original styles
  //   const originalStyles = {
  //     position: input.style.position,
  //     top: input.style.top,
  //     left: input.style.left,
  //     width: input.style.width,
  //     maxWidth: input.style.maxWidth,
  //     margin: input.style.margin,
  //     transform: input.style.transform,
  //   };

  //   // Fix: Set exact width to match webpage (A4 width in pixels at 96 DPI)
  //   const A4_WIDTH_MM = 210;
  //   const MM_TO_PX = 3.779527559; // 96 DPI / 25.4 mm
  //   const targetWidthPx = Math.floor(A4_WIDTH_MM * MM_TO_PX); // ~794px

  //   // Reset and set fixed width
  //   input.style.position = "relative";
  //   input.style.top = "0";
  //   input.style.left = "0";
  //   input.style.margin = "0";
  //   input.style.transform = "none";
  //   input.style.width = targetWidthPx + "px";
  //   input.style.maxWidth = targetWidthPx + "px";

  //   input.classList.add("pdf-mode");

  //   // Wait for layout to settle
  //   await new Promise((r) => setTimeout(r, 600));

  //   try {
  //     // Capture at exact width
  //     const canvas = await html2canvas(input, {
  //       scale: forEmail ? 1.2 : 2, // Slightly reduced scale for better fit
  //       backgroundColor: "#ffffff",
  //       useCORS: true,
  //       allowTaint: true,
  //       logging: false,
  //       width: targetWidthPx,
  //       windowWidth: targetWidthPx,
  //       x: 0,
  //       y: 0,
  //       scrollX: 0,
  //       scrollY: -window.scrollY, // Account for scroll position
  //     });

  //     const pdf = new jsPDF("p", "mm", "a4");

  //     const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  //     const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

  //     // Small margins
  //     const marginX = 5;
  //     const marginY = 2;
  //     const usableWidth = pageWidth - marginX * 2;
  //     const usableHeight = pageHeight - marginY * 2;

  //     const imgWidth = canvas.width;
  //     const imgHeight = canvas.height;

  //     // Calculate exact ratio to fit width perfectly
  //     const ratio = usableWidth / (imgWidth / (forEmail ? 1.2 : 2)); // Adjust for scale

  //     // Better approach: use direct dimensions
  //     const pdfImgWidth = usableWidth;
  //     const pdfImgHeight = (imgHeight * usableWidth) / imgWidth;

  //     // If content fits on one page
  //     if (pdfImgHeight <= usableHeight) {
  //       const imgData = canvas.toDataURL("image/jpeg", forEmail ? 0.7 : 0.9);
  //       pdf.addImage(
  //         imgData,
  //         "JPEG",
  //         marginX,
  //         marginY,
  //         pdfImgWidth,
  //         pdfImgHeight,
  //       );
  //     } else {
  //       // Multi-page with exact width preservation
  //       let positionY = marginY;
  //       let sourceY = 0;
  //       const pageHeightPx = (usableHeight * imgWidth) / pdfImgWidth;

  //       while (sourceY < imgHeight) {
  //         if (sourceY > 0) {
  //           pdf.addPage();
  //           positionY = marginY;
  //         }

  //         const sliceHeight = Math.min(pageHeightPx, imgHeight - sourceY);
  //         const tempCanvas = document.createElement("canvas");
  //         tempCanvas.width = imgWidth;
  //         tempCanvas.height = sliceHeight;

  //         const ctx = tempCanvas.getContext("2d");
  //         ctx.fillStyle = "#ffffff";
  //         ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  //         ctx.drawImage(
  //           canvas,
  //           0,
  //           sourceY,
  //           imgWidth,
  //           sliceHeight,
  //           0,
  //           0,
  //           imgWidth,
  //           sliceHeight,
  //         );

  //         const imgData = tempCanvas.toDataURL(
  //           "image/jpeg",
  //           forEmail ? 0.7 : 0.9,
  //         );
  //         const slicePdfHeight = (sliceHeight * pdfImgWidth) / imgWidth;

  //         pdf.addImage(
  //           imgData,
  //           "JPEG",
  //           marginX,
  //           positionY,
  //           pdfImgWidth,
  //           slicePdfHeight,
  //         );

  //         sourceY += sliceHeight;
  //       }
  //     }

  //     return pdf;
  //   } finally {
  //     // Restore original styles
  //     Object.assign(input.style, originalStyles);
  //     input.classList.remove("pdf-mode");
  //   }
  // };

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

    // Get the full content width (including any overflowing content)
    const contentWidth = input.scrollWidth;
    const contentHeight = input.scrollHeight;

    // A4 dimensions
    const A4_WIDTH_MM = 210;
    const MM_TO_PX = 3.779527559;
    const a4WidthPx = Math.floor(A4_WIDTH_MM * MM_TO_PX); // ~794px

    // Set exact dimensions for capture - use actual content width
    input.style.position = "absolute";
    input.style.top = "0";
    input.style.left = "0";
    input.style.margin = "0";
    input.style.transform = "none";
    input.style.width = contentWidth + "px";
    input.style.maxWidth = "none";
    input.style.minWidth = contentWidth + "px";

    input.classList.add("pdf-mode");

    // Wait for layout to settle
    await new Promise((r) => setTimeout(r, 600));

    try {
      // Capture at higher resolution for quality
      const captureScale = forEmail ? 2 : 3;

      const canvas = await html2canvas(input, {
        scale: captureScale,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: contentWidth,
        height: contentHeight,
        windowWidth: contentWidth,
        windowHeight: contentHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Margins
      const marginX = 5;
      const marginY = 2;
      const usableWidth = pageWidth - marginX * 2;
      const usableHeight = pageHeight - marginY * 2;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Scale image to fit usable width while maintaining aspect ratio
      const pdfImgWidth = usableWidth;
      const pdfImgHeight = (imgHeight * usableWidth) / imgWidth;

      // If content fits on one page
      if (pdfImgHeight <= usableHeight) {
        const imgData = canvas.toDataURL("image/jpeg", forEmail ? 0.85 : 0.95);
        pdf.addImage(
          imgData,
          "JPEG",
          marginX,
          marginY,
          pdfImgWidth,
          pdfImgHeight
        );
      } else {
        // Multi-page with proper scaling
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
            sliceHeight
          );

          const imgData = tempCanvas.toDataURL("image/jpeg", forEmail ? 0.85 : 0.95);
          const slicePdfHeight = (sliceHeight * pdfImgWidth) / imgWidth;

          pdf.addImage(
            imgData,
            "JPEG",
            marginX,
            positionY,
            pdfImgWidth,
            slicePdfHeight
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
      pdf.save(`NAF_PFT_${resultData.svc_no || "RESULT"}.pdf`);
    } catch (e) {
      console.error("PDF download error:", e);
      alert("Failed to generate PDF");
    }
  };

  // ---------- SEND EMAIL ----------
  const sendEmail = async () => {
    if (isSending) return;

    console.log("=== Send Email clicked ===");
    console.log("Sending to:", resultData.email);
    console.log("Personnel name:", resultData.full_name);

    if (!resultData.email) {
      alert("No email address provided. Please enter an email in the form.");
      return;
    }

    setIsSending(true);

    try {
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
      formData.append("email", resultData.email);
      formData.append("file", pdfBlob, "NAF_PFT_Report.pdf");
      formData.append("personnel_name", resultData.full_name || "");

      const res = await fetch(
        "https://naf-pft-sys-1.onrender.com/send-report-pdf",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errText = errData.detail || (await res.text());
        console.error("Server error:", res.status, errText);
        throw new Error(`Server error: ${res.status} - ${errText}`);
      }

      const data = await res.json();
      console.log("Email sent successfully:", data);
      alert("Report sent successfully to " + resultData.email);
    } catch (err) {
      console.error("Send email failed:", err);
      alert("Failed to send email: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const goToHome = () => {
    navigate("/", { replace: true });
  };

  return (
    <>
      <div className="results" ref={resultsRef}>
        <Header />
        <PersonalInfo state={resultData} />
        <StatusGroups state={resultData} />
        <OverallRecommendation state={resultData} />
      </div>

      <ActionButtons
        onDownload={downloadPDF}
        onHome={goToHome}
        sendMail={sendEmail}
        isSending={isSending}
      />
    </>
  );
}

// import { useLocation, useNavigate } from "react-router-dom";
// import { useEffect, useRef, useState } from "react";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";

// import Header from "./results/Header";
// import PersonalInfo from "./results/PersonalInfo";
// import StatusGroups from "./results/StatusGroups";
// import ActionButtons from "./results/ActionButtons";
// import OverallRecommendation from "./results/OverallRecommendation";

// import "../styles/Results.css";

// export default function Results() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const resultsRef = useRef(null);
//   const [resultData, setResultData] = useState(null);
//   const [isSending, setIsSending] = useState(false);

//   useEffect(() => {
//     const state = location.state;
//     if (!state) {
//       navigate("/", { replace: true });
//       return;
//     }
//     setResultData(state);
//   }, [location.state, navigate]);

//   if (!resultData) return null;

//   // ---------- GENERATE PDF - REDUCED SIZE FOR EMAIL ----------
//   const generatePDF = async (forEmail = false) => {
//     const input = resultsRef.current;
//     if (!input) return null;

//     input.classList.add("pdf-mode");
//     await new Promise((r) => setTimeout(r, 300));

//     // Use much lower scale for email to keep size under 5MB
//     const scale = forEmail ? 0.8 : 1.5;

//     const canvas = await html2canvas(input, {
//       scale: scale,
//       backgroundColor: "#ffffff",
//       windowWidth: 924,
//       imageTimeout: 0, // Don't timeout on images
//       useCORS: true,
//     });

//     const pdf = new jsPDF("p", "mm", "a4");

//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();
//     const marginX = 15;
//     const marginY = 20;
//     const usableWidth = pageWidth - marginX * 2;

//     const ratio = usableWidth / canvas.width;
//     const pageCanvasHeight = (pageHeight - marginY * 2) / ratio;

//     let renderedHeight = 0;

//     while (renderedHeight < canvas.height) {
//       const sliceHeight = Math.min(
//         pageCanvasHeight,
//         canvas.height - renderedHeight,
//       );

//       const tempCanvas = document.createElement("canvas");
//       tempCanvas.width = canvas.width;
//       tempCanvas.height = sliceHeight;

//       const ctx = tempCanvas.getContext("2d");
//       ctx.drawImage(
//         canvas,
//         0,
//         renderedHeight,
//         canvas.width,
//         sliceHeight,
//         0,
//         0,
//         canvas.width,
//         sliceHeight,
//       );

//       // Use JPEG with lower quality for smaller file size
//       const imgData = tempCanvas.toDataURL("image/jpeg", forEmail ? 0.6 : 0.9);

//       pdf.addImage(
//         imgData,
//         "JPEG",
//         marginX,
//         marginY,
//         usableWidth,
//         sliceHeight * ratio,
//       );

//       renderedHeight += sliceHeight;
//       if (renderedHeight < canvas.height) {
//         pdf.addPage();
//       }
//     }

//     input.classList.remove("pdf-mode");
//     return pdf;
//   };

//   // ---------- DOWNLOAD PDF - HIGH QUALITY ----------
//   const downloadPDF = async () => {
//     try {
//       const pdf = await generatePDF(false); // High quality
//       if (!pdf) return;
//       pdf.save(`NAF_PFT_${resultData.svc_no || "RESULT"}.pdf`);
//     } catch (e) {
//       console.error("PDF download error:", e);
//       alert("Failed to generate PDF");
//     }
//   };

//   // ---------- SEND EMAIL - LOW QUALITY FOR SIZE ----------
//   const sendEmail = async () => {
//     if (isSending) return;

//     console.log("=== Send Email clicked ===");
//     console.log("Sending to:", resultData.email);

//     if (!resultData.email) {
//       alert("No email address provided. Please enter an email in the form.");
//       return;
//     }

//     setIsSending(true);

//     try {
//       // Generate LOW QUALITY PDF for email (smaller size)
//       const pdf = await generatePDF(true);
//       if (!pdf) throw new Error("Failed to generate PDF");

//       // Get PDF as Blob with compression
//       const pdfBlob = pdf.output("blob");

//       console.log("PDF Blob size:", pdfBlob.size, "bytes");
//       console.log("PDF Blob type:", pdfBlob.type);

//       // Check size - if still too large, warn user
//       if (pdfBlob.size > 4.5 * 1024 * 1024) {
//         // 4.5MB limit for safety
//         alert(
//           "PDF is still too large for email even with compression. Please download and send manually.",
//         );
//         setIsSending(false);
//         return;
//       }

//       // Create FormData
//       const formData = new FormData();
//       formData.append("email", resultData.email);
//       formData.append("file", pdfBlob, "NAF_PFT_Report.pdf");

//       const res = await fetch(
//         "https://naf-pft-sys-1.onrender.com/send-report-pdf",
//         {
//           method: "POST",
//           credentials: "include",
//           body: formData,
//         },
//       );

//       if (!res.ok) {
//         const errData = await res.json().catch(() => ({}));
//         const errText = errData.detail || (await res.text());
//         console.error("Server error:", res.status, errText);
//         throw new Error(`Server error: ${res.status} - ${errText}`);
//       }

//       const data = await res.json();
//       console.log("Email sent successfully:", data);
//       alert("Report sent successfully to " + resultData.email);
//     } catch (err) {
//       console.error("Send email failed:", err);
//       alert("Failed to send email: " + err.message);
//     } finally {
//       setIsSending(false);
//     }
//   };

//   const goToHome = () => {
//     navigate("/", { replace: true });
//   };

//   return (
//     <>
//       <div className="results" ref={resultsRef}>
//         <Header />
//         <PersonalInfo state={resultData} />
//         <StatusGroups state={resultData} />
//         <OverallRecommendation state={resultData} />
//       </div>

//       <ActionButtons
//         onDownload={downloadPDF}
//         onHome={goToHome}
//         sendMail={sendEmail}
//         isSending={isSending}
//       />
//     </>
//   );
// }

// import { useLocation, useNavigate } from "react-router-dom";
// import { useEffect, useRef, useState } from "react";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";

// import Header from "./results/Header";
// import PersonalInfo from "./results/PersonalInfo";
// import StatusGroups from "./results/StatusGroups";
// import ActionButtons from "./results/ActionButtons";
// import OverallRecommendation from "./results/OverallRecommendation";

// import "../styles/Results.css";

// export default function Results() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const resultsRef = useRef(null);
//   const [resultData, setResultData] = useState(null);
//   const [isSending, setIsSending] = useState(false);

//   // Get data from navigation state only (no localStorage/sessionStorage)
//   useEffect(() => {
//     const state = location.state;

//     if (!state) {
//       // No data available, redirect to form
//       navigate("/", { replace: true });
//       return;
//     }

//     setResultData(state);
//   }, [location.state, navigate]);

//   if (!resultData) return null;

//   // ---------- GENERATE PDF ----------
//   const generatePDF = async () => {
//     const input = resultsRef.current;
//     if (!input) return null;

//     input.classList.add("pdf-mode");
//     await new Promise((r) => setTimeout(r, 300));

//     const canvas = await html2canvas(input, {
//       scale: 1.5, // Reduced scale to make PDF smaller
//       backgroundColor: "#ffffff",
//       windowWidth: 924,
//     });

//     const pdf = new jsPDF("p", "mm", "a4");

//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();

//     const marginX = 15;
//     const marginY = 20;
//     const usableWidth = pageWidth - marginX * 2;

//     const ratio = usableWidth / canvas.width;
//     const pageCanvasHeight = (pageHeight - marginY * 2) / ratio;

//     let renderedHeight = 0;

//     while (renderedHeight < canvas.height) {
//       const sliceHeight = Math.min(
//         pageCanvasHeight,
//         canvas.height - renderedHeight,
//       );

//       const tempCanvas = document.createElement("canvas");
//       tempCanvas.width = canvas.width;
//       tempCanvas.height = sliceHeight;

//       const ctx = tempCanvas.getContext("2d");

//       ctx.drawImage(
//         canvas,
//         0,
//         renderedHeight,
//         canvas.width,
//         sliceHeight,
//         0,
//         0,
//         canvas.width,
//         sliceHeight,
//       );

//       pdf.addImage(
//         tempCanvas.toDataURL("image/png"),
//         "PNG",
//         marginX,
//         marginY,
//         usableWidth,
//         sliceHeight * ratio,
//       );

//       renderedHeight += sliceHeight;

//       if (renderedHeight < canvas.height) {
//         pdf.addPage();
//       }
//     }

//     input.classList.remove("pdf-mode");

//     return pdf;
//   };

//   // ---------- DOWNLOAD PDF ----------
//   const downloadPDF = async () => {
//     try {
//       const pdf = await generatePDF();
//       if (!pdf) return;

//       pdf.save(`NAF_PFT_${resultData.svc_no || "RESULT"}.pdf`);
//     } catch (e) {
//       console.error("PDF download error:", e);
//     }
//   };

//   // ---------- SEND EMAIL ----------
//   const sendEmail = async () => {
//     if (isSending) return;

//     console.log("=== Send Email clicked ===");
//     console.log("Sending to:", resultData.email);
//     console.log("Service No:", resultData.svc_no);
//     console.log("Name:", resultData.full_name);

//     if (!resultData.email) {
//       alert("No email address provided. Please enter an email in the form.");
//       return;
//     }

//     setIsSending(true);

//     try {
//       // Generate PDF first
//       const pdf = await generatePDF();
//       if (!pdf) throw new Error("Failed to generate PDF");

//       // Get PDF as Blob
//       const pdfBlob = pdf.output("blob");

//       console.log("PDF Blob size:", pdfBlob.size, "bytes");
//       console.log("PDF Blob type:", pdfBlob.type);

//       // Warn if PDF is too large
//       if (pdfBlob.size > 25 * 1024 * 1024) {
//         alert("PDF is too large to email (>25MB). Try downloading instead.");
//         setIsSending(false);
//         return;
//       }

//       // Create FormData
//       const formData = new FormData();
//       formData.append("email", resultData.email);
//       formData.append("file", pdfBlob, "NAF_PFT_Report.pdf");

//       const res = await fetch(
//         "https://naf-pft-sys-1.onrender.com/send-report-pdf",
//         {
//           method: "POST",
//           credentials: "include",
//           body: formData,
//         },
//       );

//       if (!res.ok) {
//         const errData = await res.json().catch(() => ({}));
//         const errText = errData.detail || (await res.text());
//         console.error("Server error:", res.status, errText);
//         throw new Error(`Server error: ${res.status} - ${errText}`);
//       }

//       const data = await res.json();
//       console.log("Email sent successfully:", data);
//       alert("Report sent successfully to " + resultData.email);
//     } catch (err) {
//       console.error("Send email failed:", err);
//       alert("Failed to send email: " + err.message);
//     } finally {
//       setIsSending(false);
//     }
//   };

//   // ---------- BACK HOME ----------
//   const goToHome = () => {
//     navigate("/", { replace: true });
//   };

//   return (
//     <>
//       <div className="results" ref={resultsRef}>
//         <Header />
//         <PersonalInfo state={resultData} />
//         <StatusGroups state={resultData} />
//         <OverallRecommendation state={resultData} />
//       </div>

//       <ActionButtons
//         onDownload={downloadPDF}
//         onHome={goToHome}
//         sendMail={sendEmail}
//         isSending={isSending}
//       />
//     </>
//   );
// }

// import { useLocation, useNavigate } from "react-router-dom";
// import { useEffect, useRef, useState } from "react";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";

// import Header from "./results/Header";
// import PersonalInfo from "./results/PersonalInfo";
// import StatusGroups from "./results/StatusGroups";
// import ActionButtons from "./results/ActionButtons";
// import OverallRecommendation from "./results/OverallRecommendation";

// import "../styles/Results.css";

// export default function Results() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const resultsRef = useRef(null);
//   const [resultData, setResultData] = useState(null);

//   // Get data from navigation state only (no localStorage/sessionStorage)
//   useEffect(() => {
//     const state = location.state;

//     if (!state) {
//       // No data available, redirect to form
//       navigate("/", { replace: true });
//       return;
//     }

//     setResultData(state);
//   }, [location.state, navigate]);

//   if (!resultData) return null;

//   // ---------- GENERATE PDF ----------
//   const generatePDF = async () => {
//     const input = resultsRef.current;
//     if (!input) return null;

//     input.classList.add("pdf-mode");
//     await new Promise((r) => setTimeout(r, 300));

//     const canvas = await html2canvas(input, {
//       scale: 2,
//       backgroundColor: "#ffffff",
//       windowWidth: 924,
//     });

//     const pdf = new jsPDF("p", "mm", "a4");

//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();

//     const marginX = 15;
//     const marginY = 20;
//     const usableWidth = pageWidth - marginX * 2;

//     const ratio = usableWidth / canvas.width;
//     const pageCanvasHeight = (pageHeight - marginY * 2) / ratio;

//     let renderedHeight = 0;

//     while (renderedHeight < canvas.height) {
//       const sliceHeight = Math.min(
//         pageCanvasHeight,
//         canvas.height - renderedHeight,
//       );

//       const tempCanvas = document.createElement("canvas");
//       tempCanvas.width = canvas.width;
//       tempCanvas.height = sliceHeight;

//       const ctx = tempCanvas.getContext("2d");

//       ctx.drawImage(
//         canvas,
//         0,
//         renderedHeight,
//         canvas.width,
//         sliceHeight,
//         0,
//         0,
//         canvas.width,
//         sliceHeight,
//       );

//       pdf.addImage(
//         tempCanvas.toDataURL("image/png"),
//         "PNG",
//         marginX,
//         marginY,
//         usableWidth,
//         sliceHeight * ratio,
//       );

//       renderedHeight += sliceHeight;

//       if (renderedHeight < canvas.height) {
//         pdf.addPage();
//       }
//     }

//     input.classList.remove("pdf-mode");

//     return pdf;
//   };

//   // ---------- DOWNLOAD PDF ----------
//   const downloadPDF = async () => {
//     try {
//       const pdf = await generatePDF();
//       if (!pdf) return;

//       pdf.save(`NAF_PFT_${resultData.svc_no || "RESULT"}.pdf`);
//     } catch (e) {
//       console.error("PDF download error:", e);
//     }
//   };

//   // ---------- SEND EMAIL ----------
//   const sendEmail = async () => {
//     console.log("=== Send Email clicked ===");
//     console.log("Sending to:", resultData.email);
//     console.log("Service No:", resultData.svc_no);
//     console.log("Name:", resultData.full_name);

//     try {
//       const pdf = await generatePDF();

//       if (!pdf) throw new Error("Failed to generate PDF");

//       const pdfBlob = pdf.output("blob");

//       const formData = new FormData();
//       formData.append("email", resultData.email);
//       formData.append("file", pdfBlob, "NAF_PFT_Report.pdf");

//       const res = await fetch(
//         "https://naf-pft-sys-1.onrender.com/send-report-pdf",
//         {
//           method: "POST",
//           credentials: "include",
//           body: formData,
//         },
//       );

//       if (!res.ok) {
//         const errText = await res.text();
//         console.error("Server error:", errText);
//         throw new Error("Email failed");
//       }

//       alert("Report sent successfully!");
//     } catch (err) {
//       console.error("Send email failed:", err);
//       alert("Failed to send email.");
//     }
//   };

//   // ---------- BACK HOME ----------
//   const goToHome = () => {
//     navigate("/", { replace: true });
//   };

//   return (
//     <>
//       <div className="results" ref={resultsRef}>
//         <Header />
//         <PersonalInfo state={resultData} />
//         <StatusGroups state={resultData} />
//         <OverallRecommendation state={resultData} />
//       </div>

//       <ActionButtons
//         onDownload={downloadPDF}
//         onHome={goToHome}
//         sendMail={sendEmail}
//       />
//     </>
//   );
// }

// import { useLocation, useNavigate } from "react-router-dom";
// import { useEffect, useRef } from "react";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";

// import Header from "./results/Header";
// import PersonalInfo from "./results/PersonalInfo";
// import StatusGroups from "./results/StatusGroups";
// import ActionButtons from "./results/ActionButtons";
// import OverallRecommendation from "./results/OverallRecommendation";

// import "../styles/Results.css";

// export default function Results() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const resultsRef = useRef(null);

//   const state =
//     location.state || JSON.parse(sessionStorage.getItem("naf_pft_result"));

//   useEffect(() => {
//     if (!state) {
//       navigate("/", { replace: true });
//     }
//   }, [state, navigate]);

//   if (!state) return null;

//   // ---------- GENERATE PDF ----------
//   const generatePDF = async () => {
//     const input = resultsRef.current;
//     if (!input) return null;

//     input.classList.add("pdf-mode");
//     await new Promise((r) => setTimeout(r, 300));

//     const canvas = await html2canvas(input, {
//       scale: 2,
//       backgroundColor: "#ffffff",
//       windowWidth: 924,
//     });

//     const pdf = new jsPDF("p", "mm", "a4");

//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();

//     const marginX = 15;
//     const marginY = 20;
//     const usableWidth = pageWidth - marginX * 2;

//     const ratio = usableWidth / canvas.width;
//     const pageCanvasHeight = (pageHeight - marginY * 2) / ratio;

//     let renderedHeight = 0;

//     while (renderedHeight < canvas.height) {
//       const sliceHeight = Math.min(
//         pageCanvasHeight,
//         canvas.height - renderedHeight,
//       );

//       const tempCanvas = document.createElement("canvas");
//       tempCanvas.width = canvas.width;
//       tempCanvas.height = sliceHeight;

//       const ctx = tempCanvas.getContext("2d");

//       ctx.drawImage(
//         canvas,
//         0,
//         renderedHeight,
//         canvas.width,
//         sliceHeight,
//         0,
//         0,
//         canvas.width,
//         sliceHeight,
//       );

//       pdf.addImage(
//         tempCanvas.toDataURL("image/png"),
//         "PNG",
//         marginX,
//         marginY,
//         usableWidth,
//         sliceHeight * ratio,
//       );

//       renderedHeight += sliceHeight;

//       if (renderedHeight < canvas.height) {
//         pdf.addPage();
//       }
//     }

//     input.classList.remove("pdf-mode");

//     return pdf;
//   };

//   // ---------- DOWNLOAD PDF ----------
//   const downloadPDF = async () => {
//     try {
//       const pdf = await generatePDF();
//       if (!pdf) return;

//       pdf.save(`NAF_PFT_${state.svc_no || "RESULT"}.pdf`);
//     } catch (e) {
//       console.error("PDF download error:", e);
//     }
//   };

//   // ---------- SEND EMAIL ----------
//   const sendEmail = async () => {
//     console.log("=== Send Email clicked ===");
//     console.log("Sending to:", state.email);
//     console.log("Service No:", state.svc_no);
//     console.log("Name:", state.full_name);

//     try {
//       const pdf = await generatePDF();

//       if (!pdf) throw new Error("Failed to generate PDF");

//       const pdfBlob = pdf.output("blob");

//       const formData = new FormData();
//       formData.append("email", state.email);
//       formData.append("file", pdfBlob, "NAF_PFT_Report.pdf");

//       const res = await fetch("https://naf-pft-sys.onrender.com/send-report", {
//         method: "POST",
//         body: formData,
//       });

//       if (!res.ok) {
//         const errText = await res.text();
//         console.error("Server error:", errText);
//         throw new Error("Email failed");
//       }

//       alert("Report sent successfully!");
//     } catch (err) {
//       console.error("Send email failed:", err);
//       alert("Failed to send email.");
//     }
//   };

//   // ---------- BACK HOME ----------
//   const goToHome = () => {
//     sessionStorage.removeItem("naf_pft_result");
//     navigate("/", { replace: true });
//   };

//   return (
//     <>
//       <div className="results" ref={resultsRef}>
//         <Header />
//         <PersonalInfo state={state} />
//         <StatusGroups state={state} />
//         <OverallRecommendation state={state} />
//       </div>

//       <ActionButtons
//         onDownload={downloadPDF}
//         onHome={goToHome}
//         sendMail={sendEmail}
//       />
//     </>
//   );
// }
