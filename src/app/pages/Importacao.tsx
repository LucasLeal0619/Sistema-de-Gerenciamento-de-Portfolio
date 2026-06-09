import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  LayoutDashboard,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  FileJson,
  History,
  FileText,
  RotateCcw,
  FileSpreadsheet,
  History as HistoryIcon,
} from "lucide-react";
import { useConfirm } from "../components/ConfirmProvider";
import { usePermissions } from "../hooks/usePermissions";
import { ImportReplaceHint } from "../components/ImportReplaceHint";
import { ReadOnlyBanner } from "../components/ReadOnlyBanner";
import {
  importarPortfolioCompleto,
  limparPortfolioCompleto,
  type ResultadoModulo,
} from "../utils/importarPortfolioCompleto";
import { analisarPortfolioCompleto, type PreviewPortfolio } from "../utils/analisarPortfolio";
import {
  downloadPortfolioBackup,
  hasPreImportSnapshot,
  importPortfolioBackupFile,
  restorePreImportSnapshot,
  savePreImportSnapshot,
} from "../utils/backupRestore";
import { downloadActivityLogCsv, exportActivityLogPdf } from "../utils/activityLogExport";
import { subscribeDataChanged } from "../utils/dataRefresh";
import { exportPortfolioReportPdf } from "../utils/portfolioReport";
import { getActivityLog } from "../utils/activityLog";
import { ImportPreviewModal } from "../components/ImportPreviewModal";
import { ActivityLogPanel } from "../components/ActivityLogPanel";
import { LastImportBanner } from "../components/LastImportBanner";
import { CrossModuleValidationPanel } from "../components/CrossModuleValidationPanel";
import { formatImportWhen, getImportHistory } from "../utils/importHistory";
import { exportPortfolioExcel } from "../utils/portfolioExcelExport";
import { toastError, toastSuccess } from "../utils/toast";

function ResultadoImportacao({
  item,
  modo = "importar",
}: {
  item: ResultadoModulo;
  modo?: "importar" | "limpar";
}) {
  const sucesso = modo === "limpar" ? item.ok : item.ok && item.quantidade > 0;

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
        sucesso
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-gray-200 bg-gray-50 text-gray-600"
      }`}
    >
      <div className="flex items-center gap-2">
        {sucesso ? (
          <CheckCircle2 size={16} className="text-emerald-600" />
        ) : (
          <AlertCircle size={16} className="text-gray-400" />
        )}
        <span className="font-medium">{item.label}</span>
      </div>
      <span>
        {item.quantidade > 0
          ? `${item.quantidade} registros`
          : item.mensagem || "Sem dados"}
      </span>
    </div>
  );
}

export function Importacao() {
  const confirm = useConfirm();
  const { canWrite, isConsultivo } = usePermissions();
  const inputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);
  const [limpando, setLimpando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoModulo[] | null>(null);
  const [modoResultado, setModoResultado] = useState<"importar" | "limpar">("importar");
  const [preview, setPreview] = useState<PreviewPortfolio | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [recentLog, setRecentLog] = useState(() => getActivityLog().slice(0, 3));
  const [podeDesfazer, setPodeDesfazer] = useState(() => hasPreImportSnapshot());
  const [desfazendo, setDesfazendo] = useState(false);
  const [importHistory, setImportHistory] = useState(() => getImportHistory().slice(0, 5));

  const refreshUi = () => {
    setRecentLog(getActivityLog().slice(0, 3));
    setPodeDesfazer(hasPreImportSnapshot());
    setImportHistory(getImportHistory().slice(0, 5));
  };

  useEffect(() => subscribeDataChanged(refreshUi), []);

  const executarImportacao = async (file: File, previewConfirmado: PreviewPortfolio) => {
    setImportando(true);
    setResultados(null);
    setModoResultado("importar");
    try {
      savePreImportSnapshot();
      const resultado = await importarPortfolioCompleto(file, {
        fileName: file.name,
        preview: previewConfirmado,
      });
      setResultados(resultado.resultados);
      if (resultado.sucesso) {
        toastSuccess(`Planilha importada: ${resultado.totalImportado} registros nos módulos.`);
        setPodeDesfazer(true);
        refreshUi();
      } else {
        toastError(
          "Importação não concluída. Use a planilha principal do portfólio (com abas de Cursos, Plano de Metas ou Valores PCA).",
        );
      }
    } catch (error) {
      console.error(error);
      toastError("Erro ao importar a planilha principal.");
    } finally {
      setImportando(false);
      setPreview(null);
      setPendingFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleImportarPortfolio = async (file?: File) => {
    if (!file) return;
    try {
      const analise = await analisarPortfolioCompleto(file);
      setPendingFile(file);
      setPreview(analise);
    } catch (error) {
      console.error(error);
      toastError("Erro ao analisar a planilha.");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRestaurarBackup = async (file?: File) => {
    if (!file) return;
    const ok = await confirm({
      title: "Restaurar backup",
      message:
        "Deseja substituir todos os dados locais pelos do arquivo de backup?\n\nUsuários, cursos, metas e demais módulos serão sobrescritos.",
      destructive: true,
      confirmLabel: "Restaurar",
    });
    if (!ok) {
      if (backupInputRef.current) backupInputRef.current.value = "";
      return;
    }

    setRestaurando(true);
    try {
      const result = await importPortfolioBackupFile(file);
      if (result.ok) {
        toastSuccess("Backup restaurado. As telas foram atualizadas automaticamente.");
        setResultados(null);
        refreshUi();
      } else {
        toastError(result.error);
      }
    } finally {
      setRestaurando(false);
      if (backupInputRef.current) backupInputRef.current.value = "";
    }
  };

  const handleLimparPortfolio = async () => {
    const ok = await confirm({
      title: "Limpar dados importados",
      message:
        "Deseja limpar todos os dados da planilha principal?\n\nSerão removidos: Cursos, Plano de Metas, Valores PCA, Cursos por Eixo, Visitas e Horas. Ações Extensivas e Eventos não são afetados. Usuários e CEPED também permanecem.",
      destructive: true,
      confirmLabel: "Limpar tudo",
    });
    if (!ok) return;

    setLimpando(true);
    setResultados(null);
    setModoResultado("limpar");

    try {
      const resultado = limparPortfolioCompleto();
      setResultados(resultado.resultados);
      toastSuccess("Dados importados removidos. O Dashboard foi zerado.");
      refreshUi();
    } catch (error) {
      console.error(error);
      toastError("Erro ao limpar os dados importados.");
    } finally {
      setLimpando(false);
    }
  };

  const handleDesfazerImportacao = async () => {
    const ok = await confirm({
      title: "Desfazer última importação",
      message:
        "Restaurar o estado anterior à última importação da planilha?\n\nOs dados atuais serão substituídos pelo snapshot automático salvo antes da importação.",
      destructive: true,
      confirmLabel: "Restaurar anterior",
    });
    if (!ok) return;

    setDesfazendo(true);
    try {
      const result = restorePreImportSnapshot();
      if (result.ok) {
        toastSuccess("Estado anterior restaurado com sucesso.");
        setResultados(null);
        setPodeDesfazer(false);
        refreshUi();
      } else {
        toastError(result.error);
      }
    } finally {
      setDesfazendo(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-auto bg-[#F5F7FA]">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div>
          <Link
            to="/app/inicio"
            className="text-sm font-semibold text-[#003F7D] hover:underline"
            style={{ textDecoration: "none" }}
          >
            ← Voltar ao Início
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-[#003F7D]">Importação e ferramentas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Planilha principal, backup, validação cruzada, histórico e log de atividades.
          </p>
        </div>

        <ReadOnlyBanner />

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#003F7D]">Planilha principal</h2>
          <p className="mt-1 text-sm text-gray-500">
            Um único arquivo alimenta Cursos, Plano de Metas, PCA, Cursos por Eixo, Visitas,
            Horas, Ações Extensivas e Eventos.
          </p>

          <div className="mt-4">
            <LastImportBanner />
          </div>

          <div className="mx-auto mt-4 flex w-full max-w-sm flex-col gap-2">
            {canWrite && (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleImportarPortfolio(e.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={importando || limpando}
                  onClick={() => {
                    if (inputRef.current) inputRef.current.value = "";
                    inputRef.current?.click();
                  }}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F57C00] px-5 py-3 text-sm font-semibold text-white hover:bg-[#E67300] disabled:opacity-70"
                >
                  {importando ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Importar planilha completa
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={importando || limpando}
                  onClick={handleLimparPortfolio}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-70"
                >
                  {limpando ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Limpando...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Limpar dados importados
                    </>
                  )}
                </button>
              </>
            )}
            {!canWrite && isConsultivo && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
                Seu perfil e somente leitura. Importacao disponivel para Administrador e Editor.
              </p>
            )}
            <Link
              to="/app/dashboard"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#003F7D]/20 px-5 py-3 text-sm font-semibold text-[#003F7D] hover:bg-[#E8EFF7]"
              style={{ textDecoration: "none" }}
            >
              <LayoutDashboard size={18} />
              Ver Dashboard
            </Link>
          </div>

          <ImportReplaceHint className="mt-5" />

          {podeDesfazer && canWrite && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-900">
                Snapshot salvo antes da última importação. Use para desfazer se algo saiu errado.
              </p>
              <button
                type="button"
                disabled={desfazendo || importando}
                onClick={handleDesfazerImportacao}
                className="mx-auto inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
              >
                <RotateCcw size={16} className={desfazendo ? "animate-spin" : ""} />
                {desfazendo ? "Restaurando..." : "Desfazer última importação"}
              </button>
            </div>
          )}

          {resultados && (
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {resultados.map((item) => (
                <ResultadoImportacao key={item.modulo} item={item} modo={modoResultado} />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#003F7D]">Validação cruzada</h2>
          <p className="mt-1 text-sm text-gray-500">
            Inconsistências entre Cursos, Metas, PCA, Visitas e Eventos.
          </p>
          <div className="mt-4">
            <CrossModuleValidationPanel />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#003F7D]">Histórico de importações</h2>
              <p className="mt-1 text-sm text-gray-500">Últimas planilhas importadas neste navegador.</p>
            </div>
            <HistoryIcon size={20} className="text-[#003F7D]/40" />
          </div>
          {importHistory.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma importação registrada ainda.</p>
          ) : (
            <ul className="space-y-2">
              {importHistory.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-gray-900">{entry.fileName}</span>
                    <span className="text-xs text-gray-400">{formatImportWhen(entry.timestamp)}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {entry.usuario} · {entry.totalImportado} registros
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#003F7D]">Backup e relatório</h2>
          <p className="mt-1 text-sm text-gray-500">
            Exportar backup JSON, relatório PDF ou Excel consolidado.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadPortfolioBackup()}
              className="inline-flex items-center gap-2 rounded-xl border border-[#003F7D]/20 px-4 py-2.5 text-sm font-semibold text-[#003F7D] hover:bg-[#E8EFF7]"
            >
              <Download size={16} />
              Exportar backup JSON
            </button>
            {canWrite && (
              <>
                <input
                  ref={backupInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => handleRestaurarBackup(e.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={restaurando}
                  onClick={() => backupInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                >
                  <FileJson size={16} />
                  {restaurando ? "Restaurando..." : "Restaurar backup"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => exportPortfolioReportPdf()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#003F7D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#00355C]"
            >
              <FileText size={16} />
              Relatório PDF
            </button>
            <button
              type="button"
              onClick={() => exportPortfolioExcel()}
              className="inline-flex items-center gap-2 rounded-xl border border-[#003F7D]/20 px-4 py-2.5 text-sm font-semibold text-[#003F7D] hover:bg-[#E8EFF7]"
            >
              <FileSpreadsheet size={16} />
              Excel consolidado
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#003F7D]">Log de atividades</h2>
              <p className="mt-1 text-sm text-gray-500">Registro local de ações neste navegador.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentLog.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => downloadActivityLogCsv()}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Download size={16} />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => void exportActivityLogPdf()}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#003F7D]/20 px-4 py-2 text-sm font-semibold text-[#003F7D] hover:bg-[#E8EFF7]"
                  >
                    <FileText size={16} />
                    PDF
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setShowLog(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <History size={16} />
                Ver tudo
              </button>
            </div>
          </div>
          {recentLog.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma atividade registrada ainda.</p>
          ) : (
            <ul className="space-y-2">
              {recentLog.map((e) => (
                <li key={e.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <span className="font-medium text-gray-800">{e.acao}</span>
                  {e.detalhes && <span className="text-gray-500"> — {e.detalhes}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {preview && pendingFile && (
        <ImportPreviewModal
          preview={preview}
          fileName={pendingFile.name}
          loading={importando}
          onCancel={() => {
            setPreview(null);
            setPendingFile(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          onConfirm={() => pendingFile && preview && executarImportacao(pendingFile, preview)}
        />
      )}

      {showLog && <ActivityLogPanel onClose={() => setShowLog(false)} />}
    </div>
  );
}
