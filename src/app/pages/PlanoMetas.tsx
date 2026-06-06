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
  clearPlanoMetas,
  deletePlanoMeta,
  getPlanoMetas,
  replacePlanoMetas,
  savePlanoMeta,
  updatePlanoMeta,
  type PlanoMetaRecord,
} from "../utils/store";
import { ExportHint } from "../components/ExportHint";
import { importarPlanoMetasExcel } from "../utils/importExcel";
import { exportToCsv, exportToExcel } from "../utils/exportExcel";
import { gerarRelatorioPlanoMetas } from "../utils/gerarRelatorio";
import { toastError, toastSuccess } from "../utils/toast";

type FormState = Omit<PlanoMetaRecord, "id"> & {
  curso?: string;
};

const EMPTY_META: FormState = {
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

function statusBadgeClass(status: string) {
  const normalized = normalizarStatus(status);

  if (normalized.includes("PUBLICADO")) {
    return "bg-green-100 text-green-700 border-green-200";
  }

  if (normalized.includes("ANALISE")) {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }

  if (
    normalized.includes("PENDENTE") ||
    normalized.includes("CPFD") ||
    normalized.includes("CPED")
  ) {
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
      className="font-medium text-[#003F7D] underline underline-offset-2 hover:text-[#F57C00]"
    >
      {sei}
    </a>
  );
}

export function PlanoMetas() {
  const [records, setRecords] = useState<PlanoMetaRecord[]>(() => getPlanoMetas());
  const [search, setSearch] = useState("");
  const [filterSegmento, setFilterSegmento] = useState("Todos");
  const [filterTipo, setFilterTipo] = useState("Todos");
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

      if (cardStatus !== "Todos") {
        const normalized = normalizarStatus(item.status);

        if (cardStatus === "PUBLICADO" && !normalized.includes("PUBLICADO")) return false;
        if (cardStatus === "EM ANÁLISE" && !normalized.includes("ANALISE")) return false;

        if (
          cardStatus === "CPFD / PENDENTES" &&
          !normalized.includes("PENDENTE") &&
          !normalized.includes("CPFD") &&
          !normalized.includes("CPED")
        ) {
          return false;
        }
      }

      return true;
    });
  }, [records, search, filterSegmento, filterTipo, filterMes, filterStatus, cardStatus]);

  const segmentos = useMemo(
    () => ["Todos", ...Array.from(new Set(records.map((r) => r.segmento).filter(Boolean))).sort()],
    [records],
  );

  const tipos = useMemo(
    () => [
      "Todos",
      ...Array.from(
        new Set(
          records
            .map((r) => getTipo(r as PlanoMetaRecord & { curso?: string }))
            .filter(Boolean),
        ),
      ).sort(),
    ],
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

  const publicados = records.filter((r) =>
    normalizarStatus(r.status).includes("PUBLICADO"),
  ).length;

  const emAnalise = records.filter((r) =>
    normalizarStatus(r.status).includes("ANALISE"),
  ).length;

  const pendentes = records.filter((r) => {
    const status = normalizarStatus(r.status);
    return status.includes("PENDENTE") || status.includes("CPFD") || status.includes("CPED");
  }).length;

  const contarCategorias = () => {
    let aperfeicoamento = 0;
    let qualificacao = 0;
    let tecnico = 0;
    let outros = 0;

    records.forEach((item) => {
      const categoria = normalizarStatus(getTipo(item as PlanoMetaRecord & { curso?: string }));

      if (categoria.includes("APERFEI")) aperfeicoamento++;
      else if (categoria.includes("QUALIFICA")) qualificacao++;
      else if (categoria.includes("TECNICO") || categoria.includes("HABILITA")) tecnico++;
      else outros++;
    });

    return { aperfeicoamento, qualificacao, tecnico, outros };
  };

  const handleExportPdfGerencial = () => {
    if (!filtered.length) {
      toastError("Não há dados para gerar o relatório. Importe a planilha ou ajuste os filtros.");
      return;
    }

    const linhasRelatorio = filtered.map((item) => {
      const itemWithCurso = item as PlanoMetaRecord & { curso?: string };
      return {
        segmento: item.segmento,
        categoria: getTipo(itemWithCurso),
        tipo: getCurso(itemWithCurso),
        numeroSEI: item.numeroSEI,
        codigoSIG: item.codigoSIG,
        status: item.status,
        mesEntrega: item.mesEntrega,
        observacao: item.observacao,
      };
    });

    const ok = gerarRelatorioPlanoMetas(linhasRelatorio, {
      totalCursos: records.length,
      statusCount: {
        publicado: publicados,
        emAnalise: emAnalise,
        cpfd: pendentes,
      },
      categoriaCount: contarCategorias(),
    });

    if (ok) {
      toastSuccess(`PDF gerencial exportado com ${filtered.length} registros.`);
    }
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
    setForm(EMPTY_META);
    setModalOpen(true);
  };

  const openEdit = (record: PlanoMetaRecord) => {
    const recordWithCurso = record as PlanoMetaRecord & { curso?: string };

    setEditing(record);
    setForm({
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
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_META);
  };

  const handleSave = () => {
    const curso = String(form.curso || form.tipo || "").trim();

    if (!form.segmento.trim() || !curso) {
      alert("Preencha o segmento e o nome do curso.");
      return;
    }

    const status = normalizarStatus(form.status);
    const precisaObservacao =
      status.includes("ANALISE") ||
      status.includes("PENDENTE") ||
      status.includes("CPFD") ||
      status.includes("CPED");

    if (precisaObservacao && !form.observacao.trim()) {
      alert("Informe a observação/justificativa para registros em análise, pendentes, CPFD ou CPED.");
      return;
    }

    const payload = {
      ...form,
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
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Deseja excluir este registro do Plano de Metas?")) return;
    deletePlanoMeta(id);
    refresh();
  };

  const handleClearPlano = () => {
    if (
      !confirm(
        "Deseja limpar todos os registros do Plano de Metas?\n\nA tela ficará vazia até uma nova importação ou cadastro.",
      )
    ) {
      return;
    }

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

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#003F7D]">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Plano de Metas 2025</h1>
                  <p className="text-gray-500">
                    Mapeamento de produção, produtividade e estratégias
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-500">
                Clique nos cards para filtrar a tabela. Registros em análise, pendentes, CPFD ou CPED
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
                className="h-12 gap-2 px-5 text-gray-600"
                onClick={() => inputPlanoRef.current?.click()}
              >
                <Upload size={18} />
                Importar Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 gap-2 px-5 text-gray-600"
                onClick={() => exportToExcel(dadosExportacao, "Plano_Metas_2025")}
              >
                <FileSpreadsheet size={18} />
                Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 gap-2 px-5 text-gray-600"
                onClick={() => exportToCsv(dadosExportacao, "Plano_Metas_2025")}
              >
                <Download size={18} />
                CSV
              </Button>

              <Button
                variant="outline"
                className="h-12 gap-2 px-5 text-gray-600"
                onClick={handleExportPdfGerencial}
              >
                PDF Gerencial
              </Button>

              <Button
                variant="outline"
                className="h-12 gap-2 border-red-200 px-5 text-red-600 hover:bg-red-50"
                onClick={handleClearPlano}
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
            </div>
            <div className="mt-3 w-full">
              <ExportHint filteredCount={filtered.length} totalCount={records.length} />
            </div>
          </div>
        </div>

        {records.length === 0 && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-800">
            <strong>Nenhum registro importado ainda.</strong>
            <p className="mt-1 text-sm">
              Use <strong>Início → Importar planilha completa</strong> ou o botão{" "}
              <strong>Importar Excel</strong> nesta tela com a planilha principal do portfólio.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
            subtitle="CPFD: sigla em confirmação com a área"
            titleTooltip="CPFD — sigla pendente de confirmação oficial com a área responsável. Inclui registros pendentes e situações CPED relacionadas à precificação."
          />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-500">Buscar</label>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por curso, SEI, SIG, observação..."
                  className="h-11 w-full rounded-xl border border-gray-200 py-0 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
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
              label="Tipo"
              value={filterTipo}
              onChange={setFilterTipo}
              options={tipos}
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

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase">Segmento</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Curso</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Número SEI</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Código SIG</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Mês de Entrega</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Origem</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Observação</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Status Final</th>
                  <th className="px-4 py-3 text-center text-xs uppercase">Ações</th>
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
                          className={`inline-flex max-w-[260px] rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClass(
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

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
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
                        </div>
                      </td>
                    </tr>
                  );
                })}

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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-100 p-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editing ? "Editar Plano de Metas" : "Novo Registro"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Registre os dados do plano de metas no mesmo formato da planilha.
                  </p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                  <X size={22} />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
                <Input
                  label="Segmento"
                  value={form.segmento}
                  onChange={(v) => setForm({ ...form, segmento: v })}
                />

                <Input
                  label="Tipo"
                  value={form.categoria}
                  onChange={(v) => setForm({ ...form, categoria: v })}
                />

                <Input
                  label="Mês de Entrega"
                  value={form.mesEntrega}
                  onChange={(v) => setForm({ ...form, mesEntrega: v })}
                />

                <div className="md:col-span-3">
                  <Input
                    label="Curso"
                    value={String(form.curso || form.tipo || "")}
                    onChange={(v) => setForm({ ...form, curso: v, tipo: v })}
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
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    Observação / Justificativa
                  </label>
                  <textarea
                    value={form.observacao}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                    placeholder="Explique o motivo do item estar em análise, pendente, CPFD, CPED ou outra situação relevante..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 p-6">
                <Button variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-[#003F7D] text-white hover:bg-[#00355C]">
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
  titleTooltip,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  subtitle: string;
  titleTooltip?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titleTooltip}
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
        onChange={(e) => onChange(e.target.value)}
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
      <label className="mb-1 block text-xs font-semibold text-gray-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
      />
    </div>
  );
}