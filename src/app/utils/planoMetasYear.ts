import type { PlanoMetaRecord } from "./store";

export const PLANO_METAS_DEFAULT_YEARS = ["2024", "2025", "2026", "2027"] as const;

export function inferPlanoMetaYear(
  record: Partial<PlanoMetaRecord> & { numeroSEI?: string; ano?: string },
  fallback = "2025",
): string {
  const explicit = String(record.ano ?? "").trim();
  if (/^\d{4}$/.test(explicit)) return explicit;

  const sei = String(record.numeroSEI ?? "").trim();
  const fromSei = sei.match(/^(\d{4})/);
  if (fromSei) return fromSei[1];

  return fallback;
}

export function buildPlanoMetasYearOptions(records: PlanoMetaRecord[]): string[] {
  const fromData = records.map((record) => inferPlanoMetaYear(record)).filter(Boolean);
  return Array.from(new Set([...PLANO_METAS_DEFAULT_YEARS, ...fromData])).sort();
}

export function resolveDefaultPlanoMetasYear(
  years: string[],
  records: PlanoMetaRecord[],
): string {
  const yearsWithData = years.filter((year) =>
    records.some((record) => inferPlanoMetaYear(record) === year),
  );

  if (yearsWithData.length) {
    return yearsWithData[yearsWithData.length - 1];
  }

  const currentYear = String(new Date().getFullYear());
  if (years.includes(currentYear)) return currentYear;
  if (years.includes("2025")) return "2025";
  return years[years.length - 1] ?? "2025";
}

export function filterPlanoMetasByYear(
  records: PlanoMetaRecord[],
  year: string,
): PlanoMetaRecord[] {
  if (year === "Todos") return records;
  return records.filter((record) => inferPlanoMetaYear(record) === year);
}
