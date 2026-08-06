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
import { ImportacoesLink } from "../components/layout";
import { exportToPdf } from "../utils/exportExcel";
import { REPORT_DEFINITIONS, type ReportDefinition, type ReportPayload } from "../utils/reportDefinitions";

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
  const [filterAno, setFilterAno] = useState("Todos");
  const [exporting, setExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const payload = useMemo(() => (selected ? selected.getPayload() : null), [selected]);

  const anos = useMemo(() => {
    if (!payload) return [];
    const col = payload.columns.find((c) => c.toLowerCase() === "ano");
    if (!col) return [];
    const values = Array.from(
      new Set(payload.rows.map((row) => String(row[col] ?? "").trim()).filter(Boolean))
    ).sort();
    return values;
  }, [payload]);

  const filteredRows = useMemo(() => {
    if (!payload) return [];
    if (filterAno === "Todos") return payload.rows;
    const col = payload.columns.find((c) => c.toLowerCase() === "ano");
    if (!col) return payload.rows;
    return payload.rows.filter((row) => String(row[col] ?? "") === filterAno);
  }, [payload, filterAno]);

  const displayColumns = payload?.columns.slice(0, 10) ?? [];

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
    setFilterAno("Todos");
    setSuccessMsg("");
    setErrorMsg("");
  };

  const backToCatalog = () => {
    setSelected(null);
    setFilterAno("Todos");
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
                {anos.length ? (
                  <select value={filterAno} onChange={(event) => setFilterAno(event.target.value)}>
                    <option value="Todos">Todos os anos</option>
                    {anos.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                ) : null}
                {filterAno !== "Todos" ? (
                  <button type="button" className="btn-limpar" onClick={() => setFilterAno("Todos")}>
                    Limpar
                  </button>
                ) : null}
              </div>

              <div className="rel-tabela-card">
                <div className="rel-tabela-header">
                  {filteredRows.length} registro{filteredRows.length !== 1 ? "s" : ""}
                  {payload.referencePeriod ? ` · ${payload.referencePeriod}` : ""}
                </div>
                <div className="rel-tabela-wrap">
                  {filteredRows.length === 0 ? (
                    <div className="rel-vazio">
                      Nenhum dado disponível para este relatório. Importe os dados em <ImportacoesLink />.
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
