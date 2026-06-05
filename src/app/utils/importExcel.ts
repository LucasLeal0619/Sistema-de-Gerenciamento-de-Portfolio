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

  const sheetName =
    encontrarNomeAba(wb, [
      "PLANO DE METAS 2025",
      "NOVOS TÍTULOS 2025 - PLANO DE METAS",
      "NOVOS TITULOS 2025 - PLANO DE METAS",
      "Plano de Metas",
      "Metas 2025",
      "Cursos",
      "CURSOS",
    ]) || "";

  if (!sheetName) {
    alert(
      `Aba de Plano de Metas não encontrada.\n\nAbas disponíveis: ${wb.SheetNames.join(
        " | ",
      )}`,
    );

    return [];
  }

  const ws = wb.Sheets[sheetName];

  const matriz = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  const normalizarHeader = (value: unknown) =>
    normalizarTexto(value)
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  let headerRow = -1;

  for (let i = 0; i < Math.min(matriz.length, 120); i++) {
    const linha = matriz[i] || [];
    const headers = linha.map(normalizarHeader);

    const temSegmento = headers.some((h) => h === "segmento");
    const temTipo = headers.some((h) => h === "tipo");
    const temSei = headers.some((h) => h.includes("sei"));
    const temStatus = headers.some((h) => h.includes("status"));
    const temOrigem = headers.some((h) => h.includes("origem"));
    const temObservacao = headers.some((h) => h.includes("observacao"));
    const temMesEntrega = headers.some(
      (h) => h.includes("mes") && h.includes("entrega"),
    );

    const pareceCabecalhoPlano =
      temSegmento &&
      temTipo &&
      temSei &&
      temStatus &&
      (temMesEntrega || temOrigem || temObservacao);

    if (pareceCabecalhoPlano) {
      headerRow = i;
      break;
    }
  }

  if (headerRow < 0) {
    alert(
      `Cabeçalho do Plano de Metas não encontrado na aba "${sheetName}".\n\nA importação espera uma tabela com colunas próximas de: SEGMENTO, CURSO, TIPO, NÚMERO SEI, CÓDIGO SIG, MÊS DE ENTREGA, STATUS, ORIGEM, OBSERVAÇÃO e STATUS FINAL.`,
    );

    return [];
  }

  const headers = (matriz[headerRow] || []).map(normalizarHeader);

  const findIndex = (aliases: string[]) => {
    const normalizedAliases = aliases.map(normalizarHeader);

    const exact = headers.findIndex((header) => normalizedAliases.includes(header));

    if (exact >= 0) return exact;

    return headers.findIndex((header) =>
      normalizedAliases.some((alias) => {
        if (!alias) return false;
        if (header === alias) return true;
        if (header.includes(alias)) return true;

        const palavras = alias.split(" ").filter(Boolean);

        return palavras.every((palavra) => header.includes(palavra));
      }),
    );
  };

  let idxSegmento = findIndex(["SEGMENTO"]);
  let idxTipo = findIndex(["TIPO", "CATEGORIA"]);
  let idxCurso = findIndex(["CURSO", "NOME DO CURSO", "TÍTULO", "TITULO"]);
  let idxNumeroSEI = findIndex(["NÚMERO SEI", "NUMERO SEI", "PROCESSO SEI", "SEI"]);
  let idxCodigoSIG = findIndex(["CÓDIGO SIG", "CODIGO SIG", "SIG"]);
  let idxMesEntrega = findIndex(["MÊS DE ENTREGA", "MES DE ENTREGA"]);
  let idxOrigem = findIndex(["ORIGEM"]);
  let idxObservacao = findIndex(["OBSERVAÇÃO", "OBSERVACAO", "JUSTIFICATIVA"]);

  const statusIndexes = headers
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => header === "status" || header.includes("status"))
    .map(({ index }) => index);

  let idxStatus = statusIndexes[0] ?? -1;
  let idxStatusFinal = statusIndexes.length > 1 ? statusIndexes[statusIndexes.length - 1] : -1;

  /*
    A planilha real do Plano de Metas usa esta ordem visual:
    SEGMENTO | CURSO | TIPO | NÚMERO SEI | CÓDIGO SIG | MÊS DE ENTREGA | STATUS | ORIGEM | OBSERVAÇÃO | STATUS FINAL

    Em algumas exportações o cabeçalho CURSO vem vazio/mesclado.
    Por isso, quando encontrar SEGMENTO e TIPO, assumimos que CURSO é a coluna entre eles.
  */
  if (idxSegmento < 0) idxSegmento = 0;
  if (idxTipo < 0) idxTipo = 2;

  if (idxCurso < 0) {
    if (idxTipo > idxSegmento + 1) {
      idxCurso = idxTipo - 1;
    } else {
      idxCurso = 1;
    }
  }

  if (idxNumeroSEI < 0) idxNumeroSEI = idxTipo + 1;
  if (idxCodigoSIG < 0) idxCodigoSIG = idxNumeroSEI + 1;
  if (idxMesEntrega < 0) idxMesEntrega = idxCodigoSIG + 1;
  if (idxStatus < 0) idxStatus = idxMesEntrega + 1;
  if (idxOrigem < 0) idxOrigem = idxStatus + 1;
  if (idxObservacao < 0) idxObservacao = idxOrigem + 1;
  if (idxStatusFinal < 0) idxStatusFinal = idxObservacao + 1;

  const getCell = (row: unknown[], index: number) => {
    if (index < 0) return "";
    return txt(row[index]);
  };

  const registros = matriz
    .slice(headerRow + 1)
    .map((row) => {
      const linha = Array.isArray(row) ? row : [];

      const segmento = getCell(linha, idxSegmento);
      const curso = getCell(linha, idxCurso);
      const categoria = getCell(linha, idxTipo);
      const numeroSEI = getCell(linha, idxNumeroSEI);
      const codigoSIG = getCell(linha, idxCodigoSIG);
      const mesEntrega = getCell(linha, idxMesEntrega);
      const status = getCell(linha, idxStatus);
      const origem = getCell(linha, idxOrigem);
      const observacao = getCell(linha, idxObservacao);
      const statusFinal = getCell(linha, idxStatusFinal);

      return {
        segmento,
        curso,
        tipo: curso,
        categoria: categoria || "—",
        numeroSEI,
        codigoSIG,
        mesEntrega,
        status: status || "—",
        origem,
        observacao,
        responsavel: "",
        statusFinal,
      };
    })
    .filter((row) => {
      const segmento = normalizarTexto(row.segmento);
      const curso = normalizarTexto(row.curso);
      const tipo = normalizarTexto(row.categoria);
      const sei = normalizarTexto(row.numeroSEI);
      const status = normalizarTexto(row.status);
      const origem = normalizarTexto(row.origem);
      const observacao = normalizarTexto(row.observacao);
      const statusFinal = normalizarTexto(row.statusFinal);

      const linhaVazia =
        !segmento &&
        !curso &&
        !tipo &&
        !sei &&
        !status &&
        !origem &&
        !observacao &&
        !statusFinal;

      const cabecalhoRepetido =
        segmento === "segmento" ||
        curso === "curso" ||
        tipo === "tipo" ||
        sei === "numero sei" ||
        sei === "número sei" ||
        status === "status";

      const linhaDeTitulo =
        curso.includes("novos titulos") ||
        curso.includes("plano de metas") ||
        segmento.includes("novos titulos") ||
        segmento.includes("plano de metas");

      /*
        Não importar linhas que pertencem a outras abas/listas.
        Plano de Metas precisa ter pelo menos segmento + curso,
        ou curso + SEI, ou status/origem/observação com curso.
      */
      const pareceRegistroPlano =
        (segmento && curso) ||
        (curso && sei) ||
        (curso && (status || origem || observacao || statusFinal));

      return !linhaVazia && !cabecalhoRepetido && !linhaDeTitulo && pareceRegistroPlano;
    });

  return registros;
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