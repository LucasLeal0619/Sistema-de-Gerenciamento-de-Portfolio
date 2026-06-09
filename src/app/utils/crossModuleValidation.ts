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
  reason: string;
  check: string;
  reference?: string;
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

function withBusca(path: string, ...values: unknown[]) {
  const busca = firstText(...values);
  return busca ? `${path}?busca=${encodeURIComponent(busca)}` : path;
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
    reason: string,
    check: string,
    href: string,
    reference?: string,
  ) => {
    issues.push({ id: `v-${counter++}`, severity, modulo, message, reason, check, href, reference });
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
        "O registro existe no Plano de Metas, mas nenhum curso equivalente foi encontrado no modulo Cursos.",
        "Confira se o SIG, o SEI ou o titulo do curso estao iguais aos do catalogo importado.",
        withBusca("/app/plano-metas", meta.codigoSIG, meta.numeroSEI, curso),
        [
          meta.codigoSIG ? `SIG: ${meta.codigoSIG}` : "",
          meta.numeroSEI ? `SEI: ${meta.numeroSEI}` : "",
        ].filter(Boolean).join(" | "),
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
        "PCA",
        `${row.titulo || "Curso sem titulo"} sem curso correspondente por SIG, SEI ou titulo`,
        "O curso aparece no PCA, mas nao foi localizado no catalogo de Cursos.",
        "Confira se o curso deveria estar no catalogo ou se a linha de PCA possui SIG/SEI/titulo divergente.",
        withBusca("/app/valores-pca-2025", row.sig, row.sei, row.titulo),
        [
          row.sig ? `SIG: ${row.sig}` : "",
          row.sei ? `SEI: ${row.sei}` : "",
        ].filter(Boolean).join(" | "),
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
        "O mesmo SIG foi encontrado em Cursos e PCA, mas os titulos nao batem depois da normalizacao.",
        "Confira se e o mesmo curso com nome atualizado ou se uma das planilhas esta com o SIG reaproveitado/incorreto.",
        withBusca("/app/cursos", courseSig(course), titulo),
        `Curso: ${titulo} | PCA: ${pcaRow.titulo}`,
      );
    }
  });

  visitas.forEach((visita) => {
    if (!String(visita.processoSEI || "").trim()) {
      add(
        "error",
        "Visitas Tecnicas",
        `Visita em ${visita.unidade || "unidade nao informada"} sem processo SEI`,
        "A visita tecnica nao possui processo SEI preenchido.",
        "Informe o processo SEI ou marque a visita como pendente/cancelada, conforme a regra da area.",
        "/app/processos-visitas-tecnicas",
        [visita.unidade, visita.eixo, visita.dataVisitaPrevista].filter(Boolean).join(" | "),
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
        "O evento informa que possui acao extensiva vinculada, mas essa acao nao existe no modulo Acoes Extensivas.",
        "Confira se o nome da acao vinculada esta igual ao cadastro ou importe/cadastre a acao correspondente.",
        "/app/eventos",
        evento.acaoVinculada,
      );
    }
  });

  return issues;
}
