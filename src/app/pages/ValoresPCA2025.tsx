import { useMemo, useRef, useState } from "react";
import {
  Calculator,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  clearValoresPCA,
  deleteValorPCA,
  getValoresPCA,
  replaceValoresPCA,
  saveValorPCA,
  updateValorPCA,
  type ValorPCARecord,
} from "../utils/store";
import { importarValoresPCAExcel } from "../utils/importExcel";
import { exportToCsv, exportToExcel, exportToPdf } from "../utils/exportExcel";

type FormState = Omit<ValorPCARecord, "id">;

const EMPTY_FORM: FormState = {
  ano: "2025",
  sei: "",
  sig: "",
  titulo: "",
  eixo: "",
  unidade: "",
  ch: "",
  valor: "",
  status: "Vigente",
  observacao: "",
  precificacao: "",
  valorPrimeiroModulo: "",
  parcelasBoleto: "",
  valorParcelaBoleto: "",
  parcelasCartao: "",
  valorCartao: "",
  parcelaDesc20: "",
  parcelaDesc15: "",
};

function formatCurrency(value: string) {
  if (!value) return "—";

  const numeric = Number(
    String(value)
      .replace(/[^\d,.-]/g, "")
      .replace(".", "")
      .replace(",", "."),
  );

  if (Number.isNaN(numeric)) return value;

  return numeric.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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

export function ValoresPCA2025() {
  const [records, setRecords] = useState<ValorPCARecord[]>(() => getValoresPCA());
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todas");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ValorPCARecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const inputPcaRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setRecords(getValoresPCA());
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return records.filter((item) => {
      const text = [
        item.ano,
        item.sei,
        item.sig,
        item.titulo,
        item.eixo,
        item.unidade,
        item.ch,
        item.valor,
        item.status,
        item.observacao,
        item.precificacao,
        item.valorPrimeiroModulo,
        item.parcelasBoleto,
        item.valorParcelaBoleto,
        item.parcelasCartao,
        item.valorCartao,
        item.parcelaDesc20,
        item.parcelaDesc15,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (q && !text.includes(q)) return false;
      if (filterAno !== "Todos" && item.ano !== filterAno) return false;
      if (filterStatus !== "Todos" && item.status !== filterStatus) return false;
      if (filterEixo !== "Todos" && item.eixo !== filterEixo) return false;
      if (filterUnidade !== "Todas" && item.unidade !== filterUnidade) return false;

      return true;
    });
  }, [records, search, filterAno, filterStatus, filterEixo, filterUnidade]);

  const anos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.ano).filter(Boolean))).sort()],
    [records],
  );

  const statusList = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.status).filter(Boolean))).sort()],
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

  const dadosExportacao = filtered.map((r) => ({
    Ano: r.ano,
    SEI: r.sei,
    SIG: r.sig,
    Título: r.titulo,
    Eixo: r.eixo,
    Unidade: r.unidade,
    CH: r.ch,
    Valor: r.valor,
    Status: r.status,
    Observação: r.observacao,
    Precificação: r.precificacao ?? "",
    "Valor 1º Módulo": r.valorPrimeiroModulo ?? "",
    "Nº Parcelas Boleto": r.parcelasBoleto ?? "",
    "Valor Parcela Boleto": r.valorParcelaBoleto ?? "",
    "Nº Parcelas Cartão": r.parcelasCartao ?? "",
    "Valor Cartão": r.valorCartao ?? "",
    "Parcela desc. 20%": r.parcelaDesc20 ?? "",
    "Parcela desc. 15%": r.parcelaDesc15 ?? "",
  }));

  const totalRegistros = records.length;
  const totalFiltrado = filtered.length;
  const totalVigentes = records.filter((r) => r.status.toLowerCase().includes("vigente")).length;
  const totalComValor = records.filter((r) => r.valor || r.precificacao).length;

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (record: ValorPCARecord) => {
    setEditing(record);
    setForm({
      ano: record.ano,
      sei: record.sei,
      sig: record.sig,
      titulo: record.titulo,
      eixo: record.eixo,
      unidade: record.unidade,
      ch: record.ch,
      valor: record.valor,
      status: record.status,
      observacao: record.observacao,
      precificacao: record.precificacao ?? "",
      valorPrimeiroModulo: record.valorPrimeiroModulo ?? "",
      parcelasBoleto: record.parcelasBoleto ?? "",
      valorParcelaBoleto: record.valorParcelaBoleto ?? "",
      parcelasCartao: record.parcelasCartao ?? "",
      valorCartao: record.valorCartao ?? "",
      parcelaDesc20: record.parcelaDesc20 ?? "",
      parcelaDesc15: record.parcelaDesc15 ?? "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.sei.trim() || !form.titulo.trim()) {
      alert("Preencha pelo menos o SEI e o título.");
      return;
    }

    if (editing) {
      updateValorPCA(editing.id, form);
    } else {
      saveValorPCA(form);
    }

    refresh();
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Deseja excluir este registro de Valores PCA?")) return;

    deleteValorPCA(id);
    refresh();
  };

  const handleClearValoresPCA = () => {
    if (
      !confirm(
        "Deseja limpar todos os registros de Valores PCA?\n\nA tela ficará vazia até uma nova importação ou cadastro.",
      )
    ) {
      return;
    }

    clearValoresPCA();
    setRecords([]);
    setSearch("");
    setFilterAno("Todos");
    setFilterStatus("Todos");
    setFilterEixo("Todos");
    setFilterUnidade("Todas");
  };

  const handleImport = async (file?: File) => {
    if (!file) return;

    try {
      const rows = await importarValoresPCAExcel(file);

      replaceValoresPCA(
        rows.map((r) => ({
          ano: r.ano,
          sei: r.sei,
          sig: r.sig,
          titulo: r.titulo,
          eixo: r.eixo,
          unidade: r.unidade,
          ch: r.ch,
          valor: r.valor,
          status: r.status,
          observacao: r.observacao,
          precificacao: r.precificacao,
          valorPrimeiroModulo: r.valorPrimeiroModulo,
          parcelasBoleto: r.parcelasBoleto,
          valorParcelaBoleto: r.valorParcelaBoleto,
          parcelasCartao: r.parcelasCartao,
          valorCartao: r.valorCartao,
          parcelaDesc20: r.parcelaDesc20,
          parcelaDesc15: r.parcelaDesc15,
        })),
      );

      setSearch("");
      setFilterAno("Todos");
      setFilterStatus("Todos");
      setFilterEixo("Todos");
      setFilterUnidade("Todas");

      refresh();

      alert(
        `${rows.length} registros PCA importados com sucesso.\n\nOs dados anteriores foram substituídos para evitar duplicidade.`,
      );
    } catch (error) {
      console.error(error);
      alert("Erro ao importar a planilha de Valores PCA.");
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
                  <DollarSign className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Valores PCA 2025</h1>
                  <p className="text-gray-500">
                    Controle dos títulos retificativos PCA 2025 - CPED
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-3">
                Ao importar novamente a planilha, os registros anteriores são substituídos para
                evitar duplicidade. Fluxo do PCA sujeito a validação com a área responsável.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={inputPcaRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleImport(e.target.files?.[0])}
              />

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => inputPcaRef.current?.click()}
              >
                <Upload size={18} />
                Importar Planilha
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToExcel(dadosExportacao, "Valores_PCA_2025")}
              >
                <FileSpreadsheet size={18} />
                Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToCsv(dadosExportacao, "Valores_PCA_2025")}
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
                    "Relatorio_Valores_PCA_2025",
                    "Relatório Valores PCA 2025",
                    ["SEI", "SIG", "Título", "CH", "Valor", "Status", "Observação"],
                  )
                }
              >
                PDF
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleClearValoresPCA}
              >
                <Trash2 size={18} />
                Limpar
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

        {records.length === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-orange-800">
            <strong>Nenhum valor PCA importado ainda.</strong>
            <p className="text-sm mt-1">
              Clique em <strong>Importar Planilha</strong> e selecione a planilha principal do
              portfólio. Esta tela lerá apenas a aba de Valores PCA.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard
            icon={<Calculator size={22} />}
            label="Total de Registros"
            value={totalRegistros}
            subtitle="Base PCA"
          />
          <InfoCard
            icon={<Search size={22} />}
            label="Registros Filtrados"
            value={totalFiltrado}
            subtitle="Resultado atual"
          />
          <InfoCard
            icon={<CreditCard size={22} />}
            label="Vigentes"
            value={totalVigentes}
            subtitle="Status vigente"
          />
          <InfoCard
            icon={<DollarSign size={22} />}
            label="Com Valor"
            value={totalComValor}
            subtitle="Possuem precificação"
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
                  placeholder="Buscar por título, SEI, SIG, valor..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                />
              </div>
            </div>

            <FilterSelect label="Ano" value={filterAno} onChange={setFilterAno} options={anos} />
            <FilterSelect
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={statusList}
            />
            <FilterSelect
              label="Eixo"
              value={filterEixo}
              onChange={setFilterEixo}
              options={eixos}
            />
            <FilterSelect
              label="Unidade"
              value={filterUnidade}
              onChange={setFilterUnidade}
              options={unidades}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px]">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase">SEI</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">SIG</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Título</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">CH</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Precificação</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">1º Módulo</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Boleto</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Cartão</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Observação</th>
                  <th className="px-4 py-3 text-center text-xs uppercase">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 text-sm">
                      <SeiLink sei={item.sei} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.sig || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium max-w-md">
                      {item.titulo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.ch || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(item.precificacao || item.valor)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(item.valorPrimeiroModulo || "")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.parcelasBoleto || "—"}x
                      {item.valorParcelaBoleto
                        ? ` de ${formatCurrency(item.valorParcelaBoleto)}`
                        : ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.parcelasCartao || "—"}x
                      {item.valorCartao ? ` de ${formatCurrency(item.valorCartao)}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        {item.status || "—"}
                      </span>
                    </td>
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
                ))}

                {!filtered.length && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
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
                    {editing ? "Editar Valor PCA" : "Novo Valor PCA"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Preencha os dados do título retificativo PCA.
                  </p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Ano" value={form.ano} onChange={(v) => setForm({ ...form, ano: v })} />
                <Input label="SEI" value={form.sei} onChange={(v) => setForm({ ...form, sei: v })} />
                <Input label="SIG" value={form.sig} onChange={(v) => setForm({ ...form, sig: v })} />
                <div className="md:col-span-3">
                  <Input
                    label="Título"
                    value={form.titulo}
                    onChange={(v) => setForm({ ...form, titulo: v })}
                  />
                </div>
                <Input label="Eixo" value={form.eixo} onChange={(v) => setForm({ ...form, eixo: v })} />
                <Input
                  label="Unidade"
                  value={form.unidade}
                  onChange={(v) => setForm({ ...form, unidade: v })}
                />
                <Input label="CH" value={form.ch} onChange={(v) => setForm({ ...form, ch: v })} />
                <Input
                  label="Precificação"
                  value={form.precificacao ?? ""}
                  onChange={(v) => setForm({ ...form, precificacao: v, valor: v })}
                />
                <Input
                  label="Valor 1º Módulo"
                  value={form.valorPrimeiroModulo ?? ""}
                  onChange={(v) => setForm({ ...form, valorPrimeiroModulo: v })}
                />
                <Input
                  label="Nº Parcelas Boleto"
                  value={form.parcelasBoleto ?? ""}
                  onChange={(v) => setForm({ ...form, parcelasBoleto: v })}
                />
                <Input
                  label="Valor Parcela Boleto"
                  value={form.valorParcelaBoleto ?? ""}
                  onChange={(v) => setForm({ ...form, valorParcelaBoleto: v })}
                />
                <Input
                  label="Nº Parcelas Cartão"
                  value={form.parcelasCartao ?? ""}
                  onChange={(v) => setForm({ ...form, parcelasCartao: v })}
                />
                <Input
                  label="Valor Cartão"
                  value={form.valorCartao ?? ""}
                  onChange={(v) => setForm({ ...form, valorCartao: v })}
                />
                <Input
                  label="Parcela desc. 20%"
                  value={form.parcelaDesc20 ?? ""}
                  onChange={(v) => setForm({ ...form, parcelaDesc20: v })}
                />
                <Input
                  label="Parcela desc. 15%"
                  value={form.parcelaDesc15 ?? ""}
                  onChange={(v) => setForm({ ...form, parcelaDesc15: v })}
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
                    placeholder="Observações sobre o registro..."
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
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-[#003F7D]">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
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