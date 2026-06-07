import { Clock, Download, FileText, X } from "lucide-react";
import { getActivityLog, type ActivityEntry } from "../utils/activityLog";
import { downloadActivityLogCsv, exportActivityLogPdf } from "../utils/activityLogExport";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ActivityLogPanel({ onClose }: { onClose: () => void }) {
  const entries: ActivityEntry[] = getActivityLog();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-[#003F7D]" />
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#003F7D]" />
            <h2 className="text-lg font-bold text-[#003F7D]">Log de atividades</h2>
          </div>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => downloadActivityLogCsv()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Download size={14} />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => void exportActivityLogPdf()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#003F7D]/20 px-3 py-1.5 text-xs font-semibold text-[#003F7D] hover:bg-[#E8EFF7]"
                >
                  <FileText size={14} />
                  PDF
                </button>
              </>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Nenhuma atividade registrada ainda.</p>
          ) : (
            <ul className="space-y-3">
              {entries.map((e) => (
                <li key={e.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{e.acao}</p>
                      {e.detalhes && <p className="text-xs text-gray-600 mt-0.5">{e.detalhes}</p>}
                      <p className="text-xs text-gray-400 mt-1">{e.usuario} · {e.email}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatWhen(e.timestamp)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-3 text-xs text-gray-400">
          Últimas {entries.length} ações · salvo neste navegador
        </div>
      </div>
    </div>
  );
}
