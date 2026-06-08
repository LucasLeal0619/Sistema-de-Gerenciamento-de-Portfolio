import { getPlanoMetas, getVisitas } from "./store";

export type DeadlineSeverity = "overdue" | "soon";

export type DeadlineAlert = {
  id: string;
  tipo: "visita" | "meta";
  label: string;
  subtitle: string;
  dataLabel: string;
  date: Date;
  daysUntil: number;
  severity: DeadlineSeverity;
  href: string;
};

const MESES: Record<string, number> = {
  jan: 0,
  fev: 1,
  mar: 2,
  abr: 3,
  mai: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  set: 8,
  out: 9,
  nov: 10,
  dez: 11,
};

function parseBrDate(value: string): Date | null {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    const d = new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function parseMesEntrega(value: string): Date | null {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const br = raw.match(/^(\d{1,2})\/(\d{4})$/);
  if (br) {
    return new Date(Number(br[2]), Number(br[1]), 0);
  }

  const named = raw.match(/^([a-zA-Z]{3,})\s*\/\s*(\d{4})$/i);
  if (named) {
    const mes = MESES[named[1].slice(0, 3).toLowerCase()];
    if (mes !== undefined) return new Date(Number(named[2]), mes + 1, 0);
  }

  return parseBrDate(raw);
}

function daysBetween(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getDeadlineAlerts(daysAhead = 15): DeadlineAlert[] {
  const today = startOfToday();
  const alerts: DeadlineAlert[] = [];
  let counter = 0;

  const push = (
    tipo: DeadlineAlert["tipo"],
    label: string,
    subtitle: string,
    dataLabel: string,
    date: Date,
    href: string,
  ) => {
    const daysUntil = daysBetween(today, date);
    if (daysUntil > daysAhead) return;

    alerts.push({
      id: `dl-${counter++}`,
      tipo,
      label,
      subtitle,
      dataLabel,
      date,
      daysUntil,
      severity: daysUntil < 0 ? "overdue" : "soon",
      href,
    });
  };

  getVisitas().forEach((v) => {
    const status = String(v.status || "").toLowerCase();
    if (status.includes("conclu") || status.includes("cancel")) return;

    const prazo = parseBrDate(v.prazoLimite || "");
    if (prazo) {
      push(
        "visita",
        v.processoSEI || v.unidade || "Visita técnica",
        [v.unidade, v.eixo].filter(Boolean).join(" · "),
        `Prazo: ${v.prazoLimite}`,
        prazo,
        "/app/processos-visitas-tecnicas",
      );
      return;
    }

    const prevista = parseBrDate(v.dataVisitaPrevista || "");
    if (prevista) {
      push(
        "visita",
        v.processoSEI || v.unidade || "Visita técnica",
        [v.unidade, v.eixo].filter(Boolean).join(" · "),
        `Visita prevista: ${v.dataVisitaPrevista}`,
        prevista,
        "/app/processos-visitas-tecnicas",
      );
    }
  });

  getPlanoMetas().forEach((m) => {
    const status = String(m.status || "").toLowerCase();
    if (status.includes("conclu") || status.includes("entregue") || status.includes("finaliz")) {
      return;
    }

    const entrega = parseMesEntrega(m.mesEntrega || "");
    if (!entrega) return;

    const curso = String(m.tipo || m.categoria || "").trim();
    push(
      "meta",
      curso || "Meta sem nome",
      [m.segmento, m.numeroSEI].filter(Boolean).join(" · "),
      `Entrega: ${m.mesEntrega}`,
      entrega,
      "/app/plano-metas",
    );
  });

  return alerts.sort((a, b) => a.daysUntil - b.daysUntil);
}
