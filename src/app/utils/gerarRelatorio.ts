import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { applyPdfFont, getPdfTableFontName, preloadPdfFont } from "./pdfFont";

const AZUL = "#003F7D";
const LARANJA = "#F57C00";

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export type PlanoMetasRelatorioRow = {
  segmento: string;
  categoria: string;
  tipo: string;
  numeroSEI: string;
  codigoSIG: string;
  status: string;
  mesEntrega: string;
  observacao?: string;
};

export type PlanoMetasRelatorioStats = {
  totalCursos: number;
  statusCount: { publicado: number; entregue?: number; emAnalise: number; cpfd: number };
  categoriaCount: {
    aperfeicoamento: number;
    qualificacao: number;
    tecnico: number;
    outros: number;
  };
};

export async function gerarRelatorioPlanoMetas(
  filteredCourses: PlanoMetasRelatorioRow[],
  stats: PlanoMetasRelatorioStats,
): Promise<boolean> {
  if (!filteredCourses.length) {
    return false;
  }

  await preloadPdfFont();

  const doc = new jsPDF({ orientation: "landscape", format: "a4" });
  const pdfFont = applyPdfFont(doc);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const today = new Date().toLocaleDateString("pt-BR");

  // ── Cabeçalho ──────────────────────────────────────────────────────────────
  doc.setFillColor(...hexToRgb(AZUL));
  doc.rect(0, 0, pageW, 28, "F");

  doc.setFillColor(...hexToRgb(LARANJA));
  doc.rect(0, 28, pageW, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont(pdfFont, "bold");
  doc.setFontSize(16);
  doc.text("SENAC DF — Relatório Gerencial", 14, 12);

  doc.setFontSize(10);
  doc.setFont(pdfFont, "normal");
  doc.text("Plano de Metas 2025 | Mapeamento de Produção, Produtividade e Estratégias", 14, 21);
  doc.text(`Emitido em: ${today}`, pageW - 14, 21, { align: "right" });

  // ── Cards de resumo ─────────────────────────────────────────────────────────
  const cardY = 40;
  const cardH = 28;
  const cardW = (pageW - 28 - 9) / 4;

  const pct = (n: number) =>
    stats.totalCursos > 0 ? `${Math.round((n / stats.totalCursos) * 100)}% do total` : "—";

  const cards = [
    { label: "Total de Registros", value: String(filteredCourses.length), sub: `de ${stats.totalCursos} no plano`, color: AZUL },
    { label: "Publicados", value: String(stats.statusCount.publicado), sub: pct(stats.statusCount.publicado), color: "#388E3C" },
    { label: "Entregues", value: String(stats.statusCount.entregue ?? 0), sub: pct(stats.statusCount.entregue ?? 0), color: "#1976D2" },
    { label: "Em Análise", value: String(stats.statusCount.emAnalise), sub: pct(stats.statusCount.emAnalise), color: "#F9A825" },
    { label: "Pendentes", value: String(stats.statusCount.cpfd), sub: pct(stats.statusCount.cpfd), color: "#D32F2F" },
  ];

  cards.forEach((card, i) => {
    const x = 14 + i * (cardW + 3);
    doc.setFillColor(...hexToRgb(card.color));
    doc.roundedRect(x, cardY, cardW, cardH, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont(pdfFont, "bold");
    doc.setFontSize(18);
    doc.text(card.value, x + cardW / 2, cardY + 13, { align: "center" });
    doc.setFontSize(7);
    doc.setFont(pdfFont, "normal");
    doc.text(card.label.toUpperCase(), x + cardW / 2, cardY + 20, { align: "center" });
    doc.setFontSize(6.5);
    doc.setTextColor(220, 220, 220);
    doc.text(card.sub, x + cardW / 2, cardY + 25, { align: "center" });
  });

  // ── Distribuição por Categoria (barra simples) ──────────────────────────────
  const barSectionY = cardY + cardH + 8;
  doc.setTextColor(...hexToRgb(AZUL));
  doc.setFont(pdfFont, "bold");
  doc.setFontSize(9);
  doc.text("Distribuição por Categoria", 14, barSectionY);

  const categorias = [
    { label: "Aperfeiçoamento", count: stats.categoriaCount.aperfeicoamento, color: AZUL },
    { label: "Qualificação", count: stats.categoriaCount.qualificacao, color: LARANJA },
    { label: "Hab. Técnica", count: stats.categoriaCount.tecnico, color: "#388E3C" },
    { label: "Outros", count: stats.categoriaCount.outros, color: "#9C27B0" },
  ];

  const maxCount = Math.max(...categorias.map(c => c.count));
  const barAreaW = pageW - 28;
  const barY = barSectionY + 4;
  const barH2 = 10;
  const barGap = 3;

  categorias.forEach((cat, i) => {
    const y = barY + i * (barH2 + barGap);
    const barW = maxCount > 0 ? ((cat.count / maxCount) * (barAreaW - 60)) : 0;
    doc.setFillColor(235, 235, 235);
    doc.roundedRect(14 + 45, y, barAreaW - 60, barH2, 2, 2, "F");
    doc.setFillColor(...hexToRgb(cat.color));
    if (barW > 0) doc.roundedRect(14 + 45, y, barW, barH2, 2, 2, "F");
    doc.setTextColor(80, 80, 80);
    doc.setFont(pdfFont, "normal");
    doc.setFontSize(7.5);
    doc.text(cat.label, 14, y + 7);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(...hexToRgb(cat.color));
    doc.text(String(cat.count), 14 + 45 + barW + 3, y + 7);
  });

  // ── Tabela de registros ─────────────────────────────────────────────────────
  const tableStartY = barY + categorias.length * (barH2 + barGap) + 8;

  doc.setTextColor(...hexToRgb(AZUL));
  doc.setFont(pdfFont, "bold");
  doc.setFontSize(9);
  doc.text(`Registros — ${filteredCourses.length} itens${filteredCourses.length < stats.totalCursos ? " (filtrados)" : ""}`, 14, tableStartY);

  autoTable(doc, {
    startY: tableStartY + 4,
    head: [["Segmento", "Categoria", "Tipo", "N° SEI", "Cód. SIG", "Status", "Mês Entrega", "Obs."]],
    body: filteredCourses.map(c => [
      c.segmento,
      c.categoria,
      c.tipo,
      c.numeroSEI,
      c.codigoSIG,
      c.status,
      c.mesEntrega,
      (c.observacao || "").slice(0, 80),
    ]),
    styles: { font: getPdfTableFontName(), fontSize: 7, cellPadding: 2.5 },
    headStyles: {
      fillColor: hexToRgb(AZUL),
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 32 },
      2: { cellWidth: 45 },
      3: { cellWidth: 40 },
      4: { cellWidth: 20 },
      5: { cellWidth: 30 },
      6: { cellWidth: 22 },
      7: { cellWidth: 35 },
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const status = String(data.cell.raw);
        let color: [number, number, number] = [158, 158, 158];
        if (status === "PUBLICADO") color = [56, 142, 60];
        else if (status === "EM ANÁLISE") color = [249, 168, 37];
        else if (status === "CPFD") color = [211, 47, 47];
        doc.setTextColor(...color);
        doc.setFont(pdfFont, "bold");
        doc.setFontSize(6.5);
        doc.text(status, data.cell.x + 2, data.cell.y + data.cell.height / 2 + 2);
        doc.setFont(pdfFont, "normal");
        doc.setTextColor(0, 0, 0);
        return false;
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Rodapé ──────────────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...hexToRgb(AZUL));
    doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont(pdfFont, "normal");
    doc.text("SENAC DF — Sistema de Gerenciamento de Portfólio (SGP)", 14, pageH - 3.5);
    doc.text(`Página ${p} de ${totalPages}`, pageW - 14, pageH - 3.5, { align: "right" });
  }

  doc.save(`Relatorio_Gerencial_PlanoMetas_2025_${today.replace(/\//g, "-")}.pdf`);
  return true;
}
