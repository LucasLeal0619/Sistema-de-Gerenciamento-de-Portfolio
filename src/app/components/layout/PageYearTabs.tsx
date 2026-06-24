type PageYearTabsProps = {
  years: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  counts?: Record<string, number>;
  label?: string;
};

export function PageYearTabs({
  years,
  selectedYear,
  onYearChange,
  counts,
  label = "Ano",
}: PageYearTabsProps) {
  if (!years.length) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-500">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {years.map((year) => {
          const active = year === selectedYear;
          const count = counts?.[year];

          return (
            <button
              key={year}
              type="button"
              onClick={() => onYearChange(year)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "border-[#003F7D] bg-[#003F7D] text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#003F7D]/30 hover:bg-[#E8EFF7] hover:text-[#003F7D]"
              }`}
              aria-pressed={active}
            >
              <span>{year}</span>
              {typeof count === "number" ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
