export function extrairAnoReferencia(...valores: unknown[]) {
  for (const valor of valores) {
    const texto = String(valor ?? "").trim();
    if (!texto) continue;

    const match =
      texto.match(/\b(2024|2025|2026)\b/) || texto.match(/^(2024|2025|2026)/);
    if (match) return match[1];
  }

  return null;
}

export function detectarAnoEmTexto(texto: string) {
  const normalizado = String(texto ?? "").toLowerCase();
  if (normalizado.includes("2026")) return "2026";
  if (normalizado.includes("2025")) return "2025";
  if (normalizado.includes("2024")) return "2024";
  return null;
}
