import { Clock } from "lucide-react";
import { formatImportWhen, getUltimaImportacao } from "../utils/importHistory";

export function LastImportBanner({ compact = false }: { compact?: boolean }) {
  const ultima = getUltimaImportacao();
  if (!ultima) return null;

  const resumo = ultima.modulos.map((m) => `${m.label}: ${m.quantidade}`).join(" · ");

  if (compact) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-[#003F7D]/15 bg-[#E8EFF7] px-3 py-2 text-xs text-[#003F7D]">
        <Clock size={14} className="mt-0.5 shrink-0" />
        <span>
          Última importação: <strong>{formatImportWhen(ultima.timestamp)}</strong> por{" "}
          {ultima.usuario} · <strong>{ultima.fileName}</strong>
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#003F7D]/15 bg-[#E8EFF7] px-4 py-3">
      <div className="flex items-start gap-3">
        <Clock size={18} className="mt-0.5 shrink-0 text-[#003F7D]" />
        <div className="min-w-0 text-sm text-[#003F7D]">
          <p className="font-semibold">Última atualização dos dados</p>
          <p className="mt-1 text-[#003F7D]/85">
            {formatImportWhen(ultima.timestamp)} · {ultima.usuario} ({ultima.email})
          </p>
          <p className="mt-1 break-words text-xs text-[#003F7D]/70">
            Arquivo: {ultima.fileName} · {ultima.totalImportado} registros
          </p>
          {resumo && (
            <p className="mt-2 break-words text-xs leading-relaxed text-[#003F7D]/80">{resumo}</p>
          )}
        </div>
      </div>
    </div>
  );
}
