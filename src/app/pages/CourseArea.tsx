import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Download,
  Eye,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
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

function isDeletedCourse(course: Course): boolean {
  const courseAny = course as any;
  return courseAny.deleted === true || courseAny.excluido === true;
}

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

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function escapeCsvValue(value: unknown): string {
  const text = safeText(value).replace(/"/g, '""');
  return `"${text}"`;
}

function buildCourseRows(courses: Course[]) {
  return courses.map((course) => ({
    status: getCourseStatus(course),
    modalidade: safeText(course.modalidade || course.tipo),
    titulo: getCourseName(course),
    ch: safeText(course.cargaHoraria || course.ch),
    codigoDN: safeText(course.codigoDN || course.codigoDn),
    codigoSIG: safeText(course.codigoSIG || course.codSIG),
    ident: safeText(course.ident),
    tipo: safeText(course.tipo),
    revisao: safeText(course.revisao),
    processoSEI: safeText(course.processoSEI || course.sei),
    valores: safeText(course.valor || course.valores),
    observacoes: safeText(course.observacoes || course.observacao),
    unidade: safeText(course.unidade),
    bolsa: safeText(course.bolsa),
    comercial: safeText(course.comercial),
  }));
}

function buildCsv(courses: Course[]): string {
  const headers = [
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
  ];

  const rows = buildCourseRows(courses).map((row) =>
    [
      row.status,
      row.modalidade,
      row.titulo,
      row.ch,
      row.codigoDN,
      row.codigoSIG,
      row.ident,
      row.tipo,
      row.revisao,
      row.processoSEI,
      row.valores,
      row.observacoes,
      row.unidade,
      row.bolsa,
      row.comercial,
    ]
      .map(escapeCsvValue)
      .join(";"),
  );

  return [headers.map(escapeCsvValue).join(";"), ...rows].join("\n");
}

function buildExcelHtml(courses: Course[], title: string): string {
  const rows = buildCourseRows(courses);

  const bodyRows = rows
    .map(
      (row) => `
        <tr>
          <td>${row.status}</td>
          <td>${row.modalidade}</td>
          <td>${row.titulo}</td>
          <td>${row.ch}</td>
          <td>${row.codigoDN}</td>
          <td>${row.codigoSIG}</td>
          <td>${row.ident}</td>
          <td>${row.tipo}</td>
          <td>${row.revisao}</td>
          <td>${row.processoSEI}</td>
          <td>${row.valores}</td>
          <td>${row.observacoes}</td>
          <td>${row.unidade}</td>
          <td>${row.bolsa}</td>
          <td>${row.comercial}</td>
        </tr>`,
    )
    .join("");

  return `
    <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>
              <th colspan="15">${title}</th>
            </tr>
            <tr>
              <th>Status</th>
              <th>Modalidade</th>
              <th>Título</th>
              <th>CH</th>
              <th>Cód. DN</th>
              <th>Cód. SIG</th>
              <th>Ident.</th>
              <th>Tipo</th>
              <th>Revisão</th>
              <th>Processo SEI</th>
              <th>Valores</th>
              <th>Observações</th>
              <th>Unidade</th>
              <th>Bolsa</th>
              <th>Comercial</th>
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

export function CourseArea() {
  const area = getAreaFromPath();

  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const normalizedArea = normalizeText(area);
  const areaTitle = AREA_LABELS[normalizedArea] || safeText(area);

  const courses = useMemo(() => {
    const allCourses = getStoredCourses();

    return allCourses
      .filter((course) => !isDeletedCourse(course))
      .filter((course) => matchesArea(course, area));
  }, [area]);

  const filteredCourses = useMemo(() => {
    const query = normalizeText(search);

    if (!query) return courses;

    return courses.filter((course) => {
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
  }, [courses, search]);

  const totalCourses = courses.length;

  const totalFic = courses.filter((course) => {
    const value = normalizeText(`${course.modalidade || ""} ${course.tipo || ""}`);
    return value.includes("fic");
  }).length;

  const totalHabilitacao = courses.filter((course) =>
    normalizeText(course.tipo).includes("habilitacao"),
  ).length;

  const totalAcaoExtensiva = courses.filter((course) =>
    normalizeText(course.tipo).includes("acao-extensiva"),
  ).length;

  function handleDelete(course: Course) {
    const courseName = getCourseName(course);

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o curso "${courseName}"?`,
    );

    if (!confirmed) return;

    deleteCourse(course.id);
    window.location.reload();
  }

  function handleExportExcel() {
    const fileName = `cursos-${normalizeText(areaTitle)}.xls`;
    const content = buildExcelHtml(filteredCourses, `Cursos - ${areaTitle}`);

    downloadTextFile(
      fileName,
      content,
      "application/vnd.ms-excel;charset=utf-8",
    );
  }

  function handleExportCsv() {
    const fileName = `cursos-${normalizeText(areaTitle)}.csv`;
    const content = buildCsv(filteredCourses);

    downloadTextFile(fileName, content, "text/csv;charset=utf-8");
  }

  function handleExportPdf() {
    window.print();
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
            <Download size={16} />
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

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-[#004b8d] p-5 text-white shadow-sm">
          <div className="text-sm font-semibold opacity-90">Total de Cursos</div>
          <div className="mt-3 text-4xl font-bold">{totalCourses}</div>
        </div>

        <div className="rounded-xl bg-[#f58220] p-5 text-white shadow-sm">
          <div className="text-sm font-semibold opacity-90">FIC</div>
          <div className="mt-3 text-4xl font-bold">{totalFic}</div>
        </div>

        <div className="rounded-xl bg-green-600 p-5 text-white shadow-sm">
          <div className="text-sm font-semibold opacity-90">Habilitação</div>
          <div className="mt-3 text-4xl font-bold">{totalHabilitacao}</div>
        </div>

        <div className="rounded-xl bg-purple-600 p-5 text-white shadow-sm">
          <div className="text-sm font-semibold opacity-90">Ação Extensiva</div>
          <div className="mt-3 text-4xl font-bold">{totalAcaoExtensiva}</div>
        </div>
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

                  const sei = safeText(course.processoSEI || course.sei);

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
                          {safeText(course.modalidade || course.tipo)}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {getCourseName(course)}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-orange-100 px-2 py-1 text-xs font-bold text-orange-700">
                          {safeText(course.cargaHoraria || course.ch)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {safeText(course.codigoDN || course.codigoDn)}
                      </td>

                      <td className="px-4 py-3">
                        {safeText(course.codigoSIG || course.codSIG)}
                      </td>

                      <td className="px-4 py-3">{safeText(course.ident)}</td>

                      <td className="px-4 py-3">{safeText(course.tipo)}</td>

                      <td className="px-4 py-3">{safeText(course.revisao)}</td>

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
                        {safeText(course.valor || course.valores)}
                      </td>

                      <td className="max-w-[260px] px-4 py-3 text-gray-600">
                        <span className="line-clamp-2">
                          {safeText(course.observacoes || course.observacao)}
                        </span>
                      </td>

                      <td className="px-4 py-3">{safeText(course.unidade)}</td>

                      <td className="px-4 py-3">{safeText(course.bolsa)}</td>

                      <td className="px-4 py-3">
                        {safeText(course.comercial)}
                      </td>

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

                          <a
                            href={`/app/cursos/${course.id}/editar`}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar"
                          >
                            <Pencil size={17} />
                          </a>

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
                <span>
                  {safeText(selectedCourse.cargaHoraria || selectedCourse.ch)}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Tipo</span>
                <span>{safeText(selectedCourse.tipo)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Modalidade</span>
                <span>{safeText(selectedCourse.modalidade)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Unidade</span>
                <span>{safeText(selectedCourse.unidade)}</span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Processo SEI</span>
                <span>
                  {safeText(selectedCourse.processoSEI || selectedCourse.sei)}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Código SIG</span>
                <span>
                  {safeText(selectedCourse.codigoSIG || selectedCourse.codSIG)}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Código DN</span>
                <span>
                  {safeText(selectedCourse.codigoDN || selectedCourse.codigoDn)}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr] gap-3">
                <span className="font-semibold text-gray-500">Observações</span>
                <span>
                  {safeText(
                    selectedCourse.observacoes || selectedCourse.observacao,
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-between border-t border-gray-200 p-5">
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>

              <a
                href="/app/cursos"
                className="rounded-lg bg-[#004b8d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003a70]"
              >
                Ver todos os cursos
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}