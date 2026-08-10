import { useMemo, useRef, useState } from "react";
import { Edit, Eye, Trash2 } from "lucide-react";
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
import { RecordDetailModal } from "../components/RecordDetailModal";
import { ReadOnlyBanner } from "../components/ReadOnlyBanner";
import {
  CrudFormShell,
  FilterSelect,
  PageContentSection,
  PageFiltersBar,
  PageHeader,
  PageLayout,
  PageTableCard,
  formatRegistrosCount,
} from "../components/layout";
import { usePermissions } from "../hooks/usePermissions";
import { importarAcoesExtensivasExcel } from "../utils/importExcel";
import { toastError, toastSuccess } from "../utils/toast";
import { matchesSearchQuery } from "../utils/textSearch";

type FormState = Omit<AcaoExtensivaRecord, "id">;
type Mode = "lista" | "novo" | "editar";

const EMPTY_FORM: FormState = {
  priorizacao: "Média",
  atribuido: "",
  eixo: "",
  processoSEI: "",
  tipo: "Ação Extensiva",
  assunto: "",
  objetivo: "",
  status: "CPED",
  ultimaAtualizacao: "",
  ano: "2026",
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

function priorizacaoClass(value: string) {
  const n = value.toLowerCase();
  if (n.includes("alta")) return "bg-red-100 text-red-700";
  if (n.includes("média") || n.includes("media")) return "bg-amber-100 text-amber-800";
  if (n.includes("baixa")) return "bg-slate-100 text-slate-700";
  return "bg-blue-100 text-blue-700";
}

export function AcoesExtensivas() {
  const confirm = useConfirm();
  const { canWrite } = usePermissions();
  const inputAcoesRef = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<AcaoExtensivaRecord[]>(() => getStoredAcoes());
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterPriorizacao, setFilterPriorizacao] = useState("Todas");
  const [filterAtribuido, setFilterAtribuido] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [mode, setMode] = useState<Mode>("lista");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<AcaoExtensivaRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const refresh = () => {
    setRecords(getStoredAcoes());
  };

  const filtered = useMemo(() => {
    return records.filter((item) => {
      if (
        !matchesSearchQuery(
          search,
          item.atribuido,
          item.eixo,
          item.processoSEI,
          item.assunto,
          item.objetivo,
          item.ultimaAtualizacao,
          item.ano,
        )
      ) {
        return false;
      }
      if (filterAno !== "Todos" && item.ano !== filterAno) return false;
      if (filterEixo !== "Todos" && item.eixo !== filterEixo) return false;
      if (filterPriorizacao !== "Todas" && item.priorizacao !== filterPriorizacao) return false;
      if (filterAtribuido !== "Todos" && item.atribuido !== filterAtribuido) return false;
      if (filterStatus !== "Todos" && item.status !== filterStatus) return false;

      return true;
    });
  }, [
    records,
    search,
    filterAno,
    filterEixo,
    filterPriorizacao,
    filterAtribuido,
    filterStatus,
  ]);

  const anos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.ano).filter(Boolean))).sort()],
    [records],
  );

  const eixos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.eixo).filter(Boolean))).sort()],
    [records],
  );

  const priorizacoes = useMemo(
    () => [
      "Todas",
      ...Array.from(new Set(records.map((r) => r.priorizacao).filter(Boolean))).sort(),
    ],
    [records],
  );

  const atribuidos = useMemo(
    () => [
      "Todos",
      ...Array.from(new Set(records.map((r) => r.atribuido).filter(Boolean))).sort(),
    ],
    [records],
  );

  const statusList = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.status).filter(Boolean))).sort()],
    [records],
  );

  const dadosExportacao = filtered.map((item) => ({
    Priorização: item.priorizacao,
    Atribuído: item.atribuido,
    Eixo: item.eixo,
    "Número do Processo SEI": item.processoSEI,
    Tipo: item.tipo,
    Assunto: item.assunto,
    Objetivo: item.objetivo,
    Status: item.status,
    "Última atualização": item.ultimaAtualizacao,
    Ano: item.ano,
  }));

  const openNew = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setMode("novo");
  };

  const openEdit = (record: AcaoExtensivaRecord) => {
    setForm({
      priorizacao: record.priorizacao,
      atribuido: record.atribuido,
      eixo: record.eixo,
      processoSEI: record.processoSEI,
      tipo: record.tipo,
      assunto: record.assunto,
      objetivo: record.objetivo,
      status: record.status,
      ultimaAtualizacao: record.ultimaAtualizacao,
      ano: record.ano,
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
    if (!form.assunto.trim() || !form.eixo.trim()) {
      toastError("Preencha o assunto e o eixo da ação extensiva.");
      return;
    }

    const payload: FormState = {
      ...form,
      ano:
        form.ano ||
        form.processoSEI.match(/^(\d{4})\./)?.[1] ||
        form.ultimaAtualizacao.match(/(\d{4})/)?.[1] ||
        "2026",
    };

    if (editingId) {
      updateAcao(editingId, payload);
    } else {
      saveAcao(payload);
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
      setFilterPriorizacao("Todas");
      setFilterAtribuido("Todos");
      setFilterStatus("Todos");
      refresh();

      if (!rows.length) {
        toastError(
          "Nenhuma ação extensiva válida encontrada. Verifique a aba Ações extensivas e as colunas Assunto / SEI.",
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
        "Restaurar os registros de exemplo de Ações Extensivas?\n\nCadastros e importações atuais serão substituídos pelos exemplos padrão.",
      confirmLabel: "Restaurar exemplos",
    });
    if (!ok) return;

    resetAcoesExtensivasParaExemplos();
    refresh();
    setSearch("");
    setFilterAno("Todos");
    setFilterEixo("Todos");
    setFilterPriorizacao("Todas");
    setFilterAtribuido("Todos");
    setFilterStatus("Todos");
  };

  void dadosExportacao;
  void handleImport;
  void handleRestaurarExemplos;

  if (mode !== "lista") {
    return (
      <div className="crud-page crud-page-form">
        <CrudFormShell
          title={mode === "novo" ? "Cadastrar Ação Extensiva" : "Editar Ação Extensiva"}
          subtitle="Campos alinhados à planilha Processos SEI — Atribuições (aba Ações extensivas)."
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
                  <label>Priorização</label>
                  <select
                    value={form.priorizacao}
                    onChange={(e) => setForm({ ...form, priorizacao: e.target.value })}
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Atribuído</label>
                  <input
                    value={form.atribuido}
                    onChange={(e) => setForm({ ...form, atribuido: e.target.value })}
                    placeholder="usuario.matricula"
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
                  <label>Número do Processo SEI</label>
                  <input
                    value={form.processoSEI}
                    onChange={(e) => setForm({ ...form, processoSEI: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <input
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <input
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Última atualização</label>
                  <input
                    value={form.ultimaAtualizacao}
                    onChange={(e) => setForm({ ...form, ultimaAtualizacao: e.target.value })}
                    placeholder="dd/mm/aaaa"
                  />
                </div>
                <div className="form-group">
                  <label>Ano</label>
                  <input
                    value={form.ano}
                    onChange={(e) => setForm({ ...form, ano: e.target.value })}
                  />
                </div>
                <div className="form-group full">
                  <label>
                    Assunto <span>*</span>
                  </label>
                  <input
                    value={form.assunto}
                    onChange={(e) => setForm({ ...form, assunto: e.target.value })}
                  />
                </div>
                <div className="form-group full">
                  <label>Objetivo</label>
                  <textarea
                    value={form.objetivo}
                    onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
                    rows={5}
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
        searchPlaceholder="Buscar por assunto, SEI, atribuído, eixo..."
      >
        <FilterSelect label="Ano" value={filterAno} onChange={setFilterAno} options={anos} />
        <FilterSelect label="Eixo" value={filterEixo} onChange={setFilterEixo} options={eixos} />
        <FilterSelect
          label="Priorização"
          value={filterPriorizacao}
          onChange={setFilterPriorizacao}
          options={priorizacoes}
        />
        <FilterSelect
          label="Atribuído"
          value={filterAtribuido}
          onChange={setFilterAtribuido}
          options={atribuidos}
        />
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={statusList}
        />
      </PageFiltersBar>

      <PageTableCard
        summary={formatRegistrosCount(filtered.length)}
      >
        <table className="crud-table" style={{ minWidth: "1600px" }}>
          <thead>
            <tr>
              <th>Priorização</th>
              <th>Atribuído</th>
              <th>Eixo</th>
              <th>Número do Processo SEI</th>
              <th>Tipo</th>
              <th>Assunto</th>
              <th>Objetivo</th>
              <th>Status</th>
              <th>Última atualização</th>
              <th className="text-center">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50/40">
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${priorizacaoClass(
                      item.priorizacao,
                    )}`}
                  >
                    {item.priorizacao || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{item.atribuido || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{item.eixo || "—"}</td>
                <td className="px-4 py-3 text-sm">
                  <SeiLink sei={item.processoSEI} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.tipo || "—"}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-md">
                  {item.assunto || "—"}
                </td>
                <td
                  className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate"
                  title={item.objetivo}
                >
                  {item.objetivo || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                    {item.status || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.ultimaAtualizacao || "—"}
                </td>
                <td className="acoes text-center">
                  <button
                    type="button"
                    onClick={() => setViewItem(item)}
                    className="btn-icon btn-view"
                    title="Ver detalhes"
                  >
                    <Eye size={16} />
                  </button>
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
                <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                  Nenhuma ação extensiva encontrada para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </PageTableCard>

      <input
        ref={inputAcoesRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => handleImport(e.target.files?.[0])}
      />

      {viewItem ? (
        <RecordDetailModal
          subtitle="Informações resumidas da ação extensiva selecionada."
          fields={[
            { label: "Processo SEI", value: viewItem.processoSEI },
            { label: "Priorização", value: viewItem.priorizacao },
            { label: "Atribuído", value: viewItem.atribuido },
            { label: "Eixo", value: viewItem.eixo },
            { label: "Tipo", value: viewItem.tipo },
            { label: "Status", value: viewItem.status },
            { label: "Última atualização", value: viewItem.ultimaAtualizacao, full: true },
            { label: "Assunto", value: viewItem.assunto, full: true },
            { label: "Objetivo", value: viewItem.objetivo, full: true, multiline: true },
          ]}
          canEdit={canWrite}
          onClose={() => setViewItem(null)}
          onEdit={() => {
            const item = viewItem;
            setViewItem(null);
            openEdit(item);
          }}
        />
      ) : null}
    </PageLayout>
  );
}
