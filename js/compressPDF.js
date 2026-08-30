"use strict";

async function compressPDF(file) {
  if (!file) {
    throw new Error("Please select a PDF file.");
  }

  if (file.type !== "application/pdf") {
    throw new Error("The selected file is not a PDF.");
  }

  if (!window.pdfjsLib) {
    throw new Error("PDF.js is not loaded.");
  }

  if (!window.jspdf) {
    throw new Error("jsPDF is not loaded.");
  }

  const pdfjsLib = window.pdfjsLib;
  const { jsPDF } = window.jspdf;


  if (
    pdfjsLib.GlobalWorkerOptions &&
    !pdfjsLib.GlobalWorkerOptions.workerSrc
  ) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }


  const originalBytes = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: originalBytes
  });

  const sourcePdf = await loadingTask.promise;

  let outputPdf = null;

  for (let pageNumber = 1; pageNumber <= sourcePdf.numPages; pageNumber++) {
    const page = await sourcePdf.getPage(pageNumber);

    const scale = 1.35;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", {
      alpha: false
    });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    context.fillStyle = "#ffffff";
    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    await page.render({
      canvasContext: context,
      viewport
    }).promise;

    const imageData = canvas.toDataURL(
      "image/jpeg",
      0.65
    );

    const orientation =
      viewport.width > viewport.height
        ? "landscape"
        : "portrait";

    if (!outputPdf) {
      outputPdf = new jsPDF({
        orientation,
        unit: "mm",
        format: "a4",
        compress: true
      });
    } else {
      outputPdf.addPage("a4", orientation);
    }

    const pageWidth = orientation === "landscape"
      ? 297
      : 210;

    const pageHeight = orientation === "landscape"
      ? 210
      : 297;

    const imageRatio =
      viewport.width / viewport.height;

    let width = pageWidth;
    let height = width / imageRatio;

    if (height > pageHeight) {
      height = pageHeight;
      width = height * imageRatio;
    }

    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;

    outputPdf.addImage(
      imageData,
      "JPEG",
      x,
      y,
      width,
      height,
      undefined,
      "FAST"
    );

    canvas.width = 1;
    canvas.height = 1;
  }

  if (!outputPdf) {
    throw new Error("Could not process the PDF.");
  }

  const blob = outputPdf.output("blob");

  const originalSize = file.size;
  const compressedSize = blob.size;

  /*
   * إذا الناتج أكبر من الأصلي، نستخدم الأصلي
   * بدل إعطاء المستخدم ملفًا أكبر.
   */
  if (compressedSize >= originalSize) {
    downloadCompressedPDF(
      file,
      createCompressedName(file.name)
    );

    return {
      blob: file,
      originalSize,
      compressedSize: originalSize,
      reduced: false
    };
  }

  downloadCompressedPDF(
    blob,
    createCompressedName(file.name)
  );

  return {
    blob,
    originalSize,
    compressedSize,
    reduced: true
  };
}

function createCompressedName(filename) {
  if (typeof filename !== "string") {
    return "FileFix-compressed.pdf";
  }

  const dot = filename.lastIndexOf(".");

  if (dot === -1) {
    return `${filename}-compressed.pdf`;
  }

  return (
    filename.substring(0, dot) +
    "-compressed.pdf"
  );
}

function downloadCompressedPDF(blob, filename) {
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

window.compressPDF = compressPDF;
