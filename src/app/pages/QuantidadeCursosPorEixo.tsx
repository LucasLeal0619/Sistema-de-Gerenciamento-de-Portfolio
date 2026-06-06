import { useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  BookOpen,
  CheckCircle,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  TrendingDown,
  Upload,
  X,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { importarCursosEixoExcel } from "../utils/importExcel";
import { exportToCsv, exportToExcel, exportToPdf } from "../utils/exportExcel";
import { toastError, toastSuccess } from "../utils/toast";

type CursoEixoRecord = {
  id: string;
  ano: string;
  eixo: string;
  unidade: string;
  curso: string;
  ch: string;
  status: string;
  observacao: string;
  quantidadeCursosSegmento?: string;
  turmas?: string;
  codigo?: string;
  alunos?: string;
  instrutores?: string;
  isNovo?: boolean;
};

type ModalMode = "view" | "edit" | "new";

const STORAGE_KEY = "sgp_cursos_eixo";

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

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `curso-eixo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

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

function getStoredCursosEixo(): CursoEixoRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStoredCursosEixo(records: CursoEixoRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function saveCursoEixo(record: Omit<CursoEixoRecord, "id">) {
  const records = getStoredCursosEixo();
  const next = [{ id: createId(), ...record }, ...records];
  setStoredCursosEixo(next);
}

function updateCursoEixo(id: string, payload: Omit<CursoEixoRecord, "id">) {
  const records = getStoredCursosEixo();
  const next = records.map((item) => (item.id === id ? { id, ...payload } : item));
  setStoredCursosEixo(next);
}

function deleteCursoEixo(id: string) {
  const records = getStoredCursosEixo();
  const next = records.filter((item) => item.id !== id);
  setStoredCursosEixo(next);
}

function normalizeImportedRow(row: any): CursoEixoRecord {
  return {
    id: createId(),
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
  const [registros, setRegistros] = useState<CursoEixoRecord[]>(getStoredCursosEixo);
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("2025");
  const [filterAnoComp, setFilterAnoComp] = useState("2024");
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

  const refresh = () => setRegistros(getStoredCursosEixo());

  const toast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const setField = <K extends keyof Omit<CursoEixoRecord, "id">>(
    k: K,
    v: Omit<CursoEixoRecord, "id">[K],
  ) => setModal((m) => ({ ...m, item: { ...m.item, [k]: v } }));

  const cursosAno = useMemo(
    () => registros.filter((r) => r.ano === filterAno),
    [registros, filterAno],
  );

  const cursosComp = useMemo(
    () => registros.filter((r) => r.ano === filterAnoComp),
    [registros, filterAnoComp],
  );

  const compKey = (r: CursoEixoRecord) =>
    `${normalizeText(r.curso)}||${normalizeText(r.eixo)}`;

  const compKeys = useMemo(() => new Set(cursosComp.map(compKey)), [cursosComp]);
  const anoKeys = useMemo(() => new Set(cursosAno.map(compKey)), [cursosAno]);

  const isNovo = (r: CursoEixoRecord) => {
    if (r.isNovo) return true;
    return !compKeys.has(compKey(r));
  };

  const totalNovos = useMemo(
    () => cursosAno.filter(isNovo).length,
    [cursosAno, compKeys],
  );

  const totalRemovidos = useMemo(
    () => cursosComp.filter((r) => !anoKeys.has(compKey(r))).length,
    [cursosComp, anoKeys],
  );

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

  const porEixo = useMemo(() => {
    const map: Record<string, number> = {};

    cursosAno.forEach((r) => {
      const eixo = r.eixo || "Não informado";
      map[eixo] = (map[eixo] || 0) + 1;
    });

    return map;
  }, [cursosAno]);

  const eixosParaExibir = useMemo(() => {
    const eixosImportados = Object.keys(porEixo).filter(Boolean);
    const unidos = Array.from(new Set([...EIXOS, ...eixosImportados]));

    return unidos;
  }, [porEixo]);

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

  const openNew = () =>
    setModal({
      open: true,
      mode: "new",
      item: { ...EMPTY, ano: filterAno },
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

  const handleDelete = (r: CursoEixoRecord) => {
    if (!window.confirm(`Excluir "${r.curso}" (${r.ano})?`)) return;

    deleteCursoEixo(r.id);
    refresh();
    toast("Registro excluído.");
  };

  const handleClear = () => {
    if (
      !window.confirm(
        "Deseja limpar todos os registros de Quantidade de Cursos por Eixo?\n\nA tela ficará vazia até uma nova importação ou cadastro.",
      )
    ) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
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

      setStoredCursosEixo(normalizedRows);
      setRegistros(normalizedRows);
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
    <div className="min-h-screen w-full bg-white">
      {successMsg && (
        <div className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-xl bg-green-600 px-5 py-3 text-white shadow-lg">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      <div className="border-b border-gray-200 px-4 pb-6 pt-20 lg:px-8 lg:pt-6">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#003F7D] lg:text-3xl">
              Quantidade de Cursos por Eixo
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Comparativo entre anos e distribuição por eixo tecnológico
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(event) => handleImport(event.target.files?.[0])}
            />

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={16} />
              Importar Excel
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => exportToExcel(exportRows, "Quantidade_Cursos_Por_Eixo")}
            >
              <FileSpreadsheet size={16} />
              Excel
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => exportToCsv(exportRows, "Quantidade_Cursos_Por_Eixo")}
            >
              <Download size={16} />
              CSV
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                exportToPdf(
                  exportRows,
                  "Relatorio_Quantidade_Cursos_Por_Eixo",
                  "Relatório Quantidade de Cursos por Eixo",
                  [
                    "Ano",
                    "Nome do Curso",
                    "Eixo Tecnológico",
                    "Unidade",
                    "CH",
                    "Turmas (2º Semestre)",
                    "Código",
                    "Alunos (Matrículas)",
                    "Instrutores",
                    "Status",
                    "Novo",
                    "Observação",
                  ],
                )
              }
            >
              PDF
            </Button>

            <Button
              variant="outline"
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
              onClick={handleClear}
            >
              <Trash2 size={16} />
              Limpar
            </Button>

            <Button
              onClick={openNew}
              className="gap-2 bg-[#F57C00] text-white hover:bg-[#E67300]"
            >
              <Plus size={16} />
              Novo Curso
            </Button>
          </div>
        </div>
      </div>

      {registros.length === 0 && (
        <div className="mx-4 mt-6 rounded-xl border border-orange-200 bg-orange-50 p-5 text-orange-800 lg:mx-8">
          <strong>Nenhum registro importado ainda.</strong>
          <p className="mt-1 text-sm">
            Clique em <strong>Importar Excel</strong> e selecione a planilha principal.
            Esta tela buscará a aba de Quantidade de Cursos por Eixo.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 px-4 py-6 lg:grid-cols-4 lg:px-8">
        <div className="rounded-xl bg-gradient-to-br from-[#003F7D] to-[#00355C] p-5 text-white">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen size={18} className="opacity-80" />
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
              Total
            </span>
          </div>
          <p className="text-3xl font-bold">{cursosAno.length}</p>
          <p className="mt-1 text-xs opacity-70">cursos em {filterAno}</p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={18} className="opacity-80" />
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
              Novos
            </span>
          </div>
          <p className="text-3xl font-bold">{totalNovos}</p>
          <p className="mt-1 text-xs opacity-70">não ofertados em {filterAnoComp}</p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-700 p-5 text-white">
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown size={18} className="opacity-80" />
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
              Removidos
            </span>
          </div>
          <p className="text-3xl font-bold">{totalRemovidos}</p>
          <p className="mt-1 text-xs opacity-70">
            saíram de {filterAnoComp} para {filterAno}
          </p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-[#F57C00] to-[#E06900] p-5 text-white">
          <div className="mb-3 flex items-center gap-2">
            <ArrowLeftRight size={18} className="opacity-80" />
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
              Comparação
            </span>
          </div>
          <p className="text-xl font-bold">
            {filterAnoComp} → {filterAno}
          </p>
          <p className="mt-1 text-xs opacity-80">
            {cursosComp.length} → {cursosAno.length} cursos
            {cursosAno.length >= cursosComp.length
              ? ` (+${cursosAno.length - cursosComp.length})`
              : ` (${cursosAno.length - cursosComp.length})`}
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {eixosParaExibir.map((e) => (
            <button
              key={e}
              onClick={() => setFilterEixo(filterEixo === e ? "Todos" : e)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                filterEixo === e
                  ? "border-[#003F7D] bg-[#003F7D] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#003F7D] hover:text-[#003F7D]"
              }`}
            >
              <span>{e}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filterEixo === e ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                }`}
              >
                {porEixo[e] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm lg:mx-8">
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por curso, eixo, unidade, código ou instrutor..."
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Ano</label>
          <select
            value={filterAno}
            onChange={(e) => setFilterAno(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
          >
            {ANOS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Comparar com</label>
          <select
            value={filterAnoComp}
            onChange={(e) => setFilterAnoComp(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
          >
            {ANOS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Unidade</label>
          <select
            value={filterUnidade}
            onChange={(e) => setFilterUnidade(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
          >
            <option value="Todas">Todas</option>
            {unidadesParaExibir.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
          >
            <option value="Todos">Todos</option>
            {statusParaExibir.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 self-end">
          <button className="h-9 rounded-lg bg-[#003F7D] px-4 text-sm font-medium text-white transition-colors hover:bg-[#002D5A]">
            Filtrar
          </button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 transition-colors hover:bg-gray-50"
            >
              <X size={13} />
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-10 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
            <span className="text-sm font-semibold text-gray-700">
              {filtered.length} curso{filtered.length !== 1 ? "s" : ""} — {filterAno}
            </span>

            {filterEixo !== "Todos" && (
              <span className="text-xs text-gray-500">
                Eixo: <strong>{filterEixo}</strong>
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
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
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="flex flex-wrap gap-3 border-t border-gray-200 bg-gray-50 px-5 py-3">
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
          )}
        </div>
      </div>

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
    </div>
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