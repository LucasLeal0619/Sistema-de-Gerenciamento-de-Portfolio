import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { applyPdfFont, getPdfTableFontName, preloadPdfFont } from "./pdfFont";
import { getActivityLog, logActivity } from "./activityLog";
import { getSession } from "./auth";
import { toastError, toastSuccess } from "./toast";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function escapeCsv(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadActivityLogCsv() {
  const entries = getActivityLog();
  if (!entries.length) {
    toastError("Não há registros no log de atividades.");
    return;
  }

  const header = ["Data/Hora", "Usuário", "E-mail", "Ação", "Detalhes"];
  const rows = entries.map((e) => [
    formatWhen(e.timestamp),
    e.usuario,
    e.email,
    e.acao,
    e.detalhes ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sgp-log-atividades-${stamp}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  logActivity("Log exportado", `CSV com ${entries.length} registros`);
  toastSuccess("Log de atividades exportado em CSV.");
}

export async function exportActivityLogPdf() {
  const entries = getActivityLog();
  if (!entries.length) {
    toastError("Não há registros no log de atividades.");
    return;
  }

  await preloadPdfFont();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const session = getSession();

  doc.setFillColor(0, 63, 125);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setTextColor(255, 255, 255);
  applyPdfFont(doc, 14, "bold");
  doc.text("SGP — Log de Atividades", 14, 10);
  applyPdfFont(doc, 9, "normal");
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")} · ${session?.nome ?? "Sistema"}`,
    14,
    17,
  );

  autoTable(doc, {
    startY: 28,
    head: [["Data/Hora", "Usuário", "Ação", "Detalhes"]],
    body: entries.map((e) => [
      formatWhen(e.timestamp),
      `${e.usuario}\n${e.email}`,
      e.acao,
      e.detalhes ?? "—",
    ]),
    styles: { font: getPdfTableFontName(), fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [0, 63, 125], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 38 },
      2: { cellWidth: 42 },
      3: { cellWidth: "auto" },
    },
    margin: { left: 14, right: 14 },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`sgp-log-atividades-${stamp}.pdf`);

  logActivity("Log exportado", `PDF com ${entries.length} registros`);
  toastSuccess("Log de atividades exportado em PDF.");
}
