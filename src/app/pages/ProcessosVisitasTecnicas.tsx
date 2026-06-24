import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Edit,
  Eye,
  FileText,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  clearVisitas,
  deleteVisita,
  getVisitas,
  saveVisita,
  updateVisita,
  type VisitaRecord,
} from "../utils/store";
import { useConfirm } from "../components/ConfirmProvider";
import { ReadOnlyBanner } from "../components/ReadOnlyBanner";
import {
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
import { toastError, toastSuccess } from "../utils/toast";

type FormState = Omit<VisitaRecord, "id">;
type ModalMode = "view" | "edit";

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

function podeDevolver(status: string) {
  const normalized = normalizeText(status);

  if (normalized.includes("realizada")) return false;
  if (normalized.includes("devolvida")) return false;
  if (normalized.includes("recusada")) return false;

  return true;
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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("view");
  const [editing, setEditing] = useState<VisitaRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const refresh = () => {
    setRecords(getVisitas());
  };

  const filtered = useMemo(() => {
    const q = normalizeText(search);

    return records.filter((item) => {
      const foraPrazo = isForaPrazo(item.prazoLimite, item.status);

      const text = [
        item.ano,
        item.unidade,
        item.eixo,
        item.processoSEI,
        item.dataSolicitacao,
        item.dataVisitaPrevista,
        item.prazoLimite,
        item.status,
        item.responsavel,
        item.relatorio,
        item.observacao,
        foraPrazo ? "fora do prazo vencido" : "dentro do prazo",
      ]
        .map(normalizeText)
        .join(" ");

      if (q && !text.includes(q)) return false;
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

  const fillForm = (record: VisitaRecord) => {
    setForm({
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
  };

  const openNew = () => {
    setEditing(null);
    setModalMode("edit");
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openView = (record: VisitaRecord) => {
    setEditing(record);
    setModalMode("view");
    fillForm(record);
    setModalOpen(true);
  };

  const openEdit = (record: VisitaRecord) => {
    setEditing(record);
    setModalMode("edit");
    fillForm(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setModalMode("view");
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.unidade.trim()) {
      toastError("Preencha a unidade.");
      return;
    }

    if (editing) {
      updateVisita(editing.id, form);
    } else {
      saveVisita(form);
    }

    refresh();
    closeModal();
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

  const handleDevolver = async (record: VisitaRecord) => {
    if (!podeDevolver(record.status)) return;

    const ok = await confirmDialog({
      title: "Devolver visita",
      message: `Deseja devolver/recusar a visita técnica da unidade "${record.unidade}"?\n\nO status será alterado para "Devolvida".`,
      confirmLabel: "Devolver",
    });
    if (!ok) return;

    updateVisita(record.id, {
      ano: record.ano,
      unidade: record.unidade,
      eixo: record.eixo,
      processoSEI: record.processoSEI,
      dataSolicitacao: record.dataSolicitacao,
      dataVisitaPrevista: record.dataVisitaPrevista,
      prazoLimite: record.prazoLimite,
      status: "Devolvida",
      responsavel: record.responsavel,
      relatorio: record.relatorio,
      observacao: record.observacao || "Solicitação devolvida para ajuste.",
    });

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

  return (
    <PageLayout>
      <PageHeader
        title="Visitas Técnicas"
        filteredCount={filtered.length}
        totalCount={records.length}
        meta={
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">{totalGeral} registros</span>
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
            <Button
              onClick={openNew}
              className="gap-2 bg-[#F57C00] text-white hover:bg-[#E67300]"
            >
              <Plus size={16} />
              Nova Visita Técnica
            </Button>
          ) : null
        }
      />

      <PageContentSection className="mt-5">
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
        summary={
          <>
            {filtered.length} visita{filtered.length !== 1 ? "s" : ""}
          </>
        }
      >
              <table className="w-full min-w-[1350px] text-sm">
                <thead className="bg-[#003F7D] text-white">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase">Unidade</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase">Eixo</th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase">Processo SEI</th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase">Solicitação</th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase">Visita Prevista</th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase">Prazo Limite</th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase">Relatório</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase">Observação</th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((item) => {
                    const foraPrazo = isForaPrazo(item.prazoLimite, item.status);
                    const devolverHabilitado = podeDevolver(item.status);

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

                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => openView(item)}
                              className="text-[#003F7D] hover:text-[#F57C00]"
                              title="Visualizar"
                            >
                              <Eye size={17} />
                            </button>

                            {canWrite && (
                              <>
                                <button
                                  onClick={() => openEdit(item)}
                                  className="text-blue-600 hover:text-[#F57C00]"
                                  title="Editar"
                                >
                                  <Edit size={17} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDevolver(item)}
                                  disabled={!devolverHabilitado}
                                  className={
                                    devolverHabilitado
                                      ? "text-red-500 hover:text-red-700"
                                      : "cursor-not-allowed text-gray-300"
                                  }
                                  title={
                                    devolverHabilitado
                                      ? "Devolver / Recusar solicitação"
                                      : "Ação indisponível para este status"
                                  }
                                >
                                  <span className="text-lg leading-none">↩</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Excluir"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </>
                            )}
                          </div>
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[500px] overflow-hidden rounded-xl bg-white shadow-2xl">
            {modalMode === "view" ? (
              <>
                <div className="bg-[#003F7D] px-5 py-4 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-blue-200">
                        {safeText(form.eixo)} · {safeText(form.ano)}
                      </p>
                      <h2 className="mt-1 text-lg font-bold text-white">
                        {safeText(form.unidade)}
                      </h2>
                    </div>

                    <button
                      onClick={closeModal}
                      className="rounded p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 px-5 py-5">
                  <DetailRow label="Status">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                        form.status,
                      )}`}
                    >
                      {safeText(form.status)}
                    </span>
                  </DetailRow>

                  <DetailRow label="Processo SEI">
                    <span className="text-gray-700">{safeText(form.processoSEI)}</span>
                  </DetailRow>

                  <DetailRow label="Data de Solicitação">
                    <span className="text-gray-700">{formatDate(form.dataSolicitacao)}</span>
                  </DetailRow>

                  <DetailRow label="Data Prevista da Visita">
                    <span className="text-gray-700">{formatDate(form.dataVisitaPrevista)}</span>
                  </DetailRow>

                  <DetailRow label="Prazo Limite (30 dias úteis)">
                    <span className="text-gray-700">{formatDate(form.prazoLimite)}</span>
                  </DetailRow>

                  <DetailRow label="Responsável">
                    <span className="text-gray-700">{safeText(form.responsavel)}</span>
                  </DetailRow>

                  <DetailRow label="Relatório">
                    <span className="text-gray-700">{safeText(form.relatorio)}</span>
                  </DetailRow>

                  <DetailRow label="Observação">
                    <span className="text-gray-700">{safeText(form.observacao)}</span>
                  </DetailRow>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
                  <Button variant="outline" onClick={closeModal}>
                    Fechar
                  </Button>

                  {canWrite && (
                    <Button
                      onClick={() => setModalMode("edit")}
                      className="gap-2 bg-[#003F7D] text-white hover:bg-[#00355C]"
                    >
                      <Edit size={15} />
                      Editar
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between bg-[#003F7D] px-5 py-3 text-white">
                  <h2 className="text-lg font-bold text-white">
                    {editing ? "Editar Visita Técnica" : "Nova Visita Técnica"}
                  </h2>

                  <button
                    onClick={closeModal}
                    className="rounded p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="max-h-[75vh] overflow-y-auto px-5 py-5">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <SelectInput
                      label="Ano"
                      value={form.ano}
                      onChange={(v) => setForm({ ...form, ano: v })}
                      options={ANOS_FORM}
                    />

                    <SelectInput
                      label="Status"
                      value={form.status}
                      onChange={(v) => setForm({ ...form, status: v })}
                      options={STATUS_FORM}
                    />

                    <div className="md:col-span-2">
                      <SelectInput
                        label="Unidade Solicitante *"
                        value={form.unidade}
                        onChange={(v) => setForm({ ...form, unidade: v })}
                        options={UNIDADES_FORM}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <SelectInput
                        label="Eixo Tecnológico *"
                        value={form.eixo}
                        onChange={(v) => setForm({ ...form, eixo: v })}
                        options={EIXOS_FORM}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        label="Processo SEI"
                        value={form.processoSEI}
                        onChange={(v) => setForm({ ...form, processoSEI: v })}
                      />
                    </div>

                    <Input
                      label="Data de Solicitação"
                      value={toDateInputValue(form.dataSolicitacao)}
                      onChange={(v) =>
                        setForm({ ...form, dataSolicitacao: fromDateInputValue(v) })
                      }
                      type="date"
                    />

                    <Input
                      label="Data Prevista da Visita"
                      value={toDateInputValue(form.dataVisitaPrevista)}
                      onChange={(v) =>
                        setForm({ ...form, dataVisitaPrevista: fromDateInputValue(v) })
                      }
                      type="date"
                    />

                    <div className="md:col-span-2">
                      <Input
                        label="Prazo Limite"
                        value={toDateInputValue(form.prazoLimite)}
                        onChange={(v) => setForm({ ...form, prazoLimite: fromDateInputValue(v) })}
                        type="date"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Calculado automaticamente: 30 dias úteis a partir de{" "}
                        {formatDate(form.dataSolicitacao)}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        label="Responsável"
                        value={form.responsavel}
                        onChange={(v) => setForm({ ...form, responsavel: v })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        label="Relatório da Visita"
                        value={form.relatorio}
                        onChange={(v) => setForm({ ...form, relatorio: v })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-gray-700">
                        Observação
                      </label>
                      <textarea
                        value={form.observacao}
                        onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                        rows={3}
                        placeholder="Informações adicionais..."
                        className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between border-t border-gray-100 px-5 py-4">
                  <Button variant="outline" onClick={closeModal}>
                    Cancelar
                  </Button>

                  <Button
                    onClick={handleSave}
                    className="gap-2 bg-[#F57C00] text-white hover:bg-[#E67300]"
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </>
            )}
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

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
      >
        {!options.includes(value) && value && <option value={value}>{value}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
      />
    </div>
  );
}