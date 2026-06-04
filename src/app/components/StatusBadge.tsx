const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Verde — concluído / publicado / ativo / realizado / aprovado
  concluido:   { label: "Concluído",  className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  "concluída": { label: "Concluída",  className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  publicado:   { label: "Publicado",  className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  publicada:   { label: "Publicada",  className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  ativo:       { label: "Ativo",      className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  ativa:       { label: "Ativa",      className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  vigente:     { label: "Vigente",    className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  "em vigor":  { label: "Em vigor",   className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  realizada:   { label: "Realizada",  className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  realizado:   { label: "Realizado",  className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  aprovada:    { label: "Aprovada",   className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  aprovado:    { label: "Aprovado",   className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },

  // Amarelo — em análise / pendente / planejada / em andamento
  "em análise":     { label: "Em análise",     className: "bg-amber-50 text-amber-700 border border-amber-200" },
  "em andamento":   { label: "Em andamento",   className: "bg-amber-50 text-amber-700 border border-amber-200" },
  pendente:         { label: "Pendente",        className: "bg-amber-50 text-amber-700 border border-amber-200" },
  planejada:        { label: "Planejada",       className: "bg-amber-50 text-amber-700 border border-amber-200" },
  planejado:        { label: "Planejado",       className: "bg-amber-50 text-amber-700 border border-amber-200" },
  "em planejamento":{ label: "Em planejamento", className: "bg-amber-50 text-amber-700 border border-amber-200" },

  // Vermelho — fora do prazo / devolvido / cancelado / vencido / recusado / CPFD
  "fora do prazo": { label: "Fora do prazo", className: "bg-red-50 text-red-700 border border-red-200" },
  devolvido:       { label: "Devolvido",     className: "bg-red-50 text-red-700 border border-red-200" },
  devolvida:       { label: "Devolvida",     className: "bg-red-50 text-red-700 border border-red-200" },
  cancelado:       { label: "Cancelado",     className: "bg-red-50 text-red-700 border border-red-200" },
  cancelada:       { label: "Cancelada",     className: "bg-red-50 text-red-700 border border-red-200" },
  vencido:         { label: "Vencido",       className: "bg-red-50 text-red-700 border border-red-200" },
  revogado:        { label: "Revogado",      className: "bg-red-50 text-red-700 border border-red-200" },
  revogada:        { label: "Revogada",      className: "bg-red-50 text-red-700 border border-red-200" },
  recusado:        { label: "Recusado",      className: "bg-red-50 text-red-700 border border-red-200" },
  recusada:        { label: "Recusada",      className: "bg-red-50 text-red-700 border border-red-200" },
  cpfd:            { label: "CPFD",          className: "bg-red-50 text-red-700 border border-red-200" },

  // Cinza — inativo / suspenso / arquivado
  inativo:   { label: "Inativo",   className: "bg-gray-100 text-gray-600 border border-gray-200" },
  inativa:   { label: "Inativa",   className: "bg-gray-100 text-gray-600 border border-gray-200" },
  suspenso:  { label: "Suspenso",  className: "bg-gray-100 text-gray-600 border border-gray-200" },
  suspensa:  { label: "Suspensa",  className: "bg-gray-100 text-gray-600 border border-gray-200" },
  arquivado: { label: "Arquivado", className: "bg-gray-100 text-gray-600 border border-gray-200" },
  arquivada: { label: "Arquivada", className: "bg-gray-100 text-gray-600 border border-gray-200" },

  // Azul — informativo / solicitada / submetido / em elaboração
  solicitada:      { label: "Solicitada",    className: "bg-blue-50 text-blue-700 border border-blue-200" },
  solicitado:      { label: "Solicitado",    className: "bg-blue-50 text-blue-700 border border-blue-200" },
  submetido:       { label: "Submetido",     className: "bg-blue-50 text-blue-700 border border-blue-200" },
  submetida:       { label: "Submetida",     className: "bg-blue-50 text-blue-700 border border-blue-200" },
  "em elaboração": { label: "Em elaboração", className: "bg-blue-50 text-blue-700 border border-blue-200" },
  informativo:     { label: "Informativo",   className: "bg-blue-50 text-blue-700 border border-blue-200" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const key = status.trim().toLowerCase();
  const config = STATUS_MAP[key];

  if (config) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`}>
        {config.label}
      </span>
    );
  }

  // Fallback: render as blue badge with original text
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}>
      {status}
    </span>
  );
}
