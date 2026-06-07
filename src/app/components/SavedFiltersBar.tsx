import { useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import {
  deleteFilterPreset,
  getSavedFilters,
  saveFilterPreset,
  type SavedFilterPreset,
} from "../utils/savedFilters";
import { toastSuccess } from "../utils/toast";

type Props = {
  pageId: string;
  currentFilters: Record<string, string>;
  onApply: (filters: Record<string, string>) => void;
};

export function SavedFiltersBar({ pageId, currentFilters, onApply }: Props) {
  const [presets, setPresets] = useState<SavedFilterPreset[]>(() => getSavedFilters(pageId));
  const [name, setName] = useState("");

  const refresh = () => setPresets(getSavedFilters(pageId));

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    saveFilterPreset(pageId, trimmed, currentFilters);
    setName("");
    refresh();
    toastSuccess(`Filtro "${trimmed}" salvo.`);
  };

  const handleDelete = (id: string) => {
    deleteFilterPreset(pageId, id);
    refresh();
  };

  return (
    <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Bookmark size={16} className="text-[#003F7D]" />
          Filtros salvos
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do filtro..."
            className="h-9 min-w-[160px] flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/15 lg:max-w-xs"
          />
          <button
            type="button"
            onClick={handleSave}
            className="h-9 rounded-lg bg-[#003F7D] px-4 text-sm font-semibold text-white hover:bg-[#00355C]"
          >
            Salvar atual
          </button>
        </div>
      </div>

      {presets.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="inline-flex items-center gap-1 rounded-full border border-[#003F7D]/15 bg-white pl-3 pr-1 py-1"
            >
              <button
                type="button"
                onClick={() => onApply(preset.filters)}
                className="text-xs font-semibold text-[#003F7D] hover:underline"
              >
                {preset.name}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(preset.id)}
                className="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                aria-label={`Excluir filtro ${preset.name}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-gray-500">
          Salve combinações de filtros usadas com frequência para aplicar com um clique.
        </p>
      )}
    </div>
  );
}
