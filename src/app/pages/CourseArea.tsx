import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Download,
  Eye,
  FileSpreadsheet,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useConfirm } from "../components/ConfirmProvider";
import { exportToCsv, exportToExcel, exportToPdf } from "../utils/exportExcel";
import { Course, deleteCourse, getStoredCourses } from "../utils/store";

const AREA_LABELS: Record<string, string> = {
  gastronomia: "Gastronomia",
  "gastronomia-e-turismo": "Gastronomia",
  saude: "Ambiente e Saúde",
  "ambiente-saude": "Ambiente e Saúde",
  "ambiente-e-saude": "Ambiente e Saúde",
  "gestao-e-moda": "Gestão e Moda",
  "gestao-moda": "Gestão e Moda",
  tecnologia: "Tecnologia e Economia Criativa",
  "tecnologia-e-economia-criativa": "Tecnologia e Economia Criativa",
  "tecnologia-e-games": "Tecnologia e Economia Criativa",
  beleza: "Beleza e Cuidado Pessoal",
  "beleza-e-cuidado-pessoal": "Beleza e Cuidado Pessoal",
  "60": "60+",
  "60+": "60+",
  "60-mais": "60+",
  "ensino-medio": "Ensino Médio",
  "ensino-medio-2025": "Ensino Médio",
};

const AREA_ALIASES: Record<string, string[]> = {
  gastronomia: ["gastronomia", "gastronomia-e-turismo", "turismo"],
  "gastronomia-e-turismo": ["gastronomia", "gastronomia-e-turismo", "turismo"],

  saude: ["saude", "ambiente-saude", "ambiente-e-saude"],
  "ambiente-saude": ["saude", "ambiente-saude", "ambiente-e-saude"],
  "ambiente-e-saude": ["saude", "ambiente-saude", "ambiente-e-saude"],

  "gestao-e-moda": ["gestao-e-moda", "gestao-moda", "gestao", "moda"],
  "gestao-moda": ["gestao-e-moda", "gestao-moda", "gestao", "moda"],

  tecnologia: [
    "tecnologia",
    "tecnologia-e-economia-criativa",
    "tecnologia-e-games",
    "tecnologia-da-informacao",
    "economia-criativa",
  ],
  "tecnologia-e-economia-criativa": [
    "tecnologia",
    "tecnologia-e-economia-criativa",
    "tecnologia-e-games",
    "tecnologia-da-informacao",
    "economia-criativa",
  ],
  "tecnologia-e-games": [
    "tecnologia",
    "tecnologia-e-economia-criativa",
    "tecnologia-e-games",
    "tecnologia-da-informacao",
    "economia-criativa",
  ],

  beleza: [
    "beleza",
    "beleza-e-cuidado-pessoal",
    "estetica",
    "estetica-e-massoterapia",
  ],
  "beleza-e-cuidado-pessoal": [
    "beleza",
    "beleza-e-cuidado-pessoal",
    "estetica",
    "estetica-e-massoterapia",
  ],

  "60": ["60", "60+", "60-mais"],
  "60+": ["60", "60+", "60-mais"],
  "60-mais": ["60", "60+", "60-mais"],

  "ensino-medio": ["ensino-medio", "ensino-medio-2025"],
  "ensino-medio-2025": ["ensino-medio", "ensino-medio-2025"],
};

function safeText(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const text = String(value).trim();
  return text.length > 0 ? text : "—";
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "e")
    .replace(/\+/g, "mais")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getAreaFromPath(): string {
  if (typeof window === "undefined") return "";
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function getCourseName(course: Course): string {
  return safeText(
    course.nome ||
      course.titulo ||
      course.curso ||
      course.nomeCurso ||
      course.tipo ||
      "—",
  );
}

function getCourseSegment(course: Course): string {
  return safeText(
    course.segmento ||
      course.eixoTecnologico ||
      course.eixo ||
      course.area ||
      "—",
  );
}

function getCourseStatus(course: Course): string {
  return safeText(course.status || "Ativo");
}

function getModalidadeLabel(course: Course): string {
  const modalidade = String(course.modalidade ?? "").trim();
  return modalidade || "Não informada";
}

function getCourseModalidade(course: Course): string {
  return safeText(getModalidadeLabel(course) === "Não informada" ? "" : getModalidadeLabel(course));
}

function getCourseCh(course: Course): string {
  return safeText(course.cargaHoraria || course.ch);
}

function getCourseCodDN(course: Course): string {
  return safeText(course.codigoDN || course.codigoDn || course.codDN);
}

function getCourseCodSIG(course: Course): string {
  return safeText(course.codigoSIG || course.codSIG);
}

function getCourseIdent(course: Course): string {
  return safeText(course.ident);
}

function getCourseTipo(course: Course): string {
  return safeText(course.tipo);
}

function getCourseRevisao(course: Course): string {
  return safeText(course.revisao || course.ano || course.ultimaRevisao);
}

function getCourseSei(course: Course): string {
  return safeText(course.processoSEI || course.sei);
}

function getCourseValor(course: Course): string {
  return safeText(course.valor || course.valores);
}

function getCourseObservacoes(course: Course): string {
  return safeText(course.observacoes || course.observacao);
}

function getCourseBolsa(course: Course): string {
  return safeText(course.bolsa || course.compativelBolsa);
}

function getCourseComercial(course: Course): string {
  return safeText(course.comercial);
}

function isDeletedCourse(course: Course): boolean {
  const courseAny = course as any;
  return courseAny.deleted === true || courseAny.excluido === true;
}

const MODALIDADE_CARD_COLORS = [
  "bg-[#f58220]",
  "bg-green-600",
  "bg-purple-600",
  "bg-teal-600",
  "bg-rose-600",
  "bg-indigo-600",
  "bg-amber-600",
  "bg-cyan-700",
] as const;

function matchesArea(course: Course, currentArea: string): boolean {
  const normalizedCurrentArea = normalizeText(currentArea);
  const aliases = AREA_ALIASES[normalizedCurrentArea] || [normalizedCurrentArea];

  const segmentValues = [
    course.segmento,
    course.eixoTecnologico,
    course.eixo,
    course.area,
  ]
    .filter(Boolean)
    .map(normalizeText);

  if (segmentValues.some((value) => aliases.includes(value))) {
    return true;
  }

  return segmentValues.some((value) =>
    aliases.some((alias) => value.includes(alias) || alias.includes(value)),
  );
}

const EXPORT_COLUMNS = [
  "Status",
  "Modalidade",
  "Título",
  "CH",
  "Cód. DN",
  "Cód. SIG",
  "Ident.",
  "Tipo",
  "Revisão",
  "Processo SEI",
  "Valores",
  "Observações",
  "Unidade",
  "Bolsa",
  "Comercial",
] as const;

function buildExportRow(course: Course) {
  return {
    Status: getCourseStatus(course),
    Modalidade: getCourseModalidade(course),
    Título: getCourseName(course),
    CH: getCourseCh(course),
    "Cód. DN": getCourseCodDN(course),
    "Cód. SIG": getCourseCodSIG(course),
    "Ident.": getCourseIdent(course),
    Tipo: getCourseTipo(course),
    Revisão: getCourseRevisao(course),
    "Processo SEI": getCourseSei(course),
    Valores: getCourseValor(course),
    Observações: getCourseObservacoes(course),
    Unidade: safeText(course.unidade),
    Bolsa: getCourseBolsa(course),
    Comercial: getCourseComercial(course),
  };
}

export function CourseArea() {
  const confirm = useConfirm();
  const area = getAreaFromPath();

  const [search, setSearch] = useState("");
  const [filterModalidade, setFilterModalidade] = useState("todos");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const normalizedArea = normalizeText(area);
  const areaTitle = AREA_LABELS[normalizedArea] || safeText(area);

  const courses = useMemo(() => {
    const allCourses = getStoredCourses();

    return allCourses
      .filter((course) => !isDeletedCourse(course))
      .filter((course) => matchesArea(course, area));
  }, [area]);

  useEffect(() => {
    setFilterModalidade("todos");
    setSearch("");
  }, [area]);

  const modalidadesDoEixo = useMemo(() => {
    const map = new Map<string, { chave: string; label: string; quantidade: number }>();

    courses.forEach((course) => {
      const label = getModalidadeLabel(course);
      const chave = normalizeText(label);
      const atual = map.get(chave);

      if (atual) {
        atual.quantidade++;
      } else {
        map.set(chave, { chave, label, quantidade: 1 });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.quantidade !== a.quantidade) return b.quantidade - a.quantidade;
      return a.label.localeCompare(b.label, "pt-BR");
    });
  }, [courses]);

  const filteredCourses = useMemo(() => {
    let list = courses;

    if (filterModalidade !== "todos") {
      list = list.filter(
        (course) => normalizeText(getModalidadeLabel(course)) === filterModalidade,
      );
    }

    const query = normalizeText(search);
    if (!query) return list;

    return list.filter((course) => {
      const searchable = [
        getCourseName(course),
        getCourseSegment(course),
        course.codigoSIG,
        course.codSIG,
        course.codigoDn,
        course.codigoDN,
        course.processoSEI,
        course.sei,
        course.tipo,
        course.modalidade,
        course.status,
        course.unidade,
      ]
        .map(normalizeText)
        .join(" ");

      return searchable.includes(query);
    });
  }, [courses, search, filterModalidade]);

  const totalCourses = courses.length;
  const modalidadeAtiva = modalidadesDoEixo.find((item) => item.chave === filterModalidade);

  function toggleModalidadeFiltro(chave: string) {
    setFilterModalidade((atual) => (atual === chave ? "todos" : chave));
  }

  const dadosExportacao = useMemo(
    () => filteredCourses.map(buildExportRow),
    [filteredCourses],
  );

  const exportFileBase = `Cursos_${normalizeText(areaTitle)}`;

  async function handleDelete(course: Course) {
    const courseName = getCourseName(course);

    const ok = await confirm({
      message: `Tem certeza que deseja excluir o curso "${courseName}"?`,
      destructive: true,
      confirmLabel: "Excluir",
    });
    if (!ok) return;

    deleteCourse(course.id);
    window.location.reload();
  }

  function handleExportExcel() {
    exportToExcel(dadosExportacao, exportFileBase);
  }

  function handleExportCsv() {
    exportToCsv(dadosExportacao, exportFileBase);
  }

  function handleExportPdf() {
    exportToPdf(
      dadosExportacao,
      exportFileBase,
      `Cursos — ${areaTitle}`,
      [...EXPORT_COLUMNS],
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" id="course-area-export">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <a
            href="/app/cursos"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#004b8d] hover:underline"
          >
            <ArrowLeft size={16} />
            Voltar para Cursos
          </a>

          <h1 className="text-3xl font-bold text-[#004b8d]">{areaTitle}</h1>
          <p className="text-sm text-gray-600">
            Portfólio de cursos — SENAC DF 2025
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-lg bg-[#f58220] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#d96f15]"
          >
            <FileSpreadsheet size={16} />
            Exportar Excel
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            CSV
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            PDF
          </button>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-700">Filtro por modalidade</p>
        <p className="text-xs text-gray-500">
          Cartões gerados a partir das modalidades dos cursos deste eixo ({areaTitle})
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => setFilterModalidade("todos")}
          className={`rounded-xl bg-[#004b8d] p-5 text-left text-white shadow-sm transition-all ${
            filterModalidade === "todos"
              ? "ring-4 ring-[#004b8d]/30 ring-offset-2"
              : "hover:brightness-110"
          }`}
        >
          <div className="text-sm font-semibold opacity-90">Total de Cursos</div>
          <div className="mt-3 text-4xl font-bold">{totalCourses}</div>
          <div className="mt-2 text-xs opacity-75">
            {filterModalidade === "todos"
              ? "Todas as modalidades"
              : "Clique para ver todos"}
          </div>
        </button>

        {modalidadesDoEixo.map((item, index) => {
          const cor = MODALIDADE_CARD_COLORS[index % MODALIDADE_CARD_COLORS.length];
          const ativo = filterModalidade === item.chave;

          return (
            <button
              key={item.chave}
              type="button"
              title={item.label}
              onClick={() => toggleModalidadeFiltro(item.chave)}
              className={`rounded-xl ${cor} p-5 text-left text-white shadow-sm transition-all ${
                ativo ? "ring-4 ring-white/40 ring-offset-2" : "hover:brightness-110"
              }`}
            >
              <div className="line-clamp-2 text-sm font-semibold leading-snug opacity-90">
                {item.label}
              </div>
              <div className="mt-3 text-4xl font-bold">{item.quantidade}</div>
              <div className="mt-2 text-xs opacity-75">
                {ativo ? "Filtro ativo — clique para limpar" : "Clique para filtrar"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label className="relative block max-w-xl">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por nome, código, SEI ou modalidade..."
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-[#004b8d] focus:ring-2 focus:ring-[#004b8d]/20"
          />
        </label>

        <p className="mt-3 text-sm text-gray-600">
          {filteredCourses.length} cursos encontrados
          {filterModalidade !== "todos" && modalidadeAtiva && (
            <>
              {" "}
              · Modalidade: <strong>{modalidadeAtiva.label}</strong>
              <button
                type="button"
                onClick={() => setFilterModalidade("todos")}
                className="ml-2 text-[#004b8d] hover:underline"
              >
                Limpar filtro
              </button>
            </>
          )}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-[#004b8d] px-5 py-4">
          <h2 className="text-lg font-bold text-white">Catálogo de Cursos</h2>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="text-lg font-semibold text-gray-800">
              Nenhum curso encontrado nesta área.
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Importe a planilha ou cadastre um novo curso para visualizar os
              registros aqui.
            </p>
            <a
              href="/app/cursos"
              className="mt-5 inline-flex rounded-lg bg-[#004b8d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003a70]"
            >
              Ir para Cursos
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#004b8d] text-xs uppercase text-white">
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Modalidade</th>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">CH</th>
                  <th className="px-4 py-3">Cód. DN</th>
                  <th className="px-4 py-3">Cód. SIG</th>
                  <th className="px-4 py-3">Ident.</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Revisão</th>
                  <th className="px-4 py-3">Processo SEI</th>
                  <th className="px-4 py-3">Valores</th>
                  <th className="px-4 py-3">Observações</th>
                  <th className="px-4 py-3">Unidade</th>
                  <th className="px-4 py-3">Bolsa</th>
                  <th className="px-4 py-3">Comercial</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {filteredCourses.map((course) => {
                  const status = getCourseStatus(course);
                  const statusNormalized = normalizeText(status);
                  const isActive =
                    statusNormalized.includes("ativo") ||
                    statusNormalized.includes("vigente") ||
                    statusNormalized.includes("publicado");

                  const sei = getCourseSei(course);

                  return (
                    <tr
                      key={course.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                            isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                          {getCourseModalidade(course)}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {getCourseName(course)}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">
                          {getCourseCh(course)}
                        </span>
                      </td>

                      <td className="px-4 py-3">{getCourseCodDN(course)}</td>

                      <td className="px-4 py-3">{getCourseCodSIG(course)}</td>

                      <td className="px-4 py-3">{getCourseIdent(course)}</td>

                      <td className="px-4 py-3">{getCourseTipo(course)}</td>

                      <td className="px-4 py-3">{getCourseRevisao(course)}</td>

                      <td className="px-4 py-3">
                        {sei === "—" ? (
                          "—"
                        ) : (
                          <a
                            href={`https://sei.df.gov.br/sei/controlador.php?acao=procedimento_trabalhar&protocolo=${encodeURIComponent(
                              sei,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-[#004b8d] underline"
                          >
                            {sei}
                          </a>
                        )}
                      </td>

                      <td className="px-4 py-3 font-semibold">
                        {getCourseValor(course)}
                      </td>

                      <td className="max-w-[260px] px-4 py-3 text-gray-600">
                        <span className="line-clamp-2">
                          {getCourseObservacoes(course)}
                        </span>
                      </td>

                      <td className="px-4 py-3">{safeText(course.unidade)}</td>

                      <td className="px-4 py-3">{getCourseBolsa(course)}</td>

                      <td className="px-4 py-3">{getCourseComercial(course)}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedCourse(course)}
                            className="text-[#004b8d] hover:text-[#003a70]"
                            title="Visualizar"
                          >
                            <Eye size={17} />
                          </button>

                          {course.id ? (
                            <Link
                              to={`/app/cursos/editar/${course.id}`}
                              className="text-blue-600 hover:text-blue-800"
                              title="Editar"
                            >
                              <Pencil size={17} />
                            </Link>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleDelete(course)}
                            className="text-red-500 hover:text-red-700"
                            title="Excluir"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="bg-[#004b8d] px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-wide">
                {getCourseSegment(selectedCourse)}
              </p>
              <h3 className="mt-1 text-xl font-bold">
                {getCourseName(selectedCourse)}
              </h3>
            </div>

            <div className="space-y-3 p-5 text-sm">
              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Status</span>
                <span>{getCourseStatus(selectedCourse)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Carga Horária</span>
                <span>{getCourseCh(selectedCourse)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Tipo</span>
                <span>{getCourseTipo(selectedCourse)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Modalidade</span>
                <span>{getCourseModalidade(selectedCourse)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Revisão</span>
                <span>{getCourseRevisao(selectedCourse)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Valores</span>
                <span>{getCourseValor(selectedCourse)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Unidade</span>
                <span>{safeText(selectedCourse.unidade)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Processo SEI</span>
                <span>{getCourseSei(selectedCourse)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Código SIG</span>
                <span>{getCourseCodSIG(selectedCourse)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Código DN</span>
                <span>{getCourseCodDN(selectedCourse)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Bolsa</span>
                <span>{getCourseBolsa(selectedCourse)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Comercial</span>
                <span>{getCourseComercial(selectedCourse)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Observações</span>
                <span>{getCourseObservacoes(selectedCourse)}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-2 border-t border-gray-200 p-5">
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>

              <div className="flex flex-wrap gap-2">
                {selectedCourse.id ? (
                  <Link
                    to={`/app/cursos/editar/${selectedCourse.id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#004b8d] px-4 py-2 text-sm font-semibold text-[#004b8d] hover:bg-blue-50"
                  >
                    <Pencil size={16} />
                    Editar curso
                  </Link>
                ) : null}

                <Link
                  to="/app/cursos"
                  className="rounded-lg bg-[#004b8d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003a70]"
                >
                  Ver todos os cursos
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}