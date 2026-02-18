const downloadPDF = async () => {
  const input = resultsRef.current;
  if (!input) return;

  try {
    // 🔹 Force desktop layout
    input.classList.add("pdf-mode");

    // Allow browser to reflow layout
    await new Promise((resolve) => setTimeout(resolve, 500));

    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: 794, // Force desktop width
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 15;
    const usableWidth = pageWidth - margin * 2;

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = usableWidth / imgWidth;
    const pageHeightPx = pageHeight / ratio;

    let position = 0;

    while (position < imgHeight) {
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = imgWidth;
      sliceCanvas.height = Math.min(pageHeightPx, imgHeight - position);

      const ctx = sliceCanvas.getContext("2d");
      ctx.drawImage(
        canvas,
        0,
        position,
        imgWidth,
        sliceCanvas.height,
        0,
        0,
        imgWidth,
        sliceCanvas.height,
      );

      pdf.addImage(
        sliceCanvas.toDataURL("image/png"),
        "PNG",
        margin,
        margin,
        usableWidth,
        sliceCanvas.height * ratio,
      );

      position += sliceCanvas.height;
      if (position < imgHeight) pdf.addPage();
    }

    pdf.save(
      `NAF_PFT_${state.svc_no || state.full_name?.replace(/\s+/g, "_") || "result"}.pdf`,
    );
  } catch (err) {
    console.error("PDF generation failed:", err);
  } finally {
    // 🔹 Restore original layout
    input.classList.remove("pdf-mode");
  }
};
