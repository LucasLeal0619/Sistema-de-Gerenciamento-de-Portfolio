import { useMemo, useRef, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  GitCompare,
  Layers,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { importarCursosEixoExcel } from "../utils/importExcel";
import { exportToCsv, exportToExcel, exportToPdf } from "../utils/exportExcel";

type CursoEixoRecord = {
  id: string;
  ano: string;
  eixo: string;
  segmento?: string;
  unidade: string;
  curso: string;
  ch: string;
  status: string;
  observacao: string;
  quantidadeCursosSegmento: string;
  turmas: string;
  codigo: string;
  alunos: string;
  instrutores: string;
  isNovo: boolean;
};

type FormState = Omit<CursoEixoRecord, "id">;

const STORAGE_KEY = "sgp_quantidade_cursos_por_eixo";

const EMPTY_FORM: FormState = {
  ano: "2025",
  eixo: "",
  segmento: "",
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

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `curso-eixo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getStoredRecords(): CursoEixoRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStoredRecords(records: CursoEixoRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function statusBadgeClass(status: string) {
  const normalized = normalizeText(status);

  if (
    normalized.includes("ativo") ||
    normalized.includes("vigente") ||
    normalized.includes("publicado")
  ) {
    return "border-green-200 bg-green-100 text-green-700";
  }

  if (
    normalized.includes("novo") ||
    normalized.includes("incluido") ||
    normalized.includes("incluído")
  ) {
    return "border-blue-200 bg-blue-100 text-blue-700";
  }

  if (
    normalized.includes("removido") ||
    normalized.includes("inativo") ||
    normalized.includes("cancelado")
  ) {
    return "border-red-200 bg-red-100 text-red-700";
  }

  return "border-gray-200 bg-gray-100 text-gray-700";
}

function toNumber(value: unknown) {
  const text = String(value ?? "")
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");

  const number = Number(text);

  return Number.isFinite(number) ? number : 0;
}

function toExportRows(records: CursoEixoRecord[]) {
  return records.map((item) => ({
    Ano: item.ano,
    Eixo: item.eixo || item.segmento || "",
    Unidade: item.unidade,
    Curso: item.curso,
    CH: item.ch,
    Status: item.status,
    "Curso Novo": item.isNovo ? "Sim" : "Não",
    "Quantidade no Segmento": item.quantidadeCursosSegmento,
    Turmas: item.turmas,
    Código: item.codigo,
    Alunos: item.alunos,
    Instrutores: item.instrutores,
    Observação: item.observacao,
  }));
}

export function QuantidadeCursosPorEixo() {
  const [records, setRecords] = useState<CursoEixoRecord[]>(() => getStoredRecords());
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterNovo, setFilterNovo] = useState("Todos");
  const [cardFilter, setCardFilter] = useState("Todos");
  const [selected, setSelected] = useState<CursoEixoRecord | null>(null);
  const [editing, setEditing] = useState<CursoEixoRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = normalizeText(search);

    return records.filter((item) => {
      const eixo = item.eixo || item.segmento || "";

      const searchable = [
        item.ano,
        eixo,
        item.unidade,
        item.curso,
        item.ch,
        item.status,
        item.observacao,
        item.quantidadeCursosSegmento,
        item.turmas,
        item.codigo,
        item.alunos,
        item.instrutores,
        item.isNovo ? "curso novo novo sim" : "curso existente não nao",
      ]
        .map(normalizeText)
        .join(" ");

      if (q && !searchable.includes(q)) return false;
      if (filterAno !== "Todos" && item.ano !== filterAno) return false;
      if (filterEixo !== "Todos" && eixo !== filterEixo) return false;
      if (filterStatus !== "Todos" && item.status !== filterStatus) return false;

      if (filterNovo === "Novos" && !item.isNovo) return false;
      if (filterNovo === "Existentes" && item.isNovo) return false;

      if (cardFilter === "Novos" && !item.isNovo) return false;

      if (cardFilter === "Removidos") {
        const status = normalizeText(item.status);

        if (
          !status.includes("removido") &&
          !status.includes("inativo") &&
          !status.includes("cancelado")
        ) {
          return false;
        }
      }

      return true;
    });
  }, [records, search, filterAno, filterEixo, filterStatus, filterNovo, cardFilter]);

  const anos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.ano).filter(Boolean))).sort()],
    [records],
  );

  const eixos = useMemo(
    () => [
      "Todos",
      ...Array.from(
        new Set(records.map((r) => r.eixo || r.segmento || "").filter(Boolean)),
      ).sort(),
    ],
    [records],
  );

  const statusList = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.status).filter(Boolean))).sort()],
    [records],
  );

  const totalCursos = records.length;
  const cursosNovos = records.filter((item) => item.isNovo).length;

  const removidos = records.filter((item) => {
    const status = normalizeText(item.status);

    return (
      status.includes("removido") ||
      status.includes("inativo") ||
      status.includes("cancelado")
    );
  }).length;

  const totalTurmas = records.reduce((sum, item) => sum + toNumber(item.turmas), 0);
  const totalAlunos = records.reduce((sum, item) => sum + toNumber(item.alunos), 0);

  const totalEixos = new Set(
    records.map((item) => item.eixo || item.segmento || "").filter(Boolean),
  ).size;

  const exportRows = toExportRows(filtered);

  const handleImport = async (file?: File) => {
    if (!file) return;

    try {
      const rows = await importarCursosEixoExcel(file);

      const normalizedRows: CursoEixoRecord[] = rows.map((row: any) => ({
        id: createId(),
        ano: String(row.ano || "2025"),
        eixo: String(row.eixo || row.segmento || ""),
        segmento: String(row.segmento || row.eixo || ""),
        unidade: String(row.unidade || ""),
        curso: String(row.curso || ""),
        ch: String(row.ch || ""),
        status: String(row.status || "Ativo"),
        observacao: String(row.observacao || ""),
        quantidadeCursosSegmento: String(row.quantidadeCursosSegmento || ""),
        turmas: String(row.turmas || ""),
        codigo: String(row.codigo || ""),
        alunos: String(row.alunos || ""),
        instrutores: String(row.instrutores || ""),
        isNovo: Boolean(row.isNovo),
      }));

      setStoredRecords(normalizedRows);
      setRecords(normalizedRows);

      setSearch("");
      setFilterAno("Todos");
      setFilterEixo("Todos");
      setFilterStatus("Todos");
      setFilterNovo("Todos");
      setCardFilter("Todos");

      alert(
        `${normalizedRows.length} registros importados para Quantidade de Cursos por Eixo.\n\nOs dados anteriores foram substituídos para evitar duplicidade.`,
      );
    } catch (error) {
      console.error(error);
      alert("Erro ao importar a planilha de Quantidade de Cursos por Eixo.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleClear = () => {
    if (
      !confirm(
        "Deseja limpar todos os registros de Quantidade de Cursos por Eixo?\n\nA tela ficará vazia até uma nova importação ou cadastro.",
      )
    ) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    setRecords([]);
    setSearch("");
    setFilterAno("Todos");
    setFilterEixo("Todos");
    setFilterStatus("Todos");
    setFilterNovo("Todos");
    setCardFilter("Todos");
  };

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const openEdit = (record: CursoEixoRecord) => {
    setEditing(record);
    setForm({
      ano: record.ano,
      eixo: record.eixo,
      segmento: record.segmento || record.eixo,
      unidade: record.unidade,
      curso: record.curso,
      ch: record.ch,
      status: record.status,
      observacao: record.observacao,
      quantidadeCursosSegmento: record.quantidadeCursosSegmento,
      turmas: record.turmas,
      codigo: record.codigo,
      alunos: record.alunos,
      instrutores: record.instrutores,
      isNovo: record.isNovo,
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.curso.trim()) {
      alert("Informe o nome do curso.");
      return;
    }

    const payload: CursoEixoRecord = {
      id: editing?.id || createId(),
      ...form,
      eixo: form.eixo || form.segmento || "",
      segmento: form.segmento || form.eixo || "",
    };

    const nextRecords = editing
      ? records.map((item) => (item.id === editing.id ? payload : item))
      : [payload, ...records];

    setStoredRecords(nextRecords);
    setRecords(nextRecords);
    closeEdit();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Deseja excluir este registro?")) return;

    const nextRecords = records.filter((item) => item.id !== id);
    setStoredRecords(nextRecords);
    setRecords(nextRecords);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-8">
      <div className="mx-auto max-w-[1700px] space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#003F7D]">
                  <Layers className="text-white" size={25} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Quantidade de Cursos por Eixo
                  </h1>
                  <p className="text-gray-500">
                    Comparativo de cursos, turmas, alunos e instrutores por eixo tecnológico
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                <strong>Importação:</strong> esta tela lê a aba de Quantidade de Cursos por
                Eixo e mantém os agrupamentos de segmento/eixo da planilha.
              </div>
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
                className="h-12 gap-2 px-5 text-gray-600"
                onClick={() => inputRef.current?.click()}
              >
                <Upload size={18} />
                Importar Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 gap-2 px-5 text-gray-600"
                onClick={() => exportToExcel(exportRows, "Quantidade_Cursos_Por_Eixo")}
              >
                <FileSpreadsheet size={18} />
                Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 gap-2 px-5 text-gray-600"
                onClick={() => exportToCsv(exportRows, "Quantidade_Cursos_Por_Eixo")}
              >
                <Download size={18} />
                CSV
              </Button>

              <Button
                variant="outline"
                className="h-12 gap-2 px-5 text-gray-600"
                onClick={() =>
                  exportToPdf(
                    exportRows,
                    "Relatorio_Quantidade_Cursos_Por_Eixo",
                    "Relatório Quantidade de Cursos por Eixo",
                    [
                      "Ano",
                      "Eixo",
                      "Curso",
                      "CH",
                      "Status",
                      "Curso Novo",
                      "Quantidade no Segmento",
                      "Turmas",
                      "Código",
                      "Alunos",
                      "Instrutores",
                      "Observação",
                    ],
                  )
                }
              >
                PDF
              </Button>

              <Button
                variant="outline"
                className="h-12 gap-2 border-red-200 px-5 text-red-600 hover:bg-red-50"
                onClick={handleClear}
              >
                <Trash2 size={18} />
                Limpar
              </Button>

              <Button
                onClick={openNew}
                className="h-12 gap-2 bg-[#F57C00] px-5 text-white hover:bg-[#E67300]"
              >
                <Plus size={18} />
                Novo Registro
              </Button>
            </div>
          </div>
        </div>

        {records.length === 0 && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-800">
            <strong>Nenhum registro importado ainda.</strong>
            <p className="mt-1 text-sm">
              Clique em <strong>Importar Excel</strong> e selecione a planilha principal.
              Esta tela buscará a aba de Quantidade de Cursos por Eixo.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <StatusCard
            title="Total de Cursos"
            value={totalCursos}
            icon={<BookOpen size={22} />}
            active={cardFilter === "Todos"}
            onClick={() => setCardFilter("Todos")}
            subtitle="Todos os registros"
          />

          <StatusCard
            title="Cursos Novos"
            value={cursosNovos}
            icon={<Sparkles size={22} />}
            active={cardFilter === "Novos"}
            onClick={() => setCardFilter(cardFilter === "Novos" ? "Todos" : "Novos")}
            subtitle="Identificados na planilha"
          />

          <StatusCard
            title="Removidos"
            value={removidos}
            icon={<Trash2 size={22} />}
            active={cardFilter === "Removidos"}
            onClick={() =>
              setCardFilter(cardFilter === "Removidos" ? "Todos" : "Removidos")
            }
            subtitle="Inativos ou cancelados"
          />

          <StatusCard
            title="Turmas"
            value={totalTurmas}
            icon={<BarChart3 size={22} />}
            active={false}
            onClick={() => setCardFilter("Todos")}
            subtitle="Total informado"
          />

          <StatusCard
            title="Eixos"
            value={totalEixos}
            icon={<GitCompare size={22} />}
            active={false}
            onClick={() => setCardFilter("Todos")}
            subtitle={`${totalAlunos} alunos informados`}
          />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-500">Buscar</label>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por curso, eixo, código, instrutor..."
                  className="h-11 w-full rounded-xl border border-gray-200 py-0 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                />
              </div>
            </div>

            <FilterSelect label="Ano" value={filterAno} onChange={setFilterAno} options={anos} />
            <FilterSelect label="Eixo" value={filterEixo} onChange={setFilterEixo} options={eixos} />
            <FilterSelect
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={statusList}
            />
            <FilterSelect
              label="Tipo"
              value={filterNovo}
              onChange={setFilterNovo}
              options={["Todos", "Novos", "Existentes"]}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px]">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase">Eixo / Segmento</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Qtd. Cursos</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Curso</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">CH</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Turmas</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Alunos</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Instrutores</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Novo</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Observação</th>
                  <th className="px-4 py-3 text-center text-xs uppercase">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => {
                  const eixo = item.eixo || item.segmento || "";

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3 text-sm font-semibold text-[#003F7D]">
                        {safeText(eixo)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {safeText(item.quantidadeCursosSegmento)}
                      </td>

                      <td className="max-w-md px-4 py-3 text-sm font-medium text-gray-900">
                        {safeText(item.curso)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">{safeText(item.ch)}</td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {safeText(item.turmas)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {safeText(item.codigo)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {safeText(item.alunos)}
                      </td>

                      <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600">
                        {safeText(item.instrutores)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex max-w-[180px] rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClass(
                            item.status,
                          )}`}
                        >
                          {safeText(item.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {item.isNovo ? (
                          <span className="inline-flex rounded-full border border-blue-200 bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                            Novo
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      <td
                        className="max-w-xs truncate px-4 py-3 text-xs text-gray-500"
                        title={item.observacao}
                      >
                        {safeText(item.observacao)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelected(item)}
                            className="rounded-lg p-2 text-[#003F7D] hover:bg-blue-50"
                            title="Visualizar"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => openEdit(item)}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!filtered.length && (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-gray-500">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <ViewModal record={selected} onClose={() => setSelected(null)} />
        )}

        {(editing || form !== EMPTY_FORM) && (
          <EditModal
            editing={editing}
            form={form}
            setForm={setForm}
            onClose={closeEdit}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}

function StatusCard({
  title,
  value,
  icon,
  active,
  onClick,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md ${
        active ? "border-[#003F7D] ring-2 ring-[#003F7D]/20" : "border-gray-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-[#003F7D]">{value}</p>
          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8EFF7] text-[#003F7D]">
          {icon}
        </div>
      </div>
    </button>
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
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
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

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid grid-cols-[170px_1fr] gap-3 border-b border-gray-100 py-2 text-sm">
      <span className="font-semibold text-gray-500">{label}</span>
      <span className="text-gray-800">{safeText(value)}</span>
    </div>
  );
}

function ViewModal({
  record,
  onClose,
}: {
  record: CursoEixoRecord;
  onClose: () => void;
}) {
  const eixo = record.eixo || record.segmento || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 bg-[#003F7D] p-6 text-white">
          <div>
            <p className="text-xs uppercase opacity-80">{safeText(eixo)}</p>
            <h2 className="mt-1 text-xl font-bold">{safeText(record.curso)}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <div className="p-6">
          <DetailRow label="Ano" value={record.ano} />
          <DetailRow label="Eixo / Segmento" value={eixo} />
          <DetailRow label="Quantidade no Segmento" value={record.quantidadeCursosSegmento} />
          <DetailRow label="Curso" value={record.curso} />
          <DetailRow label="CH" value={record.ch} />
          <DetailRow label="Turmas" value={record.turmas} />
          <DetailRow label="Código" value={record.codigo} />
          <DetailRow label="Alunos" value={record.alunos} />
          <DetailRow label="Instrutores" value={record.instrutores} />
          <DetailRow label="Status" value={record.status} />
          <DetailRow label="Curso Novo" value={record.isNovo ? "Sim" : "Não"} />
          <DetailRow label="Observação" value={record.observacao} />
        </div>

        <div className="flex justify-end border-t border-gray-100 p-5">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditModal({
  editing,
  form,
  setForm,
  onClose,
  onSave,
}: {
  editing: CursoEixoRecord | null;
  form: FormState;
  setForm: (form: FormState) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const update = (field: keyof FormState, value: string | boolean) => {
    setForm({
      ...form,
      [field]: value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editing ? "Editar Curso por Eixo" : "Novo Registro"}
            </h2>
            <p className="text-sm text-gray-500">
              Registre os dados conforme a aba de Quantidade de Cursos por Eixo.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
          <Input label="Ano" value={form.ano} onChange={(value) => update("ano", value)} />
          <Input label="Eixo" value={form.eixo} onChange={(value) => update("eixo", value)} />
          <Input
            label="Quantidade no Segmento"
            value={form.quantidadeCursosSegmento}
            onChange={(value) => update("quantidadeCursosSegmento", value)}
          />

          <div className="md:col-span-3">
            <Input
              label="Curso"
              value={form.curso}
              onChange={(value) => update("curso", value)}
            />
          </div>

          <Input label="CH" value={form.ch} onChange={(value) => update("ch", value)} />
          <Input
            label="Turmas"
            value={form.turmas}
            onChange={(value) => update("turmas", value)}
          />
          <Input
            label="Código"
            value={form.codigo}
            onChange={(value) => update("codigo", value)}
          />

          <Input
            label="Alunos"
            value={form.alunos}
            onChange={(value) => update("alunos", value)}
          />
          <Input
            label="Instrutores"
            value={form.instrutores}
            onChange={(value) => update("instrutores", value)}
          />
          <Input
            label="Status"
            value={form.status}
            onChange={(value) => update("status", value)}
          />

          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isNovo}
              onChange={(event) => update("isNovo", event.target.checked)}
            />
            Marcar como curso novo
          </label>

          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-semibold text-gray-500">
              Observação
            </label>
            <textarea
              value={form.observacao}
              onChange={(event) => update("observacao", event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
              placeholder="Observações sobre alterações, inclusão, remoção ou comparação..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 p-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave} className="bg-[#003F7D] text-white hover:bg-[#00355C]">
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-500">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
      />
    </div>
  );
}