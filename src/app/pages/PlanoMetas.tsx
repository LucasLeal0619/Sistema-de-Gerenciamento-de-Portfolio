import { useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { Edit, Trash2 } from "lucide-react";
import {
  clearPlanoMetas,
  deletePlanoMeta,
  getPlanoMetas,
  replacePlanoMetas,
  savePlanoMeta,
  updatePlanoMeta,
  type PlanoMetaRecord,
} from "../utils/store";
import { useConfirm } from "../components/ConfirmProvider";
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
} from "../components/layout";
import { usePermissions } from "../hooks/usePermissions";
import { importarPlanoMetasExcel } from "../utils/importExcel";
import {
  buildPlanoMetasYearOptions,
  filterPlanoMetasByYear,
  inferPlanoMetaYear,
  resolveDefaultPlanoMetasYear,
} from "../utils/planoMetasYear";
import {
  classificarStatusPlanoMetas,
  registroPertenceGrupoPlanoMetas,
  statusBadgeClassPlanoMetas,
  statusExigeObservacaoPlanoMetas,
  type GrupoStatusPlanoMetas,
} from "../utils/planoMetasStatus";
import { toastError, toastSuccess } from "../utils/toast";

type FormState = Omit<PlanoMetaRecord, "id"> & {
  curso?: string;
};

type Mode = "lista" | "novo" | "editar";

const EMPTY_META: FormState = {
  ano: "2025",
  segmento: "",
  curso: "",
  categoria: "QUALIFICAÇÃO",
  tipo: "",
  numeroSEI: "",
  codigoSIG: "",
  mesEntrega: "",
  status: "EM ANÁLISE",
  origem: "Plano de Metas",
  observacao: "",
  responsavel: "",
  statusFinal: "",
};

function safeText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function getCurso(item: Partial<PlanoMetaRecord> & { curso?: string }) {
  return String(item.curso || item.tipo || "").trim();
}

function getTipo(item: Partial<PlanoMetaRecord> & { curso?: string }) {
  return String(item.categoria || "").trim();
}

function normalizarStatus(status: string) {
  return String(status ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
      className="font-medium text-[#003F7D] underline underline-offset-2 hover:text-[#F57C00]"
    >
      {sei}
    </a>
  );
}

export function PlanoMetas() {
  const confirm = useConfirm();
  const { canWrite } = usePermissions();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = new URLSearchParams(location.search).get("busca") ?? "";
  const [records, setRecords] = useState<PlanoMetaRecord[]>(() => getPlanoMetas());
  const availableYears = useMemo(() => buildPlanoMetasYearOptions(records), [records]);
  const yearOptions = useMemo(() => ["Todos", ...availableYears], [availableYears]);
  const yearFromUrl = searchParams.get("ano");
  const [selectedYear, setSelectedYear] = useState(() => {
    const initialRecords = getPlanoMetas();
    const years = buildPlanoMetasYearOptions(initialRecords);
    if (yearFromUrl === "Todos") return "Todos";
    if (yearFromUrl && years.includes(yearFromUrl)) return yearFromUrl;
    return "Todos";
  });
  const [search, setSearch] = useState(initialSearch);
  const [filterSegmento, setFilterSegmento] = useState("Todos");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [filterMes, setFilterMes] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [cardStatus, setCardStatus] = useState<GrupoStatusPlanoMetas | "Todos">("Todos");
  const [mode, setMode] = useState<Mode>("lista");
  const [editing, setEditing] = useState<PlanoMetaRecord | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_META);

  const inputPlanoRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    setRecords(getPlanoMetas());
  };

  const recordsForYear = useMemo(
    () => filterPlanoMetasByYear(records, selectedYear),
    [records, selectedYear],
  );

  const effectiveYear = useMemo(() => {
    if (selectedYear !== "Todos") return selectedYear;
    return resolveDefaultPlanoMetasYear(availableYears, records);
  }, [selectedYear, availableYears, records]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSearch("");
    setFilterSegmento("Todos");
    setFilterTipo("Todos");
    setFilterMes("Todos");
    setFilterStatus("Todos");
    setCardStatus("Todos");
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("ano", year);
        return next;
      },
      { replace: true },
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return recordsForYear.filter((item) => {
      const curso = getCurso(item as PlanoMetaRecord & { curso?: string });
      const tipo = getTipo(item as PlanoMetaRecord & { curso?: string });

      const text = [
        item.segmento,
        curso,
        tipo,
        item.numeroSEI,
        item.codigoSIG,
        item.mesEntrega,
        item.status,
        item.origem,
        item.observacao,
        item.statusFinal,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (q && !text.includes(q)) return false;
      if (filterSegmento !== "Todos" && item.segmento !== filterSegmento) return false;
      if (filterTipo !== "Todos" && tipo !== filterTipo) return false;
      if (filterMes !== "Todos" && item.mesEntrega !== filterMes) return false;
      if (filterStatus !== "Todos" && item.status !== filterStatus) return false;

      if (!registroPertenceGrupoPlanoMetas(item.status, cardStatus)) return false;

      return true;
    });
  }, [recordsForYear, search, filterSegmento, filterTipo, filterMes, filterStatus, cardStatus]);

  const segmentos = useMemo(
    () => ["Todos", ...Array.from(new Set(recordsForYear.map((r) => r.segmento).filter(Boolean))).sort()],
    [recordsForYear],
  );

  const tipos = useMemo(
    () => [
      "Todos",
      ...Array.from(
        new Set(
          recordsForYear
            .map((r) => getTipo(r as PlanoMetaRecord & { curso?: string }))
            .filter(Boolean),
        ),
      ).sort(),
    ],
    [recordsForYear],
  );

  const meses = useMemo(
    () => ["Todos", ...Array.from(new Set(recordsForYear.map((r) => r.mesEntrega).filter(Boolean))).sort()],
    [recordsForYear],
  );

  const statusList = useMemo(
    () => ["Todos", ...Array.from(new Set(recordsForYear.map((r) => r.status).filter(Boolean))).sort()],
    [recordsForYear],
  );

  const totalCursos = recordsForYear.length;

  const publicados = recordsForYear.filter(
    (r) => classificarStatusPlanoMetas(r.status) === "PUBLICADO",
  ).length;

  const entregues = recordsForYear.filter(
    (r) => classificarStatusPlanoMetas(r.status) === "ENTREGUE",
  ).length;

  const emAnalise = recordsForYear.filter(
    (r) => classificarStatusPlanoMetas(r.status) === "EM ANALISE",
  ).length;

  const pendentes = recordsForYear.filter(
    (r) => classificarStatusPlanoMetas(r.status) === "PENDENTE",
  ).length;

  const contarCategorias = () => {
    let aperfeicoamento = 0;
    let qualificacao = 0;
    let tecnico = 0;
    let outros = 0;

    recordsForYear.forEach((item) => {
      const categoria = normalizarStatus(getTipo(item as PlanoMetaRecord & { curso?: string }));

      if (categoria.includes("APERFEI")) aperfeicoamento++;
      else if (categoria.includes("QUALIFICA")) qualificacao++;
      else if (categoria.includes("TECNICO") || categoria.includes("HABILITA")) tecnico++;
      else outros++;
    });

    return { aperfeicoamento, qualificacao, tecnico, outros };
  };

  const dadosExportacao = filtered.map((item) => {
    const curso = getCurso(item as PlanoMetaRecord & { curso?: string });
    const tipo = getTipo(item as PlanoMetaRecord & { curso?: string });

    return {
      Segmento: item.segmento,
      Curso: curso,
      Tipo: tipo,
      "Número SEI": item.numeroSEI,
      "Código SIG": item.codigoSIG,
      "Mês de Entrega": item.mesEntrega,
      Status: item.status,
      Origem: item.origem,
      Observação: item.observacao,
      "Status Final": item.statusFinal ?? "",
    };
  });

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_META, ano: effectiveYear });
    setMode("novo");
  };

  const openEdit = (record: PlanoMetaRecord) => {
    const recordWithCurso = record as PlanoMetaRecord & { curso?: string };

    setEditing(record);
    setForm({
      ano: inferPlanoMetaYear(record),
      segmento: record.segmento,
      curso: getCurso(recordWithCurso),
      categoria: getTipo(recordWithCurso),
      tipo: getCurso(recordWithCurso),
      numeroSEI: record.numeroSEI,
      codigoSIG: record.codigoSIG,
      mesEntrega: record.mesEntrega,
      status: record.status,
      origem: record.origem,
      observacao: record.observacao,
      responsavel: record.responsavel ?? "",
      statusFinal: record.statusFinal ?? "",
    });
    setMode("editar");
  };

  const voltarLista = () => {
    setMode("lista");
    setEditing(null);
    setForm(EMPTY_META);
  };

  const handleSave = () => {
    const curso = String(form.curso || form.tipo || "").trim();

    if (!form.segmento.trim() || !curso) {
      toastError("Preencha o segmento e o nome do curso.");
      return;
    }

    if (statusExigeObservacaoPlanoMetas(form.status) && !form.observacao.trim()) {
      toastError(
        "Informe a observação/justificativa para registros em análise, pendentes, CPFD ou CPED.",
      );
      return;
    }

    const payload = {
      ...form,
      ano: form.ano || effectiveYear,
      tipo: curso,
      curso,
      categoria: form.categoria || "Não informado",
    } as FormState;

    if (editing) {
      updatePlanoMeta(editing.id, payload);
    } else {
      savePlanoMeta(payload);
    }

    refresh();
    voltarLista();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      message: "Deseja excluir este registro do Plano de Metas?",
      destructive: true,
      confirmLabel: "Excluir",
    });
    if (!ok) return;
    deletePlanoMeta(id);
    refresh();
  };

  const handleClearPlano = async () => {
    const ok = await confirm({
      title: "Limpar Plano de Metas",
      message:
        "Deseja limpar todos os registros do Plano de Metas?\n\nA tela ficará vazia até uma nova importação ou cadastro.",
      destructive: true,
      confirmLabel: "Limpar tudo",
    });
    if (!ok) return;

    clearPlanoMetas();
    setRecords([]);
    setSearch("");
    setFilterSegmento("Todos");
    setFilterTipo("Todos");
    setFilterMes("Todos");
    setFilterStatus("Todos");
    setCardStatus("Todos");
  };

  const handleImportPlano = async (file?: File) => {
    if (!file) return;

    try {
      const rows = await importarPlanoMetasExcel(file);

      replacePlanoMetas(
        rows.map((r: any) => {
          const curso = String(r.curso || r.tipo || "").trim();
          const tipo = String(r.categoria || r.tipoPlanilha || "").trim();

          return {
            ano: inferPlanoMetaYear(r, effectiveYear),
            segmento: r.segmento,
            curso,
            categoria: tipo || "Não informado",
            tipo: curso,
            numeroSEI: r.numeroSEI,
            codigoSIG: r.codigoSIG,
            mesEntrega: r.mesEntrega,
            status: r.status,
            origem: r.origem,
            observacao: r.observacao,
            responsavel: "",
            statusFinal: r.statusFinal,
          } as any;
        }),
      );

      setSearch("");
      setFilterSegmento("Todos");
      setFilterTipo("Todos");
      setFilterMes("Todos");
      setFilterStatus("Todos");
      setCardStatus("Todos");

      refresh();

      if (!rows.length) {
        toastError("Nenhum registro válido encontrado na aba de Plano de Metas.");
        return;
      }

      toastSuccess(
        `${rows.length} registros importados. Dados anteriores substituídos para evitar duplicidade.`,
      );
    } catch (error) {
      console.error(error);
      toastError("Erro ao importar a planilha do Plano de Metas.");
    }
  };

  if (mode !== "lista") {
    return (
      <div className="crud-page crud-page-form">
        <CrudFormShell
          title={
            mode === "novo"
              ? "Cadastrar Registro do Plano de Metas"
              : "Editar Registro do Plano de Metas"
          }
          subtitle={
            mode === "novo"
              ? "Preencha os dados no mesmo formato da planilha de plano de metas."
              : "Atualize as informações do registro selecionado."
          }
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
              <h2>Dados do registro</h2>
              <div className="form-grid form-grid-page">
                <div className="form-group">
                  <label>
                    Segmento <span>*</span>
                  </label>
                  <input
                    value={form.segmento}
                    onChange={(e) => setForm({ ...form, segmento: e.target.value })}
                    type="text"
                    placeholder="Ex.: Infraestrutura"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Tipo <span>*</span>
                  </label>
                  <input
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    type="text"
                    placeholder="Ex.: QUALIFICAÇÃO"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Mês de Entrega <span>*</span>
                  </label>
                  <input
                    value={form.mesEntrega}
                    onChange={(e) => setForm({ ...form, mesEntrega: e.target.value })}
                    type="text"
                    placeholder="Ex.: Janeiro"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Curso <span>*</span>
                  </label>
                  <input
                    value={String(form.curso || form.tipo || "")}
                    onChange={(e) => setForm({ ...form, curso: e.target.value, tipo: e.target.value })}
                    type="text"
                    placeholder="Nome do curso"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Número SEI <span>*</span>
                  </label>
                  <input
                    value={form.numeroSEI}
                    onChange={(e) => setForm({ ...form, numeroSEI: e.target.value })}
                    type="text"
                    placeholder="Ex.: 1234567"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Código SIG <span>*</span>
                  </label>
                  <input
                    value={form.codigoSIG}
                    onChange={(e) => setForm({ ...form, codigoSIG: e.target.value })}
                    type="text"
                    placeholder="Ex.: SIG-001"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Status do Registro <span>*</span>
                  </label>
                  <input
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    type="text"
                    placeholder="Ex.: EM ANÁLISE"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Origem</label>
                  <input
                    value={form.origem}
                    onChange={(e) => setForm({ ...form, origem: e.target.value })}
                    type="text"
                    placeholder="Ex.: Plano de Metas"
                  />
                </div>
                <div className="form-group">
                  <label>
                    Situação Final <span>*</span>
                  </label>
                  <input
                    value={form.statusFinal ?? ""}
                    onChange={(e) => setForm({ ...form, statusFinal: e.target.value })}
                    type="text"
                    placeholder="Ex.: PUBLICADO"
                    required
                  />
                </div>
                <div className="form-group full">
                  <label>Observação / Justificativa</label>
                  <textarea
                    value={form.observacao}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                    rows={4}
                    placeholder="Explique o motivo do item estar em análise, pendente ou outra situação relevante..."
                  />
                </div>
              </div>
            </section>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={voltarLista}>
                Cancelar
              </button>
              {canWrite ? (
                <button type="submit" className="btn-salvar">
                  {mode === "editar" ? "Salvar Alterações" : "Cadastrar"}
                </button>
              ) : null}
            </div>
          </form>
        </CrudFormShell>
      </div>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Plano de Metas"
        description="Mapeamento de produção, produtividade e estratégias por ano"
        info="Ajuste filtros para visualizar registros de produção, infraestrutura e indicadores do portfólio."
        filteredCount={filtered.length}
        totalCount={recordsForYear.length}
        actions={
          canWrite ? (
            <button type="button" onClick={openNew} className="btn-novo">
              <span className="btn-novo-icon">+</span> Novo Registro
            </button>
          ) : null
        }
      />

      <PageContentSection className="mt-5 space-y-4">
        <ReadOnlyBanner />
      </PageContentSection>

      {records.length === 0 && (
        <PageImportAlert title="Nenhum registro importado ainda.">
          <p>
            Use <ImportacoesLink /> para carregar a planilha principal do portfólio.
          </p>
        </PageImportAlert>
      )}

      {records.length > 0 && recordsForYear.length === 0 && selectedYear !== "Todos" && (
        <PageImportAlert title={`Nenhum registro para ${selectedYear}.`}>
          <p>
            Selecione outro ano ou cadastre registros para o período de {selectedYear}.
          </p>
        </PageImportAlert>
      )}

      <PageFiltersBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por curso, SEI, SIG, observação..."
      >
        <FilterSelect
          label="Ano"
          value={selectedYear}
          onChange={handleYearChange}
          options={yearOptions}
        />
        <FilterSelect
          label="Segmento"
          value={filterSegmento}
          onChange={setFilterSegmento}
          options={segmentos}
        />
        <FilterSelect label="Tipo" value={filterTipo} onChange={setFilterTipo} options={tipos} />
        <FilterSelect label="Mês" value={filterMes} onChange={setFilterMes} options={meses} />
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={statusList}
        />
        <FilterSelect
          label="Situação"
          value={cardStatus}
          onChange={(value) => setCardStatus(value as GrupoStatusPlanoMetas | "Todos")}
          options={["Todos", "PUBLICADO", "ENTREGUE", "EM ANALISE", "PENDENTE"]}
        />
      </PageFiltersBar>

      <PageTableCard
        summary={
          <>
            {filtered.length} registro{filtered.length !== 1 ? "s" : ""} —{" "}
            {selectedYear === "Todos" ? "todos os anos" : selectedYear}
          </>
        }
      >
            <table className="crud-table" style={{ minWidth: "1400px" }}>
              <thead>
                <tr>
                  <th>Segmento</th>
                  <th>Curso</th>
                  <th>Tipo</th>
                  <th>Número SEI</th>
                  <th>Código SIG</th>
                  <th>Mês de Entrega</th>
                  <th>Status</th>
                  <th>Origem</th>
                  <th>Observação</th>
                  <th>Status Final</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtered.map((item) => {
                  const itemWithCurso = item as PlanoMetaRecord & { curso?: string };
                  const curso = getCurso(itemWithCurso);
                  const tipo = getTipo(itemWithCurso);

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/40">
                      <td className="px-4 py-3 text-sm text-gray-700">{safeText(item.segmento)}</td>

                      <td className="max-w-md px-4 py-3 text-sm font-medium text-gray-900">
                        {safeText(curso)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">{safeText(tipo)}</td>

                      <td className="px-4 py-3 text-sm">
                        <SeiLink sei={item.numeroSEI} />
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">{safeText(item.codigoSIG)}</td>

                      <td className="px-4 py-3 text-sm text-gray-600">{safeText(item.mesEntrega)}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex max-w-[260px] rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClassPlanoMetas(
                            item.status,
                          )}`}
                          title={
                            item.status.toLowerCase().includes("cpfd")
                              ? "CPFD: sigla a confirmar com a área responsável."
                              : item.observacao || item.status
                          }
                        >
                          {safeText(item.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">{safeText(item.origem)}</td>

                      <td
                        className="max-w-xs truncate px-4 py-3 text-xs text-gray-500"
                        title={item.observacao}
                      >
                        {safeText(item.observacao)}
                      </td>

                      <td
                        className="max-w-xs truncate px-4 py-3 text-sm text-gray-600"
                        title={item.statusFinal ?? ""}
                      >
                        {safeText(item.statusFinal)}
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
                  );
                })}

                {!filtered.length && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
                      {recordsForYear.length === 0
                        ? selectedYear === "Todos"
                          ? "Nenhum registro encontrado."
                          : `Nenhum registro encontrado para ${selectedYear}.`
                        : "Nenhum registro encontrado para os filtros selecionados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
      </PageTableCard>
    </PageLayout>
  );
}
