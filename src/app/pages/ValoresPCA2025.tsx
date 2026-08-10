import { useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { Edit, Eye, Trash2 } from "lucide-react";
import { importarValoresPCAExcel } from "../utils/importExcel";
import { useConfirm } from "../components/ConfirmProvider";
import { RecordDetailModal } from "../components/RecordDetailModal";
import { ReadOnlyBanner } from "../components/ReadOnlyBanner";
import {
  CrudFormShell,
  FilterSelect,
  PageContentSection,
  PageFiltersBar,
  PageHeader,
  PageImportAlert,
  ImportacoesLink,
  PageLayout,
  PageTableCard,
  formatRegistrosCount,
} from "../components/layout";
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
import { matchesSearchQuery } from "../utils/textSearch";

type FormState = Omit<ValorPCARecord, "id">;
type Mode = "lista" | "novo" | "editar";

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
  const [mode, setMode] = useState<Mode>("lista");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setRecords(getValoresPCA());
  };

  const filtered = useMemo(() => {
    return records.filter((item) => {
      if (
        !matchesSearchQuery(
          search,
          item.ano,
          item.sei,
          item.sig,
          item.titulo,
          item.eixo,
          item.unidade,
          item.ch,
          item.valor,
          item.observacao,
          item.precificacao,
          item.valorPrimeiroModulo,
          item.parcelasBoleto,
          item.valorParcelaBoleto,
          item.parcelasCartao,
          item.valorCartao,
          item.parcelaDesc20,
          item.parcelaDesc15,
        )
      ) {
        return false;
      }
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

  const semestres = useMemo(() => {
    const fromData = Array.from(new Set(records.map(getSemestreRecord).filter(Boolean))).sort();
    const defaults = ["2025/1", "2025/2", "2026/1", "2026/2"];
    const merged = Array.from(new Set([...defaults, ...fromData])).sort();
    return ["Todos", ...merged];
  }, [records]);

  const anosComDefault = useMemo(() => {
    const fromData = Array.from(new Set(records.map(getAnoRecord).filter(Boolean))).sort();
    const defaults = ["2025", "2026"];
    return ["Todos", ...Array.from(new Set([...defaults, ...fromData])).sort()];
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
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setMode("novo");
  };

  const openEdit = (record: ValorPCARecord) => {
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
    setEditingId(record.id);
    setMode("editar");
  };

  const voltarLista = () => {
    setMode("lista");
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
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

    if (editingId) {
      updateValorPCA(editingId, payload);
    } else {
      saveValorPCA(payload);
    }

    refresh();
    voltarLista();
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

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (mode !== "lista") {
    return (
      <div className="crud-page crud-page-form">
        <CrudFormShell
          title={mode === "novo" ? "Cadastrar Registro PCA" : "Editar Registro PCA"}
          subtitle="Registre os dados do curso previsto no planejamento do período."
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
              <h2>Dados do curso</h2>
              <div className="form-grid form-grid-page">
                <div className="form-group">
                  <label>Ano</label>
                  <input value={form.ano} onChange={(e) => updateForm("ano", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Semestre</label>
                  <input
                    value={form.semestre || ""}
                    onChange={(e) => updateForm("semestre", e.target.value)}
                    placeholder="Ex.: 2025/1"
                  />
                </div>
                <div className="form-group">
                  <label>SEI</label>
                  <input value={form.sei} onChange={(e) => updateForm("sei", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>SIG</label>
                  <input value={form.sig} onChange={(e) => updateForm("sig", e.target.value)} />
                </div>
                <div className="form-group full">
                  <label>
                    Título / Curso <span>*</span>
                  </label>
                  <input
                    value={form.titulo}
                    onChange={(e) => updateForm("titulo", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Eixo</label>
                  <input value={form.eixo} onChange={(e) => updateForm("eixo", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Unidade</label>
                  <input
                    value={form.unidade}
                    onChange={(e) => updateForm("unidade", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>CH</label>
                  <input value={form.ch} onChange={(e) => updateForm("ch", e.target.value)} />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h2>Precificação</h2>
              <div className="form-grid form-grid-page">
                <div className="form-group">
                  <label>Precificação</label>
                  <input
                    value={form.precificacao || ""}
                    onChange={(e) => updateForm("precificacao", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Valor 1º Módulo</label>
                  <input
                    value={form.valorPrimeiroModulo || ""}
                    onChange={(e) => updateForm("valorPrimeiroModulo", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Valor Principal</label>
                  <input value={form.valor} onChange={(e) => updateForm("valor", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Parcelas Boleto</label>
                  <input
                    value={form.parcelasBoleto || ""}
                    onChange={(e) => updateForm("parcelasBoleto", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Valor Parcela Boleto</label>
                  <input
                    value={form.valorParcelaBoleto || ""}
                    onChange={(e) => updateForm("valorParcelaBoleto", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Parcelas Cartão</label>
                  <input
                    value={form.parcelasCartao || ""}
                    onChange={(e) => updateForm("parcelasCartao", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Valor Cartão</label>
                  <input
                    value={form.valorCartao || ""}
                    onChange={(e) => updateForm("valorCartao", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Parcela com desc. 20%</label>
                  <input
                    value={form.parcelaDesc20 || ""}
                    onChange={(e) => updateForm("parcelaDesc20", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Parcela com desc. 15%</label>
                  <input
                    value={form.parcelaDesc15 || ""}
                    onChange={(e) => updateForm("parcelaDesc15", e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h2>Status e observação</h2>
              <div className="form-grid form-grid-page">
                <div className="form-group">
                  <label>Status</label>
                  <input
                    value={form.status}
                    onChange={(e) => updateForm("status", e.target.value)}
                  />
                </div>
                <div className="form-group full">
                  <label>Observação</label>
                  <textarea
                    value={form.observacao}
                    onChange={(e) => updateForm("observacao", e.target.value)}
                    rows={4}
                    placeholder="Observações sobre precificação, status ou validação..."
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
        title="PCA"
        description="Planejamento de cursos abertos por período (2025 e 2026) — visão de gestão"
        filteredCount={filtered.length}
        totalCount={records.length}
        actions={
          canWrite ? (
            <button type="button" onClick={openNew} className="btn-novo">
              <span className="btn-novo-icon">+</span> Novo Registro
            </button>
          ) : null
        }
      />

      <PageContentSection className="mt-5">
        <ReadOnlyBanner />
      </PageContentSection>

      {records.length === 0 && (
        <PageImportAlert title="Nenhum curso PCA importado ainda.">
          <p>
            Use <ImportacoesLink /> para carregar a planilha principal do portfólio.
          </p>
        </PageImportAlert>
      )}

      <PageFiltersBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por título, SEI, SIG, eixo, unidade..."
      >
        <FilterSelect label="Ano" value={filterAno} onChange={setFilterAno} options={anosComDefault} />
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
        <FilterSelect
          label="Resumo"
          value={cardFilter}
          onChange={setCardFilter}
          options={["Todos", "VIGENTES", "EM ANÁLISE", "SUSPENSOS"]}
        />
      </PageFiltersBar>

      <PageTableCard
        summary={formatRegistrosCount(filtered.length)}
      >
            <table className="crud-table" style={{ minWidth: "1400px" }}>
              <thead>
                <tr>
                  <th>Ano</th>
                  <th>Semestre</th>
                  <th>Titulo / Curso</th>
                  <th>Eixo</th>
                  <th>Unidade</th>
                  <th>CH</th>
                  <th>Status</th>
                  <th>Observacao</th>
                  <th className="text-center">Acoes</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 text-sm text-gray-700">{safeText(getAnoRecord(item))}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{safeText(getSemestreRecord(item))}</td>
                    <td className="max-w-md px-4 py-3 text-sm font-medium text-gray-900">
                      {safeText(item.titulo)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{safeText(item.eixo)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{safeText(item.unidade)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{safeText(item.ch)}</td>
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
                    <td className="acoes text-center">
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        className="btn-icon btn-view"
                        title="Ver detalhes e precificação"
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
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                      Nenhum registro encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
      </PageTableCard>

        {selected && (
          <RecordDetailModal
            subtitle="Informações resumidas do PCA selecionado."
            wide
            fields={[
              { label: "Ano", value: getAnoRecord(selected) },
              { label: "Semestre", value: getSemestreRecord(selected) },
              { label: "Título / Curso", value: selected.titulo, full: true },
              { label: "SEI", value: selected.sei },
              { label: "SIG", value: selected.sig },
              { label: "Eixo", value: selected.eixo },
              { label: "Unidade", value: selected.unidade },
              { label: "CH", value: selected.ch },
              { label: "Status", value: selected.status },
              { label: "Precificação", value: selected.precificacao || selected.valor },
              { label: "Valor 1º Módulo", value: selected.valorPrimeiroModulo },
              { label: "Valor Principal", value: selected.valor },
              { label: "Parcelas Boleto", value: selected.parcelasBoleto },
              { label: "Valor Parcela Boleto", value: selected.valorParcelaBoleto },
              { label: "Parcelas Cartão", value: selected.parcelasCartao },
              { label: "Valor Cartão", value: selected.valorCartao },
              { label: "Parcela com desc. 20%", value: selected.parcelaDesc20 },
              { label: "Parcela com desc. 15%", value: selected.parcelaDesc15 },
              { label: "Observação", value: selected.observacao, full: true, multiline: true },
            ]}
            canEdit={canWrite}
            onClose={() => setSelected(null)}
            onEdit={() => {
              const record = selected;
              setSelected(null);
              openEdit(record);
            }}
          />
        )}
    </PageLayout>
  );
}
