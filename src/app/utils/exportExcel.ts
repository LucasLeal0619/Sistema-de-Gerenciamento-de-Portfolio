import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToExcel(data: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Dados");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToCsv(data: Record<string, unknown>[], filename: string) {
  if (!data.length) {
    alert("Não há dados para exportar.");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

export function exportToPdf(
  data: Record<string, unknown>[],
  filename: string,
  title: string,
  columns?: string[],
) {
  if (!data.length) {
    alert("Não há dados para gerar relatório.");
    return;
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const tableColumns = columns ?? Object.keys(data[0]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, 14, 22);

  autoTable(doc, {
    startY: 30,
    head: [tableColumns],
    body: data.map((row) => tableColumns.map((col) => String(row[col] ?? ""))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 63, 125] },
  });

  doc.save(`${filename}.pdf`);
}