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
  showFilterButton = true,
  onFilter,
}: PageFiltersBarProps) {
  const showSearch = typeof search === "string" && typeof onSearchChange === "function";

  return (
    <div className="mx-4 mb-6 mt-6 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm lg:mx-8">
      <div className="flex flex-wrap items-end gap-3">
        {showSearch ? (
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
            />
          </div>
        ) : null}

        {children}

        {showFilterButton ? (
          <div className="flex gap-2 self-end">
            <button
              type="button"
              onClick={onFilter}
              className="h-9 rounded-lg bg-[#003F7D] px-4 text-sm font-medium text-white transition-colors hover:bg-[#002D5A]"
            >
              Filtrar
            </button>

            {hasActiveFilters && onClearFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 transition-colors hover:bg-gray-50"
              >
                <X size={13} />
                Limpar filtros
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {footer ? <div className="mt-4 border-t border-gray-100 pt-4">{footer}</div> : null}
    </div>
  );
}
