export type GrupoStatusPlanoMetas =
  | "PUBLICADO"
  | "EM ANALISE"
  | "PENDENTE"
  | "OUTRO";

export function normalizarStatusPlanoMetas(status: string) {
  return String(status ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function classificarStatusPlanoMetas(status: string): GrupoStatusPlanoMetas {
  const s = normalizarStatusPlanoMetas(status);

  if (!s || s === "-" || s === "X") return "OUTRO";
  if (s.includes("ARQUIVADO")) return "OUTRO";

  if (s.includes("EM ANALISE") || (s.includes("ANALISE") && !s.includes("PRECIFIC"))) {
    return "EM ANALISE";
  }

  if (s.includes("PENDENTE") || s.includes("CPFD")) return "PENDENTE";

  if (s.includes("PUBLICADO") || s.includes("INTRANET") || s.includes("VIGENTE")) {
    return "PUBLICADO";
  }

  if (s.includes("PRECIFICADO") || s.includes("ENTREGUE")) {
    return "PUBLICADO";
  }

  if (s.includes("CPED")) {
    if (
      s.includes("AUTORIZ") ||
      s.includes("PRECIFICACAO AUTORIZ") ||
      s.includes("PRECIFICADO")
    ) {
      return "PUBLICADO";
    }

    if (
      s.includes("FALTA") ||
      s.includes("AJUSTE") ||
      s.includes("SOLICITA") ||
      s.includes("PARECER") ||
      s.includes("ASSINATURA") ||
      s.includes("NAO ESTA") ||
      s.includes("RASCUNHO")
    ) {
      return "PENDENTE";
    }

    return "PENDENTE";
  }

  if (s.includes("NUCOMP")) return "PENDENTE";

  return "OUTRO";
}

export function labelGrupoStatusPlanoMetas(grupo: GrupoStatusPlanoMetas) {
  switch (grupo) {
    case "PUBLICADO":
      return "Publicado";
    case "EM ANALISE":
      return "Em análise";
    case "PENDENTE":
      return "Pendente / CPED";
    default:
      return "Outros";
  }
}

export function statusBadgeClassPlanoMetas(status: string) {
  const grupo = classificarStatusPlanoMetas(status);

  switch (grupo) {
    case "PUBLICADO":
      return "bg-green-100 text-green-700 border-green-200";
    case "EM ANALISE":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "PENDENTE":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function registroPertenceGrupoPlanoMetas(
  status: string,
  grupoFiltro: GrupoStatusPlanoMetas | "Todos",
) {
  if (grupoFiltro === "Todos") return true;
  return classificarStatusPlanoMetas(status) === grupoFiltro;
}

export function statusExigeObservacaoPlanoMetas(status: string) {
  const grupo = classificarStatusPlanoMetas(status);
  return grupo === "EM ANALISE" || grupo === "PENDENTE";
}
