/** Normaliza texto para busca: minúsculas, sem acento, espaços colapsados. */
export function normalizeSearchText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u2000-\u200F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Busca por trecho (1 letra ou palavra), em qualquer posição.
 * Ignora maiúscula/minúscula e acentos.
 *
 * Importante: passe só campos “de conteúdo” (nome, SEI, SIG, observação…).
 * Não passe Status/Tipo/flags — valores como ATIVO/APERFEIÇOAMENTO
 * fazem qualquer letra comum parecer que “não filtra”.
 */
export function matchesSearchQuery(query: unknown, ...fields: unknown[]): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;

  return fields.some((field) => normalizeSearchText(field).includes(q));
}

/** Campos que poluem a busca livre (já têm select próprio / enum). */
export function isNoisySearchFieldKey(key: string): boolean {
  const k = normalizeSearchText(key);
  return (
    k === "status" ||
    k === "status final" ||
    k === "status sig" ||
    k === "ativo" ||
    k === "inativo" ||
    k === "tipo" ||
    k === "tipo de curso" ||
    k === "categoria" ||
    k === "priorizacao" ||
    k === "prioridade" ||
    k === "modalidade" ||
    k === "possui acao extensiva" ||
    k === "novo" ||
    k === "isnovo" ||
    k === "prazo" ||
    k.startsWith("status ") ||
    k.includes("fora do prazo") ||
    k.includes("dentro do prazo")
  );
}
