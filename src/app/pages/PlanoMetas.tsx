import { useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  Edit,
  FileSpreadsheet,
  Info,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  deletePlanoMeta,
  getPlanoMetas,
  savePlanoMeta,
  updatePlanoMeta,
  type PlanoMetaRecord,
} from "../utils/store";
import { importarPlanoMetasExcel } from "../utils/importExcel";
import { exportToCsv, exportToExcel, exportToPdf } from "../utils/exportExcel";

type FormState = Omit<PlanoMetaRecord, "id">;

const EMPTY_META: FormState = {
  segmento: "",
  categoria: "QUALIFICAÇÃO",
  tipo: "",
  numeroSEI: "",
  codigoSIG: "",
  mesEntrega: "",
  status: "EM ANÁLISE",
  origem: "CPED",
  observacao: "",
  responsavel: "",
  statusFinal: "",
};

function normalizarStatus(status: string) {
  return String(status ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function statusBadgeClass(status: string) {
  const normalized = normalizarStatus(status);

  if (normalized.includes("PUBLICADO")) {
    return "bg-green-100 text-green-700 border-green-200";
  }

  if (normalized.includes("ANALISE")) {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }

  if (normalized.includes("PENDENTE") || normalized.includes("CPFD")) {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-gray-100 text-gray-700 border-gray-200";
}

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

export function PlanoMetas() {
  const [records, setRecords] = useState<PlanoMetaRecord[]>(() => getPlanoMetas());
  const [search, setSearch] = useState("");
  const [filterSegmento, setFilterSegmento] = useState("Todos");
  const [filterCategoria, setFilterCategoria] = useState("Todas");
  const [filterMes, setFilterMes] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [cardStatus, setCardStatus] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PlanoMetaRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_META);

  const inputPlanoRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setRecords(getPlanoMetas());
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return records.filter((item) => {
      const text = [
        item.segmento,
        item.categoria,
        item.tipo,
        item.numeroSEI,
        item.codigoSIG,
        item.mesEntrega,
        item.status,
        item.origem,
        item.observacao,
        item.responsavel,
        item.statusFinal,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (q && !text.includes(q)) return false;
      if (filterSegmento !== "Todos" && item.segmento !== filterSegmento) return false;
      if (filterCategoria !== "Todas" && item.categoria !== filterCategoria) return false;
      if (filterMes !== "Todos" && item.mesEntrega !== filterMes) return false;
      if (filterStatus !== "Todos" && item.status !== filterStatus) return false;

      if (cardStatus !== "Todos") {
        const normalized = normalizarStatus(item.status);

        if (cardStatus === "PUBLICADO" && !normalized.includes("PUBLICADO")) return false;
        if (cardStatus === "EM ANÁLISE" && !normalized.includes("ANALISE")) return false;
        if (
          cardStatus === "CPFD / PENDENTES" &&
          !normalized.includes("PENDENTE") &&
          !normalized.includes("CPFD")
        ) {
          return false;
        }
      }

      return true;
    });
  }, [records, search, filterSegmento, filterCategoria, filterMes, filterStatus, cardStatus]);

  const segmentos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.segmento).filter(Boolean))).sort()],
    [records],
  );

  const categorias = useMemo(
    () => ["Todas", ...Array.from(new Set(records.map((r) => r.categoria).filter(Boolean))).sort()],
    [records],
  );

  const meses = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.mesEntrega).filter(Boolean))).sort()],
    [records],
  );

  const statusList = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.status).filter(Boolean))).sort()],
    [records],
  );

  const totalCursos = records.length;
  const publicados = records.filter((r) => normalizarStatus(r.status).includes("PUBLICADO")).length;
  const emAnalise = records.filter((r) => normalizarStatus(r.status).includes("ANALISE")).length;
  const pendentes = records.filter((r) => {
    const status = normalizarStatus(r.status);
    return status.includes("PENDENTE") || status.includes("CPFD");
  }).length;

  const dadosExportacao = filtered.map((item) => ({
    Responsável: item.responsavel ?? "",
    Segmento: item.segmento,
    Categoria: item.categoria,
    Curso: item.tipo,
    "Número SEI": item.numeroSEI,
    "Código SIG": item.codigoSIG,
    "Mês Entrega": item.mesEntrega,
    Status: item.status,
    Origem: item.origem,
    Observação: item.observacao,
    "Status Final": item.statusFinal ?? "",
  }));

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_META);
    setModalOpen(true);
  };

  const openEdit = (record: PlanoMetaRecord) => {
    setEditing(record);
    setForm({
      segmento: record.segmento,
      categoria: record.categoria,
      tipo: record.tipo,
      numeroSEI: record.numeroSEI,
      codigoSIG: record.codigoSIG,
      mesEntrega: record.mesEntrega,
      status: record.status,
      origem: record.origem,
      observacao: record.observacao,
      responsavel: record.responsavel ?? "",
      statusFinal: record.statusFinal ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_META);
  };

  const handleSave = () => {
    if (!form.segmento.trim() || !form.tipo.trim()) {
      alert("Preencha o segmento e o nome/tipo do curso.");
      return;
    }

    const status = normalizarStatus(form.status);
    const precisaObservacao =
      status.includes("ANALISE") || status.includes("PENDENTE") || status.includes("CPFD");

    if (precisaObservacao && !form.observacao.trim()) {
      alert("Informe a observação/justificativa para registros em análise, pendentes ou CPFD.");
      return;
    }

    if (editing) {
      updatePlanoMeta(editing.id, form);
    } else {
      savePlanoMeta(form);
    }

    refresh();
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Deseja excluir este registro do Plano de Metas?")) return;
    deletePlanoMeta(id);
    refresh();
  };

  const handleImportPlano = async (file?: File) => {
    if (!file) return;

    try {
      const rows = await importarPlanoMetasExcel(file);

      rows.forEach((r) => {
        savePlanoMeta({
          segmento: r.segmento,
          categoria: r.categoria,
          tipo: r.tipo,
          numeroSEI: r.numeroSEI,
          codigoSIG: r.codigoSIG,
          mesEntrega: r.mesEntrega,
          status: r.status,
          origem: r.origem,
          observacao: r.observacao,
          responsavel: r.responsavel,
          statusFinal: r.statusFinal,
        });
      });

      refresh();
      alert(`${rows.length} registros importados para o Plano de Metas.`);
    } catch (error) {
      console.error(error);
      alert("Erro ao importar a planilha do Plano de Metas.");
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
                  <h1 className="text-2xl font-bold text-gray-900">Plano de Metas 2025</h1>
                  <p className="text-gray-500">
                    Mapeamento de produção, produtividade e estratégias
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-3">
                Clique nos cards para filtrar a tabela. Registros em análise, pendentes ou CPFD
                devem conter observação/justificativa.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={inputPlanoRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleImportPlano(e.target.files?.[0])}
              />

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => inputPlanoRef.current?.click()}
              >
                <Upload size={18} />
                Importar Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToExcel(dadosExportacao, "Plano_Metas_2025")}
              >
                <FileSpreadsheet size={18} />
                Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToCsv(dadosExportacao, "Plano_Metas_2025")}
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
                    "Relatorio_Plano_Metas_2025",
                    "Relatório Plano de Metas 2025",
                    [
                      "Responsável",
                      "Segmento",
                      "Categoria",
                      "Curso",
                      "Número SEI",
                      "Código SIG",
                      "Status",
                      "Observação",
                    ],
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
                Novo Registro
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatusCard
            title="Total de Cursos"
            value={totalCursos}
            icon={<Calendar size={22} />}
            active={cardStatus === "Todos"}
            onClick={() => setCardStatus("Todos")}
            subtitle="Clique para ver todos"
          />

          <StatusCard
            title="Publicados"
            value={publicados}
            icon={<CheckCircle2 size={22} />}
            active={cardStatus === "PUBLICADO"}
            onClick={() => setCardStatus(cardStatus === "PUBLICADO" ? "Todos" : "PUBLICADO")}
            subtitle="Filtrar publicados"
          />

          <StatusCard
            title="Em Análise"
            value={emAnalise}
            icon={<Search size={22} />}
            active={cardStatus === "EM ANÁLISE"}
            onClick={() => setCardStatus(cardStatus === "EM ANÁLISE" ? "Todos" : "EM ANÁLISE")}
            subtitle="Exige observação"
          />

          <StatusCard
            title="CPFD / Pendentes"
            value={pendentes}
            icon={<Info size={22} />}
            active={cardStatus === "CPFD / PENDENTES"}
            onClick={() =>
              setCardStatus(cardStatus === "CPFD / PENDENTES" ? "Todos" : "CPFD / PENDENTES")
            }
            subtitle="Sigla a confirmar"
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
                  placeholder="Buscar por curso, SEI, SIG, observação..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                />
              </div>
            </div>

            <FilterSelect
              label="Segmento"
              value={filterSegmento}
              onChange={setFilterSegmento}
              options={segmentos}
            />
            <FilterSelect
              label="Categoria"
              value={filterCategoria}
              onChange={setFilterCategoria}
              options={categorias}
            />
            <FilterSelect label="Mês" value={filterMes} onChange={setFilterMes} options={meses} />
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
            <table className="w-full min-w-[1400px]">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase">Responsável</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Segmento</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Curso</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">SEI</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">SIG</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Mês</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Origem</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Observação</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Status Final</th>
                  <th className="px-4 py-3 text-center text-xs uppercase">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.responsavel || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.segmento}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-md">
                      {item.tipo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.categoria}</td>
                    <td className="px-4 py-3 text-sm">
                      <SeiLink sei={item.numeroSEI} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.codigoSIG || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.mesEntrega || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full border text-xs font-semibold ${statusBadgeClass(
                          item.status,
                        )}`}
                        title={
                          item.status.toLowerCase().includes("cpfd")
                            ? "CPFD: sigla a confirmar com a área responsável."
                            : item.observacao || item.status
                        }
                      >
                        {item.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.origem || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={item.observacao}>
                      {item.observacao || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.statusFinal || "—"}</td>
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
                      Nenhum registro encontrado.
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
                    {editing ? "Editar Plano de Metas" : "Novo Registro"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Registre os dados do plano de metas e justificativas de status.
                  </p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Responsável"
                  value={form.responsavel ?? ""}
                  onChange={(v) => setForm({ ...form, responsavel: v })}
                />
                <Input
                  label="Segmento"
                  value={form.segmento}
                  onChange={(v) => setForm({ ...form, segmento: v })}
                />
                <Input
                  label="Categoria"
                  value={form.categoria}
                  onChange={(v) => setForm({ ...form, categoria: v })}
                />

                <div className="md:col-span-3">
                  <Input
                    label="Tipo / Nome do Curso"
                    value={form.tipo}
                    onChange={(v) => setForm({ ...form, tipo: v })}
                  />
                </div>

                <Input
                  label="Número SEI"
                  value={form.numeroSEI}
                  onChange={(v) => setForm({ ...form, numeroSEI: v })}
                />
                <Input
                  label="Código SIG"
                  value={form.codigoSIG}
                  onChange={(v) => setForm({ ...form, codigoSIG: v })}
                />
                <Input
                  label="Mês de Entrega"
                  value={form.mesEntrega}
                  onChange={(v) => setForm({ ...form, mesEntrega: v })}
                />
                <Input
                  label="Status"
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                />
                <Input
                  label="Origem"
                  value={form.origem}
                  onChange={(v) => setForm({ ...form, origem: v })}
                />
                <Input
                  label="Status Final"
                  value={form.statusFinal ?? ""}
                  onChange={(v) => setForm({ ...form, statusFinal: v })}
                />

                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Observação / Justificativa
                  </label>
                  <textarea
                    value={form.observacao}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                    placeholder="Explique o motivo do item estar em análise, pendente, CPFD ou outra situação relevante..."
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

function StatusCard({
  title,
  value,
  icon,
  active,
  onClick,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border p-5 text-left transition-all hover:shadow-md ${
        active ? "border-[#003F7D] ring-2 ring-[#003F7D]/20" : "border-gray-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-[#003F7D]">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-[#E8EFF7] text-[#003F7D] flex items-center justify-center">
          {icon}
        </div>
      </div>
    </button>
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