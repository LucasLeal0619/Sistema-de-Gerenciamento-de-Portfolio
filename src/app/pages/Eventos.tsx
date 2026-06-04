import { useMemo, useState } from "react";
import {
  CalendarDays,
  Download,
  Edit,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  deleteEvento,
  getStoredEventos,
  saveEvento,
  updateEvento,
  type EventoRecord,
} from "../utils/store";
import { exportToCsv, exportToExcel, exportToPdf } from "../utils/exportExcel";

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

  const totalEventos = records.length;
  const totalPessoas = records.reduce((acc, item) => {
    const n = Number(String(item.quantidadePessoas ?? "").replace(/\D/g, ""));
    return acc + (Number.isNaN(n) ? 0 : n);
  }, 0);
  const comAcao = records.filter((r) => r.possuiAcaoExtensiva === "Sim").length;
  const totalEixos = new Set(records.map((r) => r.eixo).filter(Boolean)).size;

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
      alert("Preencha o nome e a data do evento.");
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

  const handleDelete = (id: string) => {
    if (!confirm("Deseja excluir este evento?")) return;
    deleteEvento(id);
    refresh();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-[#003F7D] flex items-center justify-center">
                  <CalendarDays className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
                  <p className="text-gray-500">
                    Cadastro e acompanhamento de eventos por eixo, unidade e ação extensiva
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Esta tela não possui aba própria na planilha atual. Foram mantidas exportações e
                relatório dos eventos cadastrados no protótipo.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToExcel(dadosExportacao, "Eventos")}
              >
                <FileSpreadsheet size={18} />
                Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToCsv(dadosExportacao, "Eventos")}
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
                    "Relatorio_Eventos",
                    "Relatório de Eventos",
                    ["Ano", "Evento", "Data", "Unidade", "Eixo", "Qtd. Pessoas", "Status"],
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
                Novo Evento
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard label="Total de Eventos" value={totalEventos} />
          <InfoCard label="Pessoas Envolvidas" value={totalPessoas} />
          <InfoCard label="Com Ação Extensiva" value={comAcao} />
          <InfoCard label="Eixos" value={totalEixos} />
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
                  placeholder="Buscar por evento, eixo, unidade, equipe..."
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
              label="Ação Extensiva"
              value={filterAcao}
              onChange={setFilterAcao}
              options={["Todos", "Sim", "Não"]}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
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
                    <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                      Nenhum evento encontrado.
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
                  <Input
                    label="Ação Extensiva Vinculada"
                    value={form.acaoVinculada}
                    onChange={(v) => setForm({ ...form, acaoVinculada: v })}
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