import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toastError, toastSuccess } from "./toast";

export type ExportResult = {
  ok: boolean;
  count: number;
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

export function exportToPdf(
  data: Record<string, unknown>[],
  filename: string,
  title: string,
  columns?: string[],
): ExportResult {
  const validacao = validarDadosExportacao(data);
  if (!validacao.ok) return validacao;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const tableColumns = columns ?? Object.keys(data[0]);
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(0, 63, 125);
  doc.rect(0, 0, pageWidth, 18, "F");

  doc.setFillColor(245, 124, 0);
  doc.rect(0, 18, pageWidth, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SENAC DF — SGP", 14, 11);

  doc.setTextColor(0, 63, 125);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 14, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")} · ${validacao.count} registros`, 14, 34);

  autoTable(doc, {
    startY: 40,
    head: [tableColumns],
    body: data.map((row) => tableColumns.map((col) => String(row[col] ?? ""))),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [0, 63, 125], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(`${filename}.pdf`);

  toastSuccess(`PDF exportado com ${validacao.count} registros.`);
  return validacao;
}
