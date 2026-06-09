import { useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Download,
  Edit,
  FileSpreadsheet,
  Info,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  deleteAcao,
  getStoredAcoes,
  replaceAcoesExtensivas,
  resetAcoesExtensivasParaExemplos,
  saveAcao,
  updateAcao,
  type AcaoExtensivaRecord,
} from "../utils/store";
import { useConfirm } from "../components/ConfirmProvider";
import { ExportHint } from "../components/ExportHint";
import { ReadOnlyBanner } from "../components/ReadOnlyBanner";
import { usePermissions } from "../hooks/usePermissions";
import { exportToCsv, exportToExcel, exportToPdf } from "../utils/exportExcel";
import { importarAcoesExtensivasExcel } from "../utils/importExcel";
import { toastError, toastSuccess } from "../utils/toast";

type FormState = Omit<AcaoExtensivaRecord, "id">;

const EMPTY_FORM: FormState = {
  ano: "2025",
  titulo: "",
  eixo: "",
  unidade: "",
  cargaHoraria: "",
  data: "",
  processoSEI: "",
  status: "Ativa",
  observacao: "",
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

export function AcoesExtensivas() {
  const confirm = useConfirm();
  const { canWrite } = usePermissions();
  const inputAcoesRef = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<AcaoExtensivaRecord[]>(() => getStoredAcoes());
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todas");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AcaoExtensivaRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const refresh = () => {
    setRecords(getStoredAcoes());
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return records.filter((item) => {
      const text = [
        item.ano,
        item.titulo,
        item.eixo,
        item.unidade,
        item.cargaHoraria,
        item.data,
        item.processoSEI,
        item.status,
        item.observacao,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (q && !text.includes(q)) return false;
      if (filterAno !== "Todos" && item.ano !== filterAno) return false;
      if (filterEixo !== "Todos" && item.eixo !== filterEixo) return false;
      if (filterUnidade !== "Todas" && item.unidade !== filterUnidade) return false;
      if (filterStatus !== "Todos" && item.status !== filterStatus) return false;

      return true;
    });
  }, [records, search, filterAno, filterEixo, filterUnidade, filterStatus]);

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

  const dadosExportacao = filtered.map((item) => ({
    Ano: item.ano,
    Título: item.titulo,
    Eixo: item.eixo,
    Unidade: item.unidade,
    "Carga Horária": item.cargaHoraria,
    Data: item.data,
    "Processo SEI": item.processoSEI,
    Status: item.status,
    Observação: item.observacao,
  }));

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (record: AcaoExtensivaRecord) => {
    setEditing(record);
    setForm({
      ano: record.ano,
      titulo: record.titulo,
      eixo: record.eixo,
      unidade: record.unidade,
      cargaHoraria: record.cargaHoraria,
      data: record.data,
      processoSEI: record.processoSEI,
      status: record.status,
      observacao: record.observacao,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.titulo.trim() || !form.eixo.trim()) {
      toastError("Preencha o título e o eixo da ação extensiva.");
      return;
    }

    if (editing) {
      updateAcao(editing.id, form);
    } else {
      saveAcao(form);
    }

    refresh();
    closeModal();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      message: "Deseja excluir esta ação extensiva?",
      destructive: true,
      confirmLabel: "Excluir",
    });
    if (!ok) return;
    deleteAcao(id);
    refresh();
  };

  const handleImport = async (file?: File) => {
    if (!file) return;

    try {
      const rows = await importarAcoesExtensivasExcel(file);
      replaceAcoesExtensivas(rows);

      setSearch("");
      setFilterAno("Todos");
      setFilterEixo("Todos");
      setFilterUnidade("Todas");
      setFilterStatus("Todos");
      refresh();

      if (!rows.length) {
        toastError(
          "Nenhuma ação extensiva válida encontrada. Verifique a aba (Ações Extensivas) e a coluna Título.",
        );
        return;
      }

      toastSuccess(`${rows.length} ações importadas. Dados anteriores substituídos.`);
    } catch (error) {
      console.error(error);
      toastError("Erro ao importar a planilha de Ações Extensivas.");
    } finally {
      if (inputAcoesRef.current) inputAcoesRef.current.value = "";
    }
  };

  const handleRestaurarExemplos = async () => {
    const ok = await confirm({
      title: "Restaurar exemplos",
      message:
        "Restaurar os 3 registros de exemplo de Ações Extensivas?\n\nCadastros e importações atuais serão substituídos pelos exemplos padrão.",
      confirmLabel: "Restaurar exemplos",
    });
    if (!ok) return;

    resetAcoesExtensivasParaExemplos();
    refresh();
    setSearch("");
    setFilterAno("Todos");
    setFilterEixo("Todos");
    setFilterUnidade("Todas");
    setFilterStatus("Todos");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-[#003F7D] flex items-center justify-center">
                  <BookOpen className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Ações Extensivas</h1>
                  <p className="text-gray-500">
                    Cadastro e acompanhamento de ações extensivas vinculadas aos eixos
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {canWrite && (
                <>
                  <input
                    ref={inputAcoesRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => handleImport(e.target.files?.[0])}
                  />

                  <Button
                    variant="outline"
                    className="h-12 px-5 gap-2 text-gray-600"
                    onClick={() => inputAcoesRef.current?.click()}
                  >
                    <Upload size={18} />
                    Importar Excel
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToExcel(dadosExportacao, "Acoes_Extensivas")}
              >
                <FileSpreadsheet size={18} />
                Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToCsv(dadosExportacao, "Acoes_Extensivas")}
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
                    "Relatorio_Acoes_Extensivas",
                    "Relatório Ações Extensivas",
                    ["Ano", "Título", "Eixo", "Unidade", "Carga Horária", "Data", "Status"],
                  )
                }
              >
                PDF
              </Button>

              {canWrite && (
                <>
                  <Button
                    variant="outline"
                    className="h-12 px-5 gap-2 text-[#003F7D] border-[#003F7D]/20 hover:bg-[#E8EFF7]"
                    onClick={handleRestaurarExemplos}
                  >
                    <RotateCcw size={18} />
                    Restaurar exemplos
                  </Button>

                  <Button
                    onClick={openNew}
                    className="h-12 px-5 gap-2 bg-[#F57C00] hover:bg-[#E67300] text-white"
                  >
                    <Plus size={18} />
                    Nova Ação
                  </Button>
                </>
              )}
            </div>
            <div className="mt-3 w-full">
              <ExportHint filteredCount={filtered.length} totalCount={records.length} />
            </div>
          </div>
        </div>

        <ReadOnlyBanner />

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
          <div className="flex items-start gap-3">
            <Info size={20} className="mt-0.5 flex-shrink-0" />
            <div>
              <strong>Exemplos, importação e cadastro manual</strong>
              <p className="mt-1 text-sm">
                Enquanto não houver planilha oficial, o sistema exibe <strong>3 registros de
                exemplo</strong>. Substitua por <strong>Importar Excel</strong> (aba Ações
                Extensivas), pela planilha principal (Início) ou cadastro manual. Use{" "}
                <strong>Restaurar exemplos</strong> para voltar aos 3 registros padrão.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard label="Total de Ações" value={records.length} />
          <InfoCard
            label="Ativas"
            value={records.filter((r) => r.status.toLowerCase().includes("ativa")).length}
          />
          <InfoCard label="Eixos" value={new Set(records.map((r) => r.eixo).filter(Boolean)).size} />
          <InfoCard
            label="Unidades"
            value={new Set(records.map((r) => r.unidade).filter(Boolean)).size}
          />
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
                  placeholder="Buscar por título, eixo, unidade, SEI..."
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
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase">Título</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Eixo</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Unidade</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">CH</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">SEI</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Observação</th>
                  <th className="px-4 py-3 text-center text-xs uppercase">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-md">
                      {item.titulo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.eixo || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.unidade || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.cargaHoraria || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.data || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      <SeiLink sei={item.processoSEI} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        {item.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={item.observacao}>
                      {item.observacao || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {canWrite && (
                          <>
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
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {!filtered.length && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                      Nenhuma ação extensiva encontrada.
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
                    {editing ? "Editar Ação Extensiva" : "Nova Ação Extensiva"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Preencha os dados da ação extensiva.
                  </p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Ano" value={form.ano} onChange={(v) => setForm({ ...form, ano: v })} />
                <Input
                  label="Eixo"
                  value={form.eixo}
                  onChange={(v) => setForm({ ...form, eixo: v })}
                />
                <Input
                  label="Unidade"
                  value={form.unidade}
                  onChange={(v) => setForm({ ...form, unidade: v })}
                />
                <div className="md:col-span-3">
                  <Input
                    label="Título"
                    value={form.titulo}
                    onChange={(v) => setForm({ ...form, titulo: v })}
                  />
                </div>
                <Input
                  label="Carga Horária"
                  value={form.cargaHoraria}
                  onChange={(v) => setForm({ ...form, cargaHoraria: v })}
                />
                <Input
                  label="Data"
                  type="date"
                  value={form.data}
                  onChange={(v) => setForm({ ...form, data: v })}
                />
                <Input
                  label="Processo SEI"
                  value={form.processoSEI}
                  onChange={(v) => setForm({ ...form, processoSEI: v })}
                />
                <Input
                  label="Status"
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                />

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

function InfoCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-[#003F7D]">{value}</p>
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
      />
    </div>
  );
}