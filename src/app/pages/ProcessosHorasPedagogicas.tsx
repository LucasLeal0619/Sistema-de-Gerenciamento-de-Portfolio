import { useMemo, useRef, useState } from "react";
import {
  Download,
  Edit,
  FileSpreadsheet,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  deleteHora,
  getHoras,
  saveHora,
  updateHora,
  type HoraRecord,
} from "../utils/store";
import { importarHorasPedagogicasExcel } from "../utils/importExcel";
import { exportToCsv, exportToExcel, exportToPdf } from "../utils/exportExcel";

type FormState = Omit<HoraRecord, "id">;

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
};

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
      className="text-[#003F7D] hover:text-[#F57C00] underline underline-offset-2 font-medium"
    >
      {sei}
    </a>
  );
}

export function ProcessosHorasPedagogicas() {
  const [records, setRecords] = useState<HoraRecord[]>(() => getHoras());
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterSegmento, setFilterSegmento] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HoraRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const inputHorasRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setRecords(getHoras());
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return records.filter((item) => {
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
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (q && !text.includes(q)) return false;
      if (filterAno !== "Todos" && item.ano !== filterAno) return false;
      if (filterEixo !== "Todos" && item.eixo !== filterEixo) return false;
      if (filterSegmento !== "Todos" && item.segmento !== filterSegmento) return false;
      if (filterStatus !== "Todos" && item.status !== filterStatus) return false;

      return true;
    });
  }, [records, search, filterAno, filterEixo, filterSegmento, filterStatus]);

  const anos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.ano).filter(Boolean))).sort()],
    [records],
  );

  const eixos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.eixo).filter(Boolean))).sort()],
    [records],
  );

  const segmentos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.segmento).filter(Boolean))).sort()],
    [records],
  );

  const statusList = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.status).filter(Boolean))).sort()],
    [records],
  );

  const total = records.length;
  const pessoasChamadas = new Set(records.map((r) => r.nomePessoa).filter(Boolean)).size;
  const segmentosCount = new Set(records.map((r) => r.segmento).filter(Boolean)).size;
  const pendentes = records.filter((r) => !r.status.toLowerCase().includes("conclu")).length;

  const dadosExportacao = filtered.map((h) => ({
    Ano: h.ano,
    "Processo SEI": h.processoSEI,
    Eixo: h.eixo,
    Segmento: h.segmento,
    Nome: h.nomePessoa,
    Matrícula: h.matricula,
    Motivo: h.motivo,
    Observação: h.observacao,
    Status: h.status,
  }));

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (record: HoraRecord) => {
    setEditing(record);
    setForm({
      ano: record.ano,
      processoSEI: record.processoSEI,
      eixo: record.eixo,
      segmento: record.segmento,
      nomePessoa: record.nomePessoa,
      matricula: record.matricula,
      motivo: record.motivo,
      observacao: record.observacao,
      status: record.status,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.processoSEI.trim() || !form.segmento.trim()) {
      alert("Preencha o processo SEI e o segmento.");
      return;
    }

    if (editing) {
      updateHora(editing.id, form);
    } else {
      saveHora(form);
    }

    refresh();
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Deseja excluir este registro de horas pedagógicas?")) return;
    deleteHora(id);
    refresh();
  };

  const handleImportHoras = async (file?: File) => {
    if (!file) return;

    try {
      const rows = await importarHorasPedagogicasExcel(file);

      rows.forEach((r) => {
        saveHora({
          ano: r.ano,
          processoSEI: r.processoSEI,
          eixo: r.eixo,
          segmento: r.segmento,
          nomePessoa: r.nomePessoa,
          matricula: r.matricula,
          motivo: r.motivo,
          observacao: r.observacao,
          status: r.status,
        });
      });

      refresh();
      alert(`${rows.length} registros de horas pedagógicas importados com sucesso.`);
    } catch (error) {
      console.error(error);
      alert("Erro ao importar a planilha de Horas Pedagógicas.");
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
                  <GraduationCap className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Horas Pedagógicas</h1>
                  <p className="text-gray-500">
                    Solicitações de instrutores por segmento, pessoa, matrícula e motivo
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={inputHorasRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleImportHoras(e.target.files?.[0])}
              />

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => inputHorasRef.current?.click()}
              >
                <Upload size={18} />
                Importar Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToExcel(dadosExportacao, "Horas_Pedagogicas")}
              >
                <FileSpreadsheet size={18} />
                Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToCsv(dadosExportacao, "Horas_Pedagogicas")}
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
                    "Relatorio_Horas_Pedagogicas",
                    "Relatório Horas Pedagógicas",
                    ["Ano", "Processo SEI", "Eixo", "Segmento", "Nome", "Matrícula", "Motivo", "Status"],
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
                Nova Solicitação
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard icon={<GraduationCap size={22} />} label="Total" value={total} />
          <InfoCard icon={<UserRound size={22} />} label="Pessoas Chamadas" value={pessoasChamadas} />
          <InfoCard icon={<Search size={22} />} label="Segmentos" value={segmentosCount} />
          <InfoCard icon={<Download size={22} />} label="Pendentes" value={pendentes} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
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
                  placeholder="Buscar por SEI, segmento, pessoa, matrícula, motivo..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                />
              </div>
            </div>

            <FilterSelect label="Ano" value={filterAno} onChange={setFilterAno} options={anos} />
            <FilterSelect label="Eixo" value={filterEixo} onChange={setFilterEixo} options={eixos} />
            <FilterSelect
              label="Segmento"
              value={filterSegmento}
              onChange={setFilterSegmento}
              options={segmentos}
            />
            <FilterSelect
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={statusList}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase">SEI</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Eixo</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Segmento</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Matrícula</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Observação</th>
                  <th className="px-4 py-3 text-center text-xs uppercase">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 text-sm">
                      <SeiLink sei={item.processoSEI} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.eixo || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.segmento || "—"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.nomePessoa || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.matricula || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate" title={item.motivo}>
                      {item.motivo || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                        {item.status || "—"}
                      </span>
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
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                      Nenhum registro de horas pedagógicas encontrado.
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
                    {editing ? "Editar Solicitação" : "Nova Solicitação"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Registre nome, matrícula, motivo e observação da solicitação.
                  </p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Ano" value={form.ano} onChange={(v) => setForm({ ...form, ano: v })} />
                <Input
                  label="Processo SEI"
                  value={form.processoSEI}
                  onChange={(v) => setForm({ ...form, processoSEI: v })}
                />
                <Input label="Eixo" value={form.eixo} onChange={(v) => setForm({ ...form, eixo: v })} />
                <Input
                  label="Segmento"
                  value={form.segmento}
                  onChange={(v) => setForm({ ...form, segmento: v })}
                />
                <Input
                  label="Nome da pessoa chamada"
                  value={form.nomePessoa}
                  onChange={(v) => setForm({ ...form, nomePessoa: v })}
                />
                <Input
                  label="Matrícula"
                  value={form.matricula}
                  onChange={(v) => setForm({ ...form, matricula: v })}
                />
                <Input
                  label="Status"
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                />
                <div className="md:col-span-3">
                  <Input
                    label="Motivo da solicitação"
                    value={form.motivo}
                    onChange={(v) => setForm({ ...form, motivo: v })}
                  />
                </div>
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