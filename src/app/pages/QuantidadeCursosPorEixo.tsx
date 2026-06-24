import { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle,
  Edit2,
  Eye,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { importarCursosEixoExcel } from "../utils/importExcel";
import { useConfirm } from "../components/ConfirmProvider";
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
import { toastError, toastSuccess } from "../utils/toast";
import {
  clearCursosEixo,
  deleteCursoEixo,
  getCursosEixo,
  replaceCursosEixo,
  saveCursoEixo,
  updateCursoEixo,
  type CursoEixoRecord,
} from "../utils/store";
import { usePermissions } from "../hooks/usePermissions";
import { ReadOnlyBanner } from "../components/ReadOnlyBanner";

type ModalMode = "view" | "edit" | "new";

const EIXOS = [
  "Gastronomia",
  "Bebidas",
  "Panificação",
  "Confeitaria",
  "Turismo",
  "Hospitalidade",
  "Comunicação e Audiovisual",
  "Tecnologia da Informação - Suporte",
  "Tecnologia da Informação - Games",
  "Tecnologia da Informação - Inovação",
  "Tecnologia da Informação - Desenvolvimento",
  "Gestão e Comércio",
  "Educação",
  "Vendas e Marketing",
  "Moda e Costura",
  "Beleza e Cuidado Pessoal",
  "Estética e Massoterapia",
  "Enfermagem",
  "Saúde Bucal",
  "Nutrição",
  "Análises Clínicas",
  "Farmácia",
  "Segurança e NRs",
  "Administrativo / Serviços em Saúde",
  "Ambiente e Saúde",
  "Gestão e Moda",
  "Tecnologia e Economia Criativa",
  "60+",
  "Ensino Médio",
  "Design, Paisagismo e Ambientação",
  "Radiologia",
];

const UNIDADES = [
  "Ceilândia",
  "Gama",
  "Jessé Freire",
  "Jo Rufino e Carlos Aguiar",
  "Joaquim Loiola",
  "Miguel Setembrino — Gastronomia",
  "Miguel Setembrino — Saúde",
  "Santa Maria",
  "Sobradinho",
  "Taguatinga",
  "Talal Abu-Allan",
];

const STATUS_LIST = ["Ativo", "Suspenso", "Inativo"];
const ANOS = ["2023", "2024", "2025", "2026"];
const ANOS_COM_TODOS = ["Todos", ...ANOS];

const EMPTY: Omit<CursoEixoRecord, "id"> = {
  ano: "2025",
  eixo: "",
  unidade: "",
  curso: "",
  ch: "",
  status: "Ativo",
  observacao: "",
  quantidadeCursosSegmento: "",
  turmas: "",
  codigo: "",
  alunos: "",
  instrutores: "",
  isNovo: false,
};

const EIXO_COLORS: Record<string, string> = {
  Gastronomia: "bg-orange-100 text-orange-800",
  Bebidas: "bg-amber-100 text-amber-800",
  Panificação: "bg-yellow-100 text-yellow-800",
  Confeitaria: "bg-pink-100 text-pink-800",
  Turismo: "bg-cyan-100 text-cyan-800",
  Hospitalidade: "bg-teal-100 text-teal-800",
  "Comunicação e Audiovisual": "bg-indigo-100 text-indigo-800",
  "Tecnologia da Informação - Suporte": "bg-purple-100 text-purple-800",
  "Tecnologia da Informação - Games": "bg-violet-100 text-violet-800",
  "Tecnologia da Informação - Inovação": "bg-fuchsia-100 text-fuchsia-800",
  "Tecnologia da Informação - Desenvolvimento": "bg-blue-100 text-blue-800",
  "Tecnologia e Economia Criativa": "bg-purple-100 text-purple-800",
  "Gestão e Comércio": "bg-sky-100 text-sky-800",
  Educação: "bg-lime-100 text-lime-800",
  "Vendas e Marketing": "bg-emerald-100 text-emerald-800",
  "Moda e Costura": "bg-rose-100 text-rose-800",
  "Gestão e Moda": "bg-rose-100 text-rose-800",
  "Beleza e Cuidado Pessoal": "bg-pink-100 text-pink-800",
  "Estética e Massoterapia": "bg-red-100 text-red-800",
  Enfermagem: "bg-green-100 text-green-800",
  "Saúde Bucal": "bg-green-100 text-green-800",
  Nutrição: "bg-green-100 text-green-800",
  "Análises Clínicas": "bg-green-100 text-green-800",
  Farmácia: "bg-green-100 text-green-800",
  "Segurança e NRs": "bg-slate-100 text-slate-800",
  "Administrativo / Serviços em Saúde": "bg-gray-100 text-gray-800",
  "Ambiente e Saúde": "bg-green-100 text-green-800",
  "60+": "bg-orange-100 text-orange-800",
  "Ensino Médio": "bg-blue-100 text-blue-800",
  "Design, Paisagismo e Ambientação": "bg-lime-100 text-lime-800",
  Radiologia: "bg-green-100 text-green-800",
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function safeText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function normalizeImportedRow(row: any): Omit<CursoEixoRecord, "id"> {
  return {
    ano: String(row.ano || "2025"),
    eixo: String(row.eixo || row.segmento || ""),
    unidade: String(row.unidade || ""),
    curso: String(row.curso || row.titulo || row.nomeCurso || ""),
    ch: String(row.ch || row.cargaHoraria || ""),
    status: String(row.status || "Ativo"),
    observacao: String(row.observacao || row.observacoes || ""),
    quantidadeCursosSegmento: String(row.quantidadeCursosSegmento || ""),
    turmas: String(row.turmas || ""),
    codigo: String(row.codigo || row.codSIG || row.codigoSIG || ""),
    alunos: String(row.alunos || ""),
    instrutores: String(row.instrutores || ""),
    isNovo: Boolean(row.isNovo),
  };
}

function toExportRows(records: CursoEixoRecord[]) {
  return records.map((item) => ({
    Ano: item.ano,
    "Nome do Curso": item.curso,
    "Eixo Tecnológico": item.eixo,
    Unidade: item.unidade,
    CH: item.ch,
    "Turmas (2º Semestre)": item.turmas || "",
    Código: item.codigo || "",
    "Alunos (Matrículas)": item.alunos || "",
    Instrutores: item.instrutores || "",
    Status: item.status,
    Novo: item.isNovo ? "Sim" : "Não",
    Observação: item.observacao,
  }));
}

function formatCh(ch: string | undefined) {
  const value = String(ch || "").trim();

  if (!value) return "—";
  if (value.toLowerCase().endsWith("h")) return value;

  return `${value}h`;
}

export function QuantidadeCursosPorEixo() {
  const confirm = useConfirm();
  const { canWrite } = usePermissions();
  const [registros, setRegistros] = useState<CursoEixoRecord[]>(getCursosEixo);
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterAnoComp, setFilterAnoComp] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todas");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [successMsg, setSuccessMsg] = useState("");
  const [modal, setModal] = useState<{
    open: boolean;
    mode: ModalMode;
    item: Omit<CursoEixoRecord, "id">;
    editId: string | null;
  }>({
    open: false,
    mode: "new",
    item: EMPTY,
    editId: null,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = () => setRegistros(getCursosEixo());

  const toast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const setField = <K extends keyof Omit<CursoEixoRecord, "id">>(
    k: K,
    v: Omit<CursoEixoRecord, "id">[K],
  ) => setModal((m) => ({ ...m, item: { ...m.item, [k]: v } }));

  const cursosAno = useMemo(
    () => (filterAno === "Todos" ? registros : registros.filter((r) => r.ano === filterAno)),
    [registros, filterAno],
  );

  const cursosComp = useMemo(
    () =>
      filterAnoComp === "Todos" ? [] : registros.filter((r) => r.ano === filterAnoComp),
    [registros, filterAnoComp],
  );

  const compKey = (r: CursoEixoRecord) =>
    `${normalizeText(r.curso)}||${normalizeText(r.eixo)}`;

  const compKeys = useMemo(() => new Set(cursosComp.map(compKey)), [cursosComp]);

  const isNovo = (r: CursoEixoRecord) => {
    if (r.isNovo) return true;
    if (filterAno === "Todos" || filterAnoComp === "Todos") return false;
    return !compKeys.has(compKey(r));
  };

  const filtered = useMemo(() => {
    return cursosAno.filter((r) => {
      if (filterUnidade !== "Todas" && r.unidade !== filterUnidade) return false;
      if (filterEixo !== "Todos" && r.eixo !== filterEixo) return false;
      if (filterStatus !== "Todos" && r.status !== filterStatus) return false;

      if (search) {
        const q = normalizeText(search);
        const searchable = [
          r.curso,
          r.eixo,
          r.unidade,
          r.status,
          r.observacao,
          r.ch,
          r.turmas,
          r.codigo,
          r.alunos,
          r.instrutores,
        ]
          .map(normalizeText)
          .join(" ");

        if (!searchable.includes(q)) return false;
      }

      return true;
    });
  }, [cursosAno, filterUnidade, filterEixo, filterStatus, search]);

  const eixosParaExibir = useMemo(() => {
    const eixosImportados = registros.map((r) => r.eixo).filter(Boolean);
    const unidos = Array.from(new Set([...EIXOS, ...eixosImportados]));

    return unidos;
  }, [registros]);

  const unidadesParaExibir = useMemo(() => {
    const importadas = registros.map((r) => r.unidade).filter(Boolean);
    return Array.from(new Set([...UNIDADES, ...importadas]));
  }, [registros]);

  const statusParaExibir = useMemo(() => {
    const importados = registros.map((r) => r.status).filter(Boolean);
    return Array.from(new Set([...STATUS_LIST, ...importados]));
  }, [registros]);

  const hasFilters =
    search ||
    filterUnidade !== "Todas" ||
    filterEixo !== "Todos" ||
    filterStatus !== "Todos";

  const clearFilters = () => {
    setSearch("");
    setFilterUnidade("Todas");
    setFilterEixo("Todos");
    setFilterStatus("Todos");
  };

  const defaultAnoForNew = filterAno === "Todos" ? "2025" : filterAno;

  const openNew = () =>
    setModal({
      open: true,
      mode: "new",
      item: { ...EMPTY, ano: defaultAnoForNew },
      editId: null,
    });

  const openView = (r: CursoEixoRecord) =>
    setModal({
      open: true,
      mode: "view",
      item: {
        ano: r.ano,
        eixo: r.eixo,
        unidade: r.unidade,
        curso: r.curso,
        ch: r.ch,
        status: r.status,
        observacao: r.observacao,
        quantidadeCursosSegmento: r.quantidadeCursosSegmento,
        turmas: r.turmas,
        codigo: r.codigo,
        alunos: r.alunos,
        instrutores: r.instrutores,
        isNovo: r.isNovo,
      },
      editId: r.id,
    });

  const openEdit = (r: CursoEixoRecord) =>
    setModal({
      open: true,
      mode: "edit",
      item: {
        ano: r.ano,
        eixo: r.eixo,
        unidade: r.unidade,
        curso: r.curso,
        ch: r.ch,
        status: r.status,
        observacao: r.observacao,
        quantidadeCursosSegmento: r.quantidadeCursosSegmento,
        turmas: r.turmas,
        codigo: r.codigo,
        alunos: r.alunos,
        instrutores: r.instrutores,
        isNovo: r.isNovo,
      },
      editId: r.id,
    });

  const closeModal = () =>
    setModal({
      open: false,
      mode: "new",
      item: EMPTY,
      editId: null,
    });

  const handleSave = () => {
    if (!modal.item.curso.trim()) return;

    if (modal.editId) {
      updateCursoEixo(modal.editId, modal.item);
      toast("Registro atualizado!");
    } else {
      saveCursoEixo(modal.item);
      toast("Curso cadastrado!");
    }

    refresh();
    closeModal();
  };

  const handleDelete = async (r: CursoEixoRecord) => {
    const ok = await confirm({
      message: `Excluir "${r.curso}" (${r.ano})?`,
      destructive: true,
      confirmLabel: "Excluir",
    });
    if (!ok) return;

    deleteCursoEixo(r.id);
    refresh();
    toast("Registro excluído.");
  };

  const handleClear = async () => {
    const ok = await confirm({
      title: "Limpar registros",
      message:
        "Deseja limpar todos os registros de Quantidade de Cursos por Eixo?\n\nA tela ficará vazia até uma nova importação ou cadastro.",
      destructive: true,
      confirmLabel: "Limpar tudo",
    });
    if (!ok) return;

    clearCursosEixo();
    setRegistros([]);
    clearFilters();
    toast("Registros limpos.");
  };

  const handleImport = async (file?: File) => {
    if (!file) return;

    try {
      const rows = await importarCursosEixoExcel(file);
      const normalizedRows = rows
        .map(normalizeImportedRow)
        .filter((row) => row.curso.trim());

      const saved = replaceCursosEixo(normalizedRows);
      setRegistros(saved);
      clearFilters();

      if (!normalizedRows.length) {
        toastError("Nenhum registro válido encontrado na aba de Cursos por Eixo.");
        return;
      }

      toastSuccess(
        `${normalizedRows.length} cursos importados. Dados anteriores substituídos.`,
      );
    } catch (error) {
      console.error(error);
      toastError("Erro ao importar a planilha de Quantidade de Cursos por Eixo.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const exportRows = toExportRows(filtered);

  return (
    <PageLayout>
      {successMsg && (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-xl bg-green-600 px-5 py-3 text-white shadow-lg">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      <PageHeader
        title="Eixos"
        description="Comparativo entre anos e distribuição por eixo tecnológico"
        filteredCount={filtered.length}
        totalCount={registros.length}
        actions={
          canWrite ? (
            <Button
              onClick={openNew}
              className="gap-2 bg-[#F57C00] text-white hover:bg-[#E67300]"
            >
              <Plus size={16} />
              Novo Curso
            </Button>
          ) : null
        }
      />

      <PageContentSection className="mt-5">
        <ReadOnlyBanner />
      </PageContentSection>

      {registros.length === 0 && (
        <PageImportAlert title="Nenhum registro importado ainda.">
          <p>
            Use <ImportacoesLink /> para carregar a planilha principal. Esta tela utiliza a aba{" "}
            <strong>Quantidade de Cursos por Eixo</strong>.
          </p>
        </PageImportAlert>
      )}

      <PageFiltersBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por curso, eixo, unidade, código ou instrutor..."
        hasActiveFilters={hasFilters}
        onClearFilters={clearFilters}
      >
        <FilterSelect label="Ano" value={filterAno} onChange={setFilterAno} options={ANOS_COM_TODOS} />
        <FilterSelect
          label="Comparar com"
          value={filterAnoComp}
          onChange={setFilterAnoComp}
          options={ANOS_COM_TODOS}
        />
        <FilterSelect
          label="Eixo"
          value={filterEixo}
          onChange={setFilterEixo}
          options={["Todos", ...eixosParaExibir]}
          className="min-w-[220px]"
        />
        <FilterSelect
          label="Unidade"
          value={filterUnidade}
          onChange={setFilterUnidade}
          options={["Todas", ...unidadesParaExibir]}
        />
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={["Todos", ...statusParaExibir]}
        />
      </PageFiltersBar>

      <PageTableCard
        summary={
          <>
            {filtered.length} curso{filtered.length !== 1 ? "s" : ""} —{" "}
            {filterAno === "Todos" ? "todos os anos" : filterAno}
          </>
        }
        meta={
          filterEixo !== "Todos" ? (
            <>
              Eixo: <strong>{filterEixo}</strong>
            </>
          ) : undefined
        }
        footer={
          filtered.length > 0 ? (
            <div className="flex flex-wrap gap-3 px-5 py-3">
              {eixosParaExibir
                .filter((e) => filtered.some((r) => r.eixo === e))
                .map((e) => (
                  <span key={e} className="text-xs text-gray-500">
                    <strong className="text-gray-700">{e}:</strong>{" "}
                    {filtered.filter((r) => r.eixo === e).length}
                  </span>
                ))}

              <span className="ml-auto text-xs font-semibold text-emerald-600">
                {filtered.filter(isNovo).length} novo
                {filtered.filter(isNovo).length !== 1 ? "s" : ""} na seleção
              </span>
            </div>
          ) : undefined
        }
      >
            <table className="w-full min-w-[1650px] text-sm">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Nome do Curso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Eixo Tecnológico
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Unidade
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                    Ano
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                    CH
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                    Turmas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                    Código
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                    Alunos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Instrutores
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                    Novo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                    Observação
                  </th>
                  <th className="w-20 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-16 text-center">
                      <BookOpen size={32} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-sm text-gray-400">
                        Nenhum curso encontrado para os filtros selecionados.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, idx) => {
                    const novo = isNovo(r);
                    const eixoColor =
                      EIXO_COLORS[r.eixo] ?? "bg-gray-100 text-gray-700";

                    return (
                      <tr
                        key={r.id}
                        className={`border-b border-gray-100 transition-colors hover:bg-blue-50/50 ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{safeText(r.curso)}</p>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${eixoColor}`}
                          >
                            {safeText(r.eixo)}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-xs text-gray-600">
                          {safeText(r.unidade)}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700">
                            {safeText(r.ano)}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center font-mono text-xs text-gray-700">
                          {formatCh(r.ch)}
                        </td>

                        <td className="px-4 py-3 text-center text-xs text-gray-700">
                          {safeText(r.turmas)}
                        </td>

                        <td className="px-4 py-3 text-center font-mono text-xs text-gray-700">
                          {safeText(r.codigo)}
                        </td>

                        <td className="px-4 py-3 text-center text-xs text-gray-700">
                          {safeText(r.alunos)}
                        </td>

                        <td className="max-w-[240px] px-4 py-3 text-xs text-gray-600">
                          <span title={r.instrutores} className="line-clamp-2">
                            {safeText(r.instrutores)}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={r.status} />
                        </td>

                        <td className="px-4 py-3 text-center">
                          {novo ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                              <Sparkles size={10} />
                              Novo
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        <td className="max-w-[280px] px-4 py-3 text-xs italic text-gray-500">
                          <span title={r.observacao} className="line-clamp-2">
                            {safeText(r.observacao)}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openView(r)}
                              className="rounded p-1.5 text-blue-600 transition-colors hover:bg-blue-100"
                              title="Visualizar"
                            >
                              <Eye size={14} />
                            </button>

                            {canWrite && (
                              <>
                            <button
                              onClick={() => openEdit(r)}
                              className="rounded p-1.5 text-amber-600 transition-colors hover:bg-amber-100"
                              title="Editar"
                            >
                              <Edit2 size={14} />
                            </button>

                            <button
                              onClick={() => handleDelete(r)}
                              className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-100"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
      </PageTableCard>

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="h-1 w-full bg-[#F57C00]" />

            <div className="max-h-[90vh] overflow-y-auto px-7 py-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#003F7D]">
                  {modal.mode === "new"
                    ? "Novo Curso"
                    : modal.mode === "edit"
                      ? "Editar Curso"
                      : "Detalhes do Curso"}
                </h2>

                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {modal.mode === "view" ? (
                <div className="space-y-4">
                  <Detail label="Nome do Curso" value={modal.item.curso} />

                  <div className="grid grid-cols-2 gap-4">
                    <Detail label="Ano" value={modal.item.ano} />
                    <Detail label="C.H." value={formatCh(modal.item.ch)} />
                    <Detail label="Eixo" value={modal.item.eixo} />
                    <Detail label="Unidade" value={modal.item.unidade || "—"} />
                    <Detail label="Turmas" value={modal.item.turmas || "—"} />
                    <Detail label="Código" value={modal.item.codigo || "—"} />
                    <Detail label="Alunos" value={modal.item.alunos || "—"} />
                    <Detail label="Instrutores" value={modal.item.instrutores || "—"} />
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                      Status
                    </p>
                    <StatusBadge status={modal.item.status} />
                  </div>

                  <Detail label="Observação" value={modal.item.observacao || "—"} />

                  <div className="flex gap-3 pt-2">
                    <Button
                      className="h-10 gap-2 bg-[#F57C00] px-5 hover:bg-[#E86D00]"
                      onClick={() => setModal((m) => ({ ...m, mode: "edit" }))}
                    >
                      <Edit2 size={14} />
                      Editar
                    </Button>

                    <Button variant="outline" className="h-10 px-5" onClick={closeModal}>
                      Fechar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Ano
                      </Label>
                      <select
                        value={modal.item.ano}
                        onChange={(e) => setField("ano", e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
                      >
                        {ANOS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        C.H.
                      </Label>
                      <Input
                        value={modal.item.ch}
                        onChange={(e) => setField("ch", e.target.value)}
                        placeholder="Ex: 200"
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Nome do Curso <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={modal.item.curso}
                      onChange={(e) => setField("curso", e.target.value)}
                      placeholder="Ex: Técnico em Gastronomia"
                      className="h-10"
                    />
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Eixo Tecnológico
                    </Label>
                    <select
                      value={modal.item.eixo}
                      onChange={(e) => setField("eixo", e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
                    >
                      <option value="">Selecione...</option>
                      {eixosParaExibir.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Unidade
                    </Label>
                    <select
                      value={modal.item.unidade}
                      onChange={(e) => setField("unidade", e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
                    >
                      <option value="">Selecione...</option>
                      {unidadesParaExibir.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputBlock
                      label="Turmas"
                      value={modal.item.turmas || ""}
                      onChange={(value) => setField("turmas", value)}
                      placeholder="Ex: 2"
                    />

                    <InputBlock
                      label="Código"
                      value={modal.item.codigo || ""}
                      onChange={(value) => setField("codigo", value)}
                      placeholder="Ex: 2025.12.92"
                    />

                    <InputBlock
                      label="Alunos"
                      value={modal.item.alunos || ""}
                      onChange={(value) => setField("alunos", value)}
                      placeholder="Ex: 25"
                    />

                    <InputBlock
                      label="Instrutores"
                      value={modal.item.instrutores || ""}
                      onChange={(value) => setField("instrutores", value)}
                      placeholder="Nome do instrutor"
                    />
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Status
                    </Label>
                    <select
                      value={modal.item.status}
                      onChange={(e) => setField("status", e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
                    >
                      {statusParaExibir.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-sm font-semibold text-gray-700">
                      Observação
                    </Label>
                    <textarea
                      value={modal.item.observacao}
                      onChange={(e) => setField("observacao", e.target.value)}
                      placeholder="Informações adicionais..."
                      rows={3}
                      className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button
                      className="h-10 gap-2 bg-[#F57C00] px-6 hover:bg-[#E86D00]"
                      onClick={handleSave}
                      disabled={!modal.item.curso.trim()}
                    >
                      <Save size={15} />
                      {modal.mode === "edit" ? "Salvar Alterações" : "Cadastrar"}
                    </Button>

                    <Button variant="outline" className="h-10 px-5" onClick={closeModal}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

function Detail({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="text-gray-700">{safeText(value)}</p>
    </div>
  );
}

function InputBlock({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10"
      />
    </div>
  );
}