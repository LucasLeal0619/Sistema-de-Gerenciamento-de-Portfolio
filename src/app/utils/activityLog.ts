import { getSession } from "./auth";

const LOG_KEY = "sgp_atividade_log";
const MAX_ENTRIES = 200;

export type ActivityEntry = {
  id: string;
  timestamp: string;
  usuario: string;
  email: string;
  acao: string;
  detalhes?: string;
};

function readLog(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLog(entries: ActivityEntry[]) {
  localStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function getActivityLog(): ActivityEntry[] {
  return readLog();
}

export function logActivity(acao: string, detalhes?: string) {
  const session = getSession();
  const entry: ActivityEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    usuario: session?.nome ?? "Sistema",
    email: session?.email ?? "—",
    acao,
    detalhes,
  };
  writeLog([entry, ...readLog()]);
}

export function clearActivityLog() {
  localStorage.removeItem(LOG_KEY);
}
