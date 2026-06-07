import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { applyPdfFont, getPdfTableFontName, preloadPdfFont } from "./pdfFont";
import { logActivity } from "./activityLog";
import { getSession } from "./auth";
import {
  getCursosEixo,
  getHoras,
  getPlanoMetas,
  getStoredAcoes,
  getStoredCourses,
  getStoredEventos,
  getStoredUsers,
  getValoresPCA,
  getVisitas,
} from "./store";
import {
  DASHBOARD_EIXO_LABELS,
  getDashboardComparativoAnos,
  getDashboardCourses,
  getDashboardProcessMetrics,
  normalizarEixoDashboard,
} from "./dashboardData";
import { toastError, toastSuccess } from "./toast";

export async function exportPortfolioReportPdf() {
  const { fonte, courses } = getDashboardCourses();
  if (fonte === "vazio" || !courses.length) {
    toastError("Importe a planilha antes de gerar o relatório consolidado.");
    return;
  }

  await preloadPdfFont();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const session = getSession();

  doc.setFillColor(0, 63, 125);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("SGP — Relatório Consolidado do Portfólio", 14, 10);
  doc.setFontSize(9);
  doc.text(`SENAC DF · ${new Date().toLocaleDateString("pt-BR")}`, 14, 17);

  applyPdfFont(doc);
  doc.setTextColor(40, 40, 40);
  let y = 30;

  const metrics = getDashboardProcessMetrics();
  const comparativo = getDashboardComparativoAnos();
  const ativos = courses.filter((c) => String(c.status).toUpperCase().includes("ATIV")).length;

  const resumo = [
    ["Cursos no catálogo", String(courses.length)],
    ["Cursos ativos", String(ativos)],
    ["Plano de Metas", String(getPlanoMetas().length)],
    ["Valores PCA", String(getValoresPCA().length)],
    ["Cursos por Eixo", String(getCursosEixo().length)],
    ["Visitas Técnicas", String(getVisitas().length)],
    ["Horas Pedagógicas", String(getHoras().length)],
    ["Ações Extensivas", String(getStoredAcoes().length)],
    ["Eventos", String(getStoredEventos().length)],
    ["Usuários cadastrados", String(getStoredUsers().length)],
  ];

  doc.setFontSize(11);
  doc.setTextColor(0, 63, 125);
  doc.text("Resumo geral", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Indicador", "Quantidade"]],
    body: resumo,
    theme: "grid",
    styles: { font: getPdfTableFontName(), fontSize: 9 },
    headStyles: { fillColor: [0, 63, 125] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  const porEixo = DASHBOARD_EIXO_LABELS.map((eixo) => ({
    eixo,
    qtd: courses.filter((c) => normalizarEixoDashboard(c._eixo) === eixo || c._eixo === eixo).length,
  })).filter((r) => r.qtd > 0);

  if (porEixo.length) {
    doc.setTextColor(0, 63, 125);
    doc.text("Cursos por eixo tecnológico", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Eixo", "Cursos"]],
      body: porEixo.map((r) => [r.eixo, String(r.qtd)]),
      theme: "striped",
      styles: { font: getPdfTableFontName(), fontSize: 9 },
      headStyles: { fillColor: [245, 124, 0] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (comparativo) {
    doc.setTextColor(0, 63, 125);
    doc.text("Comparativo 2025 × 2026", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Ano", "Registros"]],
      body: [
        ["2025", String(comparativo.totais["2025"])],
        ["2026", String(comparativo.totais["2026"])],
        ["Variação", `${comparativo.variacao > 0 ? "+" : ""}${comparativo.variacao}%`],
      ],
      theme: "grid",
      styles: { font: getPdfTableFontName(), fontSize: 9 },
      headStyles: { fillColor: [0, 63, 125] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Gerado por ${session?.nome ?? "usuário"} (${session?.email ?? "—"}) · SGP v1.0-beta`,
    14,
    doc.internal.pageSize.getHeight() - 10,
  );

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`SGP_Relatorio_Portfolio_${stamp}.pdf`);
  logActivity("Relatório PDF gerado", `Consolidado com ${courses.length} cursos`);
  toastSuccess("Relatório consolidado exportado em PDF.");
}
