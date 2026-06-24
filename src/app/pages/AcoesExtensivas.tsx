import { useMemo, useRef, useState } from "react";
import {
  Edit,
  Plus,
  Trash2,
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
import { ReadOnlyBanner } from "../components/ReadOnlyBanner";
import {
  FilterSelect,
  PageContentSection,
  PageFiltersBar,
  PageHeader,
  PageLayout,
  ImportacoesLink,
  PageWarningAlert,
  PageTableCard,
} from "../components/layout";
import { usePermissions } from "../hooks/usePermissions";
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
    <PageLayout>
      <PageHeader
        title="Ações Extensivas"
        description="Cadastro e acompanhamento de ações extensivas vinculadas aos eixos"
        filteredCount={filtered.length}
        totalCount={records.length}
        actions={
          canWrite ? (
            <Button
              onClick={openNew}
              className="gap-2 bg-[#F57C00] text-white hover:bg-[#E67300]"
            >
              <Plus size={16} />
              Nova Ação
            </Button>
          ) : null
        }
      />

      <PageContentSection className="mt-5 space-y-4">
        <ReadOnlyBanner />

        <PageWarningAlert title="Nenhuma planilha oficial de Ações Extensivas foi disponibilizada ainda.">
          <p>
            O sistema exibe registros de exemplo para demonstração da funcionalidade. Quando uma
            planilha oficial estiver disponível, os dados poderão ser importados em{" "}
            <ImportacoesLink variant="yellow" />.
          </p>
        </PageWarningAlert>
      </PageContentSection>

      <PageFiltersBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por título, eixo, unidade, SEI..."
      >
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
      </PageFiltersBar>

      <PageTableCard
        summary={
          <>
            {filtered.length} ação{filtered.length !== 1 ? "ões" : ""}
          </>
        }
      >
            <table className="w-full min-w-[1300px] text-sm">
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
                      Nenhuma ação extensiva encontrada para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
      </PageTableCard>

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
    </PageLayout>
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