import {
  getAcoesExtensivas,
  getEventos,
  getPlanoMetas,
  getStoredCourses,
  getValoresPCA,
  getVisitas,
  type StoredCourseRecord,
} from "./store";

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  id: string;
  severity: ValidationSeverity;
  modulo: string;
  message: string;
  href: string;
};

function norm(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00A0/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normSei(value: unknown) {
  return norm(value).replace(/[^a-z0-9]/g, "");
}

function normSig(value: unknown) {
  return norm(value).replace(/[^a-z0-9]/g, "");
}

function normTitulo(value: unknown) {
  return norm(value)
    .replace(/\b(senac|df|curso|cursos|pca|cped)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstText(...values: unknown[]) {
  return values.map((value) => String(value ?? "").trim()).find(Boolean) ?? "";
}

function sameTitle(a: unknown, b: unknown) {
  const left = normTitulo(a);
  const right = normTitulo(b);
  if (!left || !right) return true;
  if (left === right) return true;
  return left.includes(right) || right.includes(left);
}

function courseTitle(course: StoredCourseRecord) {
  return firstText(
    course.titulo,
    course["Titulo - Nome do Curso"],
    course["TÃ­tulo - Nome do Curso"],
    course["Título - Nome do Curso"],
  );
}

function courseSig(course: StoredCourseRecord) {
  return firstText(
    course.codSIG,
    course.codigoSIG,
    course["CÃ³d. SIG"],
    course["Cód. SIG"],
    course["Código SIG"],
    course["Codigo SIG"],
  );
}

function courseSei(course: StoredCourseRecord) {
  return firstText(
    course.processoSEI,
    course["Processo SEI"],
    course["NÃšMERO SEI"],
    course["NÚMERO SEI"],
  );
}

export function runCrossModuleValidation(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let counter = 0;
  const add = (
    severity: ValidationSeverity,
    modulo: string,
    message: string,
    href: string,
  ) => {
    issues.push({ id: `v-${counter++}`, severity, modulo, message, href });
  };

  const cursos = getStoredCourses();
  const metas = getPlanoMetas();
  const pca = getValoresPCA();
  const visitas = getVisitas();
  const acoes = getAcoesExtensivas();
  const eventos = getEventos();

  const cursosPorSig = new Map<string, string>();
  const cursosPorSei = new Map<string, string>();
  const cursosPorTitulo = new Map<string, string>();

  cursos.forEach((course) => {
    const titulo = courseTitle(course);
    const label = titulo || courseSig(course) || courseSei(course) || "Curso sem titulo";
    const sig = normSig(courseSig(course));
    const sei = normSei(courseSei(course));
    const tituloKey = normTitulo(titulo);

    if (sig) cursosPorSig.set(sig, label);
    if (sei) cursosPorSei.set(sei, label);
    if (tituloKey) cursosPorTitulo.set(tituloKey, label);
  });

  const encontrarCurso = ({
    sig,
    sei,
    titulo,
  }: {
    sig?: unknown;
    sei?: unknown;
    titulo?: unknown;
  }) => {
    const sigKey = normSig(sig);
    if (sigKey && cursosPorSig.has(sigKey)) return cursosPorSig.get(sigKey);

    const seiKey = normSei(sei);
    if (seiKey && cursosPorSei.has(seiKey)) return cursosPorSei.get(seiKey);

    const tituloKey = normTitulo(titulo);
    if (tituloKey && cursosPorTitulo.has(tituloKey)) return cursosPorTitulo.get(tituloKey);

    return null;
  };

  metas.forEach((meta) => {
    const curso = firstText(meta.tipo, meta.curso, meta.categoria);
    const temIdentificador = Boolean(meta.codigoSIG || meta.numeroSEI || curso);
    const encontrado = encontrarCurso({
      sig: meta.codigoSIG,
      sei: meta.numeroSEI,
      titulo: curso,
    });

    if (!encontrado && temIdentificador) {
      add(
        "warning",
        "Plano de Metas",
        `${curso || "Curso sem nome"} nao foi localizado no catalogo por SIG, SEI ou titulo`,
        "/app/plano-metas",
      );
    }
  });

  pca.forEach((row) => {
    const temIdentificador = Boolean(row.sig || row.sei || row.titulo);
    const encontrado = encontrarCurso({
      sig: row.sig,
      sei: row.sei,
      titulo: row.titulo,
    });

    if (!encontrado && temIdentificador) {
      add(
        "warning",
        "Valores PCA",
        `${row.titulo || "Curso sem titulo"} sem curso correspondente por SIG, SEI ou titulo`,
        "/app/valores-pca-2025",
      );
    }
  });

  const pcaPorSig = new Map(
    pca
      .map((row) => [normSig(row.sig), row] as const)
      .filter(([sig]) => Boolean(sig)),
  );

  cursos.forEach((course) => {
    const sig = normSig(courseSig(course));
    const pcaRow = pcaPorSig.get(sig);
    const titulo = courseTitle(course);
    if (sig && pcaRow && pcaRow.titulo && titulo && !sameTitle(pcaRow.titulo, titulo)) {
      add(
        "warning",
        "Cursos x PCA",
        `SIG ${courseSig(course)}: titulo diverge entre Curso e PCA`,
        "/app/cursos",
      );
    }
  });

  visitas.forEach((visita) => {
    if (!String(visita.processoSEI || "").trim()) {
      add(
        "error",
        "Visitas Tecnicas",
        `Visita em ${visita.unidade || "unidade nao informada"} sem processo SEI`,
        "/app/processos-visitas-tecnicas",
      );
    }
  });

  const titulosAcoes = new Set(acoes.map((acao) => normTitulo(acao.titulo)));
  eventos.forEach((evento) => {
    if (
      norm(evento.possuiAcaoExtensiva).includes("sim") &&
      evento.acaoVinculada &&
      !titulosAcoes.has(normTitulo(evento.acaoVinculada))
    ) {
      add(
        "warning",
        "Eventos",
        `Evento "${evento.nome}": acao vinculada "${evento.acaoVinculada}" nao cadastrada`,
        "/app/eventos",
      );
    }
  });

  return issues;
}
