import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { applyPdfFont, getPdfTableFontName, preloadPdfFont } from "./pdfFont";
import { toastError, toastSuccess } from "./toast";

export type ExportResult = {
  ok: boolean;
  count: number;
};

export type PdfIndicator = {
  label: string;
  value: number | string;
};

export type PdfExportOptions = {
  reportName?: string;
  referencePeriod?: string;
  executiveSummary?: string;
  indicators?: PdfIndicator[];
  institutionName?: string;
  systemName?: string;
};

function validarDadosExportacao(data: Record<string, unknown>[]): ExportResult {
  if (!data.length) {
    toastError("Não há dados para exportar. Importe a planilha ou cadastre registros.");
    return { ok: false, count: 0 };
  }

  return { ok: true, count: data.length };
}

export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
): ExportResult {
  const validacao = validarDadosExportacao(data);
  if (!validacao.ok) return validacao;

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Dados");
  XLSX.writeFile(wb, `${filename}.xlsx`);

  toastSuccess(`Excel exportado com ${validacao.count} registros.`);
  return validacao;
}

export function exportToCsv(data: Record<string, unknown>[], filename: string): ExportResult {
  const validacao = validarDadosExportacao(data);
  if (!validacao.ok) return validacao;

  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);

  toastSuccess(`CSV exportado com ${validacao.count} registros.`);
  return validacao;
}

export async function exportToPdf(
  data: Record<string, unknown>[],
  filename: string,
  title: string,
  columns?: string[],
  options: PdfExportOptions = {},
): Promise<ExportResult> {
  const validacao = validarDadosExportacao(data);
  if (!validacao.ok) return validacao;

  await preloadPdfFont();

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const tableColumns = columns ?? Object.keys(data[0]);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generatedAt = new Date().toLocaleString("pt-BR");
  const institutionName = options.institutionName ?? "SENAC DF";
  const systemName = options.systemName ?? "SGP - Sistema de Gerenciamento de Portfólio";
  const referencePeriod = options.referencePeriod ?? "Periodo completo";

  doc.setFillColor(0, 63, 125);
  doc.rect(0, 0, pageWidth, 22, "F");

  doc.setFillColor(245, 124, 0);
  doc.rect(0, 22, pageWidth, 2, "F");

  const pdfFont = applyPdfFont(doc);

  doc.setTextColor(255, 255, 255);
  doc.setFont(pdfFont, "bold");
  doc.setFontSize(14);
  doc.text(`${institutionName} - CPED`, 14, 10);

  doc.setFont(pdfFont, "normal");
  doc.setFontSize(8);
  doc.text(systemName, 14, 16);

  doc.setTextColor(0, 63, 125);
  doc.setFont(pdfFont, "bold");
  doc.setFontSize(13);
  doc.text(options.reportName ?? title, 14, 32);

  doc.setFont(pdfFont, "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Emitido em ${generatedAt} | Periodo de referencia: ${referencePeriod}`, 14, 38);

  let currentY = 46;

  if (options.executiveSummary) {
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(14, currentY, pageWidth - 28, 16, 2, 2, "F");
    doc.setTextColor(65, 65, 65);
    doc.setFont(pdfFont, "normal");
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize(options.executiveSummary, pageWidth - 36), 18, currentY + 6);
    currentY += 22;
  }

  if (options.indicators?.length) {
    const cardGap = 4;
    const visibleIndicators = options.indicators.slice(0, 4);
    const cardWidth = Math.min(44, (pageWidth - 28 - cardGap * 3) / Math.max(visibleIndicators.length, 1));

    visibleIndicators.forEach((indicator, index) => {
      const x = 14 + index * (cardWidth + cardGap);
      doc.setDrawColor(229, 231, 235);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, currentY, cardWidth, 16, 2, 2, "FD");
      doc.setTextColor(0, 63, 125);
      doc.setFont(pdfFont, "bold");
      doc.setFontSize(12);
      doc.text(String(indicator.value), x + 3, currentY + 7);
      doc.setTextColor(90, 90, 90);
      doc.setFont(pdfFont, "normal");
      doc.setFontSize(7);
      doc.text(doc.splitTextToSize(indicator.label, cardWidth - 6), x + 3, currentY + 12);
    });

    currentY += 22;
  }

  autoTable(doc, {
    startY: currentY,
    head: [tableColumns],
    body: data.map((row) => tableColumns.map((col) => String(row[col] ?? ""))),
    styles: { font: getPdfTableFontName(), fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [0, 63, 125], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { bottom: 16 },
    didDrawPage: () => {
      const pageNumber = doc.getCurrentPageInfo().pageNumber;
      doc.setFont(pdfFont, "normal");
      doc.setFontSize(7);
      doc.setTextColor(110, 110, 110);
      doc.text(`Gerado em ${generatedAt}`, 14, pageHeight - 8);
      doc.text(systemName, pageWidth / 2, pageHeight - 8, { align: "center" });
      doc.text(`Pagina ${pageNumber}`, pageWidth - 14, pageHeight - 8, { align: "right" });
    },
  });

  doc.save(`${filename}.pdf`);

  toastSuccess(`PDF exportado com ${validacao.count} registros.`);
  return validacao;
}