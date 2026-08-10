import { useMemo, useState } from "react";
import {
  BarChart2,
  BookOpen,
  CalendarDays,
  Clock,
  FileText,
  Landmark,
  MapPin,
  Target,
  Zap,
} from "lucide-react";
import { ImportacoesLink, formatRegistrosCount } from "../components/layout";
import { exportToPdf } from "../utils/exportExcel";
import {
  getReportFilterValue,
  REPORT_DEFINITIONS,
  type ReportDefinition,
  type ReportFilterKey,
  type ReportPayload,
} from "../utils/reportDefinitions";
import { isNoisySearchFieldKey, matchesSearchQuery } from "../utils/textSearch";

const REPORT_ICONS: Record<string, typeof FileText> = {
  cursos: BookOpen,
  "plano-metas": Target,
  pca: Landmark,
  "cursos-eixo": BarChart2,
  "visitas-tecnicas": MapPin,
  "horas-pedagogicas": Clock,
  "acoes-extensivas": Zap,
  eventos: CalendarDays,
};

const EMPTY_FILTERS = {
  busca: "",
  ano: "",
  unidade: "",
  eixo: "",
  status: "",
};

type FilterState = typeof EMPTY_FILTERS;

function extractDistinctValues(rows: Record<string, unknown>[], filter: ReportFilterKey) {
  const values = new Set<string>();

  rows.forEach((row) => {
    const value = getReportFilterValue(row, filter);
    if (!value) return;

    if (filter === "ano") {
      const year = value.match(/\d{4}/)?.[0];
      if (year) values.add(year);
      return;
    }

    values.add(value);
  });

  return Array.from(values).sort((a, b) =>
    filter === "ano" ? Number(b) - Number(a) : a.localeCompare(b, "pt-BR"),
  );
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

export function Relatorios() {
  const [selected, setSelected] = useState<ReportDefinition | null>(null);
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS });
  const [exporting, setExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const payload = useMemo(() => (selected ? selected.getPayload() : null), [selected]);

  const temFiltro = (nome: ReportFilterKey) => Boolean(selected?.filtros.includes(nome));

  const temFiltroAtivo = Object.values(filters).some(Boolean);

  const anos = useMemo(() => {
    if (!payload || !temFiltro("ano")) return [];
    const fromRows = extractDistinctValues(payload.rows, "ano");
    const current = new Date().getFullYear();
    const extras = [String(current), String(current - 1)];
    return Array.from(new Set([...fromRows, ...extras])).sort((a, b) => Number(b) - Number(a));
  }, [payload, selected]);

  const unidades = useMemo(() => {
    if (!payload || !temFiltro("unidade")) return [];
    return extractDistinctValues(payload.rows, "unidade");
  }, [payload, selected]);

  const eixos = useMemo(() => {
    if (!payload || !temFiltro("eixo")) return [];
    return extractDistinctValues(payload.rows, "eixo");
  }, [payload, selected]);

  const statusList = useMemo(() => {
    if (!payload || !temFiltro("status")) return [];
    return extractDistinctValues(payload.rows, "status");
  }, [payload, selected]);

  const filteredRows = useMemo(() => {
    if (!payload) return [];

    return payload.rows.filter((row) => {
      if (
        !matchesSearchQuery(
          filters.busca,
          ...Object.entries(row)
            .filter(([key]) => !isNoisySearchFieldKey(key))
            .map(([, value]) => value),
        )
      ) {
        return false;
      }

      if (filters.ano) {
        const value = getReportFilterValue(row, "ano");
        if (!value.includes(filters.ano)) return false;
      }

      if (filters.unidade) {
        if (getReportFilterValue(row, "unidade") !== filters.unidade) return false;
      }

      if (filters.eixo) {
        if (getReportFilterValue(row, "eixo") !== filters.eixo) return false;
      }

      if (filters.status) {
        if (getReportFilterValue(row, "status") !== filters.status) return false;
      }

      return true;
    });
  }, [payload, filters]);

  const displayColumns = payload?.columns.slice(0, 10) ?? [];

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const limparFiltros = () => {
    setFilters({ ...EMPTY_FILTERS });
  };

  const handleExport = async () => {
    if (!selected || !payload) return;
    setExporting(true);
    setErrorMsg("");
    try {
      const filteredPayload: ReportPayload = {
        ...payload,
        rows: filteredRows,
      };
      await exportReport(selected, filteredPayload);
      setSuccessMsg("PDF gerado com sucesso.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch {
      setErrorMsg("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  const openReport = (definition: ReportDefinition) => {
    setSelected(definition);
    limparFiltros();
    setSuccessMsg("");
    setErrorMsg("");
  };

  const backToCatalog = () => {
    setSelected(null);
    limparFiltros();
    setErrorMsg("");
  };

  return (
    <div className="relatorios-page">
      <header className="rel-header">
        <div>
          <h1>Relatórios</h1>
          <p className="rel-subtitle">
            Central executiva para visualizar, gerar e exportar relatórios institucionais da CPED.
          </p>
        </div>
        {selected ? (
          <button type="button" className="btn-voltar" onClick={backToCatalog}>
            ← Todos os relatórios
          </button>
        ) : null}
      </header>

      {successMsg ? <div className="alert alert-success">{successMsg}</div> : null}
      {errorMsg ? <div className="alert alert-error">{errorMsg}</div> : null}

      {!selected ? (
        <div className="rel-catalogo">
          <div className="rel-cards">
            {REPORT_DEFINITIONS.map((report) => {
              const Icon = REPORT_ICONS[report.id] ?? FileText;
              const count = report.getPayload().rows.length;

              return (
                <button key={report.id} type="button" className="rel-card" onClick={() => openReport(report)}>
                  <div className="rel-card-top">
                    <span className="rel-card-icon">
                      <Icon size={20} />
                    </span>
                    <span className="rel-card-count">{count}</span>
                  </div>
                  <h2>{report.title}</h2>
                  <p>{report.description}</p>
                  <span className="rel-card-cta">Abrir relatório →</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rel-detalhe">
          <div className="rel-detalhe-head">
            <div>
              <p className="rel-kicker">Prévia e exportação</p>
              <h2>{selected.title}</h2>
              <p className="rel-detalhe-desc">{selected.description}</p>
            </div>
            <button type="button" className="btn-exportar" onClick={handleExport} disabled={exporting}>
              {exporting ? "Gerando PDF..." : "Exportar PDF"}
            </button>
          </div>

          {payload ? (
            <>
              <div className="rel-filtros">
                <div className="rel-filtro-busca">
                  <input
                    type="search"
                    value={filters.busca}
                    onChange={(e) => setFilter("busca", e.target.value)}
                    placeholder="Buscar nos registros..."
                    aria-label="Buscar nos registros do relatório"
                  />
                </div>

                {temFiltro("ano") ? (
                  <select value={filters.ano} onChange={(e) => setFilter("ano", e.target.value)}>
                    <option value="">Todos os anos</option>
                    {anos.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                ) : null}

                {temFiltro("unidade") ? (
                  <select
                    value={filters.unidade}
                    onChange={(e) => setFilter("unidade", e.target.value)}
                  >
                    <option value="">Todas as unidades</option>
                    {unidades.map((unidade) => (
                      <option key={unidade} value={unidade}>
                        {unidade}
                      </option>
                    ))}
                  </select>
                ) : null}

                {temFiltro("eixo") ? (
                  <select value={filters.eixo} onChange={(e) => setFilter("eixo", e.target.value)}>
                    <option value="">Todos os eixos</option>
                    {eixos.map((eixo) => (
                      <option key={eixo} value={eixo}>
                        {eixo}
                      </option>
                    ))}
                  </select>
                ) : null}

                {temFiltro("status") ? (
                  <select
                    value={filters.status}
                    onChange={(e) => setFilter("status", e.target.value)}
                  >
                    <option value="">Todos os status</option>
                    {statusList.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : null}

                {temFiltroAtivo ? (
                  <button type="button" className="btn-limpar" onClick={limparFiltros}>
                    Limpar
                  </button>
                ) : null}
              </div>

              <div className="rel-tabela-card">
                <div className="rel-tabela-header">
                  <span className="tabela-contador">{formatRegistrosCount(filteredRows.length)}</span>
                </div>
                <div className="rel-tabela-wrap">
                  {filteredRows.length === 0 ? (
                    <div className="rel-vazio">
                      Nenhum registro para os filtros selecionados. Ajuste os filtros ou importe dados
                      em <ImportacoesLink />.
                    </div>
                  ) : (
                    <table className="rel-table">
                      <thead>
                        <tr>
                          {displayColumns.map((column) => (
                            <th key={column}>{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.slice(0, 100).map((row, index) => (
                          <tr key={index}>
                            {displayColumns.map((column) => (
                              <td key={column}>{String(row[column] ?? "")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="rel-loading">Carregando relatório...</div>
          )}
        </div>
      )}
    </div>
  );
}
