import {
  importarAcoesExtensivasExcel,
  importarCursosEixoExcel,
  importarCursosPortfolio,
  importarEventosExcel,
  importarHorasPedagogicasExcel,
  importarPlanoMetasExcel,
  importarValoresPCAExcel,
  importarVisitasTecnicasExcel,
} from "./importExcel";
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
import type { ModuloImportacao } from "./importarPortfolioCompleto";

export type ModuloPreview = {
  modulo: ModuloImportacao;
  label: string;
  atual: number;
  incoming: number;
  novos: number;
  removidos: number;
  delta: number;
  avisos: string[];
};

export type PreviewPortfolio = {
  modulos: ModuloPreview[];
  avisosGerais: string[];
  totalIncoming: number;
  podeImportar: boolean;
  resumoComparativo: {
    totalNovos: number;
    totalRemovidos: number;
    totalDelta: number;
  };
};

const LABELS: Record<ModuloImportacao, string> = {
  cursos: "Cursos",
  planoMetas: "Plano de Metas",
  pca: "Valores PCA",
  cursosEixo: "Cursos por Eixo",
  visitas: "Visitas Técnicas",
  horas: "Horas Pedagógicas",
  acoes: "Ações Extensivas",
  eventos: "Eventos",
};

function pushModulo(
  modulos: ModuloPreview[],
  entry: Omit<ModuloPreview, "delta">,
) {
  modulos.push({ ...entry, delta: entry.incoming - entry.atual });
}

function normKey(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function diffSets(atualKeys: string[], incomingKeys: string[]) {
  const atualSet = new Set(atualKeys.filter(Boolean));
  const incomingSet = new Set(incomingKeys.filter(Boolean));
  let novos = 0;
  let removidos = 0;
  incomingSet.forEach((k) => { if (k && !atualSet.has(k)) novos++; });
  atualSet.forEach((k) => { if (k && !incomingSet.has(k)) removidos++; });
  return { novos, removidos };
}

function avisosDuplicados(keys: string[], campo: string): string[] {
  const seen = new Map<string, number>();
  keys.forEach((k) => {
    if (!k) return;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  });
  const dupes = [...seen.entries()].filter(([, n]) => n > 1).length;
  return dupes ? [`${dupes} ${campo} duplicado(s) na planilha`] : [];
}

export async function analisarPortfolioCompleto(file: File): Promise<PreviewPortfolio> {
  const avisosGerais: string[] = [];
  const modulos: ModuloPreview[] = [];

  // Cursos
  try {
    const rows = await importarCursosPortfolio(file);
    const atual = getStoredCourses();
    const keysAtual = atual.map((c) => normKey(c.codSIG || c.titulo));
    const keysIncoming = rows.map((r) => normKey(r.codSIG || r.codigoSIG || r.titulo || r.curso));
    const { novos, removidos } = diffSets(keysAtual, keysIncoming);
    const avisos: string[] = [];
    const semTitulo = rows.filter((r) => !String(r.titulo || r.curso || "").trim()).length;
    if (semTitulo) avisos.push(`${semTitulo} curso(s) sem título`);
    const semEixo = rows.filter((r) => !String(r.segmento || r.eixo || "").trim()).length;
    if (semEixo) avisos.push(`${semEixo} curso(s) sem eixo/segmento`);
    avisos.push(...avisosDuplicados(keysIncoming.filter(Boolean), "código/título"));
    pushModulo(modulos, {
      modulo: "cursos", label: LABELS.cursos, atual: atual.length, incoming: rows.length,
      novos, removidos, avisos,
    });
  } catch {
    pushModulo(modulos, { modulo: "cursos", label: LABELS.cursos, atual: getStoredCourses().length, incoming: 0, novos: 0, removidos: 0, avisos: ["Erro ao ler aba de cursos"] });
  }

  // Plano Metas
  try {
    const rows = await importarPlanoMetasExcel(file);
    const atual = getPlanoMetas();
    const keysAtual = atual.map((r) => normKey(r.codigoSIG || r.curso));
    const keysIncoming = rows.map((r) => normKey(r.codigoSIG || r.curso || r.tipo));
    const { novos, removidos } = diffSets(keysAtual, keysIncoming);
    const avisos: string[] = [];
    const semSei = rows.filter((r) => !String(r.numeroSEI || "").trim()).length;
    if (semSei) avisos.push(`${semSei} linha(s) sem SEI`);
    avisos.push(...avisosDuplicados(keysIncoming.filter(Boolean), "curso/SIG"));
    pushModulo(modulos, {
      modulo: "planoMetas", label: LABELS.planoMetas, atual: atual.length, incoming: rows.length,
      novos, removidos, avisos,
    });
  } catch {
    pushModulo(modulos, { modulo: "planoMetas", label: LABELS.planoMetas, atual: getPlanoMetas().length, incoming: 0, novos: 0, removidos: 0, avisos: ["Erro ao ler Plano de Metas"] });
  }

  // PCA
  try {
    const rows = await importarValoresPCAExcel(file);
    const atual = getValoresPCA();
    const keysAtual = atual.map((r) => normKey(r.sig || r.titulo));
    const keysIncoming = rows.map((r) => normKey(r.sig || r.titulo));
    const { novos, removidos } = diffSets(keysAtual, keysIncoming);
    const avisos: string[] = [];
    const semSig = rows.filter((r) => !String(r.sig || "").trim()).length;
    if (semSig) avisos.push(`${semSig} registro(s) sem SIG`);
    pushModulo(modulos, {
      modulo: "pca", label: LABELS.pca, atual: atual.length, incoming: rows.length,
      novos, removidos, avisos,
    });
  } catch {
    pushModulo(modulos, { modulo: "pca", label: LABELS.pca, atual: getValoresPCA().length, incoming: 0, novos: 0, removidos: 0, avisos: ["Erro ao ler Valores PCA"] });
  }

  // Cursos Eixo
  try {
    const rows = await importarCursosEixoExcel(file);
    const validos = rows.filter((r) => String(r.curso || "").trim());
    const atual = getCursosEixo();
    const keysAtual = atual.map((r) => normKey(`${r.ano}|${r.curso}|${r.unidade}`));
    const keysIncoming = validos.map((r) => normKey(`${r.ano || "2025"}|${r.curso}|${r.unidade}`));
    const { novos, removidos } = diffSets(keysAtual, keysIncoming);
    const avisos: string[] = [];
    const semEixo = validos.filter((r) => !String(r.eixo || r.segmento || "").trim()).length;
    if (semEixo) avisos.push(`${semEixo} linha(s) sem eixo`);
    pushModulo(modulos, {
      modulo: "cursosEixo", label: LABELS.cursosEixo, atual: atual.length, incoming: validos.length,
      novos, removidos, avisos,
    });
  } catch {
    pushModulo(modulos, { modulo: "cursosEixo", label: LABELS.cursosEixo, atual: getCursosEixo().length, incoming: 0, novos: 0, removidos: 0, avisos: ["Erro ao ler Cursos por Eixo"] });
  }

  // Visitas
  try {
    const rows = await importarVisitasTecnicasExcel(file);
    const atual = getVisitas();
    const { novos, removidos } = diffSets(
      atual.map((r) => normKey(`${r.processoSEI}|${r.unidade}`)),
      rows.map((r) => normKey(`${r.processoSEI}|${r.unidade}`)),
    );
    const avisos: string[] = [];
    const semSei = rows.filter((r) => !String(r.processoSEI || "").trim()).length;
    if (semSei) avisos.push(`${semSei} visita(s) sem SEI (serão importadas como pendentes)`);
    pushModulo(modulos, {
      modulo: "visitas", label: LABELS.visitas, atual: atual.length, incoming: rows.length,
      novos, removidos, avisos,
    });
  } catch {
    pushModulo(modulos, { modulo: "visitas", label: LABELS.visitas, atual: getVisitas().length, incoming: 0, novos: 0, removidos: 0, avisos: ["Erro ao ler Visitas"] });
  }

  // Horas
  try {
    const rows = await importarHorasPedagogicasExcel(file);
    const atual = getHoras();
    const { novos, removidos } = diffSets(
      atual.map((r) => normKey(`${r.processoSEI}|${r.nomePessoa}`)),
      rows.map((r) => normKey(`${r.processoSEI}|${r.nomePessoa}`)),
    );
    const avisos: string[] = [];
    const semSei = rows.filter((r) => !String(r.processoSEI || "").trim()).length;
    if (semSei) avisos.push(`${semSei} solicitação(ões) sem SEI`);
    pushModulo(modulos, {
      modulo: "horas", label: LABELS.horas, atual: atual.length, incoming: rows.length,
      novos, removidos, avisos,
    });
  } catch {
    pushModulo(modulos, { modulo: "horas", label: LABELS.horas, atual: getHoras().length, incoming: 0, novos: 0, removidos: 0, avisos: ["Erro ao ler Horas"] });
  }

  // Ações Extensivas
  try {
    const rows = await importarAcoesExtensivasExcel(file);
    const atual = getAcoesExtensivas();
    const { novos, removidos } = diffSets(
      atual.map((r) => normKey(`${r.titulo}|${r.processoSEI}`)),
      rows.map((r) => normKey(`${r.titulo}|${r.processoSEI}`)),
    );
    const avisos: string[] = [];
    const semTitulo = rows.filter((r) => !String(r.titulo || "").trim()).length;
    if (semTitulo) avisos.push(`${semTitulo} ação(ões) sem título`);
    pushModulo(modulos, {
      modulo: "acoes", label: LABELS.acoes, atual: atual.length, incoming: rows.length,
      novos, removidos, avisos,
    });
  } catch {
    pushModulo(modulos, { modulo: "acoes", label: LABELS.acoes, atual: getAcoesExtensivas().length, incoming: 0, novos: 0, removidos: 0, avisos: ["Erro ao ler Ações Extensivas"] });
  }

  // Eventos
  try {
    const rows = await importarEventosExcel(file);
    const atual = getEventos();
    const { novos, removidos } = diffSets(
      atual.map((r) => normKey(`${r.nome}|${r.data}`)),
      rows.map((r) => normKey(`${r.nome}|${r.data}`)),
    );
    const avisos: string[] = [];
    const semNome = rows.filter((r) => !String(r.nome || "").trim()).length;
    if (semNome) avisos.push(`${semNome} evento(s) sem nome`);
    pushModulo(modulos, {
      modulo: "eventos", label: LABELS.eventos, atual: atual.length, incoming: rows.length,
      novos, removidos, avisos,
    });
  } catch {
    pushModulo(modulos, { modulo: "eventos", label: LABELS.eventos, atual: getEventos().length, incoming: 0, novos: 0, removidos: 0, avisos: ["Erro ao ler Eventos"] });
  }

  const totalIncoming = modulos.reduce((s, m) => s + m.incoming, 0);
  if (!totalIncoming) avisosGerais.push("Nenhum registro válido encontrado na planilha.");

  const resumoComparativo = {
    totalNovos: modulos.reduce((s, m) => s + m.novos, 0),
    totalRemovidos: modulos.reduce((s, m) => s + m.removidos, 0),
    totalDelta: modulos.reduce((s, m) => s + m.delta, 0),
  };

  return {
    modulos,
    avisosGerais,
    totalIncoming,
    podeImportar: totalIncoming > 0,
    resumoComparativo,
  };
}
