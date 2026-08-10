import {
  getAcoesExtensivas,
  getCursosEixo,
  getEventos,
  getHoras,
  getPlanoMetas,
  getStoredCourses,
  getValoresPCA,
  getVisitas,
  type AcaoExtensivaRecord,
  type CursoEixoRecord,
  type EventoRecord,
  type HoraRecord,
  type PlanoMetaRecord,
  type ValorPCARecord,
  type VisitaRecord,
} from "./store";
import {
  normalizeCourseModality,
  normalizeCourseType,
} from "./courseFieldNormalization";
import { buildHorasIndicators, buildVisitasIndicators, type IndicatorEntry } from "./processIndicators";

export type ReportFilterKey = "ano" | "unidade" | "eixo" | "status";

export type ReportGroup = "portfolio" | "processos";

export type ReportPayload = {
  rows: Record<string, unknown>[];
  columns: string[];
  indicators: IndicatorEntry[];
  summary: string;
  referencePeriod: string;
};

export type ReportDefinition = {
  id: string;
  group: ReportGroup;
  title: string;
  description: string;
  sourceRoute: string;
  filename: string;
  /** Filtros exibidos na prévia — espelha config/relatorios.php do Sistema_SGP */
  filtros: ReportFilterKey[];
  getPayload: () => ReportPayload;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function fallback(value: unknown, text = "Não informado") {
  return clean(value) || text;
}

function countUnique<T>(records: T[], getter: (item: T) => string) {
  return new Set(records.map(getter).map(clean).filter(Boolean)).size;
}

function referenceFromYears<T>(records: T[], getter: (item: T) => string) {
  const years = Array.from(new Set(records.map(getter).map(clean).filter(Boolean))).sort();
  if (!years.length) return "Período completo";
  if (years.length === 1) return years[0];
  return `${years[0]} a ${years[years.length - 1]}`;
}

function statusCount<T>(records: T[], status: string, getter: (item: T) => string) {
  const target = status.toLowerCase();
  return records.filter((item) => getter(item).toLowerCase().includes(target)).length;
}

function getCourseTitle(course: Record<string, unknown>) {
  return clean(course.titulo ?? course["Titulo - Nome do Curso"] ?? course["T\u00edtulo - Nome do Curso"]);
}

function getCourseStatus(course: Record<string, unknown>) {
  return fallback(course.status ?? course["Status SIG"], "ATIVO");
}

function getCourseType(course: Record<string, unknown>) {
  const raw = fallback(course.tipoNorm ?? course.tipo ?? course["TIPO"]);
  const normalized = normalizeCourseType(raw);
  return normalized || raw;
}

function getCourseEixo(course: Record<string, unknown>) {
  return fallback(course.segmento ?? course._eixo);
}

function getCourseYear(course: Record<string, unknown>) {
  return clean(course.ano ?? course["\u00daltima Revis\u00e3o"] ?? course["\u00daltima revis\u00e3o"] ?? course["Ident."]);
}

function buildCoursesReport(): ReportPayload {
  const records = getStoredCourses() as unknown as Record<string, unknown>[];
  const rows = records.map((course) => ({
    "T\u00edtulo": getCourseTitle(course),
    Eixo: getCourseEixo(course),
    Modalidade: normalizeCourseModality(clean(course.modalidade)),
    CH: clean(course.ch ?? course["CH"]),
    "C\u00f3d. DN": clean(course.codDN),
    "C\u00f3d. SIG": clean(course.codSIG ?? course["C\u00f3d. SIG"] ?? course["C\u00f3digo SIG"]),
    "Processo SEI": clean(course.processoSEI ?? course["Processo SEI"] ?? course["N\u00daMERO SEI"]),
    Tipo: getCourseType(course),
    Status: getCourseStatus(course),
    Ano: getCourseYear(course),
    Unidade: clean(course.unidade ?? course["UNIDADE QUE PODE SER RODADO"]),
  }));

  return {
    rows,
    columns: ["T\u00edtulo", "Eixo", "CH", "C\u00f3d. SIG", "Processo SEI", "Tipo", "Status"],
    indicators: [
      { label: "Cursos", value: records.length },
      { label: "Ativos", value: statusCount(records, "ativo", getCourseStatus) },
      { label: "Inativos", value: statusCount(records, "inativo", getCourseStatus) },
      { label: "Eixos", value: countUnique(records, getCourseEixo) },
    ],
    summary: "Relatório consolidado do catálogo de cursos salvo no sistema, com situação, eixo tecnológico e códigos de referência.",
    referencePeriod: referenceFromYears(records, getCourseYear),
  };
}

function planoRows(records: PlanoMetaRecord[]) {
  return records.map((item) => {
    const seiAno = clean(item.numeroSEI).match(/^(\d{4})\./)?.[1] || "";
    return {
      Segmento: item.segmento,
      Curso: clean((item as PlanoMetaRecord & { curso?: string }).curso || item.tipo),
      Tipo: item.categoria,
      "N\u00famero SEI": item.numeroSEI,
      "C\u00f3digo SIG": item.codigoSIG,
      "M\u00eas de Entrega": item.mesEntrega,
      Status: item.status,
      Origem: item.origem,
      "Observa\u00e7\u00e3o": item.observacao,
      "Status Final": item.statusFinal ?? "",
      Ano: clean(item.ano) || seiAno,
    };
  });
}

function buildPlanoMetasReport(): ReportPayload {
  const records = getPlanoMetas();
  const rows = planoRows(records);
  return {
    rows,
    columns: ["Segmento", "Curso", "Tipo", "N\u00famero SEI", "C\u00f3digo SIG", "M\u00eas de Entrega", "Status"],
    indicators: [
      { label: "Registros", value: records.length },
      { label: "Publicados", value: statusCount(records, "public", (r) => r.status) },
      { label: "Em análise", value: statusCount(records, "analise", (r) => r.status) },
      { label: "Segmentos", value: countUnique(records, (r) => r.segmento) },
    ],
    summary: "Relatório de acompanhamento do Plano de Metas, com status de produção, entrega e informações de referência SEI/SIG.",
    referencePeriod: referenceFromYears(rows, (r) => clean(r.Ano)),
  };
}

function pcaRows(records: ValorPCARecord[]) {
  return records.map((item) => ({
    Ano: item.ano,
    Semestre: item.semestre ?? "",
    SEI: item.sei,
    SIG: item.sig,
    "T\u00edtulo": item.titulo,
    Eixo: item.eixo,
    Unidade: item.unidade,
    CH: item.ch,
    "Precifica\u00e7\u00e3o": item.precificacao || item.valor,
    "Valor 1\u00ba M\u00f3dulo": item.valorPrimeiroModulo || "",
    Status: item.status,
    "Observa\u00e7\u00e3o": item.observacao,
  }));
}

function buildPcaReport(): ReportPayload {
  const records = getValoresPCA();
  return {
    rows: pcaRows(records),
    columns: ["Ano", "Semestre", "SEI", "SIG", "T\u00edtulo", "Eixo", "Unidade", "CH", "Precifica\u00e7\u00e3o", "Status"],
    indicators: [
      { label: "Registros", value: records.length },
      { label: "Vigentes", value: statusCount(records, "vigente", (r) => r.status) },
      { label: "Unidades", value: countUnique(records, (r) => r.unidade) },
      { label: "Eixos", value: countUnique(records, (r) => r.eixo) },
    ],
    summary: "Relatório de valores e precificação do PCA, com cursos, unidades, carga horária e situação vigente.",
    referencePeriod: referenceFromYears(records, (r) => r.ano),
  };
}

function cursosEixoRows(records: CursoEixoRecord[]) {
  return records.map((item) => ({
    Ano: item.ano,
    "Nome do Curso": item.curso,
    "Eixo Tecnol\u00f3gico": item.eixo,
    Unidade: item.unidade,
    CH: item.ch,
    "Turmas (2\u00ba Semestre)": item.turmas || "",
    "C\u00f3digo": item.codigo || "",
    "Alunos (Matr\u00edculas)": item.alunos || "",
    Instrutores: item.instrutores || "",
    Status: item.status,
    Novo: item.isNovo ? "Sim" : "Não",
    "Observa\u00e7\u00e3o": item.observacao,
  }));
}

function buildCursosEixoReport(): ReportPayload {
  const records = getCursosEixo();
  return {
    rows: cursosEixoRows(records),
    columns: ["Ano", "Nome do Curso", "Eixo Tecnol\u00f3gico", "Unidade", "CH", "Turmas (2\u00ba Semestre)", "C\u00f3digo", "Alunos (Matr\u00edculas)", "Instrutores", "Status", "Novo"],
    indicators: [
      { label: "Cursos", value: records.length },
      { label: "Novos", value: records.filter((r) => r.isNovo).length },
      { label: "Eixos", value: countUnique(records, (r) => r.eixo) },
      { label: "Unidades", value: countUnique(records, (r) => r.unidade) },
    ],
    summary: "Relatório de distribuição de cursos por eixo tecnológico, com turmas, alunos, instrutores e sinalização de cursos novos.",
    referencePeriod: referenceFromYears(records, (r) => r.ano),
  };
}

function visitasRows(records: VisitaRecord[]) {
  return records.map((item) => ({
    Ano: item.ano,
    Unidade: item.unidade,
    Eixo: item.eixo,
    "Processo SEI": item.processoSEI,
    "Solicita\u00e7\u00e3o": item.dataSolicitacao,
    "Visita Prevista": item.dataVisitaPrevista,
    "Prazo Limite": item.prazoLimite,
    Status: item.status,
    "Respons\u00e1vel": item.responsavel,
    "Relat\u00f3rio": item.relatorio,
    "Observa\u00e7\u00e3o": item.observacao,
  }));
}

function buildVisitasReport(): ReportPayload {
  const records = getVisitas();
  const indicators = buildVisitasIndicators(records);
  return {
    rows: visitasRows(records),
    columns: ["Ano", "Unidade", "Eixo", "Processo SEI", "Solicita\u00e7\u00e3o", "Visita Prevista", "Prazo Limite", "Status", "Respons\u00e1vel"],
    indicators: [
      { label: "Visitas", value: indicators.total },
      { label: "Realizadas", value: indicators.realizadas },
      { label: "Pendentes", value: indicators.pendentes },
      { label: "Fora do prazo", value: indicators.foraPrazoCount },
    ],
    summary: "Relatório de visitas técnicas com status, prazos, unidades solicitantes, responsáveis acionados e processos SEI.",
    referencePeriod: referenceFromYears(records, (r) => r.ano),
  };
}

function horasRows(records: HoraRecord[]) {
  return records.map((item) => ({
    Ano: item.ano,
    "Processo SEI": item.processoSEI,
    "Eixo Tecnol\u00f3gico": item.eixo,
    Segmento: item.segmento,
    "Nome da Pessoa": item.nomePessoa,
    "Matr\u00edcula": item.matricula,
    "Motivo da Solicita\u00e7\u00e3o": item.motivo,
    Status: item.status,
    Ativo: item.ativo ?? true ? "Sim" : "Não",
  }));
}

function buildHorasReport(): ReportPayload {
  const records = getHoras();
  const indicators = buildHorasIndicators(records);
  return {
    rows: horasRows(records),
    columns: ["Ano", "Processo SEI", "Eixo Tecnol\u00f3gico", "Segmento", "Nome da Pessoa", "Matr\u00edcula", "Motivo da Solicita\u00e7\u00e3o", "Status", "Ativo"],
    indicators: [
      { label: "Solicitações", value: indicators.total },
      { label: "Concluídas", value: indicators.concluidas },
      { label: "Em análise", value: indicators.emAnalise },
      { label: "Inativas", value: indicators.inativos },
    ],
    summary: "Relatório das solicitações de horas pedagógicas, com pessoas acionadas, segmentos, eixos e situação do processo.",
    referencePeriod: referenceFromYears(records, (r) => r.ano),
  };
}

function acoesRows(records: AcaoExtensivaRecord[]) {
  return records.map((item) => ({
    Prioriza\u00e7\u00e3o: item.priorizacao,
    Atribu\u00eddo: item.atribuido,
    Eixo: item.eixo,
    "N\u00famero do Processo SEI": item.processoSEI,
    Tipo: item.tipo,
    Assunto: item.assunto,
    Objetivo: item.objetivo,
    Status: item.status,
    "\u00daltima atualiza\u00e7\u00e3o": item.ultimaAtualizacao,
    Ano: item.ano,
  }));
}

function buildAcoesReport(): ReportPayload {
  const records = getAcoesExtensivas();
  return {
    rows: acoesRows(records),
    columns: [
      "Prioriza\u00e7\u00e3o",
      "Atribu\u00eddo",
      "Eixo",
      "Assunto",
      "Status",
      "\u00daltima atualiza\u00e7\u00e3o",
    ],
    indicators: [
      { label: "Ações", value: records.length },
      { label: "CPED", value: statusCount(records, "cped", (r) => r.status) },
      { label: "Atribuídos", value: countUnique(records, (r) => r.atribuido) },
      { label: "Eixos", value: countUnique(records, (r) => r.eixo) },
    ],
    summary:
      "Relatório de ações extensivas da planilha de atribuições SEI, com priorização, responsável, eixo, assunto e status.",
    referencePeriod: referenceFromYears(records, (r) => r.ano),
  };
}

function eventosRows(records: EventoRecord[]) {
  return records.map((item) => ({
    Ano: item.ano,
    Evento: item.nome,
    Data: item.data,
    Unidade: item.unidade,
    Eixo: item.eixo,
    "Qtd. Pessoas": item.quantidadePessoas,
    Equipe: item.equipe,
    "Possui A\u00e7\u00e3o Extensiva": item.possuiAcaoExtensiva,
    "A\u00e7\u00e3o Vinculada": item.acaoVinculada,
    Status: item.status,
    "Observa\u00e7\u00e3o": item.observacao,
  }));
}

function buildEventosReport(): ReportPayload {
  const records = getEventos();
  const totalPessoas = records.reduce((acc, item) => {
    const n = Number(clean(item.quantidadePessoas).replace(/\D/g, ""));
    return acc + (Number.isNaN(n) ? 0 : n);
  }, 0);

  return {
    rows: eventosRows(records),
    columns: ["Ano", "Evento", "Data", "Unidade", "Eixo", "Qtd. Pessoas", "Status"],
    indicators: [
      { label: "Eventos", value: records.length },
      { label: "Pessoas", value: totalPessoas },
      { label: "Com ação extensiva", value: records.filter((r) => r.possuiAcaoExtensiva === "Sim").length },
      { label: "Eixos", value: countUnique(records, (r) => r.eixo) },
    ],
    summary: "Relatório de eventos cadastrados, com público estimado ou realizado, equipes envolvidas e vinculação com ações extensivas.",
    referencePeriod: referenceFromYears(records, (r) => r.ano),
  };
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: "cursos",
    group: "portfolio",
    title: "Relat\u00f3rio de Cursos",
    description: "Catálogo de cursos importado no portfólio.",
    sourceRoute: "/app/cursos",
    filename: "Relatorio_Cursos",
    filtros: ["ano", "unidade", "eixo", "status"],
    getPayload: buildCoursesReport,
  },
  {
    id: "plano-metas",
    group: "portfolio",
    title: "Relat\u00f3rio de Plano de Metas",
    description: "Acompanhamento da produção e entregas do Plano de Metas.",
    sourceRoute: "/app/plano-de-metas",
    filename: "Relatorio_Plano_Metas",
    filtros: ["ano", "status"],
    getPayload: buildPlanoMetasReport,
  },
  {
    id: "pca",
    group: "portfolio",
    title: "Relat\u00f3rio de PCA",
    description: "Valores, precificação e situação dos cursos abertos.",
    sourceRoute: "/app/pca",
    filename: "Relatorio_PCA",
    filtros: ["ano", "unidade", "eixo", "status"],
    getPayload: buildPcaReport,
  },
  {
    id: "cursos-eixo",
    group: "portfolio",
    title: "Relat\u00f3rio de Eixos",
    description: "Distribuição de cursos, turmas, alunos e instrutores por eixo.",
    sourceRoute: "/app/eixos",
    filename: "Relatorio_Cursos_Por_Eixo",
    filtros: ["ano", "unidade", "eixo", "status"],
    getPayload: buildCursosEixoReport,
  },
  {
    id: "visitas-tecnicas",
    group: "processos",
    title: "Relat\u00f3rio de Visitas T\u00e9cnicas",
    description: "Visitas técnicas, prazos, responsáveis e unidades solicitantes.",
    sourceRoute: "/app/visitas-tecnicas",
    filename: "Relatorio_Visitas_Tecnicas",
    filtros: ["unidade", "eixo", "status"],
    getPayload: buildVisitasReport,
  },
  {
    id: "horas-pedagogicas",
    group: "processos",
    title: "Relat\u00f3rio de Horas Pedag\u00f3gicas",
    description: "Solicitações de horas pedagógicas por pessoa, eixo e status.",
    sourceRoute: "/app/horas-pedagogicas",
    filename: "Relatorio_Horas_Pedagogicas",
    filtros: ["ano", "eixo", "status"],
    getPayload: buildHorasReport,
  },
  {
    id: "acoes-extensivas",
    group: "processos",
    title: "Relat\u00f3rio de A\u00e7\u00f5es Extensivas",
    description: "Ações extensivas por eixo, unidade, data e carga horária.",
    sourceRoute: "/app/acoes-extensivas",
    filename: "Relatorio_Acoes_Extensivas",
    filtros: ["eixo", "status"],
    getPayload: buildAcoesReport,
  },
  {
    id: "eventos",
    group: "processos",
    title: "Relat\u00f3rio de Eventos",
    description: "Eventos cadastrados, público, equipes e ações vinculadas.",
    sourceRoute: "/app/eventos",
    filename: "Relatorio_Eventos",
    filtros: ["ano", "unidade", "eixo", "status"],
    getPayload: buildEventosReport,
  },
];

/** Resolve o nome da coluna no row para cada filtro (linhas do relatório). */
export function resolveReportFilterColumn(
  row: Record<string, unknown>,
  filter: ReportFilterKey,
): string {
  const keys = Object.keys(row);
  const aliases: Record<ReportFilterKey, string[]> = {
    ano: ["Ano", "ano"],
    unidade: ["Unidade", "unidade"],
    eixo: ["Eixo", "Eixo Tecnológico", "Eixo Tecnol\u00f3gico", "Segmento", "eixo"],
    status: ["Status", "status"],
  };

  for (const alias of aliases[filter]) {
    const found = keys.find((key) => key === alias || key.toLowerCase() === alias.toLowerCase());
    if (found) return found;
  }

  return "";
}

export function getReportFilterValue(
  row: Record<string, unknown>,
  filter: ReportFilterKey,
): string {
  const col = resolveReportFilterColumn(row, filter);
  if (!col) return "";
  return String(row[col] ?? "").trim();
}
