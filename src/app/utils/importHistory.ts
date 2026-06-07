import { getSession } from "./auth";
import type { ResultadoModulo } from "./importarPortfolioCompleto";

const HISTORY_KEY = "sgp_import_history";
const MAX_ENTRIES = 50;

export type ImportHistoryEntry = {
  id: string;
  timestamp: string;
  usuario: string;
  email: string;
  fileName: string;
  totalImportado: number;
  modulos: { modulo: string; label: string; quantidade: number }[];
};

function readHistory(): ImportHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: ImportHistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function getImportHistory(): ImportHistoryEntry[] {
  return readHistory();
}

export function getUltimaImportacao(): ImportHistoryEntry | null {
  return readHistory()[0] ?? null;
}

export function recordImportHistory(
  fileName: string,
  resultados: ResultadoModulo[],
  totalImportado: number,
) {
  const session = getSession();
  const entry: ImportHistoryEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    usuario: session?.nome ?? "Sistema",
    email: session?.email ?? "—",
    fileName,
    totalImportado,
    modulos: resultados
      .filter((r) => r.quantidade > 0)
      .map((r) => ({ modulo: r.modulo, label: r.label, quantidade: r.quantidade })),
  };

  writeHistory([entry, ...readHistory()]);
  return entry;
}

export function formatImportWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
