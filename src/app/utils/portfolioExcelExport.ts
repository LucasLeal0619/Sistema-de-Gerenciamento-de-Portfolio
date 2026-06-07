import * as XLSX from "xlsx";
import {
  getAcoesExtensivas,
  getCursosEixo,
  getEventos,
  getHoras,
  getPlanoMetas,
  getStoredCourses,
  getValoresPCA,
  getVisitas,
} from "./store";
import { logActivity } from "./activityLog";
import { toastError, toastSuccess } from "./toast";

function sheet(name: string, rows: Record<string, unknown>[]) {
  const ws = rows.length
    ? XLSX.utils.json_to_sheet(rows)
    : XLSX.utils.aoa_to_sheet([["Sem registros"]]);
  return { name, ws };
}

export function exportPortfolioExcel() {
  const cursos = getStoredCourses();
  if (!cursos.length) {
    toastError("Importe a planilha antes de exportar o Excel consolidado.");
    return;
  }

  const sheets = [
    sheet(
      "Cursos",
      cursos.map((c) => ({
        Título: c.titulo,
        Eixo: c.segmento,
        Status: c.status,
        "Cód. SIG": c.codSIG,
        "Processo SEI": c.processoSEI,
        CH: c.ch,
        Modalidade: c.modalidade,
        Tipo: c.tipo,
        Unidade: c.unidade,
        Valores: c.valor || c.valores,
        Observações: c.observacao || c.observacoes,
      })),
    ),
    sheet(
      "Plano de Metas",
      getPlanoMetas().map((m) => ({
        Segmento: m.segmento,
        Curso: m.tipo,
        Tipo: m.categoria,
        SEI: m.numeroSEI,
        SIG: m.codigoSIG,
        "Mês Entrega": m.mesEntrega,
        Status: m.status,
        Origem: m.origem,
        Observação: m.observacao,
        Responsável: m.responsavel,
        "Status Final": m.statusFinal,
      })),
    ),
    sheet(
      "Valores PCA",
      getValoresPCA().map((p) => ({
        SEI: p.sei,
        SIG: p.sig,
        Título: p.titulo,
        Eixo: p.eixo,
        Unidade: p.unidade,
        CH: p.ch,
        Valor: p.valor,
        Status: p.status,
        Observação: p.observacao,
      })),
    ),
    sheet(
      "Cursos por Eixo",
      getCursosEixo().map((r) => ({
        Ano: r.ano,
        Eixo: r.eixo,
        Unidade: r.unidade,
        Curso: r.curso,
        CH: r.ch,
        Turmas: r.turmas,
        Alunos: r.alunos,
        Instrutores: r.instrutores,
      })),
    ),
    sheet(
      "Visitas Técnicas",
      getVisitas().map((v) => ({
        Unidade: v.unidade,
        Eixo: v.eixo,
        SEI: v.processoSEI,
        Solicitação: v.dataSolicitacao,
        "Visita Prevista": v.dataVisitaPrevista,
        "Prazo Limite": v.prazoLimite,
        Status: v.status,
        Responsável: v.responsavel,
      })),
    ),
    sheet(
      "Horas Pedagógicas",
      getHoras().map((h) => ({
        SEI: h.processoSEI,
        Segmento: h.segmento,
        Nome: h.nomePessoa,
        Matrícula: h.matricula,
        Motivo: h.motivo,
        Status: h.status,
        Observação: h.observacao,
      })),
    ),
    sheet(
      "Ações Extensivas",
      getAcoesExtensivas().map((a) => ({
        Ano: a.ano,
        Título: a.titulo,
        Eixo: a.eixo,
        Unidade: a.unidade,
        CH: a.cargaHoraria,
        Data: a.data,
        SEI: a.processoSEI,
        Status: a.status,
        Observação: a.observacao,
      })),
    ),
    sheet(
      "Eventos",
      getEventos().map((e) => ({
        Ano: e.ano,
        Nome: e.nome,
        Data: e.data,
        Unidade: e.unidade,
        Eixo: e.eixo,
        Público: e.quantidadePessoas,
        Equipe: e.equipe,
        "Ação Extensiva": e.possuiAcaoExtensiva,
        "Ação Vinculada": e.acaoVinculada,
        Status: e.status,
      })),
    ),
  ];

  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, ws }) => XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31)));

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `sgp-portfolio-consolidado-${stamp}.xlsx`);

  logActivity("Excel consolidado exportado", `${sheets.length} abas`);
  toastSuccess(`Excel consolidado exportado (${sheets.length} abas).`);
}
