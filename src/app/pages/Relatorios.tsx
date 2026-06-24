import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, BarChart3, Download, Eye, FileText, Search, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { ImportacoesLink, HorizontalScrollContainer } from "../components/layout";
import { exportToPdf } from "../utils/exportExcel";
import { REPORT_DEFINITIONS, type ReportDefinition, type ReportGroup, type ReportPayload } from "../utils/reportDefinitions";

type GroupFilter = "todos" | ReportGroup;

const GROUP_LABELS: Record<ReportGroup, string> = {
  portfolio: "Portfólio",
  processos: "Processos",
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function exportReport(definition: ReportDefinition, payload?: ReportPayload) {
  const data = payload ?? definition.getPayload();

  await exportToPdf(data.rows, definition.filename, definition.title, data.columns, {
    reportName: definition.title,
    referencePeriod: data.referencePeriod,
    executiveSummary: data.summary,
    indicators: data.indicators,
  });
}

function ReportCard({
  definition,
  onPreview,
}: {
  definition: ReportDefinition;
  onPreview: (definition: ReportDefinition) => void;
}) {
  const payload = definition.getPayload();
  const hasData = payload.rows.length > 0;

  return (
    <article className="flex min-h-[220px] flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8EFF7] text-[#003F7D]">
            <FileText size={20} />
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              hasData ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            {hasData ? `${payload.rows.length} registros` : "Sem dados"}
          </span>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-[#F57C00]">
          {GROUP_LABELS[definition.group]}
        </p>
        <h2 className="mt-1 text-lg font-bold text-[#003F7D]">{definition.title}</h2>
        <p className="mt-2 text-sm text-gray-500">{definition.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {payload.indicators.slice(0, 4).map((indicator) => (
            <div key={indicator.label} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-base font-bold tabular-nums text-gray-900">{indicator.value}</p>
              <p className="truncate text-xs text-gray-500">{indicator.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button variant="outline" className="h-9 gap-2" onClick={() => onPreview(definition)}>
          <Eye size={15} />
          Visualizar
        </Button>
        <Button className="h-9 gap-2 bg-[#003F7D] text-white hover:bg-[#002D5A]" onClick={() => exportReport(definition, payload)}>
          <Download size={15} />
          Gerar PDF
        </Button>
        <Link
          to={definition.sourceRoute}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-gray-500 hover:bg-gray-50"
          style={{ textDecoration: "none" }}
        >
          Origem <ArrowUpRight size={14} />
        </Link>
      </div>
    </article>
  );
}

function PreviewModal({
  definition,
  onClose,
}: {
  definition: ReportDefinition;
  onClose: () => void;
}) {
  const payload = definition.getPayload();
  const previewRows = payload.rows.slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 bg-[#003F7D] px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
                {GROUP_LABELS[definition.group]} | {payload.referencePeriod}
              </p>
              <h2 className="mt-1 text-xl font-bold text-white">{definition.title}</h2>
            </div>
            <button className="rounded p-1 text-white/80 hover:bg-white/10 hover:text-white" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-5 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            {payload.indicators.slice(0, 4).map((indicator) => (
              <div key={indicator.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-2xl font-bold text-[#003F7D]">{indicator.value}</p>
                <p className="text-sm text-gray-500">{indicator.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-base font-bold text-[#003F7D]">Resumo executivo</h3>
            <p className="mt-1 text-sm text-gray-600">{payload.summary}</p>
          </div>

          <div className="rounded-lg border border-gray-200">
            <div className="rounded-t-lg border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-bold text-gray-700">Prévia dos dados detalhados</h3>
            </div>
            <HorizontalScrollContainer>
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-[#003F7D] text-white">
                  <tr>
                    {payload.columns.slice(0, 8).map((column) => (
                      <th key={column} className="px-3 py-3 text-left text-xs font-bold uppercase">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      {payload.columns.slice(0, 8).map((column) => (
                        <td key={column} className="max-w-[240px] truncate px-3 py-3 text-gray-700">
                          {String(row[column] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!previewRows.length && (
                    <tr>
                      <td className="px-3 py-10 text-center text-gray-400" colSpan={payload.columns.slice(0, 8).length}>
                        Nenhum dado disponível para este relatório. Importe os dados em{" "}
                        <ImportacoesLink />.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </HorizontalScrollContainer>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4">
          <p className="text-xs text-gray-500">
            O PDF completo inclui cabeçalho institucional, indicadores, tabela e rodapé com paginação.
          </p>
          <Button className="gap-2 bg-[#F57C00] text-white hover:bg-[#E67300]" onClick={() => exportReport(definition, payload)}>
            <Download size={16} />
            Exportar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Relatorios() {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<GroupFilter>("todos");
  const [preview, setPreview] = useState<ReportDefinition | null>(null);

  const reports = useMemo(() => {
    const q = normalizeText(search);

    return REPORT_DEFINITIONS.filter((report) => {
      if (group !== "todos" && report.group !== group) return false;
      if (!q) return true;

      return normalizeText(`${report.title} ${report.description} ${GROUP_LABELS[report.group]}`).includes(q);
    });
  }, [group, search]);

  const totals = useMemo(() => {
    const payloads = REPORT_DEFINITIONS.map((report) => report.getPayload());
    return {
      reports: REPORT_DEFINITIONS.length,
      portfolio: REPORT_DEFINITIONS.filter((report) => report.group === "portfolio").length,
      processos: REPORT_DEFINITIONS.filter((report) => report.group === "processos").length,
      registros: payloads.reduce((acc, payload) => acc + payload.rows.length, 0),
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6 pt-20 lg:p-8 lg:pt-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[#003F7D] text-white">
                <BarChart3 size={24} />
              </div>
              <h1 className="text-2xl font-bold text-[#003F7D]">Relatórios</h1>
              <p className="mt-1 max-w-3xl text-sm text-gray-500">
                Central executiva para visualizar, gerar e exportar relatórios institucionais da CPED.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xl font-bold text-[#003F7D]">{totals.reports}</p>
                <p className="text-xs text-gray-500">Relatórios</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xl font-bold text-[#003F7D]">{totals.portfolio}</p>
                <p className="text-xs text-gray-500">Portfólio</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xl font-bold text-[#003F7D]">{totals.processos}</p>
                <p className="text-xs text-gray-500">Processos</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xl font-bold text-[#003F7D]">{totals.registros}</p>
                <p className="text-xs text-gray-500">Registros</p>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar relatório..."
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#003F7D]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: "todos", label: "Todos" },
                { value: "portfolio", label: "Portfólio" },
                { value: "processos", label: "Processos" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGroup(option.value as GroupFilter)}
                  className={`h-10 rounded-lg px-4 text-sm font-semibold transition ${
                    group === option.value
                      ? "bg-[#003F7D] text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {reports.map((report) => (
            <ReportCard key={report.id} definition={report} onPreview={setPreview} />
          ))}
        </section>

        {!reports.length && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-500">
            Nenhum relatório encontrado para os filtros selecionados.
          </div>
        )}
      </div>

      {preview && <PreviewModal definition={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
