import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  List,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  clearVisitas,
  deleteVisita,
  getVisitas,
  replaceVisitas,
  saveVisita,
  updateVisita,
  type VisitaRecord,
} from "../utils/store";
import { importarVisitasTecnicasExcel } from "../utils/importExcel";
import { useConfirm } from "../components/ConfirmProvider";
import { ExportHint } from "../components/ExportHint";
import { exportToCsv, exportToExcel, exportToPdf } from "../utils/exportExcel";
import { toastError, toastSuccess } from "../utils/toast";

type FormState = Omit<VisitaRecord, "id">;
type ActiveTab = "registros" | "indicadores";
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

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function countBy(records: VisitaRecord[], getter: (record: VisitaRecord) => string) {
  const map = new Map<string, number>();

  records.forEach((record) => {
    const key = getter(record) || "Não informado";
    map.set(key, (map.get(key) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
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
  const [records, setRecords] = useState<VisitaRecord[]>(() => getVisitas());
  const [activeTab, setActiveTab] = useState<ActiveTab>("registros");
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

  const inputVisitasRef = useRef<HTMLInputElement>(null);

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

  const total = filtered.length;
  const realizadas = filtered.filter((r) => normalizeText(r.status).includes("realizada")).length;
  const foraPrazoCount = filtered.filter((r) => isForaPrazo(r.prazoLimite, r.status)).length;
  const dentroPrazo = Math.max(total - foraPrazoCount, 0);

  const devolvidasRecusadas = filtered.filter((r) => {
    const status = normalizeText(r.status);
    return status.includes("devolvida") || status.includes("recusada");
  }).length;

  const pendentes = filtered.filter((r) => {
    const status = normalizeText(r.status);
    return (
      status.includes("solicitada") ||
      status.includes("analise") ||
      status.includes("análise") ||
      status.includes("aprovada")
    );
  }).length;

  const porEixo = useMemo(() => countBy(filtered, (r) => r.eixo), [filtered]);
  const porStatus = useMemo(() => countBy(filtered, (r) => r.status), [filtered]);
  const porUnidade = useMemo(() => countBy(filtered, (r) => r.unidade), [filtered]);
  const porResponsavel = useMemo(
    () => countBy(filtered.filter((r) => r.responsavel), (r) => r.responsavel),
    [filtered],
  );

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

  const handleImportVisitas = async (file?: File) => {
    if (!file) return;

    try {
      const rows = await importarVisitasTecnicasExcel(file);

      replaceVisitas(
        rows.map((r) => ({
          ano: r.ano,
          unidade: r.unidade,
          eixo: r.eixo,
          processoSEI: r.processoSEI,
          dataSolicitacao: r.dataSolicitacao,
          dataVisitaPrevista: r.dataVisitaPrevista,
          prazoLimite: r.prazoLimite,
          status: r.status,
          responsavel: r.responsavel,
          relatorio: r.relatorio,
          observacao: r.observacao,
        })),
      );

      setSearch("");
      setFilterAno("Todos");
      setFilterUnidade("Todas");
      setFilterEixo("Todos");
      setFilterStatus("Todos");
      setFilterPrazo("Todos");

      refresh();

      if (!rows.length) {
        toastError("Nenhuma visita técnica válida encontrada na planilha.");
        return;
      }

      toastSuccess(
        `${rows.length} visitas importadas. Dados anteriores substituídos.`,
      );
    } catch (error) {
      console.error(error);
      toastError("Erro ao importar a planilha de Visitas Técnicas.");
    } finally {
      if (inputVisitasRef.current) inputVisitasRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="border-b border-gray-200 px-5 pb-5 pt-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <h1 className="text-2xl font-bold text-[#003F7D]">Visitas Técnicas</h1>

            <div className="mt-1 flex items-center gap-3 text-sm">
              <span className="text-gray-500">{totalGeral} registros</span>

              {foraPrazoGeral > 0 && (
                <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                  <AlertTriangle size={14} />
                  {foraPrazoGeral} fora do prazo
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("registros")}
                className={`flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold transition ${
                  activeTab === "registros"
                    ? "bg-white text-[#003F7D] shadow-sm"
                    : "text-gray-500 hover:text-[#003F7D]"
                }`}
              >
                <List size={16} />
                Registros
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("indicadores")}
                className={`flex h-9 items-center gap-2 rounded-md px-4 text-sm font-semibold transition ${
                  activeTab === "indicadores"
                    ? "bg-white text-[#003F7D] shadow-sm"
                    : "text-gray-500 hover:text-[#003F7D]"
                }`}
              >
                <BarChart3 size={16} />
                Indicadores
              </button>
            </div>

            <input
              ref={inputVisitasRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleImportVisitas(e.target.files?.[0])}
            />

            <Button
              variant="outline"
              className="h-10 gap-2"
              onClick={() => inputVisitasRef.current?.click()}
            >
              <Upload size={16} />
              Importar Excel
            </Button>

            <Button
              variant="outline"
              className="h-10 gap-2"
              onClick={() => exportToExcel(dadosExportacao, "Visitas_Tecnicas")}
            >
              <FileSpreadsheet size={16} />
              Excel
            </Button>

            <Button
              variant="outline"
              className="h-10 gap-2"
              onClick={() => exportToCsv(dadosExportacao, "Visitas_Tecnicas")}
            >
              <Download size={16} />
              CSV
            </Button>

            <Button
              variant="outline"
              className="h-10"
              onClick={() =>
                exportToPdf(
                  dadosExportacao,
                  "Relatorio_Visitas_Tecnicas",
                  "Relatório Visitas Técnicas",
                  [
                    "Ano",
                    "Unidade",
                    "Eixo",
                    "Processo SEI",
                    "Solicitação",
                    "Visita Prevista",
                    "Prazo Limite",
                    "Status",
                    "Observação",
                  ],
                )
              }
            >
              PDF
            </Button>

            <Button
              variant="outline"
              className="h-10 gap-2 border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleClearVisitas}
            >
              <Trash2 size={16} />
              Limpar
            </Button>

            <Button
              onClick={openNew}
              className="h-10 gap-2 bg-[#F57C00] px-5 text-white hover:bg-[#E67300]"
            >
              <Plus size={16} />
              Nova Visita Técnica
            </Button>
          </div>
          <div className="mt-3 w-full px-5 lg:px-8">
            <ExportHint filteredCount={filtered.length} totalCount={records.length} />
          </div>
        </div>
      </div>

      {records.length === 0 && (
        <div className="mx-5 mt-6 rounded-xl border border-orange-200 bg-orange-50 p-5 text-orange-800 lg:mx-8">
          <strong>Nenhuma visita técnica importada ainda.</strong>
          <p className="mt-1 text-sm">
            Use <strong>Início → Importar planilha completa</strong> ou o botão{" "}
            <strong>Importar Excel</strong> nesta tela com a planilha principal do portfólio.
          </p>
        </div>
      )}

      <div className="mx-5 mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:mx-8">
        <div
          className={`grid grid-cols-1 gap-3 ${
            activeTab === "registros"
              ? "lg:grid-cols-[1fr_90px_250px_250px_140px_180px_80px]"
              : "lg:grid-cols-[90px_250px_250px_140px_180px_80px]"
          }`}
        >
          {activeTab === "registros" && (
            <div className="relative self-end">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por unidade, eixo, SEI ou responsável..."
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
              />
            </div>
          )}

          <FilterSelect label="Ano" value={filterAno} onChange={setFilterAno} options={anos} />
          <FilterSelect
            label="Unidade"
            value={filterUnidade}
            onChange={setFilterUnidade}
            options={unidades}
          />
          <FilterSelect
            label="Eixo Tecnológico"
            value={filterEixo}
            onChange={setFilterEixo}
            options={eixos}
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

          <button className="h-9 self-end rounded-lg bg-[#003F7D] px-4 text-sm font-semibold text-white transition hover:bg-[#002D5A]">
            Filtrar
          </button>
        </div>
      </div>

      {activeTab === "registros" ? (
        <div className="mt-4 pb-10">
          <div className="overflow-hidden bg-white">
            <div className="overflow-x-auto">
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
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!filtered.length && (
                    <tr>
                      <td colSpan={10} className="px-4 py-14 text-center text-gray-500">
                        Nenhuma visita técnica encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <IndicadoresVisitas
          total={total}
          realizadas={realizadas}
          pendentes={pendentes}
          foraPrazoCount={foraPrazoCount}
          dentroPrazo={dentroPrazo}
          devolvidasRecusadas={devolvidasRecusadas}
          porEixo={porEixo}
          porStatus={porStatus}
          porUnidade={porUnidade}
          porResponsavel={porResponsavel}
        />
      )}

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

                  <Button
                    onClick={() => setModalMode("edit")}
                    className="gap-2 bg-[#003F7D] text-white hover:bg-[#00355C]"
                  >
                    <Edit size={15} />
                    Editar
                  </Button>
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
    </div>
  );
}

function IndicadoresVisitas({
  total,
  realizadas,
  pendentes,
  foraPrazoCount,
  dentroPrazo,
  devolvidasRecusadas,
  porEixo,
  porStatus,
  porUnidade,
  porResponsavel,
}: {
  total: number;
  realizadas: number;
  pendentes: number;
  foraPrazoCount: number;
  dentroPrazo: number;
  devolvidasRecusadas: number;
  porEixo: Array<{ label: string; value: number }>;
  porStatus: Array<{ label: string; value: number }>;
  porUnidade: Array<{ label: string; value: number }>;
  porResponsavel: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="space-y-6 px-5 pb-10 lg:px-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <IndicatorCard title="Total no período" value={total} subtitle="100% do total" barPercent={100} colorClass="bg-[#003F7D]" />
        <IndicatorCard title="Realizadas" value={realizadas} subtitle={`${percent(realizadas, total)}% do total`} barPercent={percent(realizadas, total)} colorClass="bg-green-700" />
        <IndicatorCard title="Pendentes" value={pendentes} subtitle={`${percent(pendentes, total)}% do total`} barPercent={percent(pendentes, total)} colorClass="bg-yellow-700" />
        <IndicatorCard title="Fora do prazo" value={foraPrazoCount} subtitle={`${percent(foraPrazoCount, total)}% do total`} barPercent={percent(foraPrazoCount, total)} colorClass="bg-red-700" />
        <IndicatorCard title="Dentro do prazo" value={dentroPrazo} subtitle={`${percent(dentroPrazo, total)}% do total`} barPercent={percent(dentroPrazo, total)} colorClass="bg-blue-700" />
        <IndicatorCard title="Devolvidas/Recusadas" value={devolvidasRecusadas} subtitle={`${percent(devolvidasRecusadas, total)}% do total`} barPercent={percent(devolvidasRecusadas, total)} colorClass="bg-purple-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BarPanel title="Visitas por Eixo Tecnológico" subtitle="Quantas visitas cada eixo realizou no período" data={porEixo} />
        <StatusPanel title="Distribuição por Status" subtitle="Situação atual de cada solicitação" data={porStatus} total={total} />
        <RankingPanel title="Visitas por Unidade Solicitante" subtitle="Qual unidade mais solicitou visitas técnicas" data={porUnidade} total={total} />
        <RankingPanel title="Pessoas Mais Acionadas" subtitle="Quantas vezes cada pessoa foi chamada" data={porResponsavel} total={total} />
      </div>
    </div>
  );
}

function IndicatorCard({
  title,
  value,
  subtitle,
  barPercent,
  colorClass,
}: {
  title: string;
  value: number;
  subtitle: string;
  barPercent: number;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-3xl font-bold text-[#003F7D]">{value}</p>
      <p className="mt-1 text-sm text-gray-600">{title}</p>
      <div className="mt-3 h-1.5 rounded-full bg-gray-100">
        <div
          className={`h-1.5 rounded-full ${colorClass}`}
          style={{ width: `${Math.min(barPercent, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

function BarPanel({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-[#003F7D]">{title}</h3>
      <p className="text-sm text-gray-400">{subtitle}</p>

      <div className="mt-6 space-y-4">
        {data.slice(0, 8).map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-xs text-gray-600">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-[#003F7D]"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}

        {!data.length && (
          <p className="py-8 text-center text-sm text-gray-400">
            Nenhum dado para exibir.
          </p>
        )}
      </div>
    </div>
  );
}

function StatusPanel({
  title,
  subtitle,
  data,
  total,
}: {
  title: string;
  subtitle: string;
  data: Array<{ label: string; value: number }>;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-[#003F7D]">{title}</h3>
      <p className="text-sm text-gray-400">{subtitle}</p>

      <div className="mt-6 space-y-3">
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className={`rounded-full border px-2 py-0.5 font-bold ${statusClass(item.label)}`}>
                {item.label}
              </span>
              <span className="font-semibold text-gray-700">
                {item.value}{" "}
                <span className="font-normal text-gray-400">
                  {percent(item.value, total)}%
                </span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-[#003F7D]"
                style={{ width: `${percent(item.value, total)}%` }}
              />
            </div>
          </div>
        ))}

        {!data.length && (
          <p className="py-8 text-center text-sm text-gray-400">
            Nenhum dado para exibir.
          </p>
        )}
      </div>
    </div>
  );
}

function RankingPanel({
  title,
  subtitle,
  data,
  total,
}: {
  title: string;
  subtitle: string;
  data: Array<{ label: string; value: number }>;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-[#003F7D]">{title}</h3>
      <p className="text-sm text-gray-400">{subtitle}</p>

      <div className="mt-6 space-y-3">
        {data.slice(0, 8).map((item, index) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">
                {index + 1}. {item.label}
              </span>
              <span className="font-semibold text-gray-700">
                {item.value}{" "}
                <span className="font-normal text-gray-400">
                  {percent(item.value, total)}%
                </span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-[#F57C00]"
                style={{ width: `${percent(item.value, total)}%` }}
              />
            </div>
          </div>
        ))}

        {!data.length && (
          <p className="py-8 text-center text-sm text-gray-400">
            Nenhum dado para exibir.
          </p>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
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
      <label className="mb-1 block text-xs font-semibold text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
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