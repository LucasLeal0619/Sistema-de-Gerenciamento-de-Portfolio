import { Info } from "lucide-react";

type ImportReplaceHintProps = {
  modulo?: string;
  className?: string;
};

export function ImportReplaceHint({ modulo, className = "" }: ImportReplaceHintProps) {
  const texto = modulo
    ? `Reimportar a planilha substitui todos os registros de ${modulo}. Edições feitas aqui no SGP serão perdidas se não estiverem na planilha.`
    : "Reimportar a planilha substitui os dados de Cursos, Plano de Metas, PCA, Cursos por Eixo, Visitas, Horas, Ações Extensivas e Eventos. Edições feitas no SGP serão perdidas se não estiverem na planilha.";

  return (
    <div
      className={`flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className}`}
    >
      <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
      <p>{texto}</p>
    </div>
  );
}
