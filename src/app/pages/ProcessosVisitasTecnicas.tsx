import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Download,
  Edit,
  FileSpreadsheet,
  MapPin,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  clearVisitas,
  deleteVisita,
  getVisitas,
  replaceVisitas,
  saveVisita,
  updateVisita,
  type VisitaRecord,
} from "../utils/store";
import { importarVisitasTecnicasExcel } from "../utils/importExcel";
import { exportToCsv, exportToExcel, exportToPdf } from "../utils/exportExcel";

type FormState = Omit<VisitaRecord, "id">;

const EMPTY_FORM: FormState = {
  ano: "2025",
  unidade: "",
  eixo: "",
  processoSEI: "",
  dataSolicitacao: "",
  dataVisitaPrevista: "",
  prazoLimite: "",
  status: "Solicitada",
  responsavel: "",
  relatorio: "",
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

function isForaPrazo(prazoLimite: string, status: string) {
  if (!prazoLimite) return false;
  if (status.toLowerCase().includes("conclu")) return false;

  const hoje = new Date();
  const prazo = new Date(prazoLimite);

  hoje.setHours(0, 0, 0, 0);
  prazo.setHours(0, 0, 0, 0);

  return hoje > prazo;
}

export function ProcessosVisitasTecnicas() {
  const [records, setRecords] = useState<VisitaRecord[]>(() => getVisitas());
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todas");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterPrazo, setFilterPrazo] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VisitaRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const inputVisitasRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setRecords(getVisitas());
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return records.filter((item) => {
      const foraPrazo = isForaPrazo(item.prazoLimite, item.status);

      const text = [
        item.ano,
        item.unidade,
        item.eixo,
        item.processoSEI,
        item.dataSolicitacao,
        item.dataVisitaPrevista,
        item.prazoLimite,
        item.status,
        item.responsavel,
        item.relatorio,
        item.observacao,
        foraPrazo ? "fora do prazo" : "dentro do prazo",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (q && !text.includes(q)) return false;
      if (filterAno !== "Todos" && item.ano !== filterAno) return false;
      if (filterUnidade !== "Todas" && item.unidade !== filterUnidade) return false;
      if (filterEixo !== "Todos" && item.eixo !== filterEixo) return false;
      if (filterStatus !== "Todos" && item.status !== filterStatus) return false;
      if (filterPrazo === "Fora do prazo" && !foraPrazo) return false;
      if (filterPrazo === "Dentro do prazo" && foraPrazo) return false;

      return true;
    });
  }, [records, search, filterAno, filterUnidade, filterEixo, filterStatus, filterPrazo]);

  const anos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.ano).filter(Boolean))).sort()],
    [records],
  );

  const unidades = useMemo(
    () => ["Todas", ...Array.from(new Set(records.map((r) => r.unidade).filter(Boolean))).sort()],
    [records],
  );

  const eixos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.eixo).filter(Boolean))).sort()],
    [records],
  );

  const statusList = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.status).filter(Boolean))).sort()],
    [records],
  );

  const total = records.length;
  const foraPrazoCount = records.filter((r) => isForaPrazo(r.prazoLimite, r.status)).length;
  const concluidas = records.filter((r) => r.status.toLowerCase().includes("conclu")).length;
  const pendentes = records.filter((r) => !r.status.toLowerCase().includes("conclu")).length;

  const dadosExportacao = filtered.map((v) => ({
    Ano: v.ano,
    Unidade: v.unidade,
    Eixo: v.eixo,
    "Processo SEI": v.processoSEI,
    "Data Solicitação": v.dataSolicitacao,
    "Data Prevista": v.dataVisitaPrevista,
    "Prazo Limite": v.prazoLimite,
    Status: v.status,
    Responsável: v.responsavel,
    Relatório: v.relatorio,
    Observação: v.observacao,
    "Fora do Prazo": isForaPrazo(v.prazoLimite, v.status) ? "Sim" : "Não",
  }));

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (record: VisitaRecord) => {
    setEditing(record);
    setForm({
      ano: record.ano,
      unidade: record.unidade,
      eixo: record.eixo,
      processoSEI: record.processoSEI,
      dataSolicitacao: record.dataSolicitacao,
      dataVisitaPrevista: record.dataVisitaPrevista,
      prazoLimite: record.prazoLimite,
      status: record.status,
      responsavel: record.responsavel,
      relatorio: record.relatorio,
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
    if (!form.unidade.trim() || !form.processoSEI.trim()) {
      alert("Preencha a unidade e o processo SEI.");
      return;
    }

    if (editing) {
      updateVisita(editing.id, form);
    } else {
      saveVisita(form);
    }

    refresh();
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Deseja excluir esta visita técnica?")) return;

    deleteVisita(id);
    refresh();
  };

  const handleClearVisitas = () => {
    if (
      !confirm(
        "Deseja limpar todos os registros de Visitas Técnicas?\n\nA tela ficará vazia até uma nova importação ou cadastro.",
      )
    ) {
      return;
    }

    clearVisitas();
    setRecords([]);
    setSearch("");
    setFilterAno("Todos");
    setFilterUnidade("Todas");
    setFilterEixo("Todos");
    setFilterStatus("Todos");
    setFilterPrazo("Todos");
  };

  const handleImportVisitas = async (file?: File) => {
    if (!file) return;

    try {
      const rows = await importarVisitasTecnicasExcel(file);

      replaceVisitas(
        rows.map((r) => ({
          ano: r.ano,
          unidade: r.unidade,
          eixo: r.eixo,
          processoSEI: r.processoSEI,
          dataSolicitacao: r.dataSolicitacao,
          dataVisitaPrevista: r.dataVisitaPrevista,
          prazoLimite: r.prazoLimite,
          status: r.status,
          responsavel: r.responsavel,
          relatorio: r.relatorio,
          observacao: r.observacao,
        })),
      );

      setSearch("");
      setFilterAno("Todos");
      setFilterUnidade("Todas");
      setFilterEixo("Todos");
      setFilterStatus("Todos");
      setFilterPrazo("Todos");

      refresh();

      alert(
        `${rows.length} visitas técnicas importadas com sucesso.\n\nOs dados anteriores foram substituídos para evitar duplicidade.`,
      );
    } catch (error) {
      console.error(error);
      alert("Erro ao importar a planilha de Visitas Técnicas.");
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
                  <MapPin className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Visitas Técnicas</h1>
                  <p className="text-gray-500">
                    Controle de processos, prazos e relatórios de visitas técnicas
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-3">
                Ao importar novamente a planilha, os registros anteriores são substituídos para
                evitar duplicidade. O prazo limite é calculado considerando 30 dias úteis a partir
                da solicitação.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={inputVisitasRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleImportVisitas(e.target.files?.[0])}
              />

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => inputVisitasRef.current?.click()}
              >
                <Upload size={18} />
                Importar Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToExcel(dadosExportacao, "Visitas_Tecnicas")}
              >
                <FileSpreadsheet size={18} />
                Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToCsv(dadosExportacao, "Visitas_Tecnicas")}
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
                    "Relatorio_Visitas_Tecnicas",
                    "Relatório Visitas Técnicas",
                    ["Ano", "Unidade", "Eixo", "Processo SEI", "Status", "Prazo Limite", "Observação"],
                  )
                }
              >
                PDF
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleClearVisitas}
              >
                <Trash2 size={18} />
                Limpar
              </Button>

              <Button
                onClick={openNew}
                className="h-12 px-5 gap-2 bg-[#F57C00] hover:bg-[#E67300] text-white"
              >
                <Plus size={18} />
                Nova Visita
              </Button>
            </div>
          </div>
        </div>

        {records.length === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-orange-800">
            <strong>Nenhuma visita técnica importada ainda.</strong>
            <p className="text-sm mt-1">
              Clique em <strong>Importar Excel</strong> e selecione a planilha principal do
              portfólio. Esta tela lerá apenas a aba de processos de visitas técnicas.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard icon={<CalendarDays size={22} />} label="Total" value={total} />
          <InfoCard icon={<MapPin size={22} />} label="Pendentes" value={pendentes} />
          <InfoCard icon={<AlertTriangle size={22} />} label="Fora do Prazo" value={foraPrazoCount} />
          <InfoCard icon={<Download size={22} />} label="Concluídas" value={concluidas} />
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
                  placeholder="Buscar por unidade, eixo, SEI, responsável..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                />
              </div>
            </div>

            <FilterSelect label="Ano" value={filterAno} onChange={setFilterAno} options={anos} />
            <FilterSelect
              label="Unidade"
              value={filterUnidade}
              onChange={setFilterUnidade}
              options={unidades}
            />
            <FilterSelect label="Eixo" value={filterEixo} onChange={setFilterEixo} options={eixos} />
            <FilterSelect
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={statusList}
            />
            <FilterSelect
              label="Prazo"
              value={filterPrazo}
              onChange={setFilterPrazo}
              options={["Todos", "Dentro do prazo", "Fora do prazo"]}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px]">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase">Unidade</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Eixo</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">SEI</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Solicitação</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Prevista</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Prazo</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Responsável</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Relatório</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Observação</th>
                  <th className="px-4 py-3 text-center text-xs uppercase">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => {
                  const foraPrazo = isForaPrazo(item.prazoLimite, item.status);

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3 text-sm text-gray-700">{item.unidade}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.eixo || "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        <SeiLink sei={item.processoSEI} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.dataSolicitacao || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.dataVisitaPrevista || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={
                            foraPrazo
                              ? "px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold"
                              : "text-gray-600"
                          }
                        >
                          {item.prazoLimite || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          {foraPrazo ? "Fora do prazo" : item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.responsavel || "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.relatorio || "—"}</td>
                      <td
                        className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate"
                        title={item.observacao}
                      >
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
                  );
                })}

                {!filtered.length && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
                      Nenhuma visita técnica encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editing ? "Editar Visita Técnica" : "Nova Visita Técnica"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Registre dados, prazos e relatório da visita técnica.
                  </p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Ano" value={form.ano} onChange={(v) => setForm({ ...form, ano: v })} />
                <Input
                  label="Unidade"
                  value={form.unidade}
                  onChange={(v) => setForm({ ...form, unidade: v })}
                />
                <Input label="Eixo" value={form.eixo} onChange={(v) => setForm({ ...form, eixo: v })} />
                <Input
                  label="Processo SEI"
                  value={form.processoSEI}
                  onChange={(v) => setForm({ ...form, processoSEI: v })}
                />
                <Input
                  label="Data Solicitação"
                  value={form.dataSolicitacao}
                  onChange={(v) => setForm({ ...form, dataSolicitacao: v })}
                  type="date"
                />
                <Input
                  label="Data Prevista"
                  value={form.dataVisitaPrevista}
                  onChange={(v) => setForm({ ...form, dataVisitaPrevista: v })}
                  type="date"
                />
                <Input
                  label="Prazo Limite"
                  value={form.prazoLimite}
                  onChange={(v) => setForm({ ...form, prazoLimite: v })}
                  type="date"
                />
                <Input
                  label="Status"
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                />
                <Input
                  label="Responsável"
                  value={form.responsavel}
                  onChange={(v) => setForm({ ...form, responsavel: v })}
                />
                <div className="md:col-span-3">
                  <Input
                    label="Relatório da visita"
                    value={form.relatorio}
                    onChange={(v) => setForm({ ...form, relatorio: v })}
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