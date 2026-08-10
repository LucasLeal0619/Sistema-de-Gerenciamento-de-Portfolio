/** Texto padronizado do contador acima das tabelas: "X registro" / "X registros". */
export function formatRegistrosCount(count: number): string {
  const n = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
  return n === 1 ? "1 registro" : `${n} registros`;
}

type TabelaContadorProps = {
  count: number;
  className?: string;
};

export function TabelaContador({ count, className = "" }: TabelaContadorProps) {
  return (
    <span className={className ? `tabela-contador ${className}` : "tabela-contador"}>
      {formatRegistrosCount(count)}
    </span>
  );
}
