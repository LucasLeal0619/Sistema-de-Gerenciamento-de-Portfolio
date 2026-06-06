import { gastronomiaCourses } from "../data/gastronomiaData";
import { saudeSegurancaCourses } from "../data/saudeSegurancaData";
import { gestaoModaCourses } from "../data/gestaoModaData";
import { tecnologiaEconomiaCourses } from "../data/tecnologiaEconomiaData";
import { belezaCuidadoCourses } from "../data/belezaCuidadoData";
import { sessentaMaisCourses } from "../data/sessentaMaisData";
import { ensinoMedioCourses } from "../data/ensinoMedioData";
import { extrairAnoReferencia } from "./extrairAno";
import {
  getCursosEixo,
  getHoras,
  getStoredAcoes,
  getStoredCourses,
  getStoredEventos,
  getVisitas,
} from "./store";

export type DashboardCourse = {
  _eixo: string;
  titulo?: string;
  status: string;
  tipo?: string;
  ch?: string | number;
  unidade?: string;
  ano?: string;
};

export const DASHBOARD_EIXO_LABELS = [
  "Gastronomia",
  "Ambiente e Saúde",
  "Gestão e Moda",
  "Tecnologia e Econ. Criativa",
  "Beleza e Cuidado Pessoal",
  "60+",
  "Ensino Médio",
] as const;

const STATIC_EIXOS = [
  { label: "Gastronomia", courses: gastronomiaCourses },
  { label: "Ambiente e Saúde", courses: saudeSegurancaCourses },
  { label: "Gestão e Moda", courses: gestaoModaCourses },
  { label: "Tecnologia e Econ. Criativa", courses: tecnologiaEconomiaCourses },
  { label: "Beleza e Cuidado Pessoal", courses: belezaCuidadoCourses },
  { label: "60+", courses: sessentaMaisCourses },
  { label: "Ensino Médio", courses: ensinoMedioCourses },
];

function normalizarTexto(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function normalizarEixoDashboard(segmento: string) {
  const s = normalizarTexto(segmento);

  if (
    s.includes("gastronomia") ||
    s.includes("turismo") ||
    s.includes("bebida") ||
    s.includes("panificacao") ||
    s.includes("confeitaria") ||
    s.includes("hospitalidade")
  ) {
    return "Gastronomia";
  }

  if (
    s.includes("saude") ||
    s.includes("enfermagem") ||
    s.includes("farmacia") ||
    s.includes("ambiente") ||
    s.includes("nutricao") ||
    s.includes("radiologia")
  ) {
    return "Ambiente e Saúde";
  }

  if (s.includes("gestao") || s.includes("moda") || s.includes("negocio")) {
    return "Gestão e Moda";
  }

  if (s.includes("tecnologia") || s.includes("games") || s.includes("ti") || s.includes("economia")) {
    return "Tecnologia e Econ. Criativa";
  }

  if (s.includes("beleza") || s.includes("bem-estar") || s.includes("estetica")) {
    return "Beleza e Cuidado Pessoal";
  }

  if (s.includes("60") || s.includes("sessenta")) {
    return "60+";
  }

  if (s.includes("ensino medio") || s.includes("habilitacao") || s.includes("tecnico de nivel medio")) {
    return "Ensino Médio";
  }

  return segmento.trim() || "Outros";
}

function getStaticCourses(): DashboardCourse[] {
  return STATIC_EIXOS.flatMap((eixo) =>
    eixo.courses.map((curso: Record<string, unknown>) => ({
      _eixo: eixo.label,
      titulo: String(curso.titulo ?? curso["Titulo - Nome do Curso"] ?? ""),
      status: String(curso.status ?? "ATIVO").trim().toUpperCase(),
      tipo: String(curso.tipo ?? curso.TIPO ?? ""),
      ch: String(curso.ch ?? curso.CH ?? ""),
      unidade: String(curso.unidade ?? ""),
      ano: String(curso.ano ?? curso["Última Revisão"] ?? ""),
    })),
  );
}

export function getDashboardCourses() {
  const imported = getStoredCourses();

  if (imported.length > 0) {
    return {
      fonte: "importado" as const,
      courses: imported.map((curso) => ({
        _eixo: normalizarEixoDashboard(String(curso.segmento ?? "")),
        titulo: curso.titulo,
        status: String(curso.status ?? "ATIVO").trim().toUpperCase(),
        tipo: curso.tipo,
        ch: curso.ch,
        unidade: curso.unidade,
        ano: String(curso.ano ?? ""),
      })),
    };
  }

  return {
    fonte: "demonstracao" as const,
    courses: getStaticCourses(),
  };
}

export function getDashboardProcessMetrics() {
  const cursosEixo = getCursosEixo();

  return {
    visitas: getVisitas().length,
    horas: getHoras().length,
    acoes: getStoredAcoes().length,
    eventos: getStoredEventos().length,
    cursosNovos: cursosEixo.filter((curso) => curso.isNovo).length,
    totalCursosEixo: cursosEixo.length,
  };
}

function contarPorCampo<T>(items: T[], getter: (item: T) => string) {
  const map = new Map<string, number>();

  items.forEach((item) => {
    const key = getter(item).trim() || "Não informado";
    map.set(key, (map.get(key) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function chaveEixoComparativo(eixo: string) {
  return eixo.trim() || "Não informado";
}

export function getDashboardComparativoAnos() {
  const cursosEixo = getCursosEixo();
  const catalogo = getStoredCourses();
  const horas = getHoras();

  if (!cursosEixo.length && !catalogo.length) return null;

  const anosAlvo = ["2025", "2026"] as const;
  const totais: Record<(typeof anosAlvo)[number], number> = { "2025": 0, "2026": 0 };
  const porEixoMap = new Map<string, { name: string; eixo: string; "2025": number; "2026": number }>();

  const acumular = (eixoRaw: string, ano: string | null) => {
    if (ano !== "2025" && ano !== "2026") return;

    totais[ano]++;

    const eixo = chaveEixoComparativo(eixoRaw);
    const atual = porEixoMap.get(eixo) || {
      name: eixo.length > 28 ? `${eixo.slice(0, 26)}…` : eixo,
      eixo,
      "2025": 0,
      "2026": 0,
    };

    atual[ano]++;
    porEixoMap.set(eixo, atual);
  };

  cursosEixo.forEach((curso) => {
    acumular(curso.eixo, extrairAnoReferencia(curso.ano, curso.codigo) || "2025");
  });

  catalogo.forEach((curso) => {
    const ano = extrairAnoReferencia(curso.ano);
    if (ano !== "2026") return;

    acumular(
      normalizarEixoDashboard(String(curso.segmento ?? "")),
      ano,
    );
  });

  const horasPorAno: Record<(typeof anosAlvo)[number], number> = { "2025": 0, "2026": 0 };
  horas.forEach((item) => {
    const ano = extrairAnoReferencia(item.ano, item.processoSEI);
    if (ano === "2025" || ano === "2026") {
      horasPorAno[ano]++;
    }
  });

  const porEixo = Array.from(porEixoMap.values())
    .filter((item) => item["2025"] > 0 || item["2026"] > 0)
    .sort((a, b) => b["2025"] + b["2026"] - (a["2025"] + a["2026"]));

  const temDados = totais["2025"] + totais["2026"] > 0;
  if (!temDados) return null;

  const variacao =
    totais["2025"] > 0
      ? Math.round(((totais["2026"] - totais["2025"]) / totais["2025"]) * 100)
      : totais["2026"] > 0
        ? 100
        : 0;

  const complemento2026 = totais["2026"] === 0 && horasPorAno["2026"] > 0;

  return { totais, porEixo, variacao, horasPorAno, complemento2026 };
}

export function getDashboardProcessCharts() {
  const visitas = getVisitas();
  const horas = getHoras();

  return {
    visitasPorEixo: contarPorCampo(visitas, (item) => item.eixo || item.unidade),
    horasPorEixo: contarPorCampo(horas, (item) => item.eixo || item.segmento),
    instrutoresAcionados: contarPorCampo(
      horas.filter((item) => item.nomePessoa),
      (item) => item.nomePessoa,
    ).slice(0, 6),
  };
}
