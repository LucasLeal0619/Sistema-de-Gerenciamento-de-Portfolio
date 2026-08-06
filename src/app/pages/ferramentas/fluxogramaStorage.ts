export type FluxoNodeType = "inicio" | "fim" | "processo" | "decisao";

export type FluxogramaNode = {
  id: string;
  type: FluxoNodeType;
  label: string;
  x: number;
  y: number;
};

export type FluxogramaEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type FluxogramaItem = {
  id: string;
  titulo: string;
  slug: string;
  descricao?: string;
  tipo: "linear" | "funcional";
  nodes: FluxogramaNode[];
  edges: FluxogramaEdge[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "sgp_fluxogramas";

export const NODE_COLORS: Record<
  FluxoNodeType,
  { borda: string; fundo: string; texto: string; label: string }
> = {
  inicio: { borda: "#003F7D", fundo: "#e8f1fb", texto: "#003F7D", label: "Início" },
  fim: { borda: "#475569", fundo: "#e2e8f0", texto: "#1e293b", label: "Fim" },
  processo: { borda: "#003F7D", fundo: "#eff6ff", texto: "#003F7D", label: "Processo" },
  decisao: { borda: "#F57C00", fundo: "#fff7ed", texto: "#9a3412", label: "Decisão" },
};

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(text: string) {
  const base = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "fluxograma";
}

function uniqueSlug(titulo: string, existing: FluxogramaItem[], ignoreId?: string) {
  const base = slugify(titulo);
  let slug = base;
  let n = 2;
  while (existing.some((q) => q.slug === slug && q.id !== ignoreId)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

function templateNodes(): { nodes: FluxogramaNode[]; edges: FluxogramaEdge[] } {
  const n1 = uid("n");
  const n2 = uid("n");
  const n3 = uid("n");
  return {
    nodes: [
      { id: n1, type: "inicio", label: "Início", x: 80, y: 120 },
      { id: n2, type: "processo", label: "Processo", x: 280, y: 110 },
      { id: n3, type: "fim", label: "Fim", x: 500, y: 120 },
    ],
    edges: [
      { id: uid("e"), source: n1, target: n2 },
      { id: uid("e"), source: n2, target: n3 },
    ],
  };
}

export function loadFluxogramas(): FluxogramaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FluxogramaItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFluxogramas(items: FluxogramaItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getFluxogramaBySlug(slug: string) {
  return loadFluxogramas().find((f) => f.slug === slug) ?? null;
}

export function createFluxograma(input: {
  titulo: string;
  descricao?: string;
  tipo: "linear" | "funcional";
}) {
  const all = loadFluxogramas();
  const now = new Date().toISOString();
  const tpl = templateNodes();
  const item: FluxogramaItem = {
    id: uid("flux"),
    titulo: input.titulo.trim(),
    slug: uniqueSlug(input.titulo, all),
    descricao: input.descricao?.trim() || undefined,
    tipo: input.tipo,
    nodes: tpl.nodes,
    edges: tpl.edges,
    createdAt: now,
    updatedAt: now,
  };
  saveFluxogramas([item, ...all]);
  return item;
}

export function updateFluxogramaMeta(
  id: string,
  input: { titulo: string; descricao?: string; tipo: "linear" | "funcional" },
) {
  const all = loadFluxogramas();
  const updated = all.map((f) => {
    if (f.id !== id) return f;
    return {
      ...f,
      titulo: input.titulo.trim(),
      descricao: input.descricao?.trim() || undefined,
      tipo: input.tipo,
      slug: uniqueSlug(input.titulo, all, id),
      updatedAt: new Date().toISOString(),
    };
  });
  saveFluxogramas(updated);
  return updated.find((f) => f.id === id) ?? null;
}

export function deleteFluxograma(id: string) {
  saveFluxogramas(loadFluxogramas().filter((f) => f.id !== id));
}

export function saveFluxogramaDiagrama(item: FluxogramaItem) {
  const all = loadFluxogramas();
  const next = { ...item, updatedAt: new Date().toISOString() };
  saveFluxogramas(all.map((f) => (f.id === next.id ? next : f)));
  return next;
}

export function newNodeId() {
  return uid("n");
}

export function newEdgeId() {
  return uid("e");
}
