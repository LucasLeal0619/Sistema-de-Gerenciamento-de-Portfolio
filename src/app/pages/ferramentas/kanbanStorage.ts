export type KanbanCartao = {
  id: string;
  titulo: string;
  descricao?: string;
};

export type KanbanColuna = {
  id: string;
  titulo: string;
  cor: string;
  cartoes: KanbanCartao[];
};

export type KanbanQuadro = {
  id: string;
  nome: string;
  slug: string;
  colunas: KanbanColuna[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "sgp_kanban_quadros";

const DEFAULT_COLUMNS: Omit<KanbanColuna, "id" | "cartoes">[] = [
  { titulo: "A Fazer", cor: "#64748B" },
  { titulo: "Em Andamento", cor: "#F57C00" },
  { titulo: "Concluído", cor: "#16A34A" },
];

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function slugify(text: string) {
  const base = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "quadro";
}

function uniqueSlug(nome: string, existing: KanbanQuadro[], ignoreId?: string) {
  const base = slugify(nome);
  let slug = base;
  let n = 2;
  while (existing.some((q) => q.slug === slug && q.id !== ignoreId)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

function createDefaultColumns(): KanbanColuna[] {
  return DEFAULT_COLUMNS.map((col) => ({
    ...col,
    id: uid("col"),
    cartoes: [],
  }));
}

export function loadKanbanQuadros(): KanbanQuadro[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as KanbanQuadro[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveKanbanQuadros(quadros: KanbanQuadro[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quadros));
}

export function getKanbanQuadroBySlug(slug: string) {
  return loadKanbanQuadros().find((q) => q.slug === slug) ?? null;
}

export function createKanbanQuadro(nome: string) {
  const quadros = loadKanbanQuadros();
  const now = new Date().toISOString();
  const quadro: KanbanQuadro = {
    id: uid("quadro"),
    nome: nome.trim(),
    slug: uniqueSlug(nome, quadros),
    colunas: createDefaultColumns(),
    createdAt: now,
    updatedAt: now,
  };
  saveKanbanQuadros([quadro, ...quadros]);
  return quadro;
}

export function renameKanbanQuadro(id: string, nome: string) {
  const quadros = loadKanbanQuadros();
  const updated = quadros.map((q) => {
    if (q.id !== id) return q;
    return {
      ...q,
      nome: nome.trim(),
      slug: uniqueSlug(nome, quadros, id),
      updatedAt: new Date().toISOString(),
    };
  });
  saveKanbanQuadros(updated);
  return updated.find((q) => q.id === id) ?? null;
}

export function deleteKanbanQuadro(id: string) {
  saveKanbanQuadros(loadKanbanQuadros().filter((q) => q.id !== id));
}

export function updateKanbanQuadro(quadro: KanbanQuadro) {
  const quadros = loadKanbanQuadros();
  const next = {
    ...quadro,
    updatedAt: new Date().toISOString(),
  };
  saveKanbanQuadros(quadros.map((q) => (q.id === next.id ? next : q)));
  return next;
}

export function quadroResumo(quadro: KanbanQuadro) {
  const totalColunas = quadro.colunas.length;
  const totalCartoes = quadro.colunas.reduce((acc, c) => acc + c.cartoes.length, 0);
  return { totalColunas, totalCartoes };
}

export function newCartaoId() {
  return uid("cartao");
}
