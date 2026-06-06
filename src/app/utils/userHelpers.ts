export const UNIDADES = [
  "Asa Norte",
  "Taguatinga",
  "Gama",
  "Ceilândia",
  "Sobradinho",
  "Jessé Freire",
  "Santa Maria",
  "São Sebastião",
  "Brazlândia",
];

export const PERFIS = [
  { value: "admin", label: "Administrador", desc: "Acesso total ao sistema" },
  { value: "editor", label: "Editor", desc: "Pode cadastrar e editar cursos" },
  { value: "consultivo", label: "Consultivo", desc: "Apenas visualização" },
] as const;

export const PERFIL_LABELS = PERFIS.map((p) => p.label);

export const STATUS_LIST = ["Ativo", "Inativo", "Suspenso"] as const;

export function perfilToSlug(perfil: string): string {
  const p = perfil.toLowerCase().trim();
  if (p === "admin" || p.includes("administr")) return "admin";
  if (p === "editor" || p.includes("editor")) return "editor";
  if (p === "consultivo" || p.includes("consult")) return "consultivo";
  return p;
}

export function perfilToLabel(perfil: string): string {
  const slug = perfilToSlug(perfil);
  return PERFIS.find((p) => p.value === slug)?.label ?? perfil;
}

export function getInitials(nome: string): string {
  return (
    nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function isStatusAtivo(status: string): boolean {
  const s = status.toLowerCase();
  return s === "ativo" || s === "online";
}

export function normalizeStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === "online" || s === "ativo") return "Ativo";
  if (s === "offline" || s === "inativo") return "Inativo";
  if (s === "suspenso") return "Suspenso";
  return status;
}

export const PERFIL_STYLE: Record<string, { bg: string; text: string }> = {
  admin: { bg: "bg-blue-100", text: "text-blue-800" },
  editor: { bg: "bg-green-100", text: "text-green-800" },
  consultivo: { bg: "bg-purple-100", text: "text-purple-800" },
};

export const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  Ativo: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  Inativo: { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  Suspenso: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};
