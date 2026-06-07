import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Button } from "./ui/button";
import type { PreviewPortfolio } from "../utils/analisarPortfolio";

type Props = {
  preview: PreviewPortfolio;
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ImportPreviewModal({ preview, fileName, onConfirm, onCancel, loading }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-[#F57C00]" />
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#003F7D]">Pré-visualização da importação</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">{fileName}</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto px-6 py-4 space-y-3 max-h-[55vh]">
          {(preview.resumoComparativo.totalNovos > 0 ||
            preview.resumoComparativo.totalRemovidos > 0 ||
            preview.resumoComparativo.totalDelta !== 0) && (
            <div className="rounded-xl border border-[#003F7D]/15 bg-[#E8EFF7] px-4 py-3">
              <p className="text-sm font-semibold text-[#003F7D]">Comparativo antes → depois</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {preview.resumoComparativo.totalNovos > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-800">
                    +{preview.resumoComparativo.totalNovos} novo(s) no total
                  </span>
                )}
                {preview.resumoComparativo.totalRemovidos > 0 && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800">
                    −{preview.resumoComparativo.totalRemovidos} removido(s) no total
                  </span>
                )}
                <span className="rounded-full bg-white px-2.5 py-1 font-medium text-[#003F7D]">
                  Variação líquida: {preview.resumoComparativo.totalDelta > 0 ? "+" : ""}
                  {preview.resumoComparativo.totalDelta} registros
                </span>
              </div>
              <p className="mt-2 text-xs text-[#003F7D]/70">
                Contagem apenas dos módulos que serão alterados. Módulos sem dados na planilha
                permanecem como estão.
              </p>
            </div>
          )}

          {preview.avisosGerais.map((aviso) => (
            <div key={aviso} className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              {aviso}
            </div>
          ))}

          {preview.modulos.map((m) => (
            <div key={m.modulo} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{m.label}</span>
                <span className="text-sm text-gray-500">
                  {m.incoming} na planilha · {m.atual} no sistema
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {m.novos > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-medium text-emerald-800">
                    +{m.novos} novo(s)
                  </span>
                )}
                {m.removidos > 0 && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-800">
                    −{m.removidos} removido(s)
                  </span>
                )}
                {m.delta !== 0 && (
                  <span className="rounded-full bg-[#003F7D]/10 px-2.5 py-0.5 font-medium text-[#003F7D]">
                    Δ {m.delta > 0 ? "+" : ""}{m.delta}
                  </span>
                )}
                {m.incoming === 0 && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-600">
                    Mantido no sistema
                  </span>
                )}
              </div>
              {m.avisos.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-amber-800">
                  {m.avisos.map((a) => (
                    <li key={a} className="flex items-start gap-1.5">
                      <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <p className="text-xs text-gray-500">
            Apenas módulos <strong>com dados na planilha</strong> serão substituídos. Um snapshot
            automático é salvo antes da importação — use <strong>Desfazer última importação</strong> na
            Início se necessário.
          </p>
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <Button
            className="flex-1 bg-[#F57C00] hover:bg-[#E06900] gap-2"
            onClick={onConfirm}
            disabled={!preview.podeImportar || loading}
          >
            <CheckCircle2 size={16} />
            {loading
              ? "Importando..."
              : preview.podeImportar
                ? "Confirmar importação"
                : "Planilha não reconhecida"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
