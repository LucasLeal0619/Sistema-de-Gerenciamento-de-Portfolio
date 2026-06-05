import * as XLSX from "xlsx";

const normalizarTexto = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u2000-\u200F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const txt = (v: unknown) =>
  String(v ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u2000-\u200F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const pick = (row: Record<string, unknown>, aliases: string[]) => {
  const entries = Object.entries(row);
  const aliasesNormalizados = aliases.map(normalizarTexto);

  for (const [key, value] of entries) {
    const keyNormalizada = normalizarTexto(key);

    if (aliasesNormalizados.includes(keyNormalizada) && txt(value)) {
      return txt(value);
    }
  }

  for (const [key, value] of entries) {
    const keyNormalizada = normalizarTexto(key);

    const encontrou = aliasesNormalizados.some((alias) => {
      const palavras = alias.split(" ").filter(Boolean);
      return palavras.every((palavra) => keyNormalizada.includes(palavra));
    });

    if (encontrou && txt(value)) {
      return txt(value);
    }
  }

  return "";
};

const addBusinessDays = (isoDate: string, days: number) => {
  if (!isoDate) return "";

  const d = new Date(isoDate);
  let added = 0;

  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();

    if (day !== 0 && day !== 6) {
      added++;
    }
  }

  return d.toISOString().slice(0, 10);
};

async function lerWorkbook(file: File) {
  const data = await file.arrayBuffer();

  return XLSX.read(data, {
    type: "array",
    cellDates: false,
    raw: false,
  });
}

function encontrarNomeAba(wb: XLSX.WorkBook, nomesPossiveis: string[]) {
  const abas = wb.SheetNames;
  const nomesNormalizados = nomesPossiveis.map(normalizarTexto);

  const exata = abas.find((aba) => nomesNormalizados.includes(normalizarTexto(aba)));
  if (exata) return exata;

  const porPalavras = abas.find((aba) => {
    const abaNormalizada = normalizarTexto(aba);

    return nomesNormalizados.some((nome) => {
      const palavras = nome.split(" ").filter(Boolean);
      return palavras.every((palavra) => abaNormalizada.includes(palavra));
    });
  });

  if (porPalavras) return porPalavras;

  return abas.find((aba) => {
    const abaNormalizada = normalizarTexto(aba);
    return nomesNormalizados.some((nome) => abaNormalizada.includes(nome) || nome.includes(abaNormalizada));
  });
}


function lerAbaComCabecalhoAutomatico(
  wb: XLSX.WorkBook,
  sheetNameOrAliases: string | string[],
  palavrasObrigatorias: string[],
  palavrasComplementares: string[] = [],
) {
  const aliases = Array.isArray(sheetNameOrAliases)
    ? sheetNameOrAliases
    : [sheetNameOrAliases];

  const sheetName = encontrarNomeAba(wb, aliases);

  if (!sheetName) {
    console.warn(`Aba não encontrada: ${aliases.join(" / ")}`);
    return { sheetName: "", rows: [] as Record<string, unknown>[] };
  }

  const ws = wb.Sheets[sheetName];
  const matriz = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    raw: false,
  });

  const obrigatorias = palavrasObrigatorias.map(normalizarTexto);
  const complementares = palavrasComplementares.map(normalizarTexto);

  let melhorLinha = -1;
  let melhorPontuacao = 0;

  matriz.forEach((linha, index) => {
    const celulas = linha.map(normalizarTexto).filter(Boolean);
    if (!celulas.length) return;

    const textoLinha = celulas.join(" | ");

    const obrigatoriasEncontradas = obrigatorias.filter((palavra) =>
      textoLinha.includes(palavra),
    ).length;

    const complementaresEncontradas = complementares.filter((palavra) =>
      textoLinha.includes(palavra),
    ).length;

    const pontuacao = obrigatoriasEncontradas * 3 + complementaresEncontradas;

    if (obrigatoriasEncontradas >= 2 && pontuacao > melhorPontuacao) {
      melhorLinha = index;
      melhorPontuacao = pontuacao;
    }
  });

  if (melhorLinha < 0) {
    console.warn(`Cabeçalho não encontrado automaticamente na aba: ${sheetName}`);
    return { sheetName, rows: [] as Record<string, unknown>[] };
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    range: melhorLinha,
    defval: "",
    raw: false,
  });

  return { sheetName, rows };
}

function lerAba(
  wb: XLSX.WorkBook,
  sheetNameOrAliases: string | string[],
  headerRowZeroBased: number,
) {
  const aliases = Array.isArray(sheetNameOrAliases)
    ? sheetNameOrAliases
    : [sheetNameOrAliases];

  const sheetName = encontrarNomeAba(wb, aliases);

  if (!sheetName) {
    alert(
      `Aba não encontrada na planilha.\n\nProcurado por: ${aliases.join(
        " / ",
      )}\n\nAbas disponíveis: ${wb.SheetNames.join(" | ")}`,
    );
    return [];
  }

  const ws = wb.Sheets[sheetName];

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    range: headerRowZeroBased,
    defval: "",
    raw: false,
  });
}

/* ─────────────────────────────
   PLANO DE METAS
───────────────────────────── */

export async function importarPlanoMetasExcel(file: File) {
  const wb = await lerWorkbook(file);

  return lerAba(wb, ["PLANO DE METAS 2025", "Plano de Metas", "Metas 2025"], 1)
    .filter((row) => {
      return (
        pick(row, ["NÚMERO SEI", "Numero SEI", "SEI"]) ||
        pick(row, ["SEGMENTO", "Segmento"]) ||
        pick(row, ["CURSO", "Titulo", "Título"])
      );
    })
    .map((row) => ({
      responsavel: pick(row, ["NOVOS TÍTULOS 2025 - PLANO DE METAS", "Responsável", "Responsavel", "__EMPTY"]),
      segmento: pick(row, ["SEGMENTO", "Segmento"]),
      tipo: pick(row, [" ", "__EMPTY_1", "__EMPTY", "CURSO", "Título", "Titulo", "Nome do Curso"]),
      categoria: pick(row, ["TIPO", "Categoria"]) || "Não informado",
      numeroSEI: pick(row, ["NÚMERO SEI", "Numero SEI", "SEI"]),
      codigoSIG: pick(row, ["CÓDIGO SIG", "Codigo SIG", "SIG"]),
      mesEntrega: pick(row, ["MÊS DE ENTREGA", "Mes de Entrega", "Mês Entrega"]),
      status: pick(row, ["STATUS", "Status"]) || "EM ANÁLISE",
      origem: pick(row, ["ORIGEM", "Origem"]),
      observacao: pick(row, ["OBSERVAÇÃO", "Observacao", "Observação"]),
      statusFinal: pick(row, ["STATUS.1", "Status Final", "Status final"]),
    }));
}

/* ─────────────────────────────
   VALORES PCA
───────────────────────────── */

export async function importarValoresPCAExcel(file: File) {
  const wb = await lerWorkbook(file);

  return lerAba(
    wb,
    [
      "Valores PCA 2025 - Retificativo",
      "Retificativos PCA 2025",
      "Retificativos PCA_2025",
      "Valores PCA",
      "PCA 2025",
    ],
    0,
  )
    .filter((row) => pick(row, ["SEI", "Processo SEI"]) && pick(row, ["Títulos Retificativos PCA 2025 - CPED", "Título", "Titulo"]))
    .map((row) => ({
      ano: "2025",
      sei: pick(row, ["SEI", "Processo SEI"]),
      sig: pick(row, ["SIG", "Código SIG", "Codigo SIG"]),
      titulo: pick(row, [
        "Títulos Retificativos PCA 2025 - CPED",
        "Titulos Retificativos PCA 2025 - CPED",
        "Título",
        "Titulo",
        "Curso",
      ]),
      eixo: pick(row, ["Eixo", "Segmento"]),
      unidade: pick(row, ["Unidade"]),
      ch: pick(row, ["CH", "Carga Horária", "Carga Horaria"]),
      valor: pick(row, ["Precificação", "Precificacao", "Valor"]),
      status: pick(row, ["Status"]) || "Vigente",
      observacao: pick(row, ["Observação", "Observacao", "OBSERVAÇÃO"]),
      precificacao: pick(row, ["Precificação", "Precificacao"]),
      valorPrimeiroModulo: pick(row, ["Valor 1º Módulo", "Valor 1 Modulo", "Valor Primeiro Modulo"]),
      parcelasBoleto: pick(row, ["N° Parcelas - Boleto", "Nº Parcelas - Boleto", "Parcelas Boleto"]),
      valorParcelaBoleto: pick(row, [
        "Valor Parcela - Boleto",
        "Valor Parcela Boleto",
        "Parcela Boleto",
      ]),
      parcelasCartao: pick(row, [
        "N° Parcelas - Cartão",
        "Nº Parcelas - Cartão",
        "N° Parcelas - Cartao",
        "Parcelas Cartão",
        "Parcelas Cartao",
      ]),
      valorCartao: pick(row, ["Valor - Cartão", "Valor - Cartao", "Valor Cartão", "Valor Cartao"]),
      parcelaDesc20: pick(row, [
        "Parcela com desc de 20%",
        "Parcelas 20%",
        "Parcela 20%",
        "Desconto 20%",
      ]),
      parcelaDesc15: pick(row, [
        "Parcela com desc de 15%",
        "Parcela com 15%",
        "Parcela 15%",
        "Desconto 15%",
      ]),
    }));
}

/* ─────────────────────────────
   QUANTIDADE DE CURSOS POR EIXO
───────────────────────────── */

export async function importarCursosEixoExcel(file: File) {
  const wb = await lerWorkbook(file);

  const raw = lerAba(
    wb,
    ["Quantidade de cursos por eixo", "Cursos por eixo", "Quantidade por eixo"],
    0,
  );

  const cursosNovos = lerAba(wb, ["CURSOS NOVOS PCA_2025", "Cursos Novos PCA", "Cursos Novos"], 2)
    .map((row) => pick(row, ["CURSO", "Curso", "Nome do Curso"]).toLowerCase())
    .filter(Boolean);

  const resultado: Array<{
    ano: string;
    eixo: string;
    unidade: string;
    curso: string;
    ch: string;
    status: string;
    observacao: string;
    quantidadeCursosSegmento: string;
    turmas: string;
    codigo: string;
    alunos: string;
    instrutores: string;
    isNovo: boolean;
  }> = [];

  let segmentoAtual = "";
  let qtdAtual = "";
  let cursoAtual = "";
  let chAtual = "";

  for (const row of raw) {
    const segmento = pick(row, ["SEGMENTO", "Segmento", "Eixo"]);
    const qtd = pick(row, ["Quantidade de Cursos", "Qtd Cursos"]);
    const curso = pick(row, ["Cursos", "Curso", "Nome do Curso"]);
    const ch = pick(row, ["CH do curso", "CH", "Carga Horária", "Carga Horaria"]);
    const turmas = pick(row, ["Turmas (2º Semestre)", "Turmas", "Turmas 2 Semestre"]);
    const codigo = pick(row, ["Codigo", "Código", "Código SIG", "Codigo SIG"]);
    const alunos = pick(row, ["Alunos (Matriculas)", "Alunos", "Matrículas", "Matriculas"]);
    const instrutores = pick(row, ["instrutores", "Instrutores"]);

    if (segmento) segmentoAtual = segmento;
    if (qtd) qtdAtual = qtd;
    if (curso) cursoAtual = curso;
    if (ch) chAtual = ch;

    if (!cursoAtual && !codigo && !instrutores) continue;

    resultado.push({
      ano: "2025",
      eixo: segmentoAtual,
      unidade: "",
      curso: cursoAtual,
      ch: chAtual,
      status: "Ativo",
      observacao: "",
      quantidadeCursosSegmento: qtdAtual,
      turmas,
      codigo,
      alunos,
      instrutores,
      isNovo: cursosNovos.includes(cursoAtual.toLowerCase()),
    });
  }

  return resultado;
}

/* ─────────────────────────────
   VISITAS TÉCNICAS
───────────────────────────── */

export async function importarVisitasTecnicasExcel(file: File) {
  const wb = await lerWorkbook(file);

  return lerAba(
    wb,
    ["Processos de Visitas Técnicas", "Visitas Técnicas", "Visitas Tecnicas"],
    1,
  )
    .filter((row) => pick(row, ["PROCESSO SEI", "Processo SEI", "SEI"]))
    .map((row) => {
      const dataSolicitacao = new Date().toISOString().slice(0, 10);

      return {
        ano: "2025",
        unidade: pick(row, ["Relação dos CEP´s", "Relação dos CEP's", "Relação dos CEPs", "Unidade"]),
        eixo: pick(row, ["Eixo", "Segmento"]),
        processoSEI: pick(row, ["PROCESSO SEI", "Processo SEI", "SEI"]),
        dataSolicitacao,
        dataVisitaPrevista: pick(row, ["Data Prevista", "Data da Visita", "Data Visita"]),
        prazoLimite: addBusinessDays(dataSolicitacao, 30),
        status: pick(row, ["Status"]) || "Solicitada",
        responsavel: pick(row, ["Responsável", "Responsavel"]),
        relatorio: pick(row, ["Relatório", "Relatorio"]),
        observacao: pick(row, ["Observação", "Observacao", "OBSERVAÇÃO"]),
      };
    });
}

/* ─────────────────────────────
   HORAS PEDAGÓGICAS
───────────────────────────── */

export async function importarHorasPedagogicasExcel(file: File) {
  const wb = await lerWorkbook(file);

  return lerAba(
    wb,
    ["Processos Horas Pedagógicas", "Horas Pedagógicas", "Horas Pedagogicas"],
    1,
  )
    .filter((row) => pick(row, ["PROCESSO SEI", "Processo SEI", "SEI"]))
    .map((row) => ({
      ano: "2025",
      processoSEI: pick(row, ["PROCESSO SEI", "Processo SEI", "SEI"]),
      eixo: pick(row, ["Eixo"]),
      segmento: pick(row, ["Segmentos", "Segmento"]),
      nomePessoa: pick(row, ["Nome", "Nome da Pessoa", "Pessoa", "Instrutor"]),
      matricula: pick(row, ["Matrícula", "Matricula"]),
      motivo: pick(row, ["Motivo", "Motivo da Solicitação", "Motivo da Solicitacao"]),
      observacao: pick(row, ["Observação", "Observacao", "OBSERVAÇÃO"]),
      status: pick(row, ["Status"]) || "Solicitada",
    }));
}

/* ─────────────────────────────
   CATÁLOGO DE CURSOS
───────────────────────────── */

const COURSE_SHEETS = [
  { sheet: ["Gastronomia e Turismo", "Gastronomia", "Turismo"] },
  { sheet: ["Saúde", "Saude", "Ambiente e Saúde", "Ambiente e Saude"] },
  { sheet: ["Gestão e Moda", "Gestao e Moda", "Gestão", "Gestao"] },
  { sheet: ["Tecnologia e Economia Criativa", "Tecnologia", "Economia Criativa"] },
  { sheet: ["Beleza e Cuidado Pessoal", "Beleza"] },
  { sheet: ["60+", "Sessenta Mais"] },
  { sheet: ["Ensino Médio 2025", "Ensino Medio 2025", "Ensino Médio", "Ensino Medio"] },
] as const;

function normalizarEixoCurso(sheetName: string) {
  const sheet = normalizarTexto(sheetName);

  if (sheet.includes("gastronomia") || sheet.includes("turismo")) {
    return "Gastronomia";
  }

  if (sheet.includes("saude")) {
    return "Ambiente e Saúde";
  }

  if (sheet.includes("gestao") || sheet.includes("moda")) {
    return "Gestão e Moda";
  }

  if (sheet.includes("tecnologia") || sheet.includes("economia")) {
    return "Tecnologia e Economia Criativa";
  }

  if (sheet.includes("beleza")) {
    return "Beleza e Cuidado Pessoal";
  }

  if (sheet.includes("60") || sheet.includes("sessenta")) {
    return "60+";
  }

  if (sheet.includes("ensino")) {
    return "Ensino Médio";
  }

  return sheetName;
}

function normalizarStatusCurso(statusRaw: string) {
  const status = txt(statusRaw);
  if (!status) return "ATIVO";

  const statusNormalizado = normalizarTexto(status);

  if (statusNormalizado.includes("inativo")) return "INATIVO";
  if (statusNormalizado.includes("ativo")) return "ATIVO";
  if (statusNormalizado.includes("publicado")) return "PUBLICADO";
  if (statusNormalizado.includes("arquivado")) return "ARQUIVADO";

  return status;
}

const ehLinhaDeCursoValida = (row: Record<string, unknown>) => {
  const titulo = pick(row, [
    "Titulo - Nome do Curso",
    "Título - Nome do Curso",
    "Título - Nome do Curso ",
    "CURSO",
    "Curso",
    "Nome do Curso",
  ]);

  const tituloNormalizado = normalizarTexto(titulo);

  if (!titulo) return false;
  if (["total", "quantidades", "modalidade"].includes(tituloNormalizado)) return false;

  return true;
};

export async function importarCursosPortfolio(file: File) {
  const wb = await lerWorkbook(file);

  return COURSE_SHEETS.flatMap(({ sheet }) => {
    const { sheetName, rows } = lerAbaComCabecalhoAutomatico(
      wb,
      [...sheet],
      ["titulo", "curso", "ch"],
      [
        "status",
        "segmento",
        "modalidade",
        "cod sig",
        "codigo sig",
        "processo sei",
        "tipo",
        "ultima revisao",
        "valor",
        "observacoes",
      ],
    );

    if (!sheetName || !rows.length) {
      console.warn(`Aba de curso não importada: ${sheet.join(" / ")}`);
      return [];
    }

    const eixoSistema = normalizarEixoCurso(sheetName);

    return rows
      .filter(ehLinhaDeCursoValida)
      .map((row) => {
        const segmentoPlanilha = pick(row, ["Segmento ", "Segmento", "SEGMENTO", "Eixo"]);
        const titulo = pick(row, [
          "Titulo - Nome do Curso",
          "Título - Nome do Curso ",
          "Título - Nome do Curso",
          "CURSO",
          "Curso",
          "Nome do Curso",
        ]);

        const status = normalizarStatusCurso(
          pick(row, [
            "Status SIG (Ativo ou Inativo)",
            "Status SIG\n(Ativo ou Inativo)",
            "Status SIG",
            "Status",
          ]),
        );

        const observacao = pick(row, [
          "Observações de Conferência",
          "Observacoes de Conferencia",
          "Observações de conferência",
          "Observações / Orientações",
          "Observacoes / Orientacoes",
          "Observações/Orientações",
          "Observacoes/Orientacoes",
          "Observações Eixo",
          "Observacoes Eixo",
          "Observação",
          "Observacao",
          "OBSERVAÇÃO",
        ]);

        const valor = pick(row, ["Valores ", "Valores", "Valor", "Precificação", "Precificacao"]);

        return {
          id: crypto.randomUUID(),
          origemSheet: sheetName,
          eixo: eixoSistema,
          segmento: eixoSistema,
          segmentoPlanilha,
          modalidade: pick(row, ["Modalidade ", "Modalidade"]),
          titulo,
          ch: pick(row, ["CH", "Carga Horária", "Carga Horaria"]),
          codDN: pick(row, ["Cód. DN", "Cod. DN", "Código DN", "Codigo DN"]),
          codSIG: pick(row, ["Cód. SIG", "Cod. SIG", "Código SIG", "Codigo SIG"]),
          ident: pick(row, ["Ident.", "Ident"]),
          tipo: pick(row, ["TIPO", "Tipo"]),
          ultimaRevisao: pick(row, ["Última Revisão", "Última revisão", "Ultima Revisao", "Ident.", "Ident"]),
          ano: pick(row, ["Última Revisão", "Última revisão", "Ultima Revisao"]),
          processoSEI: pick(row, ["Processo SEI", "NÚMERO SEI", "Numero SEI", "SEI"]),
          valor,
          valores: valor,
          unidade: pick(row, [
            "UNIDADE QUE PODE SER RODADO",
            "Unidade que pode ser rodado",
            "Unidade",
          ]),
          status,
          observacao,
          observacoes: observacao,
          compativelBolsa: pick(row, ["Compatível com bolsa", "Compativel com bolsa"]),
          comercial: pick(row, ["Comercial*"]),
          pcn: pick(row, ["PCN"]),
          pcr: pick(row, ["PCR"]),
          resolucao: pick(row, ["Resolução", "Resolucao"]),
        };
      });
  });
}
