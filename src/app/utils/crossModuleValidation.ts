import {
  getAcoesExtensivas,
  getEventos,
  getPlanoMetas,
  getStoredCourses,
  getValoresPCA,
  getVisitas,
} from "./store";

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  id: string;
  severity: ValidationSeverity;
  modulo: string;
  message: string;
  href: string;
};

function norm(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normSei(value: string) {
  return norm(value).replace(/[^a-z0-9]/g, "");
}

function normSig(value: string) {
  return norm(value).replace(/\s+/g, "");
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

  const seisCursos = new Set(
    cursos.map((c) => normSei(c.processoSEI || "")).filter(Boolean),
  );
  const sigsCursos = new Map<string, string>();
  cursos.forEach((c) => {
    const sig = normSig(c.codSIG || "");
    if (sig) sigsCursos.set(sig, c.titulo || sig);
  });

  metas.forEach((m) => {
    const curso = String(m.tipo || "").trim();
    const sei = normSei(m.numeroSEI || "");
    const sig = normSig(m.codigoSIG || "");

    if (sei && !seisCursos.has(sei)) {
      add(
        "warning",
        "Plano de Metas",
        `SEI ${m.numeroSEI} (${curso || "sem nome"}) não encontrado nos Cursos`,
        "/app/plano-metas",
      );
    }

    if (sig && !sigsCursos.has(sig)) {
      add(
        "warning",
        "Plano de Metas",
        `SIG ${m.codigoSIG} (${curso || "sem nome"}) não encontrado nos Cursos`,
        "/app/plano-metas",
      );
    }
  });

  pca.forEach((p) => {
    const sig = normSig(p.sig || "");
    if (sig && !sigsCursos.has(sig)) {
      add(
        "warning",
        "Valores PCA",
        `SIG ${p.sig} (${p.titulo || "sem título"}) sem curso correspondente`,
        "/app/valores-pca-2025",
      );
    }
  });

  const sigsPca = new Map(pca.map((p) => [normSig(p.sig || ""), p]));
  cursos.forEach((c) => {
    const sig = normSig(c.codSIG || "");
    const pcaRow = sigsPca.get(sig);
    if (sig && pcaRow && pcaRow.titulo && c.titulo) {
      if (norm(pcaRow.titulo) !== norm(c.titulo)) {
        add(
          "warning",
          "Cursos × PCA",
          `SIG ${c.codSIG}: título diverge entre Curso e PCA`,
          "/app/cursos",
        );
      }
    }
  });

  visitas.forEach((v) => {
    if (!String(v.processoSEI || "").trim()) {
      add(
        "error",
        "Visitas Técnicas",
        `Visita em ${v.unidade || "unidade não informada"} sem processo SEI`,
        "/app/processos-visitas-tecnicas",
      );
    }
  });

  const titulosAcoes = new Set(acoes.map((a) => norm(a.titulo)));
  eventos.forEach((e) => {
    if (
      norm(e.possuiAcaoExtensiva).includes("sim") &&
      e.acaoVinculada &&
      !titulosAcoes.has(norm(e.acaoVinculada))
    ) {
      add(
        "warning",
        "Eventos",
        `Evento "${e.nome}": ação vinculada "${e.acaoVinculada}" não cadastrada`,
        "/app/eventos",
      );
    }
  });

  return issues;
}
