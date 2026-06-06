import type jsPDF from "jspdf";

const FONT_FILE = "Roboto-Regular.ttf";
const FONT_NAME = "Roboto";
const FONT_URL = `${import.meta.env.BASE_URL}fonts/Roboto-Regular.ttf`;

let fontBase64: string | null = null;
let loadPromise: Promise<void> | null = null;
const docsComFonte = new WeakSet<jsPDF>();

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;

  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }

  return btoa(binary);
}

export function preloadPdfFont() {
  if (fontBase64) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = fetch(FONT_URL)
    .then((response) => {
      if (!response.ok) throw new Error("Fonte PDF não encontrada");
      return response.arrayBuffer();
    })
    .then((buffer) => {
      fontBase64 = arrayBufferToBase64(buffer);
    })
    .catch((error) => {
      console.warn("Não foi possível carregar fonte Roboto para PDF:", error);
      loadPromise = null;
    });

  return loadPromise;
}

export function applyPdfFont(doc: jsPDF) {
  if (!fontBase64) {
    doc.setFont("helvetica", "normal");
    return "helvetica";
  }

  if (!docsComFonte.has(doc)) {
    doc.addFileToVFS(FONT_FILE, fontBase64);
    doc.addFont(FONT_FILE, FONT_NAME, "normal");
    doc.addFont(FONT_FILE, FONT_NAME, "bold");
    docsComFonte.add(doc);
  }

  doc.setFont(FONT_NAME, "normal");
  return FONT_NAME;
}

export function getPdfTableFontName() {
  return fontBase64 ? FONT_NAME : "helvetica";
}
