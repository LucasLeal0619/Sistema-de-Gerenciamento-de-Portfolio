import { useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  BookOpen,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  Filter,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useConfirm } from "../components/ConfirmProvider";
import { ExportHint } from "../components/ExportHint";
import { ReadOnlyBanner } from "../components/ReadOnlyBanner";
import { usePermissions } from "../hooks/usePermissions";
import { exportToCsv, exportToExcel, exportToPdf } from "../utils/exportExcel";
import { importarCursosPortfolio } from "../utils/importExcel";
import { toastError, toastSuccess } from "../utils/toast";
import { SavedFiltersBar } from "../components/SavedFiltersBar";
import {
  adaptarCursoImportado,
  clearImportedCourses,
  deleteCourse,
  getStoredCourses,
  replaceCourses,
  segmentoToSlug,
} from "../utils/store";

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
  return String(course.tipoNorm ?? course.tipo ?? course["TIPO"] ?? "Não informado");
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
  const { canWrite } = usePermissions();
  const location = useLocation();
  const initialSearch = new URLSearchParams(location.search).get("busca") ?? "";
  const [catalogo, setCatalogo] = useState<CourseItem[]>(() => carregarCursosLocalStorage());

  const [search, setSearch] = useState(initialSearch);
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todas");

  const inputCursosRef = useRef<HTMLInputElement>(null);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();

    return catalogo.filter((course) => {
      const titulo = getCourseTitle(course);
      const eixo = getCourseEixo(course);
      const status = getCourseStatus(course);
      const tipo = getCourseType(course);
      const ano = getCourseAno(course);
      const unidade = getCourseUnidade(course);

      const text = [
        titulo,
        eixo,
        status,
        tipo,
        ano,
        unidade,
        getCourseCh(course),
        getCourseSig(course),
        getCourseSei(course),
        getCourseObservacao(course),
      ]
        .join(" ")
        .toLowerCase();

      if (q && !text.includes(q)) return false;
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
    Modalidade: String(course.modalidade ?? ""),
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
    <div className="min-h-screen bg-[#F5F7FA] p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-[#003F7D] flex items-center justify-center">
                  <BookOpen className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
                  <p className="text-gray-500">
                    Catálogo importado da planilha principal do portfólio
                  </p>
                </div>
              </div>

            </div>

            <div className="flex flex-wrap gap-2">
              {canWrite && (
                <>
                  <input
                    ref={inputCursosRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => handleImportCursos(e.target.files?.[0])}
                  />

                  <Button
                    variant="outline"
                    className="h-12 px-5 gap-2 text-gray-600"
                    onClick={() => inputCursosRef.current?.click()}
                  >
                    <Upload size={18} />
                    Importar Planilha
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToExcel(dadosExportacao, "Catalogo_Cursos")}
              >
                <FileSpreadsheet size={18} />
                Excel
              </Button>

              <Button
                variant="outline"
                className="h-12 px-5 gap-2 text-gray-600"
                onClick={() => exportToCsv(dadosExportacao, "Catalogo_Cursos")}
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
                    "Relatorio_Catalogo_Cursos",
                    "Relatório de Cursos",
                    ["Título", "Eixo", "CH", "Cód. SIG", "Processo SEI", "Tipo", "Status"],
                  )
                }
              >
                PDF
              </Button>

              {canWrite && (
                <>
                  <Button
                    variant="outline"
                    className="h-12 px-5 gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleClearCourses}
                  >
                    <Trash2 size={18} />
                    Limpar
                  </Button>

                  <Link to="/app/novo-curso">
                    <Button className="h-12 px-5 gap-2 bg-[#F57C00] hover:bg-[#E67300] text-white">
                      <Plus size={18} />
                      Novo Curso
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <div className="mt-3 w-full">
              <ExportHint filteredCount={filteredCourses.length} totalCount={catalogo.length} />
            </div>
          </div>
        </div>

        <ReadOnlyBanner />

        {catalogo.length === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-orange-800">
            <strong>Nenhum curso importado ainda.</strong>
            <p className="mt-1 text-sm">
              Use <Link to="/app/inicio" className="font-semibold underline hover:text-orange-900">Início → Importar planilha completa</Link> ou o botão{" "}
              <strong>Importar Planilha</strong> nesta tela com a planilha principal do portfólio.
              O{" "}
              <Link to="/app/dashboard" className="font-semibold underline hover:text-orange-900">Dashboard</Link>{" "}
              também ficará zerado até a importação — ambos usam os mesmos dados.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoCard label="Total de Cursos" value={totalCursos} />
          <InfoCard label="Cursos Ativos" value={totalAtivos} />
          <InfoCard label="Cursos Inativos" value={totalInativos} />
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
                  placeholder="Buscar por curso, SIG, SEI, eixo..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#003F7D]/20"
                />
              </div>
            </div>

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
          </div>

          <SavedFiltersBar
            pageId="cursos"
            currentFilters={{
              search,
              filterEixo,
              filterStatus,
              filterTipo,
              filterAno,
              filterUnidade,
            }}
            onApply={(filters) => {
              setSearch(filters.search ?? "");
              setFilterEixo(filters.filterEixo ?? "Todos");
              setFilterStatus(filters.filterStatus ?? "Todos");
              setFilterTipo(filters.filterTipo ?? "Todos");
              setFilterAno(filters.filterAno ?? "Todos");
              setFilterUnidade(filters.filterUnidade ?? "Todas");
            }}
          />

          <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
            <Filter size={16} />
            <span>
              Exibindo <strong>{filteredCourses.length}</strong> de{" "}
              <strong>{catalogo.length}</strong> cursos.
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px]">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase">Curso</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Eixo</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">CH</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">SIG</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">SEI</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Ano/Revisão</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Unidade</th>
                  <th className="px-4 py-3 text-left text-xs uppercase">Observação</th>
                  <th className="px-4 py-3 text-center text-xs uppercase">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredCourses.map((course, index) => {
                  const title = getCourseTitle(course);
                  const eixo = getCourseEixo(course);
                  const eixoSlug = String(course._eixoSlug ?? segmentoToSlug(eixo));
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
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Link to={`/app/cursos/${eixoSlug}`}>
                            <button
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                              title="Ver área"
                            >
                              <Eye size={16} />
                            </button>
                          </Link>

                          {canWrite && course.id && (
                            <Link to={`/app/cursos/editar/${course.id}`}>
                              <button
                                className="p-2 rounded-lg text-[#F57C00] hover:bg-orange-50"
                                title="Editar curso"
                              >
                                <Edit2 size={16} />
                              </button>
                            </Link>
                          )}

                          {canWrite && (
                            <button
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                              title="Excluir curso"
                              onClick={() => handleDeleteCourse(course)}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!filteredCourses.length && (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-gray-500">
                      Nenhum curso encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
