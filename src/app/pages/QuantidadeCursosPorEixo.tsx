import { useMemo, useRef, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Download,
  Edit,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  deleteCursoEixo,
  getCursosEixo,
  saveCursoEixo,
  updateCursoEixo,
  type CursoEixoRecord,
} from "../utils/store";
import { importarCursosEixoExcel } from "../utils/importExcel";
import { exportToCsv, exportToExcel, exportToPdf } from "../utils/exportExcel";

type FormState = Omit<CursoEixoRecord, "id">;

const EMPTY_FORM: FormState = {
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

export function QuantidadeCursosPorEixo() {
  const [records, setRecords] = useState<CursoEixoRecord[]>(() => getCursosEixo());
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todas");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterNovo, setFilterNovo] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CursoEixoRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const inputCursosEixoRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setRecords(getCursosEixo());
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return records.filter((item) => {
      const text = [
        item.ano,
        item.eixo,
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
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (q && !text.includes(q)) return false;
      if (filterAno !== "Todos" && item.ano !== filterAno) return false;
      if (filterEixo !== "Todos" && item.eixo !== filterEixo) return false;
      if (filterUnidade !== "Todas" && item.unidade !== filterUnidade) return false;
      if (filterStatus !== "Todos" && item.status !== filterStatus) return false;
      if (filterNovo === "Novos" && !item.isNovo) return false;
      if (filterNovo === "Não novos" && item.isNovo) return false;

      return true;
    });
  }, [records, search, filterAno, filterEixo, filterUnidade, filterStatus, filterNovo]);

  const anos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.ano).filter(Boolean))).sort()],
    [records],
  );

  const eixos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.eixo).filter(Boolean))).sort()],
    [records],
  );

  const unidades = useMemo(
    () => ["Todas", ...Array.from(new Set(records.map((r) => r.unidade).filter(Boolean))).sort()],
    [records],
  );

  const statusList = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.status).filter(Boolean))).sort()],
    [records],
  );

  const totalCursos = records.length;
  const totalEixos = new Set(records.map((r) => r.eixo).filter(Boolean)).size;
  const totalTurmas = records.reduce((acc, item) => {
    const n = Number(String(item.turmas ?? "").replace(/\D/g, ""));
    return acc + (Number.isNaN(n) ? 0 : n);
  }, 0);
  const totalNovos = records.filter((r) => r.isNovo).length;

  const dadosExportacao = filtered.map((r) => ({
    Ano: r.ano,
    Eixo: r.eixo,
    Unidade: r.unidade,
    Curso: r.curso,
    CH: r.ch,
    Status: r.status,
    Observação: r.observacao,
    "Qtd. Cursos Segmento": r.quantidadeCursosSegmento ?? "",
    Turmas: r.turmas ?? "",
    Código: r.codigo ?? "",
    Alunos: r.alunos ?? "",
    Instrutores: r.instrutores ?? "",
    Novo: r.isNovo ? "Sim" : "Não",
  }));

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (record: CursoEixoRecord) => {
    setEditing(record);
    setForm({
      ano: record.ano,
      eixo: record.eixo,
      unidade: record.unidade,
      curso: record.curso,
      ch: record.ch,
      status: record.status,
      observacao: record.observacao,
      quantidadeCursosSegmento: record.quantidadeCursosSegmento ?? "",
      turmas: record.turmas ?? "",
      codigo: record.codigo ?? "",
      alunos: record.alunos ?? "",
      instrutores: record.instrutores ?? "",
      isNovo: Boolean(record.isNovo),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.eixo.trim() || !form.curso.trim()) {
      alert("Preencha o eixo e o nome do curso.");
      return;
    }

    if (editing) {
      updateCursoEixo(editing.id, form);
    } else {
      saveCursoEixo(form);
    }

    refresh();
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Deseja excluir este curso por eixo?")) return;
    deleteCursoEixo(id);
    refresh();
  };

  const handleImportCursosEixo = async (file?: File) => {
    if (!file) return;

    try {
      const rows = await importarCursosEixoExcel(file);

      rows.forEach((r) => {
        saveCursoEixo({
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
        });
      });

      refresh();
      alert(`${rows.length} cursos por eixo importados com sucesso.`);
    } catch (error) {
      console.error(error);
      alert("Erro ao importar a planilha de Quantidade de Cursos por Eixo.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-[#003F7D] flex items-center justify-center">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Quantidade de Cursos por Eixo
                  </h1>
                  <p className="text-gray-500">
                    Relação de cursos por eixo tecnológico e comparação de cursos novos
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={inputCursosEixoRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleImportCursosEixo(e.target.files?.[0])}
              />

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => inputCursosEixoRef.current?.click()}
              >
                <Upload size={18} />
                Importar Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToExcel(dadosExportacao, "Quantidade_Cursos_por_Eixo")}
              >
                <FileSpreadsheet size={18} />
                Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToCsv(dadosExportacao, "Quantidade_Cursos_por_Eixo")}
              >
                <Download size={18} />
                CSV
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() =>
                  exportToPdf(
                    dadosExportacao,
                    "Relatorio_Quantidade_Cursos_por_Eixo",
                    "Relatório Quantidade de Cursos por Eixo",
                    ["Eixo", "Curso", "CH", "Turmas", "Código", "Alunos", "Instrutores", "Novo"],
                  )
                }
              >
                PDF
              </Button>

              <Button
                onClick={openNew}
                className="h-12 px-5 gap-2 bg-[#F57C00] hover:bg-[#E67300] text-white"
              >
                <Plus size={18} />
                Novo Curso
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard icon={<BookOpen size={22} />} label="Total de Cursos" value={totalCursos} />
          <InfoCard icon={<BarChart3 size={22} />} label="Eixos" value={totalEixos} />
          <InfoCard icon={<Users size={22} />} label="Turmas" value={totalTurmas} />
          <InfoCard icon={<Plus size={22} />} label="Cursos Novos" value={totalNovos} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Buscar</label>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por curso, eixo, código, instrutor..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                />
              </div>
            </div>

            <FilterSelect label="Ano" value={filterAno} onChange={setFilterAno} options={anos} />
            <FilterSelect label="Eixo" value={filterEixo} onChange={setFilterEixo} options={eixos} />
            <FilterSelect
              label="Unidade"
              value={filterUnidade}
              onChange={setFilterUnidade}
              options={unidades}
            />
            <FilterSelect
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={statusList}
            />
            <FilterSelect
              label="Novo?"
              value={filterNovo}
              onChange={setFilterNovo}
              options={["Todos", "Novos", "Não novos"]}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase">Eixo</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Curso</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">CH</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Turmas</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Alunos</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Instrutores</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Qtd. Segmento</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Novo?</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Observação</th>
                  <th className="px-4 py-3 text-center text-xs uppercase">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 text-sm text-gray-700">{item.eixo || "—"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-md">
                      {item.curso}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.ch || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.turmas || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.codigo || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.alunos || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.instrutores || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.quantidadeCursosSegmento || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        {item.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.isNovo ? (
                        <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                          Novo
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={item.observacao}>
                      {item.observacao || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!filtered.length && (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-gray-500">
                      Nenhum curso encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editing ? "Editar Curso por Eixo" : "Novo Curso por Eixo"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Preencha os dados do curso por eixo tecnológico.
                  </p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Ano" value={form.ano} onChange={(v) => setForm({ ...form, ano: v })} />
                <Input label="Eixo" value={form.eixo} onChange={(v) => setForm({ ...form, eixo: v })} />
                <Input
                  label="Unidade"
                  value={form.unidade}
                  onChange={(v) => setForm({ ...form, unidade: v })}
                />
                <div className="md:col-span-3">
                  <Input
                    label="Curso"
                    value={form.curso}
                    onChange={(v) => setForm({ ...form, curso: v })}
                  />
                </div>
                <Input label="CH" value={form.ch} onChange={(v) => setForm({ ...form, ch: v })} />
                <Input
                  label="Turmas"
                  value={form.turmas ?? ""}
                  onChange={(v) => setForm({ ...form, turmas: v })}
                />
                <Input
                  label="Código"
                  value={form.codigo ?? ""}
                  onChange={(v) => setForm({ ...form, codigo: v })}
                />
                <Input
                  label="Alunos"
                  value={form.alunos ?? ""}
                  onChange={(v) => setForm({ ...form, alunos: v })}
                />
                <Input
                  label="Instrutores"
                  value={form.instrutores ?? ""}
                  onChange={(v) => setForm({ ...form, instrutores: v })}
                />
                <Input
                  label="Quantidade no Segmento"
                  value={form.quantidadeCursosSegmento ?? ""}
                  onChange={(v) => setForm({ ...form, quantidadeCursosSegmento: v })}
                />
                <Input
                  label="Status"
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                />

                <label className="flex items-center gap-2 mt-7 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={Boolean(form.isNovo)}
                    onChange={(e) => setForm({ ...form, isNovo: e.target.checked })}
                  />
                  Curso novo
                </label>

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Observação</label>
                  <textarea
                    value={form.observacao}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
                <Button variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-[#003F7D] hover:bg-[#00355C] text-white">
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-[#003F7D]">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#E8EFF7] text-[#003F7D] flex items-center justify-center">
          {icon}
        </div>
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
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
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
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
      />
    </div>
  );
}