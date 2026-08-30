"use strict";

let currentTool = "image-pdf";
let selectedFiles = [];

const tools = {
  "image-pdf": {
    title: "صور → PDF",
    description: "ارفع صورك لإنشاء ملف PDF.",
    accept: ["image/jpeg", "image/png", "image/webp"],
    multiple: true
  },

  "merge-pdf": {
    title: "دمج PDF",
    description: "اختر ملفات PDF لدمجها في ملف واحد.",
    accept: ["application/pdf"],
    multiple: true
  },

  "compress-pdf": {
    title: "ضغط PDF",
    description: "اختر ملف PDF لتقليل حجمه.",
    accept: ["application/pdf"],
    multiple: false
  },

  "word-pdf": {
    title: "Word → PDF",
    description: "اختر مستند Word لتحويله إلى PDF.",
    accept: [
      ".doc",
      ".docx",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    multiple: false
  }
};

const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const actionArea = document.getElementById("actionArea");
const dropzone = document.getElementById("dropzone");
const status = document.getElementById("status");
const convertBtn = document.getElementById("convertBtn");
const toolTitle = document.getElementById("toolTitle");
const toolDescription = document.getElementById("toolDescription");

document.addEventListener("DOMContentLoaded", init);

function init() {
  loadDarkMode();
  setupFileInput();
  setupDragAndDrop();
  setupKeyboardSupport();
  setupSupport();
  applyLanguage(getSavedLanguage());
}

function setupFileInput() {
  if (!fileInput) return;

  fileInput.addEventListener("change", event => {
    const files = Array.from(event.target.files || []);

    if (files.length) {
      addFiles(files);
    }

    fileInput.value = "";
  });
}

function setupDragAndDrop() {
  if (!dropzone) return;

  ["dragenter", "dragover"].forEach(eventName => {
    dropzone.addEventListener(eventName, event => {
      event.preventDefault();
      event.stopPropagation();
      dropzone.classList.add("dragging");
    });
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropzone.addEventListener(eventName, event => {
      event.preventDefault();
      event.stopPropagation();
      dropzone.classList.remove("dragging");
    });
  });

  dropzone.addEventListener("drop", event => {
    const files = Array.from(event.dataTransfer?.files || []);

    if (files.length) {
      addFiles(files);
    }
  });
}

function setupKeyboardSupport() {
  document.querySelectorAll(".tool-card").forEach(card => {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
  });
}

function selectTool(tool) {
  if (!tools[tool]) return;

  updateTool(tool);
  scrollToWorkspace();
}

function updateTool(tool, resetFiles = true) {
  currentTool = tool;

  const config = tools[tool];

  const lang = document.documentElement.lang === "en" ? "en" : "ar";

  const titles = {
    ar: {
      "image-pdf": "صور → PDF",
      "merge-pdf": "دمج PDF",
      "compress-pdf": "ضغط PDF",
      "word-pdf": "Word → PDF"
    },
    en: {
      "image-pdf": "Images → PDF",
      "merge-pdf": "Merge PDF",
      "compress-pdf": "Compress PDF",
      "word-pdf": "Word → PDF"
    }
  };

  const descriptions = {
    ar: {
      "image-pdf": "ارفع صورك لإنشاء ملف PDF.",
      "merge-pdf": "اختر ملفات PDF لدمجها في ملف واحد.",
      "compress-pdf": "اختر ملف PDF لتقليل حجمه.",
      "word-pdf": "اختر مستند Word لتحويله إلى PDF."
    },
    en: {
      "image-pdf": "Upload your images to create a PDF.",
      "merge-pdf": "Choose PDF files to merge into one file.",
      "compress-pdf": "Choose a PDF file to reduce its size.",
      "word-pdf": "Choose a Word document to convert to PDF."
    }
  };

  if (toolTitle) {
    toolTitle.textContent = titles[lang][tool];
  }

  if (toolDescription) {
    toolDescription.textContent = descriptions[lang][tool];
  }

  if (fileInput) {
    fileInput.accept = config.accept.join(",");
    fileInput.multiple = config.multiple;
  }

  if (resetFiles) {
    selectedFiles = [];
    clearStatus();
    renderFiles();
  }
}

function addFiles(files) {
  if (!files.length) return;

  const config = tools[currentTool];

  const validFiles = files.filter(file =>
    isFileAllowed(file, config.accept)
  );

  if (!validFiles.length) {
    setStatus("نوع الملف غير مدعوم لهذه الأداة.", "error");
    return;
  }

  if (!config.multiple) {
    selectedFiles = [validFiles[0]];
  } else {
    selectedFiles.push(...validFiles);
  }

  selectedFiles = removeDuplicates(selectedFiles);

  clearStatus();
  renderFiles();
}

function isFileAllowed(file, acceptedTypes) {
  if (!file || !file.name) return false;

  const extension = getExtension(file.name).toLowerCase();

  return acceptedTypes.some(type => {
    const normalized = type.toLowerCase();

    if (normalized.startsWith(".")) {
      return `.${extension}` === normalized;
    }

    return file.type.toLowerCase() === normalized;
  });
}

function removeDuplicates(files) {
  const seen = new Set();

  return files.filter(file => {
    const key = [
      file.name,
      file.size,
      file.lastModified,
      file.type
    ].join("|");

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function renderFiles() {
  if (!fileList || !actionArea) return;

  fileList.innerHTML = "";

  if (!selectedFiles.length) {
    fileList.style.display = "none";
    actionArea.style.display = "none";
    return;
  }

  fileList.style.display = "flex";
  actionArea.style.display = "block";

  selectedFiles.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "file-item";

    const type = document.createElement("div");
    type.className = "file-type";
    type.textContent = getExtension(file.name).toUpperCase();

    const info = document.createElement("div");
    info.className = "file-info";

    const name = document.createElement("div");
    name.className = "file-name";
    name.textContent = file.name;
    name.title = file.name;

    const size = document.createElement("div");
    size.className = "file-size";
    size.textContent = formatSize(file.size);

    const removeButton = document.createElement("button");
    removeButton.className = "remove-btn";
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.setAttribute(
      "aria-label",
      `حذف ${file.name}`
    );

    removeButton.addEventListener("click", () => {
      removeFile(index);
    });

    info.appendChild(name);
    info.appendChild(size);

    item.appendChild(type);
    item.appendChild(info);
    item.appendChild(removeButton);

    fileList.appendChild(item);
  });
}

function removeFile(index) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= selectedFiles.length
  ) {
    return;
  }

  selectedFiles.splice(index, 1);

  clearStatus();
  renderFiles();
}

async function processFiles() {
  if (!selectedFiles.length) {
    setStatus("اختر ملفًا أولًا.", "error");
    return;
  }

  if (!convertBtn) return;

  convertBtn.disabled = true;

  const originalText = convertBtn.textContent;

  convertBtn.textContent = "جاري المعالجة...";
  setStatus("جاري معالجة الملف...", "loading");

  try {
    let result;

    if (currentTool === "image-pdf") {
      if (typeof window.imagesToPDF !== "function") {
        throw new Error("imagesToPDF is not loaded.");
      }

      result = await window.imagesToPDF(selectedFiles);

      setStatus(
        "تم تحويل الصور إلى PDF وتنزيل الملف بنجاح.",
        "success"
      );
    }

    else if (currentTool === "merge-pdf") {
      if (typeof window.mergePDF !== "function") {
        throw new Error("mergePDF is not loaded.");
      }

      if (selectedFiles.length < 2) {
        throw new Error("اختر ملفي PDF على الأقل.");
      }

      result = await window.mergePDF(selectedFiles);

      setStatus(
        "تم دمج ملفات PDF وتنزيل الملف بنجاح.",
        "success"
      );
    }

    else if (currentTool === "compress-pdf") {
      if (typeof window.compressPDF !== "function") {
        throw new Error("compressPDF is not loaded.");
      }

      result = await window.compressPDF(selectedFiles[0]);

      const originalSize = formatSize(result.originalSize);
      const compressedSize = formatSize(result.compressedSize);

      if (result.reduced) {
        setStatus(
          `تم الضغط بنجاح: ${originalSize} → ${compressedSize}`,
          "success"
        );
      } else {
        setStatus(
          `الملف مضغوط أصلًا: ${originalSize} → ${compressedSize}`,
          "success"
        );
      }
    }

    else if (currentTool === "word-pdf") {
      if (typeof window.wordToPDF !== "function") {
        throw new Error("wordToPDF is not loaded.");
      }

      result = await window.wordToPDF(selectedFiles[0]);

      setStatus(
        "تم تحويل Word إلى PDF وتنزيل الملف بنجاح.",
        "success"
      );
    }

    else {
      throw new Error("Unknown tool.");
    }

    return result;

  } catch (error) {
    console.error(error);

    setStatus(
      error?.message || "حدث خطأ أثناء معالجة الملف.",
      "error"
    );
  } finally {
    convertBtn.disabled = false;
    convertBtn.textContent = originalText;
  }
}

function getExtension(filename) {
  if (typeof filename !== "string") {
    return "FILE";
  }

  const cleanName = filename.split("?")[0];
  const parts = cleanName.split(".");

  if (parts.length < 2) {
    return "FILE";
  }

  return parts.pop().trim() || "FILE";
}

function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 Bytes";
  }

  if (bytes === 0) {
    return "0 Bytes";
  }

  const units = [
    "Bytes",
    "KB",
    "MB",
    "GB",
    "TB"
  ];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  const size = bytes / Math.pow(1024, index);

  return `${parseFloat(size.toFixed(2))} ${units[index]}`;
}

function setStatus(message, type = "") {
  if (!status) return;

  status.textContent = message || "";
  status.dataset.type = type;
}

function clearStatus() {
  setStatus("");
}

function scrollToTools() {
  const section = document.getElementById("tools");

  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function scrollToWorkspace() {
  const workspace = document.getElementById("workspace");

  if (workspace) {
    workspace.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}


function scrollToSupport() {
  const section = document.getElementById("support");

  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function copyAddress(addressId, button) {
  const addressElement = document.getElementById(addressId);

  if (!addressElement || !button) return;

  const address = addressElement.textContent.trim();

  const copied = () => {
    const originalText = button.textContent;
    button.textContent = document.documentElement.lang === "en" ? "Copied ✓" : "تم النسخ ✓";
    button.classList.add("copied");

    window.setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("copied");
    }, 1800);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(address)
      .then(copied)
      .catch(() => fallbackCopyAddress(address, copied));
  } else {
    fallbackCopyAddress(address, copied);
  }
}

function fallbackCopyAddress(address, onSuccess) {
  const textarea = document.createElement("textarea");

  textarea.value = address;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);
  textarea.select();

  try {
    if (document.execCommand("copy")) {
      onSuccess();
    }
  } catch (error) {
    console.warn("Copy failed:", error);
  }

  textarea.remove();
}

function setupSupport() {
  document.querySelectorAll(".copy-btn[data-address-id]").forEach(button => {
    button.addEventListener("click", () => {
      copyAddress(button.dataset.addressId, button);
    });
  });
}


const translations = {
  ar: {
    langButton: "EN",
    langLabel: "التبديل إلى الإنجليزية",
    navTools: "الأدوات",
    navStart: "ابدأ الآن",
    navSupport: "دعم المشروع",
    badge: "✦ مجاني — بدون تسجيل",
    heroTitle1: "أصلح ملفاتك.",
    heroTitle2: "ببساطة.",
    heroDescription: "FileFix يوفر لك أدوات سريعة لتحويل وضغط ودمج ملفاتك من المتصفح، بدون خطوات معقدة.",
    toolImageTitle: "صور → PDF",
    toolImageDesc: "حوّل JPG وPNG إلى ملف PDF بسهولة.",
    toolMergeTitle: "دمج PDF",
    toolMergeDesc: "اجمع عدة ملفات PDF في ملف واحد.",
    toolCompressTitle: "ضغط PDF",
    toolCompressDesc: "قلل حجم ملف PDF بسهولة.",
    toolWordTitle: "Word → PDF",
    toolWordDesc: "حوّل مستندات Word إلى PDF.",
    workspaceTitle: "صور → PDF",
    workspaceDescription: "ارفع صورك لإنشاء ملف PDF.",
    dropTitle: "اسحب ملفاتك هنا",
    dropDescription: "أو اختر الملفات من جهازك",
    chooseFiles: "اختيار الملفات",
    processFiles: "بدء المعالجة",
    privacyTitle: "🔒 الخصوصية",
    privacyDesc: "تتم معالجة الملفات محليًا داخل المتصفح قدر الإمكان.",
    fastTitle: "⚡ سريع",
    fastDesc: "واجهة خفيفة ومصممة للأجهزة المختلفة.",
    freeTitle: "🆓 مجاني",
    freeDesc: "لا تحتاج إلى إنشاء حساب للبدء.",
    supportLabel: "دعم اختياري",
    supportTitle: "ساعد FileFix على الاستمرار",
    supportDescription: "FileFix مجاني بالكامل ولا يحتاج إلى تسجيل أو اشتراك. إذا وجدت الموقع مفيدًا، يمكنك دعمه اختياريًا عبر إحدى المحافظ التالية.",
    copy: "نسخ",
    scanSupport: "امسح للدعم",
    supportNote: "الدعم اختياري بالكامل — جميع أدوات FileFix مجانية.",
    footer: "© 2026 FileFix — Simple tools for everyday files.",
    tokenComingSoon: "FileFix Token — قريبًا",
    tokenCA: "CA:",
    tokenPump: "PUMP.FUN ↗"
  },
  en: {
    langButton: "AR",
    langLabel: "Switch to Arabic",
    navTools: "Tools",
    navStart: "Get started",
    navSupport: "Support",
    badge: "✦ Free — No registration",
    heroTitle1: "Fix your files.",
    heroTitle2: "Simply.",
    heroDescription: "FileFix gives you fast tools to convert, compress, and merge your files right in your browser — no complicated steps.",
    toolImageTitle: "Images → PDF",
    toolImageDesc: "Convert JPG and PNG images into a PDF easily.",
    toolMergeTitle: "Merge PDF",
    toolMergeDesc: "Combine multiple PDF files into one.",
    toolCompressTitle: "Compress PDF",
    toolCompressDesc: "Reduce the size of a PDF file easily.",
    toolWordTitle: "Word → PDF",
    toolWordDesc: "Convert Word documents to PDF.",
    workspaceTitle: "Images → PDF",
    workspaceDescription: "Upload your images to create a PDF.",
    dropTitle: "Drop your files here",
    dropDescription: "Or choose files from your device",
    chooseFiles: "Choose files",
    processFiles: "Start processing",
    privacyTitle: "🔒 Privacy",
    privacyDesc: "Files are processed locally in your browser whenever possible.",
    fastTitle: "⚡ Fast",
    fastDesc: "A lightweight interface designed for all devices.",
    freeTitle: "🆓 Free",
    freeDesc: "No account is required to get started.",
    supportLabel: "Optional support",
    supportTitle: "Help keep FileFix running",
    supportDescription: "FileFix is completely free and requires no account or subscription. If you find it useful, you can optionally support the project using one of the wallets below.",
    copy: "Copy",
    scanSupport: "Scan to support",
    supportNote: "Support is completely optional — all FileFix tools are free.",
    footer: "© 2026 FileFix — Simple tools for everyday files.",
    tokenComingSoon: "FileFix Token — Coming soon",
    tokenCA: "CA:",
    tokenPump: "PUMP.FUN ↗"
  }
};

function getSavedLanguage() {
  try {
    return localStorage.getItem("filefix-language-v2") === "ar" ? "ar" : "en";
  } catch (error) {
    return "en";
  }
}

function applyLanguage(language) {
  const lang = translations[language] ? language : "en";
  const t = translations[lang];

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
  document.body.classList.toggle("english", lang === "en");

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;
    if (t[key] !== undefined) element.textContent = t[key];
  });

  const languageButton = document.getElementById("languageBtn");
  if (languageButton) {
    languageButton.textContent = t.langButton;
    languageButton.setAttribute("aria-label", t.langLabel);
    languageButton.setAttribute("title", t.langLabel);
  }

  updateTool(currentTool, false);

  try {
    localStorage.setItem("filefix-language-v2", lang);
  } catch (error) {
    console.warn(error);
  }
}

function toggleLanguage() {
  const nextLanguage = document.documentElement.lang === "en" ? "ar" : "en";
  applyLanguage(nextLanguage);
}

function toggleDarkMode() {
  const isDark =
    document.body.classList.toggle("dark");

  try {
    localStorage.setItem(
      "filefix-dark-v2",
      isDark ? "1" : "0"
    );
  } catch (error) {
    console.warn(error);
  }
}

function loadDarkMode() {
  try {
    const saved = localStorage.getItem("filefix-dark-v2");

    // Dark mode is the default. Only an explicit saved light preference disables it.
    document.body.classList.toggle("dark", saved !== "0");
  } catch (error) {
    document.body.classList.add("dark");
    console.warn(error);
  }
}



window.selectTool = selectTool;
window.removeFile = removeFile;
window.processFiles = processFiles;
window.scrollToTools = scrollToTools;
window.scrollToWorkspace = scrollToWorkspace;
window.scrollToSupport = scrollToSupport;
window.copyAddress = copyAddress;
window.toggleDarkMode = toggleDarkMode;
window.toggleLanguage = toggleLanguage;

