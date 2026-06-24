import { useMemo, useRef, useState } from "react";
import {
  Edit,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
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

type FormState = Omit<EventoRecord, "id">;

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventoRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const refresh = () => {
    setRecords(getStoredEventos());
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return records.filter((item) => {
      const text = [
        item.ano,
        item.nome,
        item.data,
        item.unidade,
        item.eixo,
        item.quantidadePessoas,
        item.equipe,
        item.possuiAcaoExtensiva,
        item.acaoVinculada,
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

  const acoesExtensivas = useMemo(() => getStoredAcoes(), [records, modalOpen]);

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
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (record: EventoRecord) => {
    setEditing(record);
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
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.nome.trim() || !form.data.trim()) {
      toastError("Preencha o nome e a data do evento.");
      return;
    }

    if (editing) {
      updateEvento(editing.id, form);
    } else {
      saveEvento(form);
    }

    refresh();
    closeModal();
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

  return (
    <PageLayout>
      <PageHeader
        title="Eventos"
        description="Cadastro e acompanhamento de eventos por eixo, unidade e ação extensiva"
        filteredCount={filtered.length}
        totalCount={records.length}
        actions={
          canWrite ? (
            <Button
              onClick={openNew}
              className="gap-2 bg-[#F57C00] text-white hover:bg-[#E67300]"
            >
              <Plus size={16} />
              Novo Evento
            </Button>
          ) : null
        }
      />

      <PageContentSection className="mt-5 space-y-4">
        <ReadOnlyBanner />

        <PageWarningAlert title="Nenhuma planilha oficial de Eventos foi disponibilizada ainda.">
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
        summary={
          <>
            {filtered.length} evento{filtered.length !== 1 ? "s" : ""}
          </>
        }
      >
            <table className="w-full min-w-[1200px]">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase">Evento</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Unidade</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Eixo</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Qtd. Pessoas</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Equipe</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Ação Extensiva</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Observação</th>
                  <th className="px-4 py-3 text-center text-xs uppercase">Ações</th>
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
                    <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                      Nenhum evento encontrado para os filtros selecionados.
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
                    {editing ? "Editar Evento" : "Novo Evento"}
                  </h2>
                  <p className="text-sm text-gray-500">Preencha os dados do evento.</p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Ano" value={form.ano} onChange={(v) => setForm({ ...form, ano: v })} />
                <Input
                  label="Data"
                  type="date"
                  value={form.data}
                  onChange={(v) => setForm({ ...form, data: v })}
                />
                <Input
                  label="Unidade"
                  value={form.unidade}
                  onChange={(v) => setForm({ ...form, unidade: v })}
                />
                <div className="md:col-span-3">
                  <Input
                    label="Nome do Evento"
                    value={form.nome}
                    onChange={(v) => setForm({ ...form, nome: v })}
                  />
                </div>
                <Input label="Eixo" value={form.eixo} onChange={(v) => setForm({ ...form, eixo: v })} />
                <Input
                  label="Quantidade de Pessoas"
                  value={form.quantidadePessoas}
                  onChange={(v) => setForm({ ...form, quantidadePessoas: v })}
                />
                <Input
                  label="Status"
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                />
                <div className="md:col-span-3">
                  <Input
                    label="Equipe / Responsáveis"
                    value={form.equipe}
                    onChange={(v) => setForm({ ...form, equipe: v })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Possui Ação Extensiva?
                  </label>
                  <select
                    value={form.possuiAcaoExtensiva}
                    onChange={(e) => setForm({ ...form, possuiAcaoExtensiva: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    Ação Extensiva Vinculada
                  </label>
                  {form.possuiAcaoExtensiva === "Sim" && acoesExtensivas.length > 0 ? (
                    <select
                      value={form.acaoVinculada}
                      onChange={(e) => setForm({ ...form, acaoVinculada: e.target.value })}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                    >
                      <option value="">Selecione uma ação extensiva</option>
                      {acoesExtensivas.map((acao) => (
                        <option key={acao.id} value={acao.titulo}>
                          {acao.titulo} ({acao.eixo})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={form.acaoVinculada}
                      onChange={(e) => setForm({ ...form, acaoVinculada: e.target.value })}
                      placeholder="Informe ou cadastre ações extensivas antes"
                      className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                    />
                  )}
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