"use strict";

async function mergePDF(files) {
  if (!files || files.length < 2) {
    throw new Error("Please select at least two PDF files.");
  }

  if (typeof window.PDFLib === "undefined") {
    throw new Error("PDF-Lib is not loaded.");
  }

  const { PDFDocument } = window.PDFLib;

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    if (file.type !== "application/pdf") {
      continue;
    }

    const arrayBuffer = await file.arrayBuffer();

    const sourcePdf = await PDFDocument.load(arrayBuffer);

    const pages = await mergedPdf.copyPages(
      sourcePdf,
      sourcePdf.getPageIndices()
    );

    pages.forEach(page => {
      mergedPdf.addPage(page);
    });
  }

  if (mergedPdf.getPageCount() === 0) {
    throw new Error("No valid PDF files found.");
  }

  const pdfBytes = await mergedPdf.save();

  const blob = new Blob(
    [pdfBytes],
    { type: "application/pdf" }
  );

  downloadMergedPDF(
    blob,
    "FileFix-merged.pdf"
  );

  return blob;
}

function downloadMergedPDF(blob, filename) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

window.mergePDF = mergePDF;
