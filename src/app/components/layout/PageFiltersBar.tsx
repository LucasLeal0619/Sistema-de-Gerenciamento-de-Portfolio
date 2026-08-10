import type { ReactNode } from "react";
import { Search, X } from "lucide-react";

type PageFiltersBarProps = {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  /** No sistema real os filtros aplicam ao mudar — botão Filtrar não existe. */
  showFilterButton?: boolean;
  onFilter?: () => void;
};

export function PageFiltersBar({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  children,
  footer,
  onClearFilters,
  hasActiveFilters = false,
  showFilterButton = false,
  onFilter,
}: PageFiltersBarProps) {
  const showSearch = typeof search === "string" && typeof onSearchChange === "function";

  const emitSearch = (value: string) => {
    onSearchChange?.(value);
  };

  return (
    <div className="filtros-panel">
      <div className="filtros-row">
        {showSearch ? (
          <div className="filtro-busca">
            <span className="filtro-busca-icon" aria-hidden="true">
              <Search size={15} strokeWidth={2} />
            </span>
            <input
              value={search}
              onChange={(event) => emitSearch(event.target.value)}
              onInput={(event) => emitSearch(event.currentTarget.value)}
              placeholder={searchPlaceholder}
              type="text"
              role="searchbox"
              autoComplete="off"
              spellCheck={false}
              name="filtro-busca-sgp"
              aria-label={searchPlaceholder}
            />
          </div>
        ) : null}

        {children}

        {hasActiveFilters && onClearFilters ? (
          <div className="flex gap-2 self-end">
            <button
              type="button"
              onClick={onClearFilters}
              className="flex h-[2.4rem] items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 transition-colors hover:bg-gray-50"
            >
              <X size={13} />
              Limpar filtros
            </button>
          </div>
        ) : null}

        {showFilterButton ? (
          <div className="flex gap-2 self-end">
            <button
              type="button"
              onClick={onFilter}
              className="h-[2.4rem] rounded-lg bg-[#003F7D] px-4 text-sm font-medium text-white transition-colors hover:bg-[#002D5A]"
            >
              Filtrar
            </button>
          </div>
        ) : null}
      </div>

      {footer ? <div className="mt-4 border-t border-gray-100 pt-4">{footer}</div> : null}
    </div>
  );
}
