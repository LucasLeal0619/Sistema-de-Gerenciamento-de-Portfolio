import { useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import {
  BadgeDollarSign,
  CheckCircle2,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  Info,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { importarValoresPCAExcel } from "../utils/importExcel";
import { useConfirm } from "../components/ConfirmProvider";
import { ExportHint } from "../components/ExportHint";
import { ImportReplaceHint } from "../components/ImportReplaceHint";
import { exportToCsv, exportToExcel, exportToPdf } from "../utils/exportExcel";
import { toastError, toastSuccess } from "../utils/toast";
import {
  clearValoresPCA,
  deleteValorPCA,
  getValoresPCA,
  replaceValoresPCA,
  saveValorPCA,
  updateValorPCA,
  type ValorPCARecord,
} from "../utils/store";
import { usePermissions } from "../hooks/usePermissions";
import { ReadOnlyBanner } from "../components/ReadOnlyBanner";

type FormState = Omit<ValorPCARecord, "id">;

const EMPTY_FORM: FormState = {
  ano: "2025",
  semestre: "",
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

function safeText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStatus(value: unknown) {
  return normalizeText(value).toUpperCase();
}

function getSemestreRecord(item: ValorPCARecord): string {
  if (item.semestre?.trim()) return item.semestre.trim();

  const ano = String(item.ano ?? "").trim();
  const match = ano.match(/^(\d{4})\s*[/\-]\s*([12])$/);
  if (match) return `${match[1]}/${match[2]}`;

  return "";
}

function getAnoRecord(item: ValorPCARecord): string {
  const ano = String(item.ano ?? "").trim();
  const match = ano.match(/^(\d{4})/);
  if (match) return match[1];
  return ano;
}

function statusBadgeClass(status: string) {
  const normalized = normalizeStatus(status);

  if (
    normalized.includes("VIGENTE") ||
    normalized.includes("PUBLICADO") ||
    normalized.includes("ATIVO") ||
    normalized.includes("APROVADO")
  ) {
    return "border-green-200 bg-green-100 text-green-700";
  }

  if (
    normalized.includes("ANALISE") ||
    normalized.includes("ANÁLISE") ||
    normalized.includes("AGUARDANDO")
  ) {
    return "border-yellow-200 bg-yellow-100 text-yellow-700";
  }

  if (
    normalized.includes("SUSPENSO") ||
    normalized.includes("REVOGADO") ||
    normalized.includes("INATIVO") ||
    normalized.includes("CANCELADO")
  ) {
    return "border-red-200 bg-red-100 text-red-700";
  }

  return "border-gray-200 bg-gray-100 text-gray-700";
}

function formatMoneyLike(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text) return "—";

  if (text.includes("R$")) return text;

  const normalized = text.replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);

  if (Number.isFinite(number) && text.match(/[0-9]/)) {
    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return text;
}

function SeiLink({ sei }: { sei: string }) {
  const value = String(sei ?? "").trim();

  if (!value) return <span className="text-gray-400">—</span>;

  const href = `https://sei.df.gov.br/sei/controlador.php?acao=procedimento_trabalhar&id_procedimento=${encodeURIComponent(
    value,
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[#003F7D] underline underline-offset-2 hover:text-[#F57C00]"
    >
      {value}
    </a>
  );
}

function toExportRows(records: ValorPCARecord[]) {
  return records.map((item) => ({
    Ano: getAnoRecord(item),
    Semestre: getSemestreRecord(item),
    SEI: item.sei,
    SIG: item.sig,
    Título: item.titulo,
    Eixo: item.eixo,
    Unidade: item.unidade,
    CH: item.ch,
    Precificação: item.precificacao || item.valor,
    "Valor 1º Módulo": item.valorPrimeiroModulo || "",
    "Parcelas Boleto": item.parcelasBoleto || "",
    "Valor Parcela Boleto": item.valorParcelaBoleto || "",
    "Parcelas Cartão": item.parcelasCartao || "",
    "Valor Cartão": item.valorCartao || "",
    "Parcela com desc. 20%": item.parcelaDesc20 || "",
    "Parcela com desc. 15%": item.parcelaDesc15 || "",
    Status: item.status,
    Observação: item.observacao,
  }));
}

export function ValoresPCA2025() {
  const confirm = useConfirm();
  const { canWrite } = usePermissions();
  const location = useLocation();
  const initialSearch = new URLSearchParams(location.search).get("busca") ?? "";
  const [records, setRecords] = useState<ValorPCARecord[]>(() => getValoresPCA());
  const [search, setSearch] = useState(initialSearch);
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterSemestre, setFilterSemestre] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todos");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [cardFilter, setCardFilter] = useState("Todos");
  const [selected, setSelected] = useState<ValorPCARecord | null>(null);
  const [editing, setEditing] = useState<ValorPCARecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setRecords(getValoresPCA());
  };

  const filtered = useMemo(() => {
    const q = normalizeText(search);

    return records.filter((item) => {
      const searchable = [
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
        .map(normalizeText)
        .join(" ");

      if (q && !searchable.includes(q)) return false;
      if (filterAno !== "Todos" && getAnoRecord(item) !== filterAno) return false;
      if (filterSemestre !== "Todos" && getSemestreRecord(item) !== filterSemestre) return false;
      if (filterUnidade !== "Todos" && item.unidade !== filterUnidade) return false;
      if (filterEixo !== "Todos" && item.eixo !== filterEixo) return false;
      if (filterStatus !== "Todos" && item.status !== filterStatus) return false;

      if (cardFilter !== "Todos") {
        const status = normalizeStatus(item.status);

        if (
          cardFilter === "VIGENTES" &&
          !status.includes("VIGENTE") &&
          !status.includes("PUBLICADO") &&
          !status.includes("ATIVO") &&
          !status.includes("APROVADO")
        ) {
          return false;
        }

        if (
          cardFilter === "EM ANÁLISE" &&
          !status.includes("ANALISE") &&
          !status.includes("ANÁLISE") &&
          !status.includes("AGUARDANDO")
        ) {
          return false;
        }

        if (
          cardFilter === "SUSPENSOS" &&
          !status.includes("SUSPENSO") &&
          !status.includes("REVOGADO") &&
          !status.includes("INATIVO") &&
          !status.includes("CANCELADO")
        ) {
          return false;
        }
      }

      return true;
    });
  }, [records, search, filterAno, filterSemestre, filterUnidade, filterEixo, filterStatus, cardFilter]);

  const anos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map(getAnoRecord).filter(Boolean))).sort()],
    [records],
  );

  const semestres = useMemo(() => {
    const fromData = Array.from(new Set(records.map(getSemestreRecord).filter(Boolean))).sort();
    const defaults = ["2025/1", "2025/2"];
    const merged = Array.from(new Set([...defaults, ...fromData])).sort();
    return ["Todos", ...merged];
  }, [records]);

  const unidades = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.unidade).filter(Boolean))).sort()],
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

  const vigentes = records.filter((item) => {
    const status = normalizeStatus(item.status);

    return (
      status.includes("VIGENTE") ||
      status.includes("PUBLICADO") ||
      status.includes("ATIVO") ||
      status.includes("APROVADO")
    );
  }).length;

  const emAnalise = records.filter((item) => {
    const status = normalizeStatus(item.status);

    return (
      status.includes("ANALISE") ||
      status.includes("ANÁLISE") ||
      status.includes("AGUARDANDO")
    );
  }).length;

  const suspensos = records.filter((item) => {
    const status = normalizeStatus(item.status);

    return (
      status.includes("SUSPENSO") ||
      status.includes("REVOGADO") ||
      status.includes("INATIVO") ||
      status.includes("CANCELADO")
    );
  }).length;

  const exportRows = toExportRows(filtered);

  const handleImport = async (file?: File) => {
    if (!file) return;

    try {
      const rows = await importarValoresPCAExcel(file);

      const normalizedRows = rows.map((row: any) => ({
        ano: String(row.ano || "2025").replace(/\s*\/\s*[12]\s*$/, ""),
        semestre: String(row.semestre || ""),
        sei: String(row.sei || ""),
        sig: String(row.sig || ""),
        titulo: String(row.titulo || ""),
        eixo: String(row.eixo || ""),
        unidade: String(row.unidade || ""),
        ch: String(row.ch || ""),
        valor: String(row.valor || row.precificacao || ""),
        status: String(row.status || "Vigente"),
        observacao: String(row.observacao || ""),
        precificacao: String(row.precificacao || row.valor || ""),
        valorPrimeiroModulo: String(row.valorPrimeiroModulo || ""),
        parcelasBoleto: String(row.parcelasBoleto || ""),
        valorParcelaBoleto: String(row.valorParcelaBoleto || ""),
        parcelasCartao: String(row.parcelasCartao || ""),
        valorCartao: String(row.valorCartao || ""),
        parcelaDesc20: String(row.parcelaDesc20 || ""),
        parcelaDesc15: String(row.parcelaDesc15 || ""),
      }));

      const saved = replaceValoresPCA(normalizedRows);
      setRecords(saved);

      setSearch("");
      setFilterAno("Todos");
      setFilterSemestre("Todos");
      setFilterUnidade("Todos");
      setFilterEixo("Todos");
      setFilterStatus("Todos");
      setCardFilter("Todos");

      if (!normalizedRows.length) {
        toastError("Nenhum registro válido encontrado na aba de PCA.");
        return;
      }

      toastSuccess(
        `${normalizedRows.length} registros importados. Dados anteriores substituídos.`,
      );
    } catch (error) {
      console.error(error);
      toastError("Erro ao importar a planilha de PCA.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleClear = async () => {
    const ok = await confirm({
      title: "Limpar PCA",
      message:
        "Deseja limpar todos os registros de PCA?\n\nA tela ficará vazia até uma nova importação ou cadastro.",
      destructive: true,
      confirmLabel: "Limpar tudo",
    });
    if (!ok) return;

    clearValoresPCA();
    setRecords([]);
    setSearch("");
    setFilterAno("Todos");
    setFilterSemestre("Todos");
    setFilterUnidade("Todos");
    setFilterEixo("Todos");
    setFilterStatus("Todos");
    setCardFilter("Todos");
  };

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const openEdit = (record: ValorPCARecord) => {
    setEditing(record);
    setForm({
      ano: getAnoRecord(record),
      semestre: getSemestreRecord(record),
      sei: record.sei,
      sig: record.sig,
      titulo: record.titulo,
      eixo: record.eixo,
      unidade: record.unidade,
      ch: record.ch,
      valor: record.valor,
      status: record.status,
      observacao: record.observacao,
      precificacao: record.precificacao || "",
      valorPrimeiroModulo: record.valorPrimeiroModulo || "",
      parcelasBoleto: record.parcelasBoleto || "",
      valorParcelaBoleto: record.valorParcelaBoleto || "",
      parcelasCartao: record.parcelasCartao || "",
      valorCartao: record.valorCartao || "",
      parcelaDesc20: record.parcelaDesc20 || "",
      parcelaDesc15: record.parcelaDesc15 || "",
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.titulo.trim()) {
      toastError("Informe o título/curso.");
      return;
    }

    const payload = {
      ...form,
      valor: form.valor || form.precificacao || form.valorPrimeiroModulo || form.valorCartao || "",
    };

    if (editing) {
      updateValorPCA(editing.id, payload);
    } else {
      saveValorPCA(payload);
    }

    refresh();
    closeEdit();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      message: "Deseja excluir este registro de PCA?",
      destructive: true,
      confirmLabel: "Excluir",
    });
    if (!ok) return;

    deleteValorPCA(id);
    refresh();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-8">
      <div className="mx-auto max-w-[1700px] space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#003F7D]">
                  <BadgeDollarSign className="text-white" size={25} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">PCA</h1>
                  <p className="text-gray-500">
                    Cursos previstos no planejamento do período — não é precificação geral do portfólio
                  </p>
                </div>
              </div>

              <ImportReplaceHint modulo="PCA" className="mt-3" />
            </div>

            <div className="flex flex-wrap gap-2">
              {canWrite && (
                <>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(event) => handleImport(event.target.files?.[0])}
              />

              <Button
                variant="outline"
                className="h-12 gap-2 px-5 text-gray-600"
                onClick={() => inputRef.current?.click()}
              >
                <Upload size={18} />
                Importar Excel
              </Button>
                </>
              )}

              <Button
                variant="outline"
                className="h-12 gap-2 px-5 text-gray-600"
                onClick={() => exportToExcel(exportRows, "PCA")}
              >
                <FileSpreadsheet size={18} />
                Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 gap-2 px-5 text-gray-600"
                onClick={() => exportToCsv(exportRows, "PCA")}
              >
                <Download size={18} />
                CSV
              </Button>

              <Button
                variant="outline"
                className="h-12 gap-2 px-5 text-gray-600"
                onClick={() =>
                  exportToPdf(
                    exportRows,
                    "Relatorio_PCA",
                    "Relatório PCA",
                    [
                      "Ano",
                      "Semestre",
                      "SEI",
                      "SIG",
                      "Título",
                      "Eixo",
                      "Unidade",
                      "CH",
                      "Precificação",
                      "Valor 1º Módulo",
                      "Parcelas Boleto",
                      "Valor Parcela Boleto",
                      "Parcelas Cartão",
                      "Valor Cartão",
                      "Status",
                      "Observação",
                    ],
                  )
                }
              >
                PDF
              </Button>

              {canWrite && (
                <>
              <Button
                variant="outline"
                className="h-12 gap-2 border-red-200 px-5 text-red-600 hover:bg-red-50"
                onClick={handleClear}
              >
                <Trash2 size={18} />
                Limpar
              </Button>

              <Button
                onClick={openNew}
                className="h-12 gap-2 bg-[#F57C00] px-5 text-white hover:bg-[#E67300]"
              >
                <Plus size={18} />
                Novo Registro
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

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-blue-900">
          <p className="text-sm leading-relaxed">
            <strong>O que é PCA?</strong> O Plano de Cursos Abertos (PCA) reúne os cursos previstos
            para o período planejado (ex.: 2025/1 e 2025/2). Use os filtros de ano, semestre, unidade
            e eixo para consultar o planejamento. A precificação detalhada aparece aqui como
            complemento dos títulos do PCA — diferente de Cursos por Eixo ou do catálogo geral.
          </p>
        </div>

        {records.length === 0 && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-800">
            <strong>Nenhum curso PCA importado ainda.</strong>
            <p className="mt-1 text-sm">
              Use <strong>Importação → Importar planilha completa</strong> ou o botão{" "}
              <strong>Importar Excel</strong> nesta tela com a planilha principal do portfólio.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatusCard
            title="Total"
            value={total}
            icon={<BadgeDollarSign size={22} />}
            active={cardFilter === "Todos"}
            onClick={() => setCardFilter("Todos")}
            subtitle="Todos os registros"
          />

          <StatusCard
            title="Vigentes"
            value={vigentes}
            icon={<CheckCircle2 size={22} />}
            active={cardFilter === "VIGENTES"}
            onClick={() => setCardFilter(cardFilter === "VIGENTES" ? "Todos" : "VIGENTES")}
            subtitle="Ativos ou publicados"
          />

          <StatusCard
            title="Em Análise"
            value={emAnalise}
            icon={<Search size={22} />}
            active={cardFilter === "EM ANÁLISE"}
            onClick={() =>
              setCardFilter(cardFilter === "EM ANÁLISE" ? "Todos" : "EM ANÁLISE")
            }
            subtitle="Aguardando validação"
          />

          <StatusCard
            title="Suspensos / Revogados"
            value={suspensos}
            icon={<Info size={22} />}
            active={cardFilter === "SUSPENSOS"}
            onClick={() => setCardFilter(cardFilter === "SUSPENSOS" ? "Todos" : "SUSPENSOS")}
            subtitle="Itens inativos"
          />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-500">Buscar</label>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por título, SEI, SIG, eixo, valor..."
                  className="h-11 w-full rounded-xl border border-gray-200 py-0 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                />
              </div>
            </div>

            <FilterSelect label="Ano" value={filterAno} onChange={setFilterAno} options={anos} />
            <FilterSelect
              label="Semestre"
              value={filterSemestre}
              onChange={setFilterSemestre}
              options={semestres}
            />
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
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1650px]">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase">SEI</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">SIG</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Título</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Eixo</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Unidade</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">CH</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Precificação</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Valor 1º Módulo</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Boleto</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Cartão</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Desc. 20%</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Desc. 15%</th>
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

                    <td className="px-4 py-3 text-sm text-gray-600">{safeText(item.sig)}</td>

                    <td className="max-w-md px-4 py-3 text-sm font-medium text-gray-900">
                      {safeText(item.titulo)}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">{safeText(item.eixo)}</td>

                    <td className="px-4 py-3 text-sm text-gray-600">{safeText(item.unidade)}</td>

                    <td className="px-4 py-3 text-sm text-gray-600">{safeText(item.ch)}</td>

                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      {formatMoneyLike(item.precificacao || item.valor)}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatMoneyLike(item.valorPrimeiroModulo)}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div>{safeText(item.parcelasBoleto)} parcelas</div>
                      <div className="font-semibold">{formatMoneyLike(item.valorParcelaBoleto)}</div>
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div>{safeText(item.parcelasCartao)} parcelas</div>
                      <div className="font-semibold">{formatMoneyLike(item.valorCartao)}</div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatMoneyLike(item.parcelaDesc20)}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatMoneyLike(item.parcelaDesc15)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex max-w-[220px] rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClass(
                          item.status,
                        )}`}
                        title={item.status}
                      >
                        {safeText(item.status)}
                      </span>
                    </td>

                    <td
                      className="max-w-xs truncate px-4 py-3 text-xs text-gray-500"
                      title={item.observacao}
                    >
                      {safeText(item.observacao)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelected(item)}
                          className="rounded-lg p-2 text-[#003F7D] hover:bg-blue-50"
                          title="Visualizar"
                        >
                          <Eye size={16} />
                        </button>

                        {canWrite && (
                          <>
                        <button
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
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
                    <td colSpan={15} className="px-4 py-10 text-center text-gray-500">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <ViewModal record={selected} onClose={() => setSelected(null)} />
        )}

        {(editing || form !== EMPTY_FORM) && (
          <EditModal
            editing={editing}
            form={form}
            setForm={setForm}
            onClose={closeEdit}
            onSave={handleSave}
          />
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
      className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md ${
        active ? "border-[#003F7D] ring-2 ring-[#003F7D]/20" : "border-gray-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-[#003F7D]">{value}</p>
          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8EFF7] text-[#003F7D]">
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
      <label className="mb-1 block text-xs font-semibold text-gray-500">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
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

function DetailRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid grid-cols-[170px_1fr] gap-3 border-b border-gray-100 py-2 text-sm">
      <span className="font-semibold text-gray-500">{label}</span>
      <span className="text-gray-800">{safeText(value)}</span>
    </div>
  );
}

function ViewModal({
  record,
  onClose,
}: {
  record: ValorPCARecord;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 bg-[#003F7D] p-6 text-white">
          <div>
            <p className="text-xs uppercase opacity-80">{safeText(record.eixo)}</p>
            <h2 className="mt-1 text-xl font-bold">{safeText(record.titulo)}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <div className="p-6">
          <DetailRow label="Ano" value={getAnoRecord(record)} />
          <DetailRow label="Semestre" value={getSemestreRecord(record)} />
          <DetailRow label="SEI" value={record.sei} />
          <DetailRow label="SIG" value={record.sig} />
          <DetailRow label="Unidade" value={record.unidade} />
          <DetailRow label="CH" value={record.ch} />
          <DetailRow label="Precificação" value={record.precificacao || record.valor} />
          <DetailRow label="Valor 1º Módulo" value={record.valorPrimeiroModulo} />
          <DetailRow label="Parcelas Boleto" value={record.parcelasBoleto} />
          <DetailRow label="Valor Parcela Boleto" value={record.valorParcelaBoleto} />
          <DetailRow label="Parcelas Cartão" value={record.parcelasCartao} />
          <DetailRow label="Valor Cartão" value={record.valorCartao} />
          <DetailRow label="Parcela com desc. 20%" value={record.parcelaDesc20} />
          <DetailRow label="Parcela com desc. 15%" value={record.parcelaDesc15} />
          <DetailRow label="Status" value={record.status} />
          <DetailRow label="Observação" value={record.observacao} />
        </div>

        <div className="flex justify-end border-t border-gray-100 p-5">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditModal({
  editing,
  form,
  setForm,
  onClose,
  onSave,
}: {
  editing: ValorPCARecord | null;
  form: FormState;
  setForm: (form: FormState) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const update = (field: keyof FormState, value: string) => {
    setForm({
      ...form,
      [field]: value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editing ? "Editar PCA" : "Novo Registro PCA"}
            </h2>
            <p className="text-sm text-gray-500">
              Registre os dados do curso previsto no planejamento do período.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
          <Input label="Ano" value={form.ano} onChange={(value) => update("ano", value)} />
          <Input
            label="Semestre"
            value={form.semestre || ""}
            onChange={(value) => update("semestre", value)}
            placeholder="Ex.: 2025/1"
          />
          <Input label="SEI" value={form.sei} onChange={(value) => update("sei", value)} />
          <Input label="SIG" value={form.sig} onChange={(value) => update("sig", value)} />

          <div className="md:col-span-3">
            <Input
              label="Título / Curso"
              value={form.titulo}
              onChange={(value) => update("titulo", value)}
            />
          </div>

          <Input label="Eixo" value={form.eixo} onChange={(value) => update("eixo", value)} />
          <Input
            label="Unidade"
            value={form.unidade}
            onChange={(value) => update("unidade", value)}
          />
          <Input label="CH" value={form.ch} onChange={(value) => update("ch", value)} />

          <Input
            label="Precificação"
            value={form.precificacao || ""}
            onChange={(value) => update("precificacao", value)}
          />
          <Input
            label="Valor 1º Módulo"
            value={form.valorPrimeiroModulo || ""}
            onChange={(value) => update("valorPrimeiroModulo", value)}
          />
          <Input label="Valor Principal" value={form.valor} onChange={(value) => update("valor", value)} />

          <Input
            label="Parcelas Boleto"
            value={form.parcelasBoleto || ""}
            onChange={(value) => update("parcelasBoleto", value)}
          />
          <Input
            label="Valor Parcela Boleto"
            value={form.valorParcelaBoleto || ""}
            onChange={(value) => update("valorParcelaBoleto", value)}
          />
          <Input
            label="Parcelas Cartão"
            value={form.parcelasCartao || ""}
            onChange={(value) => update("parcelasCartao", value)}
          />

          <Input
            label="Valor Cartão"
            value={form.valorCartao || ""}
            onChange={(value) => update("valorCartao", value)}
          />
          <Input
            label="Parcela com desc. 20%"
            value={form.parcelaDesc20 || ""}
            onChange={(value) => update("parcelaDesc20", value)}
          />
          <Input
            label="Parcela com desc. 15%"
            value={form.parcelaDesc15 || ""}
            onChange={(value) => update("parcelaDesc15", value)}
          />

          <Input
            label="Status"
            value={form.status}
            onChange={(value) => update("status", value)}
          />

          <div className="md:col-span-3">
            <label className="mb-1 block text-xs font-semibold text-gray-500">
              Observação
            </label>
            <textarea
              value={form.observacao}
              onChange={(event) => update("observacao", event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
              placeholder="Observações sobre precificação, status ou validação..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 p-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave} className="bg-[#003F7D] text-white hover:bg-[#00355C]">
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-500">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
      />
    </div>
  );
}
