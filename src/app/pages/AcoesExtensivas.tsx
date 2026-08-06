import { useMemo, useRef, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
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
  CrudFormShell,
  FilterSelect,
  PageContentSection,
  PageFiltersBar,
  PageHeader,
  PageLayout,
  PageTableCard,
} from "../components/layout";
import { usePermissions } from "../hooks/usePermissions";
import { importarAcoesExtensivasExcel } from "../utils/importExcel";
import { toastError, toastSuccess } from "../utils/toast";

type FormState = Omit<AcaoExtensivaRecord, "id">;
type Mode = "lista" | "novo" | "editar";

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
  const [mode, setMode] = useState<Mode>("lista");
  const [editingId, setEditingId] = useState<string | null>(null);
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
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setMode("novo");
  };

  const openEdit = (record: AcaoExtensivaRecord) => {
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
    setEditingId(record.id);
    setMode("editar");
  };

  const voltarLista = () => {
    setMode("lista");
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSave = () => {
    if (!form.titulo.trim() || !form.eixo.trim()) {
      toastError("Preencha o título e o eixo da ação extensiva.");
      return;
    }

    if (editingId) {
      updateAcao(editingId, form);
    } else {
      saveAcao(form);
    }

    refresh();
    voltarLista();
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

  if (mode !== "lista") {
    return (
      <div className="crud-page crud-page-form">
        <CrudFormShell
          title={mode === "novo" ? "Cadastrar Ação Extensiva" : "Editar Ação Extensiva"}
          subtitle="Preencha os dados no formato da planilha de atribuições SEI."
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
              <h2>Dados do processo</h2>
              <div className="form-grid form-grid-page">
                <div className="form-group">
                  <label>Ano</label>
                  <input
                    value={form.ano}
                    onChange={(e) => setForm({ ...form, ano: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>
                    Eixo <span>*</span>
                  </label>
                  <input
                    value={form.eixo}
                    onChange={(e) => setForm({ ...form, eixo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Unidade</label>
                  <input
                    value={form.unidade}
                    onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                  />
                </div>
                <div className="form-group full">
                  <label>
                    Título <span>*</span>
                  </label>
                  <input
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Carga Horária</label>
                  <input
                    value={form.cargaHoraria}
                    onChange={(e) => setForm({ ...form, cargaHoraria: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Processo SEI</label>
                  <input
                    value={form.processoSEI}
                    onChange={(e) => setForm({ ...form, processoSEI: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <input
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  />
                </div>
                <div className="form-group full">
                  <label>Observação</label>
                  <textarea
                    value={form.observacao}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
            </section>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={voltarLista}>
                Cancelar
              </button>
              <button type="submit" className="btn-salvar">
                {mode === "editar" ? "Salvar Alterações" : "Cadastrar"}
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
        title="Ações Extensivas"
        description="Processos SEI de ações extensivas — atribuições CPED"
        info="Consulte e filtre as ações extensivas por SEI, atribuído, eixo, priorização e status — conforme a planilha de atribuições."
        filteredCount={filtered.length}
        totalCount={records.length}
        actions={
          canWrite ? (
            <button type="button" onClick={openNew} className="btn-novo">
              <span className="btn-novo-icon">+</span> Nova Ação
            </button>
          ) : null
        }
      />

      <PageContentSection className="mt-5 space-y-4">
        <ReadOnlyBanner />
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
            <table className="crud-table" style={{ minWidth: "1300px" }}>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Eixo</th>
                  <th>Unidade</th>
                  <th>CH</th>
                  <th>Data</th>
                  <th>SEI</th>
                  <th>Status</th>
                  <th>Observação</th>
                  <th className="text-center">Ações</th>
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
                    <td className="acoes text-center">
                      {canWrite && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="btn-icon btn-edit"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="btn-icon btn-delete"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
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
    </PageLayout>
  );
}