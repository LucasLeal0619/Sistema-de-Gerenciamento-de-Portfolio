import type { HoraRecord, VisitaRecord } from "./store";

// Centralizes the process indicator calculations rendered by the Dashboard.
export type IndicatorEntry = {
  label: string;
  value: number;
};

export type VisitasIndicators = {
  total: number;
  realizadas: number;
  pendentes: number;
  foraPrazoCount: number;
  dentroPrazo: number;
  devolvidasRecusadas: number;
  porEixo: IndicatorEntry[];
  porStatus: IndicatorEntry[];
  porUnidade: IndicatorEntry[];
  porResponsavel: IndicatorEntry[];
};

export type HorasIndicators = {
  total: number;
  concluidas: number;
  aprovadas: number;
  emAnalise: number;
  solicitadas: number;
  recusadas: number;
  inativos: number;
  porEixo: IndicatorEntry[];
  porStatus: IndicatorEntry[];
  porSegmento: IndicatorEntry[];
  porPessoa: IndicatorEntry[];
};

export function normalizeProcessText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function parseProcessDate(value: string) {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isVisitaForaPrazo(prazoLimite: string, status: string) {
  if (!prazoLimite) return false;

  const statusNormalizado = normalizeProcessText(status);

  if (
    statusNormalizado.includes("realizada") ||
    statusNormalizado.includes("concluida") ||
    statusNormalizado.includes("devolvida") ||
    statusNormalizado.includes("recusada")
  ) {
    return false;
  }

  const hoje = new Date();
  const prazo = parseProcessDate(prazoLimite);

  if (!prazo) return false;

  hoje.setHours(0, 0, 0, 0);
  prazo.setHours(0, 0, 0, 0);

  return hoje > prazo;
}

function countBy<T>(records: T[], getter: (record: T) => string): IndicatorEntry[] {
  const map = new Map<string, number>();

  records.forEach((record) => {
    const key = getter(record) || "N\u00e3o informado";
    map.set(key, (map.get(key) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function buildVisitasIndicators(records: VisitaRecord[]): VisitasIndicators {
  const total = records.length;
  const realizadas = records.filter((r) => normalizeProcessText(r.status).includes("realizada")).length;
  const foraPrazoCount = records.filter((r) => isVisitaForaPrazo(r.prazoLimite, r.status)).length;
  const dentroPrazo = Math.max(total - foraPrazoCount, 0);

  const devolvidasRecusadas = records.filter((r) => {
    const status = normalizeProcessText(r.status);
    return status.includes("devolvida") || status.includes("recusada");
  }).length;

  const pendentes = records.filter((r) => {
    const status = normalizeProcessText(r.status);
    return status.includes("solicitada") || status.includes("analise") || status.includes("aprovada");
  }).length;

  return {
    total,
    realizadas,
    pendentes,
    foraPrazoCount,
    dentroPrazo,
    devolvidasRecusadas,
    porEixo: countBy(records, (r) => r.eixo),
    porStatus: countBy(records, (r) => r.status),
    porUnidade: countBy(records, (r) => r.unidade),
    porResponsavel: countBy(
      records.filter((r) => r.responsavel),
      (r) => r.responsavel,
    ),
  };
}

export function buildHorasIndicators(records: HoraRecord[]): HorasIndicators {
  const normalized = records.map((record) => ({
    ...record,
    ativo: record.ativo ?? true,
  }));

  return {
    total: normalized.length,
    concluidas: normalized.filter((r) => normalizeProcessText(r.status).includes("concluida")).length,
    aprovadas: normalized.filter((r) => normalizeProcessText(r.status).includes("aprovada")).length,
    emAnalise: normalized.filter((r) => normalizeProcessText(r.status).includes("analise")).length,
    solicitadas: normalized.filter((r) => normalizeProcessText(r.status).includes("solicitada")).length,
    recusadas: normalized.filter((r) => normalizeProcessText(r.status).includes("recusada")).length,
    inativos: normalized.filter((r) => !(r.ativo ?? true)).length,
    porEixo: countBy(normalized, (r) => r.eixo),
    porStatus: countBy(normalized, (r) => r.status),
    porSegmento: countBy(normalized, (r) => r.segmento),
    porPessoa: countBy(normalized, (r) => r.nomePessoa),
  };
}
