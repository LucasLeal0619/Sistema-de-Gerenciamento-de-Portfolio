import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { BookOpen, Edit2, Eye, Filter, Pencil, Trash2 } from "lucide-react";
import { useConfirm } from "../components/ConfirmProvider";
import { ReadOnlyBanner } from "../components/ReadOnlyBanner";
import {
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
import { usePermissions } from "../hooks/usePermissions";
import { importarCursosPortfolio } from "../utils/importExcel";
import { toastError, toastSuccess } from "../utils/toast";
import {
  adaptarCursoImportado,
  clearImportedCourses,
  deleteCourse,
  getStoredCourses,
  replaceCourses,
  segmentoToSlug,
} from "../utils/store";
import { normalizeCourseModality, normalizeCourseType } from "../utils/courseFieldNormalization";
import { matchesSearchQuery } from "../utils/textSearch";

type CourseItem = {
  id?: string;
  _id?: string;
  _eixo?: string;
  _eixoSlug?: string;
  segmento?: string;
  titulo?: string;
  modalidade?: string;
  ch?: string;
  codDN?: string;
  codSIG?: string;
  processoSEI?: string;
  status?: string;
  tipo?: string;
  tipoNorm?: string;
  unidade?: string;
  observacao?: string;
  observacoes?: string;
  ano?: string;
  valor?: string;
  resolucao?: string;
  [key: string]: unknown;
};

function getCourseTitle(course: CourseItem) {
  return String(
    course.titulo ??
      course["Titulo - Nome do Curso"] ??
      course["Título - Nome do Curso"] ??
      "",
  );
}

function getCourseStatus(course: CourseItem) {
  return String(course.status ?? course["Status SIG"] ?? "ATIVO");
}

function getCourseType(course: CourseItem) {
  const raw = String(course.tipoNorm ?? course.tipo ?? course["TIPO"] ?? "");
  const normalized = normalizeCourseType(raw);
  return normalized || "Não informado";
}

function getCourseEixo(course: CourseItem) {
  return String(course._eixo ?? course.segmento ?? "Não informado");
}

function getCourseSei(course: CourseItem) {
  return String(course.processoSEI ?? course["Processo SEI"] ?? course["NÚMERO SEI"] ?? "");
}

function getCourseSig(course: CourseItem) {
  return String(course.codSIG ?? course["Cód. SIG"] ?? course["Código SIG"] ?? "");
}

function getCourseCh(course: CourseItem) {
  return String(course.ch ?? course["CH"] ?? "");
}

function getCourseAno(course: CourseItem) {
  return String(
    course.ano ??
      course["Última Revisão"] ??
      course["Última revisão"] ??
      course["Ident."] ??
      "",
  );
}

function getCourseUnidade(course: CourseItem) {
  return String(course.unidade ?? course["UNIDADE QUE PODE SER RODADO"] ?? "");
}

function getCourseObservacao(course: CourseItem) {
  return String(
    course.observacao ??
      course.observacoes ??
      course["Observações de Conferência"] ??
      course["Observações / Orientações"] ??
      "",
  );
}

function displayField(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text || text === "—" || text.toLowerCase() === "undefined" || text.toLowerCase() === "null") {
    return "Não informado";
  }
  return text;
}

function pickCourseField(course: CourseItem, keys: string[]) {
  for (const key of keys) {
    const value = course[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function formatCourseDate(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const [y, m, d] = text.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  return text;
}

function DetailField({
  label,
  value,
  full = false,
}: {
  label: string;
  value: unknown;
  full?: boolean;
}) {
  return (
    <div className={`detalhe-campo${full ? " detalhe-campo-full" : ""}`}>
      <span className="detalhe-label">{label}</span>
      <span className={`detalhe-valor${full ? " detalhe-valor-texto" : ""}`}>{displayField(value)}</span>
    </div>
  );
}

function CourseDetailModal({
  course,
  canWrite,
  onClose,
  onEdit,
}: {
  course: CourseItem;
  canWrite: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const titulo = getCourseTitle(course) || "Sem título";
  const segmento = getCourseEixo(course);
  const status = getCourseStatus(course);
  const tipo = getCourseType(course);
  const modalidadeRaw = pickCourseField(course, ["modalidade", "Modalidade"]);
  const modalidade = normalizeCourseModality(modalidadeRaw) || modalidadeRaw;

  const unidadesLista = Array.isArray(course.unidades)
    ? course.unidades.map(String).filter(Boolean)
    : [];
  const unidadesTexto =
    unidadesLista.length > 0
      ? unidadesLista.join(", ")
      : pickCourseField(course, [
          "unidade",
          "UNIDADE QUE PODE SER RODADO",
          "Unidades",
          "Unidade",
        ]);

  const ch = getCourseCh(course) || pickCourseField(course, ["CH", "Carga Horária", "Carga Horaria"]);
  const turmas = pickCourseField(course, ["turmas", "Turmas", "Quantidade de Turmas", "Qtd Turmas"]);
  const codigo = pickCourseField(course, ["codigo", "Código", "Codigo", "Código do Processo", "Codigo do Processo"]);
  const alunos = pickCourseField(course, ["alunos", "Alunos", "Matrículas", "Matriculas"]);
  const instrutor = pickCourseField(course, [
    "instrutor",
    "instrutores",
    "Instrutor",
    "Instrutores",
    "Instrutor(es)",
  ]);
  const descricao = pickCourseField(course, ["descricao", "Descrição", "Descricao", "Descrição do Curso"]);
  const codDN = pickCourseField(course, ["codDN", "codigoDN", "codigoDn", "Cód. DN", "Cod. DN", "Código DN"]);
  const codSIG = getCourseSig(course);
  const ident = pickCourseField(course, ["ident", "Ident.", "Identificação", "Identificacao"]);
  const revisao = pickCourseField(course, [
    "revisao",
    "ano",
    "Última Revisão",
    "Ultima Revisao",
    "Última revisão",
  ]);
  const processoSEI = getCourseSei(course);
  const dataInicio = formatCourseDate(
    pickCourseField(course, ["dataInicio", "Data de Início", "Data de Inicio", "Início", "Inicio"]),
  );
  const dataFim = formatCourseDate(
    pickCourseField(course, ["dataFim", "Data de Término", "Data de Termino", "Término", "Termino"]),
  );
  const valores = pickCourseField(course, ["valores", "valor", "Valores", "Valor"]);
  const bolsa = pickCourseField(course, [
    "bolsa",
    "compativelBolsa",
    "Compatível com bolsa",
    "Compativel com bolsa",
  ]);
  const comercial = pickCourseField(course, ["comercial", "Comercial"]);
  const pcn = pickCourseField(course, ["pcn", "PCN"]);
  const pcr = pickCourseField(course, ["pcr", "PCR"]);
  const resolucao = pickCourseField(course, ["resolucao", "Resolução", "Resolucao"]);
  const observacoes = getCourseObservacao(course);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-detalhes"
        role="dialog"
        aria-labelledby="detalhes-curso-titulo"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(820px, 100%)" }}
      >
        <div className="modal-detalhes-header">
          <h2 id="detalhes-curso-titulo">Detalhes do Curso</h2>
          <button type="button" className="btn-fechar-x" title="Fechar" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="curso-detalhe-hero">
          <span className="curso-detalhe-icon" aria-hidden="true">
            <BookOpen size={20} />
          </span>
          <div>
            <h3>{titulo}</h3>
            <p>{segmento || "Segmento não informado"}</p>
            <div className="curso-detalhe-badges">
              <span className={`px-2 py-1 rounded-full border text-xs font-semibold ${getStatusBadgeClass(status)}`}>
                {status}
              </span>
              <span className="px-2 py-1 rounded-full border text-xs font-semibold bg-blue-50 text-[#003F7D] border-blue-100">
                {tipo}
              </span>
            </div>
          </div>
        </div>

        <section className="curso-detalhe-section">
          <h4>Informações principais</h4>
          <div className="detalhe-grid">
            <DetailField label="Segmento / Área" value={segmento} full />
            <DetailField label="Título do Curso" value={titulo} full />
            <DetailField label="Carga Horária (CH)" value={ch} />
            <DetailField label="Quantidade de Turmas" value={turmas} />
            <DetailField label="Código do Processo" value={codigo} />
            <DetailField label="Alunos (Matrículas)" value={alunos} />
            <DetailField label="Instrutor(es)" value={instrutor} full />
            <DetailField label="Unidades de Oferta" value={unidadesTexto} full />
            <DetailField label="Descrição do Curso" value={descricao} full />
          </div>
        </section>

        <section className="curso-detalhe-section">
          <h4>Informações técnicas</h4>
          <div className="detalhe-grid">
            <DetailField label="Status" value={status} />
            <DetailField label="Modalidade" value={modalidade} />
            <DetailField label="Cód. DN" value={codDN} />
            <DetailField label="Cód. SIG" value={codSIG} />
            <DetailField label="Identificação" value={ident} />
            <DetailField label="Tipo" value={tipo} />
            <DetailField label="Última Revisão / Ano" value={revisao} />
            <DetailField label="Processo SEI" value={processoSEI} />
            <DetailField label="Data de Início" value={dataInicio} />
            <DetailField label="Data de Término" value={dataFim} />
          </div>
        </section>

        <section className="curso-detalhe-section">
          <h4>Dados comerciais</h4>
          <div className="detalhe-grid">
            <DetailField label="Valores" value={valores} />
            <DetailField label="Compatível com Bolsa" value={bolsa} />
            <DetailField label="Comercial" value={comercial} />
            <DetailField label="PCN" value={pcn} />
            <DetailField label="PCR" value={pcr} />
            <DetailField label="Resolução" value={resolucao} />
            <DetailField label="Observações" value={observacoes} full />
          </div>
        </section>

        <div className="modal-detalhes-actions" style={{ paddingTop: "1.25rem" }}>
          {canWrite && course.id ? (
            <button type="button" className="btn-editar-modal" onClick={onEdit}>
              <Pencil size={15} />
              Editar Curso
            </button>
          ) : null}
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function getStatusBadgeClass(status: string) {
  const s = status.toLowerCase();

  if (s.includes("inativo")) return "bg-red-100 text-red-700 border-red-200";
  if (s.includes("ativo")) return "bg-green-100 text-green-700 border-green-200";
  if (s.includes("análise") || s.includes("analise")) {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
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

function carregarCursosLocalStorage(): CourseItem[] {
  return getStoredCourses().map((c) => ({
    ...c,
    _eixo: c.segmento,
    _eixoSlug: segmentoToSlug(c.segmento),
  }));
}

export function Courses() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { canWrite } = usePermissions();
  const location = useLocation();
  const initialSearch = new URLSearchParams(location.search).get("busca") ?? "";
  const [catalogo, setCatalogo] = useState<CourseItem[]>(() => carregarCursosLocalStorage());
  const [viewCourse, setViewCourse] = useState<CourseItem | null>(null);

  const [search, setSearch] = useState(initialSearch);
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todas");

  const inputCursosRef = useRef<HTMLInputElement>(null);

  const filteredCourses = useMemo(() => {
    return catalogo.filter((course) => {
      const titulo = getCourseTitle(course);
      const eixo = getCourseEixo(course);
      const status = getCourseStatus(course);
      const tipo = getCourseType(course);
      const ano = getCourseAno(course);
      const unidade = getCourseUnidade(course);

      if (
        !matchesSearchQuery(
          search,
          titulo,
          eixo,
          unidade,
          ano,
          getCourseCh(course),
          getCourseSig(course),
          getCourseSei(course),
          getCourseObservacao(course),
        )
      ) {
        return false;
      }
      if (filterEixo !== "Todos" && eixo !== filterEixo) return false;
      if (filterStatus !== "Todos" && status !== filterStatus) return false;
      if (filterTipo !== "Todos" && tipo !== filterTipo) return false;
      if (filterAno !== "Todos" && ano !== filterAno) return false;
      if (filterUnidade !== "Todas" && unidade !== filterUnidade) return false;

      return true;
    });
  }, [catalogo, search, filterEixo, filterStatus, filterTipo, filterAno, filterUnidade]);

  const eixos = useMemo(
    () => ["Todos", ...Array.from(new Set(catalogo.map(getCourseEixo).filter(Boolean))).sort()],
    [catalogo],
  );

  const statuses = useMemo(
    () => ["Todos", ...Array.from(new Set(catalogo.map(getCourseStatus).filter(Boolean))).sort()],
    [catalogo],
  );

  const tipos = useMemo(
    () => ["Todos", ...Array.from(new Set(catalogo.map(getCourseType).filter(Boolean))).sort()],
    [catalogo],
  );

  const anos = useMemo(
    () => ["Todos", ...Array.from(new Set(catalogo.map(getCourseAno).filter(Boolean))).sort()],
    [catalogo],
  );

  const unidades = useMemo(
    () => ["Todas", ...Array.from(new Set(catalogo.map(getCourseUnidade).filter(Boolean))).sort()],
    [catalogo],
  );

  const totalCursos = catalogo.length;

  const totalAtivos = catalogo.filter((c) => {
    const status = getCourseStatus(c).toLowerCase();
    return status.includes("ativo") && !status.includes("inativo");
  }).length;

  const totalInativos = catalogo.filter((c) =>
    getCourseStatus(c).toLowerCase().includes("inativo"),
  ).length;

  const totalEixos = new Set(catalogo.map(getCourseEixo).filter(Boolean)).size;

  const dadosExportacao = filteredCourses.map((course) => ({
    Título: getCourseTitle(course),
    Eixo: getCourseEixo(course),
    Modalidade: normalizeCourseModality(String(course.modalidade ?? "")),
    CH: getCourseCh(course),
    "Cód. DN": String(course.codDN ?? ""),
    "Cód. SIG": getCourseSig(course),
    "Processo SEI": getCourseSei(course),
    Tipo: getCourseType(course),
    Status: getCourseStatus(course),
    Ano: getCourseAno(course),
    Unidade: getCourseUnidade(course),
    Valor: String(course.valor ?? ""),
    Observação: getCourseObservacao(course),
  }));

  const handleImportCursos = async (file?: File) => {
    if (!file) return;

    try {
      const rows = await importarCursosPortfolio(file);

      const adaptados = rows.map(adaptarCursoImportado);

      replaceCourses(adaptados);

      const atualizados = carregarCursosLocalStorage();
      setCatalogo(atualizados);

      setSearch("");
      setFilterEixo("Todos");
      setFilterStatus("Todos");
      setFilterTipo("Todos");
      setFilterAno("Todos");
      setFilterUnidade("Todas");

      if (!adaptados.length) {
        toastError("Nenhum curso encontrado nas abas do portfólio.");
        return;
      }

      toastSuccess(
        `${adaptados.length} cursos importados. Dados anteriores substituídos para evitar duplicidade.`,
      );
    } catch (error) {
      console.error(error);
      toastError("Erro ao importar a planilha de cursos.");
    }
  };

  const handleClearCourses = async () => {
    const ok = await confirm({
      title: "Limpar cursos",
      message:
        "Deseja limpar os cursos importados?\n\nA tela ficará vazia até uma nova importação.",
      destructive: true,
      confirmLabel: "Limpar tudo",
    });
    if (!ok) return;

    clearImportedCourses();
    setCatalogo([]);
  };

  const handleDeleteCourse = async (course: CourseItem) => {
    const id = String(course.id ?? "");
    const title = getCourseTitle(course) || "curso selecionado";

    if (!id) {
      toastError("Não foi possível excluir este curso porque ele não possui identificador.");
      return;
    }

    const ok = await confirm({
      message: `Deseja excluir o curso "${title}"?`,
      destructive: true,
      confirmLabel: "Excluir",
    });
    if (!ok) return;

    deleteCourse(id);
    setCatalogo(carregarCursosLocalStorage());
  };

  return (
    <PageLayout>
      <PageHeader
        title="Cursos"
        description="Catálogo de cursos do portfólio — SENAC DF"
        info="Consulte e filtre os cursos cadastrados no portfólio pedagógico por eixo, status e unidade."
        filteredCount={filteredCourses.length}
        totalCount={catalogo.length}
        actions={
          canWrite ? (
            <Link to="/app/novo-curso" className="btn-novo">
              <span className="btn-novo-icon">+</span> Novo Curso
            </Link>
          ) : null
        }
      />

      <PageContentSection className="mt-5 space-y-4">
        <ReadOnlyBanner />
      </PageContentSection>

      {catalogo.length === 0 && (
        <PageImportAlert title="Nenhum curso importado ainda.">
          <p>
            Use <ImportacoesLink /> para carregar a planilha principal do portfólio.
          </p>
        </PageImportAlert>
      )}

      <PageFiltersBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por curso, SIG, SEI, eixo..."
        footer={
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter size={16} />
            <span>
              Exibindo <strong>{filteredCourses.length}</strong> de{" "}
              <strong>{catalogo.length}</strong> cursos.
            </span>
          </div>
        }
      >
        <FilterSelect label="Ano" value={filterAno} onChange={setFilterAno} options={anos} />
        <FilterSelect label="Eixo" value={filterEixo} onChange={setFilterEixo} options={eixos} />
        <FilterSelect
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={statuses}
        />
        <FilterSelect label="Tipo" value={filterTipo} onChange={setFilterTipo} options={tipos} />
        <FilterSelect
          label="Unidade"
          value={filterUnidade}
          onChange={setFilterUnidade}
          options={unidades}
        />
      </PageFiltersBar>

      <PageTableCard
        summary={formatRegistrosCount(filteredCourses.length)}
      >
            <table className="crud-table" style={{ minWidth: "1300px" }}>
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Eixo</th>
                  <th>CH</th>
                  <th>SIG</th>
                  <th>SEI</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Ano/Revisão</th>
                  <th>Unidade</th>
                  <th>Observação</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredCourses.map((course, index) => {
                  const title = getCourseTitle(course);
                  const eixo = getCourseEixo(course);
                  const status = getCourseStatus(course);
                  const sig = getCourseSig(course);
                  const sei = getCourseSei(course);

                  return (
                    <tr
                      key={String(course.id ?? course._id ?? `${title}-${index}`)}
                      className="hover:bg-blue-50/40"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-md">
                        {title || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{eixo}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getCourseCh(course) || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{sig || "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        <SeiLink sei={sei} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getCourseType(course)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full border text-xs font-semibold ${getStatusBadgeClass(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getCourseAno(course) || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getCourseUnidade(course) || "—"}
                      </td>
                      <td
                        className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate"
                        title={getCourseObservacao(course)}
                      >
                        {getCourseObservacao(course) || "—"}
                      </td>
                      <td className="acoes text-center">
                        <button
                          type="button"
                          className="btn-icon btn-view"
                          title="Ver detalhes"
                          onClick={() => setViewCourse(course)}
                        >
                          <Eye size={16} />
                        </button>

                        {canWrite && course.id && (
                          <Link to={`/app/cursos/editar/${course.id}`}>
                            <button
                              type="button"
                              className="btn-icon btn-edit"
                              title="Editar curso"
                            >
                              <Edit2 size={16} />
                            </button>
                          </Link>
                        )}

                        {canWrite && (
                          <button
                            type="button"
                            className="btn-icon btn-delete"
                            title="Excluir curso"
                            onClick={() => handleDeleteCourse(course)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!filteredCourses.length && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
                      Nenhum curso encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
      </PageTableCard>

      {viewCourse ? (
        <CourseDetailModal
          course={viewCourse}
          canWrite={canWrite}
          onClose={() => setViewCourse(null)}
          onEdit={() => {
            const id = viewCourse.id;
            setViewCourse(null);
            if (id) navigate(`/app/cursos/editar/${id}`);
          }}
        />
      ) : null}
    </PageLayout>
  );
}
