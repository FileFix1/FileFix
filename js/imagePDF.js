"use strict";

async function imagesToPDF(files) {
  if (!files || files.length === 0) {
    throw new Error("No images selected.");
  }

  if (typeof window.jspdf === "undefined") {
    throw new Error("jsPDF is not loaded.");
  }

  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (!file.type.startsWith("image/")) {
      continue;
    }

    const dataUrl = await readFileAsDataURL(file);
    const image = await loadImage(dataUrl);

    if (i > 0) {
      pdf.addPage();
    }

    const pageWidth = 210;
    const pageHeight = 297;

    const margin = 10;

    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    const imageRatio = image.width / image.height;

    let width = maxWidth;
    let height = width / imageRatio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * imageRatio;
    }

    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;

    const format = getImageFormat(file);

    pdf.addImage(
      dataUrl,
      format,
      x,
      y,
      width,
      height,
      undefined,
      "FAST"
    );
  }

  const blob = pdf.output("blob");

  downloadBlob(blob, "FileFix-images.pdf");

  return blob;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);

    reader.onerror = () => {
      reject(new Error("Failed to read image."));
    };

    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () => {
      reject(new Error("Failed to load image."));
    };

    image.src = src;
  });
}

function getImageFormat(file) {
  const type = file.type.toLowerCase();

  if (type === "image/png") {
    return "PNG";
  }

  if (type === "image/webp") {
    return "WEBP";
  }

  return "JPEG";
}

function downloadBlob(blob, filename) {
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

window.imagesToPDF = imagesToPDF;
