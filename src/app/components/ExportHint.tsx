type ExportHintProps = {
  filteredCount: number;
  totalCount?: number;
};

export function ExportHint({ filteredCount, totalCount }: ExportHintProps) {
  const isFiltered =
    typeof totalCount === "number" && totalCount > 0 && filteredCount < totalCount;

  return (
    <p className="text-xs text-gray-500">
      {filteredCount > 0 ? (
        <>
          Exportação usa <strong>{filteredCount}</strong> registro
          {filteredCount === 1 ? "" : "s"} visíve{filteredCount === 1 ? "l" : "is"} após os filtros
          {isFiltered ? (
            <>
              {" "}
              (de <strong>{totalCount}</strong> no total)
            </>
          ) : null}
          .
        </>
      ) : (
        <>Nenhum registro visível para exportar. Ajuste os filtros ou importe dados.</>
      )}
    </p>
  );
}
