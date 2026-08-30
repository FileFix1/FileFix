"use strict";

async function wordToPDF(file) {
  if (!file) {
    throw new Error("Please select a Word file.");
  }

  if (!window.docx || typeof window.docx.renderAsync !== "function") {
    throw new Error("DOCX library is not loaded.");
  }

  if (!window.html2pdf || typeof window.html2pdf !== "function") {
    throw new Error("PDF library is not loaded.");
  }

  const extension = file.name
    .split(".")
    .pop()
    .toLowerCase();

  if (extension !== "docx") {
    throw new Error("Please select a DOCX file.");
  }

  const buffer = await file.arrayBuffer();

  const container = document.createElement("div");

  container.style.position = "fixed";
  container.style.left = "-100000px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.background = "#fff";
  container.style.color = "#000";

  document.body.appendChild(container);

  try {
    await window.docx.renderAsync(
      buffer,
      container,
      null,
      {
        className: "docx",
        inWrapper: true,
        breakPages: true,
        useBase64URL: true
      }
    );

    const outputName =
      file.name.substring(
        0,
        file.name.lastIndexOf(".")
      ) + ".pdf";

    await window.html2pdf()
      .set({
        margin: 10,
        filename: outputName,
        image: {
          type: "jpeg",
          quality: 0.95
        },
        html2canvas: {
          scale: 2,
          backgroundColor: "#ffffff"
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait"
        }
      })
      .from(container)
      .save();

    return outputName;

  } finally {
    container.remove();
  }
}

window.wordToPDF = wordToPDF;
