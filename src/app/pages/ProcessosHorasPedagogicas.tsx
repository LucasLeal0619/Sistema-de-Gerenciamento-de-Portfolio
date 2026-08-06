import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Edit,
  Eye,
  FileText,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  clearHoras,
  getHoras,
  saveHora,
  updateHora,
  type HoraRecord,
} from "../utils/store";
import { useConfirm } from "../components/ConfirmProvider";
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
} from "../components/layout";
import { usePermissions } from "../hooks/usePermissions";
import { toastError } from "../utils/toast";

type FormState = Omit<HoraRecord, "id">;
type Mode = "lista" | "novo" | "editar";
type ViewForm = FormState;

const EMPTY_FORM: FormState = {
  ano: "2025",
  processoSEI: "",
  eixo: "",
  segmento: "",
  nomePessoa: "",
  matricula: "",
  motivo: "",
  observacao: "",
  status: "Solicitada",
  ativo: true,
};

const ANOS_FORM = ["2025", "2026"];

const STATUS_FORM = [
  "Solicitada",
  "Em análise",
  "Aprovada",
  "Concluída",
  "Recusada",
  "Inativa",
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

function ensureAtivo(record: HoraRecord): HoraRecord {
  return {
    ...record,
    ativo: record.ativo ?? true,
  };
}

function statusClass(status: string) {
  const normalized = normalizeText(status);

  if (normalized.includes("concluida") || normalized.includes("concluída")) {
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

  if (normalized.includes("recusada")) {
    return "border-red-200 bg-red-100 text-red-700";
  }

  if (normalized.includes("inativa")) {
    return "border-gray-200 bg-gray-100 text-gray-500";
  }

  return "border-gray-200 bg-gray-100 text-gray-700";
}

function eixoClass(eixo: string) {
  const normalized = normalizeText(eixo);

  if (normalized.includes("gastronomia")) return "bg-blue-100 text-[#003F7D]";
  if (normalized.includes("ambiente") || normalized.includes("saude")) {
    return "bg-blue-100 text-[#003F7D]";
  }
  if (normalized.includes("gestao") || normalized.includes("moda")) {
    return "bg-blue-100 text-[#003F7D]";
  }
  if (normalized.includes("tecnologia") || normalized.includes("economia")) {
    return "bg-blue-100 text-[#003F7D]";
  }
  if (normalized.includes("beleza")) return "bg-blue-100 text-[#003F7D]";

  return "bg-slate-100 text-slate-700";
}

function SeiLink({ sei }: { sei: string }) {
  if (!sei) return <span className="text-gray-300">—</span>;

  const href = `https://sei.df.gov.br/sei/controlador.php?acao=procedimento_trabalhar&id_procedimento=${encodeURIComponent(
    sei,
  )}`;

  return (
    <div className="flex items-center gap-2">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs font-semibold text-[#003F7D] hover:text-[#F57C00]"
      >
        {sei}
      </a>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#003F7D] hover:text-[#F57C00]"
        title="Abrir processo SEI"
      >
        ↗
      </a>
    </div>
  );
}

export function ProcessosHorasPedagogicas() {
  const confirm = useConfirm();
  const { canWrite } = usePermissions();
  const initialRecords = () => {
    return getHoras().map(ensureAtivo);
  };

  const [records, setRecords] = useState<HoraRecord[]>(initialRecords);
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterAtivo, setFilterAtivo] = useState("Ativos");
  const [mode, setMode] = useState<Mode>("lista");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewData, setViewData] = useState<ViewForm | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const refresh = () => {
    setRecords(getHoras().map(ensureAtivo));
  };

  const filtered = useMemo(() => {
    const q = normalizeText(search);

    return records.filter((item) => {
      const ativo = item.ativo ?? true;

      const text = [
        item.ano,
        item.processoSEI,
        item.eixo,
        item.segmento,
        item.nomePessoa,
        item.matricula,
        item.motivo,
        item.observacao,
        item.status,
        ativo ? "ativo" : "inativo",
      ]
        .map(normalizeText)
        .join(" ");

      if (q && !text.includes(q)) return false;
      if (filterAno !== "Todos" && item.ano !== filterAno) return false;
      if (filterEixo !== "Todos" && item.eixo !== filterEixo) return false;
      if (filterStatus !== "Todos" && item.status !== filterStatus) return false;
      if (filterAtivo === "Ativos" && !ativo) return false;
      if (filterAtivo === "Inativos" && ativo) return false;

      return true;
    });
  }, [records, search, filterAno, filterEixo, filterStatus, filterAtivo]);

  const anos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.ano).filter(Boolean))).sort()],
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
  const ativosGeral = records.filter((r) => r.ativo ?? true).length;
  const inativosGeral = records.filter((r) => !(r.ativo ?? true)).length;
  const dadosExportacao = filtered.map((h) => ({
    Ano: h.ano,
    "Processo SEI": h.processoSEI,
    "Eixo Tecnológico": h.eixo,
    Segmento: h.segmento,
    "Nome da Pessoa": h.nomePessoa,
    Matrícula: h.matricula,
    "Motivo da Solicitação": h.motivo,
    Observação: h.observacao,
    Status: h.status,
    Ativo: h.ativo ?? true ? "Sim" : "Não",
  }));

  const fillFormFromRecord = (record: HoraRecord): FormState => ({
    ano: record.ano,
    processoSEI: record.processoSEI,
    eixo: record.eixo,
    segmento: record.segmento,
    nomePessoa: record.nomePessoa,
    matricula: record.matricula,
    motivo: record.motivo,
    observacao: record.observacao,
    status: record.status,
    ativo: record.ativo ?? true,
  });

  const openNew = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setMode("novo");
  };

  const openView = (record: HoraRecord) => {
    setViewData(fillFormFromRecord(record));
    setEditingId(record.id);
  };

  const openEdit = (record: HoraRecord) => {
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
    if (!form.eixo.trim() || !form.motivo.trim()) {
      toastError("Preencha o eixo tecnológico e o motivo da solicitação.");
      return;
    }

    const payload: FormState = {
      ...form,
      ativo: form.status === "Inativa" ? false : form.ativo ?? true,
    };

    if (editingId) {
      updateHora(editingId, payload);
    } else {
      saveHora(payload);
    }

    refresh();
    voltarLista();
  };

  const handleInativar = async (record: HoraRecord) => {
    if (!(record.ativo ?? true)) return;

    const ok = await confirm({
      title: "Inativar solicitação",
      message: `Deseja inativar a solicitação de horas pedagógicas?\n\nPessoa: ${
        record.nomePessoa || "A indicar"
      }\nMotivo: ${record.motivo}`,
      confirmLabel: "Inativar",
    });
    if (!ok) return;

    updateHora(record.id, {
      ano: record.ano,
      processoSEI: record.processoSEI,
      eixo: record.eixo,
      segmento: record.segmento,
      nomePessoa: record.nomePessoa,
      matricula: record.matricula,
      motivo: record.motivo,
      observacao: record.observacao || "Solicitação inativada.",
      status: "Inativa",
      ativo: false,
    });

    refresh();
  };

  const handleClearHoras = async () => {
    const ok = await confirm({
      title: "Limpar Horas Pedagógicas",
      message:
        "Deseja limpar todos os registros de Horas Pedagógicas?\n\nA tela ficará vazia até uma nova importação.",
      destructive: true,
      confirmLabel: "Limpar tudo",
    });
    if (!ok) return;

    clearHoras();
    setRecords([]);
    setSearch("");
    setFilterAno("Todos");
    setFilterEixo("Todos");
    setFilterStatus("Todos");
    setFilterAtivo("Ativos");
  };

  if (mode !== "lista") {
    return (
      <div className="crud-page crud-page-form">
        <CrudFormShell
          title={
            mode === "novo"
              ? "Cadastrar Nova Hora Pedagógica"
              : "Editar Hora Pedagógica"
          }
          subtitle="Preencha os dados para registrar uma nova hora pedagógica."
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
              <h2>Dados da pessoa</h2>
              <div className="form-grid form-grid-page">
                <div className="form-group">
                  <label>Nome da Pessoa</label>
                  <input
                    value={form.nomePessoa}
                    onChange={(e) => setForm({ ...form, nomePessoa: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Matrícula</label>
                  <input
                    value={form.matricula}
                    onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h2>Processo</h2>
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
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                        ativo: e.target.value !== "Inativa",
                      })
                    }
                  >
                    {STATUS_FORM.map((option) => (
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
                  <label>Segmento</label>
                  <input
                    value={form.segmento}
                    onChange={(e) => setForm({ ...form, segmento: e.target.value })}
                  />
                </div>
                <div className="form-group full">
                  <label>
                    Motivo da Solicitação <span>*</span>
                  </label>
                  <textarea
                    value={form.motivo}
                    onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                    rows={3}
                    placeholder="Informe o motivo da solicitação..."
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
                {mode === "editar" ? "Salvar Alterações" : "Cadastrar Hora"}
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
        title="Horas Pedagógicas"
        description="Controle de horas pedagógicas e processos SEI — SENAC DF"
        info="Consulte e filtre os registros de horas pedagógicas por SEI, eixo, pessoa, matrícula, ano e situação."
        filteredCount={filtered.length}
        totalCount={records.length}
        meta={
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">{totalGeral} registros</span>
            {inativosGeral > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-gray-500">
                <AlertTriangle size={14} />
                {inativosGeral} inativo{inativosGeral !== 1 ? "s" : ""}
              </span>
            )}
            <span className="text-gray-400">
              {ativosGeral} ativo{ativosGeral !== 1 ? "s" : ""}
            </span>
          </div>
        }
        actions={
          canWrite ? (
            <button type="button" onClick={openNew} className="btn-novo">
              <span className="btn-novo-icon">+</span> Nova Hora
            </button>
          ) : null
        }
      />

      <PageContentSection className="mt-5 space-y-4">
        <ReadOnlyBanner />
      </PageContentSection>

      {records.length === 0 && (
        <PageImportAlert title="Nenhuma solicitação carregada ainda.">
          <p>
            Use <ImportacoesLink /> para carregar a planilha principal do portfólio.
          </p>
        </PageImportAlert>
      )}

      <PageFiltersBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por SEI, eixo, pessoa, matrícula ou motivo..."
      >
        <FilterSelect label="Ano" value={filterAno} onChange={setFilterAno} options={anos} />
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
          label="Situação"
          value={filterAtivo}
          onChange={setFilterAtivo}
          options={["Todos", "Ativos", "Inativos"]}
        />
      </PageFiltersBar>

      <PageTableCard
        summary={
          <>
            {filtered.length} solicitação{filtered.length !== 1 ? "ões" : ""}
          </>
        }
      >
              <table className="crud-table" style={{ minWidth: "1350px" }}>
                <thead>
                  <tr>
                    <th>Processo SEI</th>
                    <th>Eixo Tecnológico</th>
                    <th>Segmento</th>
                    <th>Nome da Pessoa</th>
                    <th className="text-center">Matrícula</th>
                    <th>Motivo da Solicitação</th>
                    <th>Observação</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((item) => {
                    const ativo = item.ativo ?? true;

                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-100 ${
                          ativo ? "bg-white" : "bg-gray-100 opacity-60"
                        }`}
                      >
                        <td className="px-4 py-4">
                          <SeiLink sei={item.processoSEI} />
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

                        <td className="px-4 py-4 text-sm text-gray-700">
                          {safeText(item.segmento)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`font-semibold ${
                              ativo ? "text-gray-900" : "text-gray-400"
                            }`}
                          >
                            {safeText(item.nomePessoa)}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center font-mono text-xs text-gray-700">
                          {safeText(item.matricula)}
                        </td>

                        <td className="max-w-[280px] px-4 py-4 text-sm text-gray-700">
                          <span title={item.motivo} className="line-clamp-2">
                            {safeText(item.motivo)}
                          </span>
                        </td>

                        <td className="max-w-[220px] px-4 py-4 text-sm text-gray-500">
                          {item.observacao ? (
                            <span className="inline-flex items-start gap-1 text-gray-600">
                              <FileText size={14} className="mt-0.5 shrink-0 text-[#F57C00]" />
                              <span title={item.observacao} className="line-clamp-2">
                                {item.observacao}
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                              ativo ? statusClass(item.status) : statusClass("Inativa")
                            }`}
                          >
                            {ativo ? safeText(item.status) : "Inativa"}
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
                                onClick={() => handleInativar(item)}
                                disabled={!ativo}
                                className="btn-icon btn-delete"
                                title={ativo ? "Inativar solicitação" : "Solicitação já inativa"}
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
                      <td colSpan={9} className="px-4 py-14 text-center text-gray-500">
                        Nenhuma solicitação de horas pedagógicas encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
      </PageTableCard>

      {viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[520px] overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="bg-[#003F7D] px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-blue-200">
                    {safeText(viewData.eixo)} · {safeText(viewData.ano)}
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-white">
                    {safeText(viewData.nomePessoa)}
                  </h2>
                </div>

                <button
                  onClick={closeView}
                  className="rounded p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5">
              <DetailRow label="Status">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                    viewData.ativo === false
                      ? statusClass("Inativa")
                      : statusClass(viewData.status)
                  }`}
                >
                  {viewData.ativo === false ? "Inativa" : safeText(viewData.status)}
                </span>
              </DetailRow>

              <DetailRow label="Processo SEI">
                <span className="text-gray-700">{safeText(viewData.processoSEI)}</span>
              </DetailRow>

              <DetailRow label="Segmento">
                <span className="text-gray-700">{safeText(viewData.segmento)}</span>
              </DetailRow>

              <DetailRow label="Matrícula">
                <span className="text-gray-700">{safeText(viewData.matricula)}</span>
              </DetailRow>

              <DetailRow label="Motivo">
                <span className="text-gray-700">{safeText(viewData.motivo)}</span>
              </DetailRow>

              <DetailRow label="Observação">
                <span className="text-gray-700">{safeText(viewData.observacao)}</span>
              </DetailRow>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
              <Button variant="outline" onClick={closeView}>
                Fechar
              </Button>

              {canWrite && (
                <Button
                  onClick={() => {
                    setForm(viewData);
                    setViewData(null);
                    setMode("editar");
                  }}
                  className="gap-2 bg-[#003F7D] text-white hover:bg-[#00355C]"
                >
                  <Edit size={15} />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[150px_1fr] items-center gap-4 text-sm">
      <span className="font-semibold text-gray-400">{label}</span>
      <div>{children}</div>
    </div>
  );
}