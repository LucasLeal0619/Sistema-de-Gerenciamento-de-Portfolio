export type SavedFilterPreset = {
  id: string;
  name: string;
  filters: Record<string, string>;
  createdAt: string;
};

function storageKey(pageId: string) {
  return `sgp_filtros_${pageId}`;
}

export function getSavedFilters(pageId: string): SavedFilterPreset[] {
  try {
    const raw = localStorage.getItem(storageKey(pageId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFilterPreset(
  pageId: string,
  name: string,
  filters: Record<string, string>,
): SavedFilterPreset {
  const preset: SavedFilterPreset = {
    id: crypto.randomUUID(),
    name: name.trim(),
    filters,
    createdAt: new Date().toISOString(),
  };

  const existing = getSavedFilters(pageId);
  localStorage.setItem(storageKey(pageId), JSON.stringify([preset, ...existing].slice(0, 20)));
  return preset;
}

export function deleteFilterPreset(pageId: string, id: string) {
  const next = getSavedFilters(pageId).filter((p) => p.id !== id);
  localStorage.setItem(storageKey(pageId), JSON.stringify(next));
}
