import { COURSE_MODALITIES, COURSE_TYPES } from "./courseOptions";

/** Chave de comparação: minúsculas, sem acentos, espaços colapsados. */
export function normalizeCourseFieldKey(value: string): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const MODALITY_ALIASES: Record<string, string> = {
  habilitacao: "Habilitação Técnica",
  "acao extensiva": "Ação Extensiva",
};

const TYPE_ALIASES: Record<string, string> = {
  aperfeicoamento: "Aperfeiçoamento",
  "aperfeicoamento/atualizacao": "Aperfeiçoamento/Atualização",
  qualificacao: "Qualificação Profissional",
  "qualificacao profissional": "Qualificação Profissional",
  "habilitacao tecnica": "Habilitação Técnica",
  "habilitacao profissional tecnica de nivel medio": "Habilitação Técnica",
  "programa socioprofissional": "Programa Socioprofissional",
  "programas socioprofissionais": "Programa Socioprofissional",
  "programa sociocultural": "Programa Socioprofissional",
  "programa instrumental": "Programa Instrumental",
  "programas instrumentais": "Programa Instrumental",
  "aprendizagem profissional": "Aprendizagem Profissional",
  aprendizagem: "Aprendizagem Profissional",
  "iniciacao profissional": "Iniciação Profissional",
  "especializacao tecnica": "Especialização Técnica",
  especializacao: "Especialização",
  oficina: "Oficina",
};

const CANONICAL_MODALITIES = new Map(
  COURSE_MODALITIES.map((value) => [normalizeCourseFieldKey(value), value]),
);

const CANONICAL_TYPES = new Map(
  COURSE_TYPES.map((value) => [normalizeCourseFieldKey(value), value]),
);

function resolveCanonical(
  value: string,
  aliases: Record<string, string>,
  canonical: Map<string, string>,
): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";

  const key = normalizeCourseFieldKey(trimmed);
  if (aliases[key]) return aliases[key];
  if (canonical.has(key)) return canonical.get(key)!;

  return trimmed;
}

/** Normaliza modalidade para exibição, filtros e persistência. */
export function normalizeCourseModality(value: string): string {
  return resolveCanonical(value, MODALITY_ALIASES, CANONICAL_MODALITIES);
}

/** Normaliza tipo de curso para exibição, filtros e persistência. */
export function normalizeCourseType(value: string): string {
  return resolveCanonical(value, TYPE_ALIASES, CANONICAL_TYPES);
}
