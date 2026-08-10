import { useMemo, useRef, useState } from "react";
import { Edit, Eye, Trash2 } from "lucide-react";
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
import {
  deleteEvento,
  getStoredAcoes,
  getStoredEventos,
  replaceEventos,
  resetEventosParaExemplos,
  saveEvento,
  updateEvento,
  type EventoRecord,
} from "../utils/store";
import { importarEventosExcel } from "../utils/importExcel";
import { toastError, toastSuccess } from "../utils/toast";
import { matchesSearchQuery } from "../utils/textSearch";

type FormState = Omit<EventoRecord, "id">;
type Mode = "lista" | "novo" | "editar";

const EMPTY_FORM: FormState = {
  ano: "2025",
  nome: "",
  data: "",
  unidade: "",
  eixo: "",
  quantidadePessoas: "",
  equipe: "",
  possuiAcaoExtensiva: "Não",
  acaoVinculada: "",
  status: "Planejado",
  observacao: "",
};

export function Eventos() {
  const confirm = useConfirm();
  const { canWrite } = usePermissions();
  const inputEventosRef = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<EventoRecord[]>(() => getStoredEventos());
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todas");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterAcao, setFilterAcao] = useState("Todos");
  const [mode, setMode] = useState<Mode>("lista");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<EventoRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const refresh = () => {
    setRecords(getStoredEventos());
  };

  const filtered = useMemo(() => {
    return records.filter((item) => {
      if (
        !matchesSearchQuery(
          search,
          item.ano,
          item.nome,
          item.data,
          item.unidade,
          item.eixo,
          item.quantidadePessoas,
          item.equipe,
          item.acaoVinculada,
          item.observacao,
        )
      ) {
        return false;
      }
      if (filterAno !== "Todos" && item.ano !== filterAno) return false;
      if (filterEixo !== "Todos" && item.eixo !== filterEixo) return false;
      if (filterUnidade !== "Todas" && item.unidade !== filterUnidade) return false;
      if (filterStatus !== "Todos" && item.status !== filterStatus) return false;
      if (filterAcao !== "Todos" && item.possuiAcaoExtensiva !== filterAcao) return false;

      return true;
    });
  }, [records, search, filterAno, filterEixo, filterUnidade, filterStatus, filterAcao]);

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
    Evento: item.nome,
    Data: item.data,
    Unidade: item.unidade,
    Eixo: item.eixo,
    "Qtd. Pessoas": item.quantidadePessoas,
    Equipe: item.equipe,
    "Possui Ação Extensiva": item.possuiAcaoExtensiva,
    "Ação Vinculada": item.acaoVinculada,
    Status: item.status,
    Observação: item.observacao,
  }));

  const acoesExtensivas = useMemo(() => getStoredAcoes(), [records, mode]);

  const totalEventos = records.length;
  const totalPessoas = records.reduce((acc, item) => {
    const n = Number(String(item.quantidadePessoas ?? "").replace(/\D/g, ""));
    return acc + (Number.isNaN(n) ? 0 : n);
  }, 0);
  const comAcao = records.filter((r) => r.possuiAcaoExtensiva === "Sim").length;
  const totalEixos = new Set(records.map((r) => r.eixo).filter(Boolean)).size;

  const eventosPorEixo = useMemo(() => {
    const map = new Map<string, { eventos: number; pessoas: number }>();

    filtered.forEach((item) => {
      const eixo = item.eixo || "Não informado";
      const atual = map.get(eixo) || { eventos: 0, pessoas: 0 };
      const pessoas = Number(String(item.quantidadePessoas ?? "").replace(/\D/g, "")) || 0;

      map.set(eixo, {
        eventos: atual.eventos + 1,
        pessoas: atual.pessoas + pessoas,
      });
    });

    return Array.from(map.entries())
      .map(([eixo, dados]) => ({ eixo, ...dados }))
      .sort((a, b) => b.eventos - a.eventos);
  }, [filtered]);

  const openNew = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setMode("novo");
  };

  const openEdit = (record: EventoRecord) => {
    setForm({
      ano: record.ano,
      nome: record.nome,
      data: record.data,
      unidade: record.unidade,
      eixo: record.eixo,
      quantidadePessoas: record.quantidadePessoas,
      equipe: record.equipe,
      possuiAcaoExtensiva: record.possuiAcaoExtensiva,
      acaoVinculada: record.acaoVinculada,
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
    if (!form.nome.trim() || !form.data.trim()) {
      toastError("Preencha o nome e a data do evento.");
      return;
    }

    if (editingId) {
      updateEvento(editingId, form);
    } else {
      saveEvento(form);
    }

    refresh();
    voltarLista();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      message: "Deseja excluir este evento?",
      destructive: true,
      confirmLabel: "Excluir",
    });
    if (!ok) return;
    deleteEvento(id);
    refresh();
  };

  const handleImport = async (file?: File) => {
    if (!file) return;

    try {
      const rows = await importarEventosExcel(file);
      replaceEventos(rows);

      setSearch("");
      setFilterAno("Todos");
      setFilterEixo("Todos");
      setFilterUnidade("Todas");
      setFilterStatus("Todos");
      setFilterAcao("Todos");
      refresh();

      if (!rows.length) {
        toastError(
          "Nenhum evento válido encontrado. Verifique a aba (Eventos) e a coluna Nome/Evento.",
        );
        return;
      }

      toastSuccess(`${rows.length} eventos importados. Dados anteriores substituídos.`);
    } catch (error) {
      console.error(error);
      toastError("Erro ao importar a planilha de Eventos.");
    } finally {
      if (inputEventosRef.current) inputEventosRef.current.value = "";
    }
  };

  const handleRestaurarExemplos = async () => {
    const ok = await confirm({
      title: "Restaurar exemplos",
      message:
        "Restaurar os 3 registros de exemplo de Eventos?\n\nCadastros e importações atuais serão substituídos pelos exemplos padrão.",
      confirmLabel: "Restaurar exemplos",
    });
    if (!ok) return;

    resetEventosParaExemplos();
    refresh();
    setSearch("");
    setFilterAno("Todos");
    setFilterEixo("Todos");
    setFilterUnidade("Todas");
    setFilterStatus("Todos");
    setFilterAcao("Todos");
  };

  if (mode !== "lista") {
    return (
      <div className="crud-page crud-page-form">
        <CrudFormShell
          title={mode === "novo" ? "Cadastrar Evento" : "Editar Evento"}
          subtitle="Preencha os dados conforme o cadastro de eventos do protótipo."
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
              <h2>Dados do evento</h2>
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
                    Data <span>*</span>
                  </label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
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
                    Nome do Evento <span>*</span>
                  </label>
                  <input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Eixo</label>
                  <input
                    value={form.eixo}
                    onChange={(e) => setForm({ ...form, eixo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Quantidade de Pessoas</label>
                  <input
                    value={form.quantidadePessoas}
                    onChange={(e) => setForm({ ...form, quantidadePessoas: e.target.value })}
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
                  <label>Equipe / Responsáveis</label>
                  <input
                    value={form.equipe}
                    onChange={(e) => setForm({ ...form, equipe: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Possui Ação Extensiva?</label>
                  <select
                    value={form.possuiAcaoExtensiva}
                    onChange={(e) => setForm({ ...form, possuiAcaoExtensiva: e.target.value })}
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ação Extensiva Vinculada</label>
                  {form.possuiAcaoExtensiva === "Sim" && acoesExtensivas.length > 0 ? (
                    <select
                      value={form.acaoVinculada}
                      onChange={(e) => setForm({ ...form, acaoVinculada: e.target.value })}
                    >
                      <option value="">Selecione uma ação extensiva</option>
                      {acoesExtensivas.map((acao) => (
                        <option key={acao.id} value={acao.assunto}>
                          {acao.assunto} ({acao.eixo})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={form.acaoVinculada}
                      onChange={(e) => setForm({ ...form, acaoVinculada: e.target.value })}
                      placeholder="Informe ou cadastre ações extensivas antes"
                    />
                  )}
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
        title="Eventos"
        description="Cadastro e acompanhamento de eventos por eixo, unidade e ação extensiva"
        info="Nenhuma planilha oficial de Eventos foi disponibilizada ainda. Os cadastros seguem o modelo do protótipo."
        filteredCount={filtered.length}
        totalCount={records.length}
        actions={
          canWrite ? (
            <button type="button" onClick={openNew} className="btn-novo">
              <span className="btn-novo-icon">+</span> Novo Evento
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
        searchPlaceholder="Buscar por evento, eixo, unidade, equipe..."
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
        <FilterSelect
          label="Ação Extensiva"
          value={filterAcao}
          onChange={setFilterAcao}
          options={["Todos", "Sim", "Não"]}
        />
      </PageFiltersBar>

      <PageTableCard
        summary={formatRegistrosCount(filtered.length)}
      >
            <table className="crud-table" style={{ minWidth: "1200px" }}>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Data</th>
                  <th>Unidade</th>
                  <th>Eixo</th>
                  <th>Qtd. Pessoas</th>
                  <th>Equipe</th>
                  <th>Ação Extensiva</th>
                  <th>Status</th>
                  <th>Observação</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-md">
                      {item.nome}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.data || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.unidade || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.eixo || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.quantidadePessoas || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={item.equipe}>
                      {item.equipe || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.possuiAcaoExtensiva}
                      {item.acaoVinculada ? ` - ${item.acaoVinculada}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                        {item.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={item.observacao}>
                      {item.observacao || "—"}
                    </td>
                    <td className="acoes text-center">
                      <button
                        type="button"
                        onClick={() => setViewItem(item)}
                        className="btn-icon"
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
                      Nenhum evento encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
      </PageTableCard>

      {viewItem ? (
        <RecordDetailModal
          subtitle="Informações resumidas do evento selecionado."
          fields={[
            { label: "Evento", value: viewItem.nome, full: true },
            { label: "Ano", value: viewItem.ano },
            { label: "Data", value: viewItem.data },
            { label: "Unidade", value: viewItem.unidade },
            { label: "Eixo", value: viewItem.eixo },
            { label: "Qtd. Pessoas", value: viewItem.quantidadePessoas },
            { label: "Equipe", value: viewItem.equipe },
            { label: "Status", value: viewItem.status },
            { label: "Possui Ação Extensiva", value: viewItem.possuiAcaoExtensiva },
            {
              label: "Ação Extensiva Vinculada",
              value: viewItem.acaoVinculada,
              full: true,
            },
            { label: "Observação", value: viewItem.observacao, full: true, multiline: true },
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