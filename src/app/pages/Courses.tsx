import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { StatusBadge } from "../components/StatusBadge";
import {
  Search, Plus, Upload, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, X, Filter,
} from "lucide-react";
import { gastronomiaCourses } from "../data/gastronomiaData";
import { saudeSegurancaCourses } from "../data/saudeSegurancaData";
import { gestaoModaCourses } from "../data/gestaoModaData";
import { tecnologiaEconomiaCourses } from "../data/tecnologiaEconomiaData";
import { belezaCuidadoCourses } from "../data/belezaCuidadoData";
import { sessentaMaisCourses } from "../data/sessentaMaisData";
import { ensinoMedioCourses } from "../data/ensinoMedioData";

// ── Normalização de tipo ──────────────────────────────────────────────────────
function normalizaTipo(raw: string): string {
  const v = (raw || "").trim().toUpperCase();
  if (!v) return "Outros";
  if (v.startsWith("APERFEI")) return "Aperfeiçoamento";
  if (v.startsWith("QUALIFICA")) return "Qualificação Profissional";
  if (v.includes("HABILITA")) return "Habilitação Técnica";
  if (v.startsWith("APRENDIZA")) return "Aprendizagem Profissional";
  if (v.startsWith("ESPECIALIZA")) return "Especialização Técnica";
  if (v.includes("SOCIO") || v.includes("SOCIOCUL")) return "Prog. Socioprofissional";
  if (v.includes("INSTRUMENTAL")) return "Prog. Instrumental";
  if (v.includes("EXTENS")) return "Ação Extensiva";
  return raw.trim() || "Outros";
}

// ── Consolidação dos dados ────────────────────────────────────────────────────
const EIXOS = [
  { label: "Gastronomia",                   slug: "gastronomia",              courses: gastronomiaCourses },
  { label: "Ambiente e Saúde",              slug: "ambiente-saude",           courses: saudeSegurancaCourses },
  { label: "Gestão e Moda",                 slug: "gestao-moda",              courses: gestaoModaCourses },
  { label: "Tecnologia e Economia Criativa",slug: "tecnologia-economia-criativa", courses: tecnologiaEconomiaCourses },
  { label: "Beleza e Cuidado Pessoal",      slug: "beleza-cuidado-pessoal",   courses: belezaCuidadoCourses },
  { label: "60+",                           slug: "60-mais",                  courses: sessentaMaisCourses },
  { label: "Ensino Médio",                  slug: "ensino-medio",             courses: ensinoMedioCourses },
];

interface Course {
  _id: string;
  _eixo: string;
  _eixoSlug: string;
  titulo: string;
  ch: string;
  codDN?: string;
  codSIG?: string;
  tipo: string;
  tipoNorm: string;
  status: string;
  processoSEI?: string;
  modalidade?: string;
  unidade?: string;
  observacoes?: string;
}

const allCourses: Course[] = EIXOS.flatMap((eixo) =>
  eixo.courses.map((c: any, i: number) => ({
    _id:       `${eixo.slug}-${i}`,
    _eixo:     eixo.label,
    _eixoSlug: eixo.slug,
    titulo:    c.titulo || "",
    ch:        c.ch || "",
    codDN:     c.codDN || "",
    codSIG:    c.codSIG || "",
    tipo:      c.tipo || "",
    tipoNorm:  normalizaTipo(c.tipo),
    status:    (c.status || "ATIVO").trim().toUpperCase(),
    processoSEI: c.processoSEI || "",
    modalidade:  c.modalidade || "",
    unidade:     c.unidade || "",
    observacoes: c.observacoes || "",
  }))
);

// ── Opções de filtro ──────────────────────────────────────────────────────────
const EIXO_OPTS = ["Todos", ...EIXOS.map((e) => e.label)];
const STATUS_OPTS = ["Todos", "ATIVO", "INATIVO"];
const TIPO_OPTS = [
  "Todos",
  "Aperfeiçoamento",
  "Qualificação Profissional",
  "Habilitação Técnica",
  "Aprendizagem Profissional",
  "Especialização Técnica",
  "Prog. Socioprofissional",
  "Prog. Instrumental",
  "Ação Extensiva",
  "Outros",
];
const MODALIDADE_OPTS = [
  "Todos",
  ...Array.from(new Set(allCourses.map((c) => c.modalidade).filter(Boolean))).sort(),
];
const UNIDADE_OPTS = [
  "Todos",
  ...Array.from(new Set(allCourses.map((c) => c.unidade).filter(Boolean))).sort(),
];

const PAGE_SIZE = 20;

export function Courses() {
  const navigate = useNavigate();

  const [search, setSearch]           = useState("");
  const [filterEixo, setFilterEixo]   = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterTipo, setFilterTipo]   = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todos");
  const [page, setPage]               = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewCourse, setViewCourse]   = useState<Course | null>(null);

  const hasActiveFilter =
    search || filterEixo !== "Todos" || filterStatus !== "Todos" ||
    filterTipo !== "Todos" || filterUnidade !== "Todos";

  const clearFilters = () => {
    setSearch(""); setFilterEixo("Todos"); setFilterStatus("Todos");
    setFilterTipo("Todos"); setFilterUnidade("Todos"); setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allCourses.filter((c) => {
      if (q && ![c.titulo, c.codSIG, c.codDN, c.processoSEI].some((f) => f?.toLowerCase().includes(q))) return false;
      if (filterEixo !== "Todos" && c._eixo !== filterEixo) return false;
      if (filterStatus !== "Todos" && c.status !== filterStatus) return false;
      if (filterTipo !== "Todos" && c.tipoNorm !== filterTipo) return false;
      if (filterUnidade !== "Todos" && c.unidade !== filterUnidade) return false;
      return true;
    });
  }, [search, filterEixo, filterStatus, filterTipo, filterUnidade]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goPage = (n: number) => setPage(Math.max(1, Math.min(totalPages, n)));

  const inputCls = "h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]";

  return (
    <div className="min-h-screen bg-white w-full overflow-auto">

      {/* ── Header ── */}
      <div className="border-b border-gray-200 px-6 py-5 pt-16 lg:pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1>Cursos</h1>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: "0.8rem" }}>
              {filtered.length} curso{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
              {" "}de {allCourses.length} no total
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {}}
              className="flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Upload size={14} />
              Importar Planilha
            </button>
            <Link
              to="/app/novo-curso"
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm text-white font-medium transition-colors"
              style={{ background: "#F57C00" }}
            >
              <Plus size={14} />
              Novo Curso
            </Link>
          </div>
        </div>
      </div>

      {/* ── Barra de filtros ── */}
      <div className="flex flex-wrap gap-3 items-end bg-white border border-gray-200 rounded-xl px-4 py-4 mx-4 lg:mx-6 my-4 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, código, SEI ou SIG..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Eixo Tecnológico</label>
          <select value={filterEixo} onChange={(e) => { setFilterEixo(e.target.value); setPage(1); }}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            {EIXO_OPTS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Unidade</label>
          <select value={filterUnidade} onChange={(e) => { setFilterUnidade(e.target.value); setPage(1); }}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            {UNIDADE_OPTS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Tipo</label>
          <select value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value); setPage(1); }}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            {TIPO_OPTS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Status</label>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            {STATUS_OPTS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex gap-2 self-end">
          <button className="h-9 px-4 bg-[#003F7D] text-white rounded-lg text-sm font-medium hover:bg-[#002D5A] transition-colors">
            Filtrar
          </button>
          {hasActiveFilter && (
            <button onClick={clearFilters}
              className="h-9 px-3 flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <X size={13} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── Tabela ── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#003F7D] text-white">
            <tr>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold min-w-72">Nome do Curso</th>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold min-w-48">Eixo Tecnológico</th>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold w-36">Unidade</th>
              <th className="text-center px-4 py-3 text-xs uppercase font-bold w-16">CH</th>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold min-w-44">Tipo</th>
              <th className="text-center px-4 py-3 text-xs uppercase font-bold w-24">Status</th>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold w-40">Processo SEI</th>
              <th className="text-center px-4 py-3 text-xs uppercase font-bold w-24">Cód. SIG</th>
              <th className="text-center px-4 py-3 text-xs uppercase font-bold w-28">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-gray-400" style={{ fontSize: "0.875rem" }}>
                  Nenhum curso encontrado para os filtros aplicados.
                </td>
              </tr>
            ) : (
              paginated.map((course, i) => (
                <tr
                  key={course._id}
                  className={`border-b border-gray-100 hover:bg-[#E8EFF7]/40 transition-colors ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900" style={{ fontSize: "0.8rem" }}>
                      {course.titulo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: "#E8EFF7", color: "#003F7D" }}
                    >
                      {course._eixo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600" style={{ fontSize: "0.8rem" }}>
                    {course.unidade || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 font-mono" style={{ fontSize: "0.8rem" }}>
                    {course.ch ? `${course.ch}h` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700" style={{ fontSize: "0.8rem" }}>
                    {course.tipoNorm}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={course.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600" style={{ fontSize: "0.75rem" }}>
                    {course.processoSEI || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-gray-700" style={{ fontSize: "0.8rem" }}>
                    {course.codSIG || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {/* Visualizar */}
                      <button
                        onClick={() => setViewCourse(course)}
                        title="Visualizar"
                        style={{ display: "inline-flex", alignItems: "center", padding: "5px", borderRadius: "6px", background: "transparent", border: "none", cursor: "pointer", color: "#003F7D" }}
                      >
                        <Eye size={15} />
                      </button>
                      {/* Editar */}
                      <Link
                        to={`/app/cursos/${course._eixoSlug}`}
                        title="Ir para eixo"
                        style={{ display: "inline-flex", alignItems: "center", padding: "5px", borderRadius: "6px", background: "transparent", color: "#2563eb" }}
                      >
                        <Pencil size={15} />
                      </Link>
                      {/* Inativar */}
                      <button
                        title="Inativar"
                        style={{ display: "inline-flex", alignItems: "center", padding: "5px", borderRadius: "6px", background: "transparent", border: "none", cursor: "pointer", color: "#ef4444" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginação ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-gray-500" style={{ fontSize: "0.8rem" }}>
            Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goPage(page - 1)}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 5) {
                if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => goPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                    p === page
                      ? "bg-[#003F7D] text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => goPage(page + 1)}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Modal de visualização ── */}
      {viewCourse && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setViewCourse(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do modal */}
            <div className="bg-[#003F7D] px-6 py-4 flex items-start justify-between">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">{viewCourse._eixo}</p>
                <h3 className="text-white" style={{ fontSize: "1rem" }}>{viewCourse.titulo}</h3>
              </div>
              <button
                onClick={() => setViewCourse(null)}
                className="text-white/70 hover:text-white mt-0.5"
              >
                <X size={18} />
              </button>
            </div>
            {/* Body */}
            <div className="p-6 space-y-3">
              {[
                ["Status", <StatusBadge status={viewCourse.status} />],
                ["Carga Horária", viewCourse.ch ? `${viewCourse.ch}h` : "—"],
                ["Tipo", viewCourse.tipoNorm],
                ["Modalidade", viewCourse.modalidade || "—"],
                ["Unidade", viewCourse.unidade || "—"],
                ["Processo SEI", viewCourse.processoSEI || "—"],
                ["Código SIG", viewCourse.codSIG || "—"],
                ["Código DN", viewCourse.codDN || "—"],
                ["Observações", viewCourse.observacoes || "—"],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-start gap-3">
                  <span className="text-gray-400 w-32 flex-shrink-0" style={{ fontSize: "0.8rem" }}>{label}</span>
                  <span className="text-gray-800 flex-1" style={{ fontSize: "0.8rem" }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex justify-between">
              <button
                onClick={() => setViewCourse(null)}
                className="h-9 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Fechar
              </button>
              <Link
                to={`/app/cursos/${viewCourse._eixoSlug}`}
                className="h-9 px-4 rounded-lg text-sm text-white font-medium flex items-center gap-2"
                style={{ background: "#003F7D" }}
              >
                Ver eixo completo
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
