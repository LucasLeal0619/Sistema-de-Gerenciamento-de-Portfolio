import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Edit,
  Eye,
  FileText,
  Trash2,
} from "lucide-react";
import {
  clearVisitas,
  deleteVisita,
  getVisitas,
  saveVisita,
  updateVisita,
  type VisitaRecord,
} from "../utils/store";
import { useConfirm } from "../components/ConfirmProvider";
import { RecordDetailModal } from "../components/RecordDetailModal";
import { ReadOnlyBanner } from "../components/ReadOnlyBanner";
import {
  CrudFormShell,
  FilterSelect,
  PageContentSection,
  PageFiltersBar,
  PageHeader,
  PageImportAlert,
  ImportacoesLink,
  PageLayout,
  PageTableCard,
  formatRegistrosCount,
} from "../components/layout";
import { matchesSearchQuery } from "../utils/textSearch";
import { usePermissions } from "../hooks/usePermissions";
import { toastError } from "../utils/toast";

type FormState = Omit<VisitaRecord, "id">;
type Mode = "lista" | "novo" | "editar";
type ViewForm = FormState;

const EMPTY_FORM: FormState = {
  ano: "2025",
  unidade: "",
  eixo: "",
  processoSEI: "",
  dataSolicitacao: "",
  dataVisitaPrevista: "",
  prazoLimite: "",
  status: "Solicitada",
  responsavel: "",
  relatorio: "",
  observacao: "",
};

const ANOS_FORM = ["2025", "2026"];

const STATUS_FORM = [
  "Solicitada",
  "Em análise",
  "Aprovada",
  "Realizada",
  "Devolvida",
  "Recusada",
];

const UNIDADES_FORM = [
  "Jessé Freire",
  "Jo Rufino e Carlos Aguiar",
  "Joaquim Loiola",
  "Miguel Setembrino — Gastronomia",
  "Miguel Setembrino — Saúde",
  "Sobradinho",
  "Talal Abu-Allan",
];

const EIXOS_FORM = [
  "Gastronomia",
  "Ambiente e Saúde",
  "Gestão e Moda",
  "Tecnologia e Economia Criativa",
  "Beleza e Cuidado Pessoal",
];

function safeText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toDateInputValue(value: string) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/");
    return `${year}-${month}-${day}`;
  }

  return value;
}

function fromDateInputValue(value: string) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  return value;
}

function parseDate(value: string) {
  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value: string) {
  const date = parseDate(value);
  if (!date) return safeText(value);

  return date.toLocaleDateString("pt-BR");
}

function isForaPrazo(prazoLimite: string, status: string) {
  if (!prazoLimite) return false;

  const statusNormalizado = normalizeText(status);

  if (
    statusNormalizado.includes("realizada") ||
    statusNormalizado.includes("concluida") ||
    statusNormalizado.includes("concluída") ||
    statusNormalizado.includes("devolvida") ||
    statusNormalizado.includes("recusada")
  ) {
    return false;
  }

  const hoje = new Date();
  const prazo = parseDate(prazoLimite);

  if (!prazo) return false;

  hoje.setHours(0, 0, 0, 0);
  prazo.setHours(0, 0, 0, 0);

  return hoje > prazo;
}

function SeiLink({ sei }: { sei: string }) {
  if (!sei) return <span className="text-gray-400">—</span>;

  const href = `https://sei.df.gov.br/sei/controlador.php?acao=procedimento_trabalhar&id_procedimento=${encodeURIComponent(
    sei,
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-xs font-semibold text-[#003F7D] hover:text-[#F57C00]"
    >
      {sei}
    </a>
  );
}

function statusClass(status: string) {
  const normalized = normalizeText(status);

  if (normalized.includes("realizada") || normalized.includes("concluida")) {
    return "border-green-200 bg-green-100 text-green-700";
  }

  if (normalized.includes("aprovada")) {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }

  if (normalized.includes("analise") || normalized.includes("análise")) {
    return "border-yellow-300 bg-yellow-50 text-yellow-700";
  }

  if (normalized.includes("solicitada")) {
    return "border-blue-200 bg-blue-100 text-blue-700";
  }

  if (normalized.includes("devolvida") || normalized.includes("recusada")) {
    return "border-red-200 bg-red-100 text-red-700";
  }

  return "border-gray-200 bg-gray-100 text-gray-700";
}

function eixoClass(eixo: string) {
  const normalized = normalizeText(eixo);

  if (normalized.includes("gastronomia")) return "bg-blue-100 text-[#003F7D]";
  if (normalized.includes("ambiente") || normalized.includes("saude")) return "bg-blue-100 text-[#003F7D]";
  if (normalized.includes("gestao") || normalized.includes("moda")) return "bg-blue-100 text-[#003F7D]";
  if (normalized.includes("tecnologia") || normalized.includes("economia")) return "bg-blue-100 text-[#003F7D]";
  if (normalized.includes("beleza")) return "bg-blue-100 text-[#003F7D]";

  return "bg-slate-100 text-slate-700";
}

export function ProcessosVisitasTecnicas() {
  const confirmDialog = useConfirm();
  const { canWrite } = usePermissions();
  const [records, setRecords] = useState<VisitaRecord[]>(() => getVisitas());
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todas");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterPrazo, setFilterPrazo] = useState("Todos");
  const [mode, setMode] = useState<Mode>("lista");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewData, setViewData] = useState<ViewForm | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const refresh = () => {
    setRecords(getVisitas());
  };

  const filtered = useMemo(() => {
    return records.filter((item) => {
      const foraPrazo = isForaPrazo(item.prazoLimite, item.status);

      if (
        !matchesSearchQuery(
          search,
          item.ano,
          item.unidade,
          item.eixo,
          item.processoSEI,
          item.dataSolicitacao,
          item.dataVisitaPrevista,
          item.prazoLimite,
          item.responsavel,
          item.relatorio,
          item.observacao,
        )
      ) {
        return false;
      }
      if (filterAno !== "Todos" && item.ano !== filterAno) return false;
      if (filterUnidade !== "Todas" && item.unidade !== filterUnidade) return false;
      if (filterEixo !== "Todos" && item.eixo !== filterEixo) return false;
      if (filterStatus !== "Todos" && item.status !== filterStatus) return false;
      if (filterPrazo === "Fora do prazo" && !foraPrazo) return false;
      if (filterPrazo === "Dentro do prazo" && foraPrazo) return false;

      return true;
    });
  }, [records, search, filterAno, filterUnidade, filterEixo, filterStatus, filterPrazo]);

  const anos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.ano).filter(Boolean))).sort()],
    [records],
  );

  const unidades = useMemo(
    () => ["Todas", ...Array.from(new Set(records.map((r) => r.unidade).filter(Boolean))).sort()],
    [records],
  );

  const eixos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.eixo).filter(Boolean))).sort()],
    [records],
  );

  const statusList = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.status).filter(Boolean))).sort()],
    [records],
  );

  const totalGeral = records.length;
  const foraPrazoGeral = records.filter((r) => isForaPrazo(r.prazoLimite, r.status)).length;
  const dadosExportacao = filtered.map((v) => ({
    Ano: v.ano,
    Unidade: v.unidade,
    Eixo: v.eixo,
    "Processo SEI": v.processoSEI,
    Solicitação: formatDate(v.dataSolicitacao),
    "Visita Prevista": formatDate(v.dataVisitaPrevista),
    "Prazo Limite": formatDate(v.prazoLimite),
    Status: v.status,
    Responsável: v.responsavel,
    Relatório: v.relatorio,
    Observação: v.observacao,
    Prazo: isForaPrazo(v.prazoLimite, v.status) ? "Fora do prazo" : "Dentro do prazo",
  }));

  const fillFormFromRecord = (record: VisitaRecord): FormState => ({
    ano: record.ano,
    unidade: record.unidade,
    eixo: record.eixo,
    processoSEI: record.processoSEI,
    dataSolicitacao: record.dataSolicitacao,
    dataVisitaPrevista: record.dataVisitaPrevista,
    prazoLimite: record.prazoLimite,
    status: record.status,
    responsavel: record.responsavel,
    relatorio: record.relatorio,
    observacao: record.observacao,
  });

  const openNew = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setMode("novo");
  };

  const openView = (record: VisitaRecord) => {
    setViewData(fillFormFromRecord(record));
    setEditingId(record.id);
  };

  const openEdit = (record: VisitaRecord) => {
    setForm(fillFormFromRecord(record));
    setEditingId(record.id);
    setViewData(null);
    setMode("editar");
  };

  const voltarLista = () => {
    setMode("lista");
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const closeView = () => {
    setViewData(null);
  };

  const handleSave = () => {
    if (!form.unidade.trim()) {
      toastError("Preencha a unidade.");
      return;
    }

    if (editingId) {
      updateVisita(editingId, form);
    } else {
      saveVisita(form);
    }

    refresh();
    voltarLista();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      message: "Deseja excluir esta visita técnica?",
      destructive: true,
      confirmLabel: "Excluir",
    });
    if (!ok) return;

    deleteVisita(id);
    refresh();
  };

  const handleClearVisitas = async () => {
    const ok = await confirmDialog({
      title: "Limpar Visitas Técnicas",
      message:
        "Deseja limpar todos os registros de Visitas Técnicas?\n\nA tela ficará vazia até uma nova importação ou cadastro.",
      destructive: true,
      confirmLabel: "Limpar tudo",
    });
    if (!ok) return;

    clearVisitas();
    setRecords([]);
    setSearch("");
    setFilterAno("Todos");
    setFilterUnidade("Todas");
    setFilterEixo("Todos");
    setFilterStatus("Todos");
    setFilterPrazo("Todos");
  };

  if (mode !== "lista") {
    return (
      <div className="crud-page crud-page-form">
        <CrudFormShell
          title={
            mode === "novo" ? "Cadastrar Nova Visita Técnica" : "Editar Visita Técnica"
          }
          subtitle="Preencha os dados para registrar um novo processo de visita técnica."
          onBack={voltarLista}
        >
          <form
            className="form-body"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <section className="form-section">
              <h2>Dados do processo</h2>
              <div className="form-grid form-grid-page">
                <div className="form-group">
                  <label>Ano</label>
                  <select
                    value={form.ano}
                    onChange={(e) => setForm({ ...form, ano: e.target.value })}
                  >
                    {ANOS_FORM.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUS_FORM.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full">
                  <label>
                    Unidade Solicitante <span>*</span>
                  </label>
                  <select
                    value={form.unidade}
                    onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                  >
                    {!UNIDADES_FORM.includes(form.unidade) && form.unidade && (
                      <option value={form.unidade}>{form.unidade}</option>
                    )}
                    {UNIDADES_FORM.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full">
                  <label>
                    Eixo Tecnológico <span>*</span>
                  </label>
                  <select
                    value={form.eixo}
                    onChange={(e) => setForm({ ...form, eixo: e.target.value })}
                  >
                    {!EIXOS_FORM.includes(form.eixo) && form.eixo && (
                      <option value={form.eixo}>{form.eixo}</option>
                    )}
                    {EIXOS_FORM.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full">
                  <label>Processo SEI</label>
                  <input
                    value={form.processoSEI}
                    onChange={(e) => setForm({ ...form, processoSEI: e.target.value })}
                  />
                </div>
                <div className="form-group full">
                  <label>Responsável</label>
                  <input
                    value={form.responsavel}
                    onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h2>Prazos</h2>
              <div className="form-grid form-grid-page">
                <div className="form-group">
                  <label>Data de Solicitação</label>
                  <input
                    type="date"
                    value={toDateInputValue(form.dataSolicitacao)}
                    onChange={(e) =>
                      setForm({ ...form, dataSolicitacao: fromDateInputValue(e.target.value) })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Data Prevista da Visita</label>
                  <input
                    type="date"
                    value={toDateInputValue(form.dataVisitaPrevista)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dataVisitaPrevista: fromDateInputValue(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-group full">
                  <label>Prazo Limite</label>
                  <input
                    type="date"
                    value={toDateInputValue(form.prazoLimite)}
                    onChange={(e) =>
                      setForm({ ...form, prazoLimite: fromDateInputValue(e.target.value) })
                    }
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Calculado automaticamente: 30 dias úteis a partir de{" "}
                    {formatDate(form.dataSolicitacao)}
                  </p>
                </div>
              </div>
            </section>

            <section className="form-section">
              <h2>Relatório e observações</h2>
              <div className="form-grid form-grid-page">
                <div className="form-group full">
                  <label>Relatório da Visita</label>
                  <input
                    value={form.relatorio}
                    onChange={(e) => setForm({ ...form, relatorio: e.target.value })}
                  />
                </div>
                <div className="form-group full">
                  <label>Observação</label>
                  <textarea
                    value={form.observacao}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                    rows={3}
                    placeholder="Informações adicionais..."
                  />
                </div>
              </div>
            </section>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={voltarLista}>
                Cancelar
              </button>
              <button type="submit" className="btn-salvar">
                {mode === "editar" ? "Salvar Alterações" : "Cadastrar Visita"}
              </button>
            </div>
          </form>
        </CrudFormShell>
      </div>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Visitas Técnicas"
        description="Processos de visitas técnicas registradas — SENAC DF"
        info="Consulte e filtre os processos de visita técnica por unidade, eixo, SEI, responsável, ano, status e prazo."
        filteredCount={filtered.length}
        totalCount={records.length}
        meta={
          <div className="flex items-center gap-3 text-sm">
            <span className="tabela-contador text-gray-500">{formatRegistrosCount(totalGeral)}</span>
            {foraPrazoGeral > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                <AlertTriangle size={14} />
                {foraPrazoGeral} fora do prazo
              </span>
            )}
          </div>
        }
        actions={
          canWrite ? (
            <button type="button" onClick={openNew} className="btn-novo">
              <span className="btn-novo-icon">+</span> Nova Visita
            </button>
          ) : null
        }
      />

      <PageContentSection className="mt-5 space-y-4">
        <ReadOnlyBanner />
      </PageContentSection>

      {records.length === 0 && (
        <PageImportAlert title="Nenhuma visita técnica importada ainda.">
          <p>
            Use <ImportacoesLink /> para carregar a planilha principal do portfólio.
          </p>
        </PageImportAlert>
      )}

      <PageFiltersBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por unidade, eixo, SEI ou responsável..."
      >
        <FilterSelect label="Ano" value={filterAno} onChange={setFilterAno} options={anos} />
        <FilterSelect
          label="Unidade"
          value={filterUnidade}
          onChange={setFilterUnidade}
          options={unidades}
          className="min-w-[200px]"
        />
        <FilterSelect
          label="Eixo Tecnológico"
          value={filterEixo}
          onChange={setFilterEixo}
          options={eixos}
          className="min-w-[200px]"
        />
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={statusList}
        />
        <FilterSelect
          label="Prazo"
          value={filterPrazo}
          onChange={setFilterPrazo}
          options={["Todos", "Dentro do prazo", "Fora do prazo"]}
        />
      </PageFiltersBar>

      <PageTableCard
        summary={formatRegistrosCount(filtered.length)}
      >
              <table className="crud-table" style={{ minWidth: "1350px" }}>
                <thead>
                  <tr>
                    <th>Unidade</th>
                    <th>Eixo</th>
                    <th className="text-center">Processo SEI</th>
                    <th className="text-center">Solicitação</th>
                    <th className="text-center">Visita Prevista</th>
                    <th className="text-center">Prazo Limite</th>
                    <th className="text-center">Status</th>
                    <th>Relatório</th>
                    <th>Observação</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((item) => {
                    const foraPrazo = isForaPrazo(item.prazoLimite, item.status);

                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-100 ${
                          foraPrazo ? "bg-red-50" : "bg-white"
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {foraPrazo && (
                              <AlertTriangle size={14} className="shrink-0 text-red-500" />
                            )}
                            <span className="font-semibold text-gray-900">
                              {safeText(item.unidade)}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${eixoClass(
                              item.eixo,
                            )}`}
                          >
                            {safeText(item.eixo)}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <SeiLink sei={item.processoSEI} />
                        </td>

                        <td className="px-4 py-4 text-center text-sm text-gray-700">
                          {formatDate(item.dataSolicitacao)}
                        </td>

                        <td className="px-4 py-4 text-center text-sm text-gray-700">
                          {formatDate(item.dataVisitaPrevista)}
                        </td>

                        <td className="px-4 py-4 text-center text-sm">
                          <div className={foraPrazo ? "font-bold text-red-600" : "text-gray-700"}>
                            {formatDate(item.prazoLimite)}
                          </div>
                          {foraPrazo && (
                            <div className="text-xs font-semibold text-red-500">Vencido</div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                              item.status,
                            )}`}
                          >
                            {safeText(item.status)}
                          </span>
                        </td>

                        <td className="max-w-[220px] px-4 py-4 text-sm text-gray-500">
                          {item.relatorio ? (
                            <span className="inline-flex items-center gap-1 text-gray-600">
                              <FileText size={14} className="text-[#F57C00]" />
                              <span title={item.relatorio} className="line-clamp-1">
                                {item.relatorio}
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        <td className="max-w-[300px] px-4 py-4 text-sm text-gray-500">
                          <span title={item.observacao} className="line-clamp-1">
                            {safeText(item.observacao)}
                          </span>
                        </td>

                        <td className="acoes text-center">
                          <button
                            type="button"
                            onClick={() => openView(item)}
                            className="btn-icon btn-view"
                            title="Visualizar"
                          >
                            <Eye size={17} />
                          </button>

                          {canWrite && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(item)}
                                className="btn-icon btn-edit"
                                title="Editar"
                              >
                                <Edit size={17} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="btn-icon btn-delete"
                                title="Excluir"
                              >
                                <Trash2 size={17} />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {!filtered.length && (
                    <tr>
                      <td colSpan={10} className="px-4 py-14 text-center text-gray-500">
                        Nenhuma visita técnica encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
      </PageTableCard>

      {viewData && (
        <RecordDetailModal
          subtitle="Informações resumidas da visita técnica selecionada."
          fields={[
            { label: "Processo SEI", value: viewData.processoSEI },
            { label: "Status", value: viewData.status },
            { label: "Unidade", value: viewData.unidade },
            { label: "Eixo", value: viewData.eixo },
            { label: "Responsável", value: viewData.responsavel },
            { label: "Data de solicitação", value: formatDate(viewData.dataSolicitacao) },
            { label: "Data visita prevista", value: formatDate(viewData.dataVisitaPrevista) },
            { label: "Prazo limite", value: formatDate(viewData.prazoLimite) },
            { label: "Relatório", value: viewData.relatorio, full: true, multiline: true },
            { label: "Observação", value: viewData.observacao, full: true, multiline: true },
          ]}
          canEdit={canWrite}
          onClose={closeView}
          onEdit={() => {
            setForm(viewData);
            setViewData(null);
            setMode("editar");
          }}
        />
      )}
    </PageLayout>
  );
}