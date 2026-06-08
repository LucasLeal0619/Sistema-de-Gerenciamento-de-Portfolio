import * as XLSX from "xlsx";
import { detectarAnoEmTexto, extrairAnoReferencia } from "./extrairAno";
import { toastError } from "./toast";

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

const PATTERN_SEI = /^\d{4}\.\d{6,}/;

function pareceNumeroSei(value: unknown) {
  return PATTERN_SEI.test(txt(value));
}

function pareceLinhaSeparadorAnoCursosEixo(textoNorm: string, linha: unknown[]) {
  const anoNaLinha = detectarAnoEmTexto(textoNorm);
  if (!anoNaLinha) return false;

  if (/\bquantidade de cursos\b/.test(textoNorm)) return true;
  if (/\bcursos por eixo\b/.test(textoNorm)) return true;
  if (/\bquantidade\b/.test(textoNorm) && /\bpor eixo\b/.test(textoNorm)) return true;

  const celulasPreenchidas = linha.filter((cell) => txt(cell)).length;
  if (celulasPreenchidas > 3) return false;

  return linha.every((cell) => {
    const valor = txt(cell);
    if (!valor) return true;

    const normalizado = normalizarTexto(valor);
    return (
      normalizado === anoNaLinha ||
      /\bquantidade\b/.test(normalizado) ||
      /\bcurso(s)?\b/.test(normalizado) ||
      /\beixo\b/.test(normalizado) ||
      /\bsegmento\b/.test(normalizado) ||
      /\bexercicio\b/.test(normalizado)
    );
  });
}

function pareceTituloSecaoVisita(unidade: string) {
  const normalizado = normalizarTexto(unidade);
  return (
    normalizado.includes("processos de visitas tecnicas") ||
    normalizado.includes("visitas tecnicas 20")
  );
}

function parseDataFlexivel(value: string) {
  const raw = txt(value);
  if (!raw) return null;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split("/").map(Number);
    return new Date(year, month - 1, day);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const addBusinessDays = (dateValue: string, days: number) => {
  const d = parseDataFlexivel(dateValue);
  if (!d) return "";

  let added = 0;

  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();

    if (day !== 0 && day !== 6) {
      added++;
    }
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${day}/${month}/${year}`;
};

function limitarMatrizPlanilha(ws: XLSX.WorkSheet, maxRows = 2000) {
  const ref = ws["!ref"];
  if (!ref) return [] as unknown[][];

  const range = XLSX.utils.decode_range(ref);
  range.e.r = Math.min(range.e.r, maxRows);

  return XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    raw: false,
    range,
  });
}

function detectarColunaSeiNasLinhas(linhas: unknown[][], amostra = 25) {
  const maxCols = linhas.slice(0, amostra).reduce((max, row) => {
    const cols = Array.isArray(row) ? row.length : 0;
    return Math.max(max, cols);
  }, 0);

  let melhorColuna = -1;
  let melhorPontuacao = 0;

  for (let col = 0; col < maxCols; col++) {
    const matches = linhas.slice(0, amostra).filter((row) => {
      const linha = Array.isArray(row) ? row : [];
      return pareceNumeroSei(linha[col]);
    }).length;

    if (matches > melhorPontuacao) {
      melhorPontuacao = matches;
      melhorColuna = col;
    }
  }

  return melhorPontuacao >= 3 ? melhorColuna : -1;
}

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
    toastError(
      "Aba não encontrada na planilha.",
      `Procurado: ${aliases.join(" / ")}. Disponíveis: ${wb.SheetNames.join(", ")}`,
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

type HeaderMatch = {
  sheetName: string;
  headerRow: number;
};

function normalizarCabecalhoPlano(value: unknown) {
  return normalizarTexto(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function headerContem(header: string, termos: string[]) {
  const headerNormalizado = normalizarCabecalhoPlano(header);

  return termos.some((termo) => {
    const termoNormalizado = normalizarCabecalhoPlano(termo);
    if (!termoNormalizado) return false;

    if (headerNormalizado === termoNormalizado) return true;
    if (headerNormalizado.includes(termoNormalizado)) return true;

    const palavras = termoNormalizado.split(" ").filter(Boolean);
    return palavras.every((palavra) => headerNormalizado.includes(palavra));
  });
}

function encontrarIndiceCabecalho(cabecalho: string[], termos: string[]) {
  const indiceExato = cabecalho.findIndex((header) => {
    const normalizado = normalizarCabecalhoPlano(header);
    return termos.map(normalizarCabecalhoPlano).includes(normalizado);
  });

  if (indiceExato >= 0) return indiceExato;

  return cabecalho.findIndex((header) => headerContem(header, termos));
}

function encontrarAbaPlanoMetas(wb: XLSX.WorkBook): HeaderMatch {
  const nomesPossiveis = [
    "PLANO DE METAS 2025",
    "NOVOS TÍTULOS 2025 - PLANO DE METAS",
    "NOVOS TITULOS 2025 - PLANO DE METAS",
    "Títulos novos 16-05",
    "Titulos novos 16-05",
    "Plano de Metas",
    "Metas 2025",
    "Cursos",
    "CURSOS",
  ];

  const nomesNormalizados = nomesPossiveis.map(normalizarTexto);

  const candidatasPorNome = wb.SheetNames.filter((sheetName) => {
    const sheetNameNormalizado = normalizarTexto(sheetName);

    return nomesNormalizados.some((nome) => {
      const palavras = nome.split(" ").filter(Boolean);

      return (
        sheetNameNormalizado === nome ||
        sheetNameNormalizado.includes(nome) ||
        nome.includes(sheetNameNormalizado) ||
        palavras.every((palavra) => sheetNameNormalizado.includes(palavra))
      );
    });
  });

  const candidatas = [
    ...candidatasPorNome,
    ...wb.SheetNames.filter((sheetName) => !candidatasPorNome.includes(sheetName)),
  ];

  let melhor: HeaderMatch = {
    sheetName: "",
    headerRow: -1,
  };

  let melhorPontuacao = 0;

  for (const sheetName of candidatas) {
    const ws = wb.Sheets[sheetName];

    if (!ws) continue;

    const matriz = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: "",
      raw: false,
    });

    for (let index = 0; index < Math.min(matriz.length, 60); index++) {
      const linha = matriz[index] || [];
      const celulas = linha.map(normalizarCabecalhoPlano).filter(Boolean);
      const textoLinha = celulas.join(" | ");

      if (!textoLinha) continue;

      const temSegmento = celulas.some((cell) => cell === "segmento" || cell.includes("segmento"));
      const temCurso = celulas.some((cell) => cell === "curso" || cell.includes("nome do curso") || cell.includes("titulo"));
      const temTipo = celulas.some((cell) => cell === "tipo" || cell.includes("categoria"));
      const temSei = celulas.some((cell) => cell.includes("sei"));
      const temMesEntrega = celulas.some((cell) => cell.includes("mes") && cell.includes("entrega"));
      const temStatus = celulas.some((cell) => cell.includes("status"));
      const temOrigem = celulas.some((cell) => cell.includes("origem"));
      const temObservacao = celulas.some((cell) => cell.includes("observacao"));
      const temColunaCursoSemTitulo = (linha as unknown[]).some(
        (cell, colIndex) =>
          !txt(cell) &&
          colIndex > 0 &&
          normalizarCabecalhoPlano((linha as unknown[])[colIndex - 1]) === "segmento",
      );

      let pontuacao = 0;

      if (temSegmento) pontuacao += 3;
      if (temCurso) pontuacao += 4;
      if (temTipo) pontuacao += 2;
      if (temSei) pontuacao += 4;
      if (temMesEntrega) pontuacao += 3;
      if (temStatus) pontuacao += 3;
      if (temOrigem) pontuacao += 2;
      if (temObservacao) pontuacao += 2;
      if (temColunaCursoSemTitulo) pontuacao += 3;

      const parecePlanoMetas =
        temSegmento &&
        temSei &&
        temStatus &&
        (temCurso || temTipo || temColunaCursoSemTitulo) &&
        pontuacao >= 12;

      if (parecePlanoMetas && pontuacao > melhorPontuacao) {
        melhor = {
          sheetName,
          headerRow: index,
        };

        melhorPontuacao = pontuacao;
      }
    }

    if (melhor.sheetName && candidatasPorNome.includes(sheetName)) {
      break;
    }
  }

  return melhor;
}

export async function importarPlanoMetasExcel(file: File) {
  const wb = await lerWorkbook(file);

  const { sheetName, headerRow } = encontrarAbaPlanoMetas(wb);

  if (!sheetName || headerRow < 0) {
    toastError(
      "Aba de Plano de Metas não encontrada.",
      `Verifique cabeçalhos SEGMENTO, CURSO, SEI e STATUS. Abas: ${wb.SheetNames.join(", ")}`,
    );

    return [];
  }

  const ws = wb.Sheets[sheetName];

  const matriz = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    raw: false,
  });

  const cabecalho = (matriz[headerRow] || []).map((cell) => txt(cell));
  const linhas = matriz.slice(headerRow + 1);

  const idxSeiDetectado = detectarColunaSeiNasLinhas(linhas);
  const usarMapeamentoPorSei = idxSeiDetectado >= 3;

  const idxSegmento = usarMapeamentoPorSei
    ? idxSeiDetectado - 3
    : encontrarIndiceCabecalho(cabecalho, ["SEGMENTO", "Segmento", "Eixo"]);
  const idxCurso = usarMapeamentoPorSei
    ? idxSeiDetectado - 2
    : encontrarIndiceCabecalho(cabecalho, [
        "CURSO",
        "Curso",
        "Nome do Curso",
        "Título",
        "Titulo",
      ]);
  const idxTipo = usarMapeamentoPorSei
    ? idxSeiDetectado - 1
    : encontrarIndiceCabecalho(cabecalho, ["TIPO", "Tipo", "Categoria"]);
  const idxNumeroSEI = usarMapeamentoPorSei
    ? idxSeiDetectado
    : encontrarIndiceCabecalho(cabecalho, [
        "NÚMERO SEI",
        "Numero SEI",
        "Processo SEI",
        "SEI",
      ]);
  const idxSigNoCabecalho = encontrarIndiceCabecalho(cabecalho, [
    "CÓDIGO SIG",
    "Codigo SIG",
    "SIG",
  ]);

  const cabecalhoAposSei = normalizarCabecalhoPlano(cabecalho[idxSeiDetectado + 1] || "");
  const temColunaSigAposSei =
    usarMapeamentoPorSei &&
    (idxSigNoCabecalho === idxSeiDetectado + 1 ||
      cabecalhoAposSei === "sig" ||
      cabecalhoAposSei.includes("codigo sig") ||
      cabecalhoAposSei.includes("cod sig"));

  const deslocamentoPosSei = temColunaSigAposSei ? 1 : 0;

  const idxCodigoSIG = usarMapeamentoPorSei
    ? temColunaSigAposSei
      ? idxSeiDetectado + 1
      : -1
    : idxSigNoCabecalho;
  const idxMesEntrega = usarMapeamentoPorSei
    ? idxSeiDetectado + 1 + deslocamentoPosSei
    : encontrarIndiceCabecalho(cabecalho, [
        "MÊS DE ENTREGA",
        "Mes de Entrega",
        "Mês Entrega",
        "Entrega",
      ]);
  const idxOrigem = usarMapeamentoPorSei
    ? idxSeiDetectado + 3 + deslocamentoPosSei
    : encontrarIndiceCabecalho(cabecalho, ["ORIGEM", "Origem"]);
  const idxObservacao = usarMapeamentoPorSei
    ? idxSeiDetectado + 4 + deslocamentoPosSei
    : encontrarIndiceCabecalho(cabecalho, [
        "OBSERVAÇÃO",
        "Observacao",
        "Observação",
        "Justificativa",
      ]);

  const statusIndexes = cabecalho
    .map((header, index) => ({
      header: normalizarCabecalhoPlano(header),
      index,
    }))
    .filter(({ header }) => header === "status" || header.includes("status"))
    .map(({ index }) => index);

  const idxStatus = usarMapeamentoPorSei
    ? idxSeiDetectado + 2 + deslocamentoPosSei
    : statusIndexes[0] ?? encontrarIndiceCabecalho(cabecalho, ["STATUS", "Status"]);
  const idxStatusFinal = usarMapeamentoPorSei
    ? idxSeiDetectado + 5 + deslocamentoPosSei
    : statusIndexes.length > 1
      ? statusIndexes[statusIndexes.length - 1]
      : encontrarIndiceCabecalho(cabecalho, ["Status Final", "STATUS FINAL"]);
  const idxResponsavel = usarMapeamentoPorSei ? idxSeiDetectado - 4 : -1;

  const getCell = (row: unknown[], index: number) => {
    if (index < 0) return "";
    return txt(row[index]);
  };

  return linhas
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
      const responsavel = getCell(linha, idxResponsavel);

      return {
        segmento,
        tipo: curso,
        curso,
        categoria: categoria || "Não informado",
        numeroSEI,
        codigoSIG,
        mesEntrega,
        status: status || "EM ANÁLISE",
        origem,
        observacao,
        statusFinal,
        responsavel,
      };
    })
    .filter((row) => {
      const linhaVazia =
        !row.segmento &&
        !row.tipo &&
        !row.curso &&
        !row.numeroSEI &&
        !row.codigoSIG &&
        !row.status &&
        !row.origem &&
        !row.observacao &&
        !row.statusFinal;

      const pareceCabecalhoRepetido =
        normalizarTexto(row.segmento) === "segmento" ||
        normalizarTexto(row.tipo) === "curso" ||
        normalizarTexto(row.curso) === "tipo";

      const registroValido =
        pareceNumeroSei(row.numeroSEI) ||
        (row.curso.length > 8 && row.segmento.length > 2);

      return !linhaVazia && !pareceCabecalhoRepetido && registroValido;
    });
}

/* ─────────────────────────────
   VALORES PCA
───────────────────────────── */

function encontrarAbaPCA(wb: XLSX.WorkBook) {
  const aliases = [
    "Valores PCA 2025 - Retificativo",
    "Retificativos PCA 2025",
    "Retificativos PCA_2025",
    "Retificativos PCA 2025 ",
    "Valores PCA",
    "PCA 2025",
  ];

  const sheetName = encontrarNomeAba(wb, aliases);
  if (!sheetName) return { sheetName: "", rows: [] as Record<string, unknown>[] };

  const ws = wb.Sheets[sheetName];
  const matriz = limitarMatrizPlanilha(ws, 1500);

  let headerRow = 0;
  for (let i = 0; i < Math.min(matriz.length, 5); i++) {
    const texto = (matriz[i] || []).map(normalizarTexto).join(" ");
    if (texto.includes("sei") && (texto.includes("titulo") || texto.includes("retificativos"))) {
      headerRow = i;
      break;
    }
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    range: headerRow,
    defval: "",
    raw: false,
  });

  return { sheetName, rows: rows.slice(0, 1200) };
}

export async function importarValoresPCAExcel(file: File) {
  const wb = await lerWorkbook(file);

  const { sheetName, rows } = encontrarAbaPCA(wb);

  if (!sheetName) {
    toastError(
      "Aba de Valores PCA não encontrada.",
      `Abas disponíveis: ${wb.SheetNames.join(", ")}`,
    );
    return [];
  }

  return rows
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

function encontrarMelhorAbaCursosPorEixo(wb: XLSX.WorkBook) {
  const candidatas = wb.SheetNames.filter((name) => {
    const normalizado = normalizarTexto(name);
    return normalizado.includes("quantidade") && normalizado.includes("eixo");
  });

  let melhorNome = "";
  let melhorPontuacao = 0;

  for (const name of candidatas) {
    const ws = wb.Sheets[name];
    if (!ws) continue;

    const matriz = limitarMatrizPlanilha(ws, 40);
    const textoCabecalho = matriz
      .slice(0, 8)
      .flat()
      .map(normalizarTexto)
      .join(" | ");

    let pontuacao = matriz.length;

    if (textoCabecalho.includes("ch do curso") || textoCabecalho.includes("carga horaria")) {
      pontuacao += 800;
    }

    if (textoCabecalho.includes("turmas")) pontuacao += 400;
    if (textoCabecalho.includes("alunos")) pontuacao += 200;
    if (textoCabecalho.includes("instrutores")) pontuacao += 200;
    if (textoCabecalho.includes("codigo")) pontuacao += 100;

    if (pontuacao > melhorPontuacao) {
      melhorPontuacao = pontuacao;
      melhorNome = name;
    }
  }

  return melhorNome;
}

export async function importarCursosEixoExcel(file: File) {
  const wb = await lerWorkbook(file);

  const sheetName = encontrarMelhorAbaCursosPorEixo(wb);

  if (!sheetName) {
    toastError(
      "Aba de Cursos por Eixo não encontrada.",
      `Abas disponíveis: ${wb.SheetNames.join(", ")}`,
    );

    return [];
  }

  const ws = wb.Sheets[sheetName];

  const matriz = limitarMatrizPlanilha(ws, 2500);

  const normalizarHeader = (value: unknown) =>
    normalizarTexto(value)
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  let headerRow = -1;

  for (let i = 0; i < Math.min(matriz.length, 120); i++) {
    const linha = matriz[i] || [];
    const headers = linha.map(normalizarHeader);
    const textoLinha = headers.join(" | ");

    const temSegmento =
      headers.some((h) => h === "segmento") ||
      headers.some((h) => h === "eixo") ||
      textoLinha.includes("segmento");

    const temQuantidade = textoLinha.includes("quantidade") || textoLinha.includes("qtd");
    const temCurso =
      headers.some((h) => h === "curso") ||
      headers.some((h) => h === "cursos") ||
      textoLinha.includes("curso");

    const temCh =
      headers.some((h) => h === "ch") ||
      textoLinha.includes("carga horaria") ||
      textoLinha.includes("ch do curso");

    const temTurmas =
      textoLinha.includes("turmas") ||
      textoLinha.includes("2 semestre") ||
      textoLinha.includes("2º semestre");

    const pareceCabecalho = temSegmento && temCurso && (temQuantidade || temCh || temTurmas);

    if (pareceCabecalho) {
      headerRow = i;
      break;
    }
  }

  if (headerRow < 0) {
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

  let idxSegmento = findIndex(["SEGMENTO", "Segmento", "Eixo"]);
  let idxQuantidadeCursos = findIndex([
    "Quantidade de Cursos",
    "Quantidade Cursos",
    "Qtd Cursos",
    "Qtd",
  ]);
  let idxCurso = findIndex(["Cursos", "Curso", "Nome do Curso"]);
  let idxCh = findIndex(["CH do curso", "CH", "Carga Horária", "Carga Horaria"]);
  let idxTurmas = findIndex([
    "Turmas (2º Semestre)",
    "Turmas (2 Semestre)",
    "Turmas 2º Semestre",
    "Turmas 2 Semestre",
    "Turmas",
  ]);
  let idxCodigo = findIndex(["Codigo", "Código", "Código SIG", "Codigo SIG", "SIG"]);
  let idxAlunos = findIndex([
    "Alunos (Matriculas)",
    "Alunos (Matrículas)",
    "Alunos",
    "Matriculas",
    "Matrículas",
  ]);
  let idxInstrutores = findIndex(["instrutores", "Instrutores"]);

  if (idxSegmento < 0) idxSegmento = 0;
  if (idxQuantidadeCursos < 0) idxQuantidadeCursos = idxSegmento + 1;
  if (idxCurso < 0) idxCurso = idxQuantidadeCursos + 1;
  if (idxCh < 0) idxCh = idxCurso + 1;
  if (idxTurmas < 0) idxTurmas = idxCh + 1;
  if (idxCodigo < 0) idxCodigo = idxTurmas + 1;
  if (idxAlunos < 0) idxAlunos = idxCodigo + 1;
  if (idxInstrutores < 0) idxInstrutores = idxAlunos + 1;

  const getCell = (row: unknown[], index: number) => {
    if (index < 0) return "";
    return txt(row[index]);
  };

  let segmentoAtual = "";
  let quantidadeAtual = "";
  let cursoAtual = "";
  let chAtual = "";
  let anoContexto = "2025";

  const idxAno = findIndex(["Ano", "ANO", "Exercicio", "Exercício"]);

  const registrosBrutos: Array<{
    ano: string;
    eixo: string;
    segmento: string;
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

  for (const row of matriz.slice(headerRow + 1)) {
    const linha = Array.isArray(row) ? row : [];
    const textoLinha = linha.map((cell) => txt(cell)).join(" ");
    const textoNorm = normalizarTexto(textoLinha);

    if (pareceLinhaSeparadorAnoCursosEixo(textoNorm, linha)) {
      const anoNaLinha = detectarAnoEmTexto(textoLinha);
      if (anoNaLinha) anoContexto = anoNaLinha;
      continue;
    }

    const segmento = getCell(linha, idxSegmento);
    const quantidadeCursos = getCell(linha, idxQuantidadeCursos);
    const curso = getCell(linha, idxCurso);
    const ch = getCell(linha, idxCh);
    const turmas = getCell(linha, idxTurmas);
    const codigo = getCell(linha, idxCodigo);
    const alunos = getCell(linha, idxAlunos);
    const instrutores = getCell(linha, idxInstrutores);
    const anoCelula = idxAno >= 0 ? getCell(linha, idxAno) : "";

    if (segmento) segmentoAtual = segmento;
    if (quantidadeCursos) quantidadeAtual = quantidadeCursos;
    if (curso) cursoAtual = curso;
    if (ch) chAtual = ch;

    registrosBrutos.push({
      ano:
        extrairAnoReferencia(anoCelula, codigo, segmento, curso) || anoContexto,
      eixo: segmentoAtual,
      segmento: segmentoAtual,
      unidade: "",
      curso: curso || cursoAtual,
      ch: ch || chAtual,
      status: normalizarTexto(codigo).includes("nao executada") ? "Inativo" : "Ativo",
      observacao: normalizarTexto(codigo).includes("nao executada") ? "Não executada" : "",
      quantidadeCursosSegmento: quantidadeCursos || quantidadeAtual,
      turmas,
      codigo,
      alunos,
      instrutores,
      isNovo: false,
    });
  }

  const registros = registrosBrutos.filter((row) => {
    const eixo = normalizarTexto(row.eixo);
    const curso = normalizarTexto(row.curso);
    const ch = normalizarTexto(row.ch);
    const turmas = normalizarTexto(row.turmas);
    const codigo = normalizarTexto(row.codigo);
    const alunos = normalizarTexto(row.alunos);
    const instrutores = normalizarTexto(row.instrutores);

    const linhaVazia =
      !eixo && !curso && !ch && !turmas && !codigo && !alunos && !instrutores;

    const cabecalhoRepetido =
      eixo === "segmento" ||
      eixo === "eixo" ||
      curso === "curso" ||
      curso === "cursos" ||
      ch === "ch" ||
      codigo === "codigo" ||
      codigo === "código";

    const linhaTitulo =
      eixo.includes("quantidade de cursos") ||
      curso.includes("quantidade de cursos") ||
      curso.includes("cursos por eixo");

    const pareceRegistro = curso && (eixo || ch || turmas || codigo || alunos || instrutores);

    return !linhaVazia && !cabecalhoRepetido && !linhaTitulo && pareceRegistro;
  });

  const cursosNovosSheet = encontrarNomeAba(wb, [
    "CURSOS NOVOS PCA_2025",
    "Cursos Novos PCA",
    "Cursos Novos",
  ]);

  const registrosComNovos = cursosNovosSheet
    ? (() => {
        const wsCursosNovos = wb.Sheets[cursosNovosSheet];

        const matrizCursosNovos = XLSX.utils.sheet_to_json<unknown[]>(wsCursosNovos, {
          header: 1,
          defval: "",
          raw: false,
          blankrows: false,
        });

        const cursosNovos = new Set(
          matrizCursosNovos
            .flat()
            .map((cell) => normalizarTexto(cell))
            .filter((cell) => cell.length > 4),
        );

        return registros.map((registro) => ({
          ...registro,
          isNovo: cursosNovos.has(normalizarTexto(registro.curso)),
        }));
      })()
    : registros;

  return registrosComNovos;
}

/* ─────────────────────────────
   VISITAS TÉCNICAS
───────────────────────────── */

export async function importarVisitasTecnicasExcel(file: File) {
  const wb = await lerWorkbook(file);

  const rows = lerAba(
    wb,
    [
      "Processos de Visitas Técnicas",
      "Processos de Visitas Tecnicas",
      "Visitas Técnicas",
      "Visitas Tecnicas",
      "Visitas",
    ],
    1,
  );

  const normalizarUnidade = (value: string) => {
    const text = txt(value)
      .replace(/\s+/g, " ")
      .trim();

    const normalized = normalizarTexto(text);

    if (!normalized) return "";

    if (normalized.includes("jesse freire")) return "Jessé Freire";
    if (normalized.includes("jo rufino")) return "Jo Rufino e Carlos Aguiar";
    if (normalized.includes("carlos aguiar")) return "Jo Rufino e Carlos Aguiar";
    if (normalized.includes("joaquim loiola")) return "Joaquim Loiola";
    if (normalized.includes("miguel setembrino") && normalized.includes("saude")) {
      return "Miguel Setembrino — Saúde";
    }
    if (normalized.includes("miguel setembrino")) {
      return "Miguel Setembrino — Gastronomia";
    }
    if (normalized.includes("sobradinho")) return "Sobradinho";
    if (normalized.includes("talal")) return "Talal Abu-Allan";
    if (normalized.includes("abu")) return "Talal Abu-Allan";

    return text;
  };

  const eixoPorUnidade = (unidade: string) => {
    const normalized = normalizarTexto(unidade);

    if (normalized.includes("jesse freire")) return "Gastronomia";
    if (normalized.includes("jo rufino")) return "Ambiente e Saúde";
    if (normalized.includes("carlos aguiar")) return "Ambiente e Saúde";
    if (normalized.includes("joaquim loiola")) return "Gestão e Moda";
    if (normalized.includes("miguel setembrino") && normalized.includes("saude")) {
      return "Ambiente e Saúde";
    }
    if (normalized.includes("miguel setembrino")) return "Gastronomia";
    if (normalized.includes("sobradinho")) return "Tecnologia e Economia Criativa";
    if (normalized.includes("talal")) return "Beleza e Cuidado Pessoal";
    if (normalized.includes("abu")) return "Beleza e Cuidado Pessoal";

    return "";
  };

  const formatarDataExcel = (value: unknown) => {
    const raw = txt(value).trim();

    if (!raw) return "";

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [year, month, day] = raw.split("-");
      return `${day}/${month}/${year}`;
    }

    const numero = Number(raw);

    if (Number.isFinite(numero) && numero > 20000 && numero < 70000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + numero * 24 * 60 * 60 * 1000);

      const day = String(date.getUTCDate()).padStart(2, "0");
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const year = String(date.getUTCFullYear());

      return `${day}/${month}/${year}`;
    }

    return raw;
  };

  const isLinhaInvalida = (row: Record<string, unknown>) => {
    const valores = Object.values(row).map(txt).filter(Boolean);
    const linha = normalizarTexto(valores.join(" "));

    if (!linha) return true;

    const unidadeRaw = pick(row, [
      "Relação dos CEP´s",
      "Relação dos CEP's",
      "Relação dos CEPs",
      "Unidade",
      "UNIDADE",
    ]);

    const processoRaw = pick(row, ["PROCESSO SEI", "Processo SEI", "SEI"]);
    const observacaoRaw = pick(row, ["Observação", "Observacao", "OBSERVAÇÃO"]);

    const unidadeNorm = normalizarTexto(unidadeRaw);
    const processoNorm = normalizarTexto(processoRaw);
    const observacaoNorm = normalizarTexto(observacaoRaw);

    if (unidadeNorm.includes("relacao dos cep")) return true;
    if (unidadeNorm === "unidade") return true;
    if (processoNorm === "processo sei") return true;
    if (processoNorm === "sei") return true;
    if (observacaoNorm === "observacao") return true;
    if (linha.includes("processo sei") && linha.includes("observacao")) return true;
    if (linha.includes("relacao dos cep") && linha.includes("processo sei")) return true;

    return false;
  };

  const registros = rows
    .filter((row) => !isLinhaInvalida(row))
    .map((row) => {
      const unidade = normalizarUnidade(
        pick(row, [
          "Relação dos CEP´s",
          "Relação dos CEP's",
          "Relação dos CEPs",
          "Unidade",
          "UNIDADE",
        ]),
      );

      const eixoPlanilha = pick(row, [
        "Eixo",
        "Eixo Tecnológico",
        "Eixo Tecnologico",
        "Segmento",
      ]);

      const eixo = eixoPlanilha || eixoPorUnidade(unidade);

      const processoSEI = pick(row, [
        "PROCESSO SEI",
        "Processo SEI",
        "Processo",
        "SEI",
      ]);

      const dataSolicitacao = formatarDataExcel(
        pick(row, [
          "Solicitação",
          "Solicitacao",
          "Data Solicitação",
          "Data Solicitacao",
          "DATA DE SOLICITAÇÃO",
          "DATA DE SOLICITACAO",
        ]),
      );

      const dataVisitaPrevista = formatarDataExcel(
        pick(row, [
          "Visita Prevista",
          "VISITA PREVISTA",
          "Data Prevista",
          "Data da Visita",
          "Data Visita",
        ]),
      );

      const prazoLimitePlanilha = formatarDataExcel(
        pick(row, [
          "Prazo Limite",
          "PRAZO LIMITE",
          "Prazo",
          "Data Limite",
        ]),
      );

      const prazoLimite =
        prazoLimitePlanilha ||
        (dataSolicitacao ? addBusinessDays(dataSolicitacao, 30) : "");

      const status = pick(row, [
        "Status",
        "STATUS",
        "Situação",
        "Situacao",
      ]);

      const relatorio = pick(row, [
        "Relatório",
        "Relatorio",
        "RELATÓRIO",
        "RELATORIO",
      ]);

      const observacao = pick(row, [
        "Observação",
        "Observacao",
        "OBSERVAÇÃO",
        "OBSERVACAO",
      ]);

      const ano =
        pick(row, ["Ano", "ANO"]) ||
        dataSolicitacao.slice(-4) ||
        prazoLimite.slice(-4) ||
        "2025";

      return {
        ano,
        unidade,
        eixo,
        processoSEI,
        dataSolicitacao,
        dataVisitaPrevista,
        prazoLimite,
        status: status || "Solicitada",
        responsavel: pick(row, ["Responsável", "Responsavel", "Responsável Técnico"]),
        relatorio,
        observacao,
      };
    })
    .filter((registro) => {
      const unidadeNorm = normalizarTexto(registro.unidade);
      const processoNorm = normalizarTexto(registro.processoSEI);
      const linhaNorm = normalizarTexto(
        [
          registro.unidade,
          registro.eixo,
          registro.processoSEI,
          registro.dataSolicitacao,
          registro.dataVisitaPrevista,
          registro.prazoLimite,
          registro.status,
          registro.relatorio,
          registro.observacao,
        ].join(" "),
      );

      if (!registro.unidade && !registro.processoSEI) return false;
      if (pareceTituloSecaoVisita(registro.unidade)) return false;
      if (unidadeNorm.includes("relacao dos cep")) return false;
      if (processoNorm === "processo sei") return false;
      if (linhaNorm.includes("relacao dos cep") && linhaNorm.includes("processo sei")) {
        return false;
      }

      return true;
    });

  const registrosLimpos = registros.filter((registro) => {
    const unidade = normalizarTexto(registro.unidade);
    const processo = normalizarTexto(registro.processoSEI);
    const observacao = normalizarTexto(registro.observacao);

    if (!registro.unidade && !registro.processoSEI) return false;
    if (pareceTituloSecaoVisita(registro.unidade)) return false;
    if (unidade.includes("relacao dos cep")) return false;
    if (processo === "processo sei") return false;
    if (observacao === "observacao") return false;

    return true;
  });

  if (registrosLimpos.length < 1) {
    return [];
  }

  return registrosLimpos.map((registro) => {
    const temSei = pareceNumeroSei(registro.processoSEI);

    return {
      ...registro,
      status: temSei ? registro.status || "Solicitada" : "Pendente",
      observacao:
        registro.observacao ||
        (temSei ? "" : "Processo SEI pendente — preencher manualmente"),
    };
  });
  
}

/* ─────────────────────────────
   HORAS PEDAGÓGICAS
───────────────────────────── */

function normalizarEixoHora(value: string) {
  const eixo = normalizarTexto(value);

  if (eixo.includes("gastronomia")) return "Gastronomia";
  if (eixo.includes("ambiente") || eixo.includes("saude") || eixo === "saude") {
    return "Ambiente e Saúde";
  }
  if (eixo.includes("gestao") || eixo.includes("negocio")) return "Gestão e Moda";
  if (eixo.includes("moda") && eixo.includes("beleza")) return "Beleza e Cuidado Pessoal";
  if (eixo.includes("moda")) return "Gestão e Moda";
  if (eixo.includes("tecnologia") || eixo.includes("economia") || eixo === "ti") {
    return "Tecnologia e Economia Criativa";
  }
  if (eixo.includes("beleza") || eixo.includes("comercio") || eixo.includes("turismo")) {
    return "Beleza e Cuidado Pessoal";
  }

  return txt(value);
}

function importarHorasPorSegmentoMatriz(matriz: unknown[][]) {
  let anoContexto = "2025";
  const registros: Array<{
    ano: string;
    processoSEI: string;
    eixo: string;
    segmento: string;
    nomePessoa: string;
    matricula: string;
    motivo: string;
    observacao: string;
    status: string;
    ativo: boolean;
  }> = [];

  for (const row of matriz) {
    if (!Array.isArray(row)) continue;

    const processoSEI = txt(row[0]);
    const segmento = txt(row[1]);
    const linha = normalizarTexto(`${processoSEI} ${segmento}`);

    if (!linha) continue;

    if (linha.includes("processos de solicitacao") && linha.includes("instrutor")) {
      if (linha.includes("2026")) anoContexto = "2026";
      else if (linha.includes("2025")) anoContexto = "2025";
      continue;
    }

    if (normalizarTexto(processoSEI) === "processo sei") continue;
    if (!segmento) continue;

    registros.push({
      ano: processoSEI.match(/^(\d{4})/)?.[1] || anoContexto,
      processoSEI,
      eixo: normalizarEixoHora(segmento),
      segmento,
      nomePessoa: "",
      matricula: "",
      motivo: "Processo de solicitação de instrutores por segmento",
      observacao: pareceNumeroSei(processoSEI) ? "" : "Processo SEI pendente — preencher manualmente",
      status: pareceNumeroSei(processoSEI) ? "Solicitada" : "Pendente",
      ativo: true,
    });
  }

  return registros;
}

export async function importarHorasPedagogicasExcel(file: File) {
  const wb = await lerWorkbook(file);

  const sheetName = encontrarNomeAba(wb, [
    "Processos Horas Pedagógicas",
    "Processos Horas Pedagogicas",
    "Horas Pedagógicas",
    "Horas Pedagogicas",
    "Horas",
  ]);

  if (sheetName) {
    const ws = wb.Sheets[sheetName];
    const matriz = limitarMatrizPlanilha(ws, 200);
    const registrosPorSegmento = importarHorasPorSegmentoMatriz(matriz);

    if (registrosPorSegmento.length > 0) {
      return registrosPorSegmento;
    }
  }

  let rows: Record<string, unknown>[] = [];

  if (sheetName) {
    const ws = wb.Sheets[sheetName];
    const matriz = limitarMatrizPlanilha(ws, 200);

    let headerRow = 1;
    for (let i = 0; i < Math.min(matriz.length, 8); i++) {
      const texto = (matriz[i] || []).map(normalizarTexto).join(" ");
      if (texto.includes("processo") && (texto.includes("segmento") || texto.includes("sei"))) {
        headerRow = i;
        break;
      }
    }

    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      range: headerRow,
      defval: "",
      raw: false,
    });
  }

  if (!rows.length) {
    const automatico = lerAbaComCabecalhoAutomatico(
      wb,
      [
        "Horas Pedagógicas",
        "Horas Pedagogicas",
        "Processos Horas Pedagógicas",
        "Processos Horas Pedagogicas",
        "Horas",
      ],
      ["processo", "sei"],
      ["segmento", "eixo", "nome", "matricula", "motivo", "status", "observacao"],
    );
    rows = automatico.rows;
  }

  const normalizarStatusHora = (value: string) => {
    const status = normalizarTexto(value);

    if (status.includes("conclu")) return "Concluída";
    if (status.includes("aprov")) return "Aprovada";
    if (status.includes("analise")) return "Em análise";
    if (status.includes("recus")) return "Recusada";
    if (status.includes("inativ")) return "Inativa";
    if (status.includes("solicit")) return "Solicitada";

    return txt(value) || "Solicitada";
  };

  const registros = rows
    .map((row) => {
      const processoSEI = pick(row, [
        "Processo SEI",
        "PROCESSO SEI",
        "SEI",
        "Processo",
      ]);

      const segmento = pick(row, [
        "Segmentos",
        "Segmento",
        "SEGMENTO",
        "Área Técnica",
        "Area Tecnica",
      ]);

      const eixo = normalizarEixoHora(
        pick(row, [
          "Eixo Tecnológico",
          "Eixo Tecnologico",
          "Eixo",
          "Área",
          "Area",
        ]) || segmento,
      );

      const nomePessoa = pick(row, [
        "Nome da Pessoa",
        "Pessoa",
        "Nome",
        "Colaborador",
        "Instrutor",
        "Responsável",
        "Responsavel",
      ]);

      const matricula = pick(row, [
        "Matrícula",
        "Matricula",
        "MATRICULA",
        "Registro",
      ]);

      const motivo = pick(row, [
        "Motivo da Solicitação",
        "Motivo da Solicitacao",
        "Motivo",
        "Solicitação",
        "Solicitacao",
        "Justificativa",
      ]);

      const observacao = pick(row, [
        "Observação",
        "Observacao",
        "OBSERVAÇÃO",
        "OBSERVACAO",
        "Obs",
      ]);

      const status = normalizarStatusHora(
        pick(row, ["Status", "STATUS", "Situação", "Situacao"]),
      );

      const ano =
        pick(row, ["Ano", "ANO"]) ||
        processoSEI.match(/^(\d{4})/)?.[1] ||
        "2025";

      const ativo = !normalizarTexto(status).includes("inativa");

      return {
        ano,
        processoSEI,
        eixo,
        segmento,
        nomePessoa,
        matricula,
        motivo,
        observacao,
        status,
        ativo,
      };
    })
    .filter((registro) => {
      const linha = normalizarTexto(
        [
          registro.ano,
          registro.processoSEI,
          registro.eixo,
          registro.segmento,
          registro.nomePessoa,
          registro.matricula,
          registro.motivo,
          registro.observacao,
          registro.status,
        ].join(" "),
      );

      if (!linha) return false;
      if (linha.includes("processo sei") && linha.includes("motivo")) return false;
      if (linha.includes("nome da pessoa") && linha.includes("matricula")) return false;
      if (linha.includes("processos de solicitacao") && linha.includes("instrutor")) return false;
      if (normalizarTexto(registro.processoSEI) === "processo sei") return false;

      return Boolean(registro.eixo || registro.segmento);
    });

  const registrosComEixo = registros.map((registro) => {
    const temSei = pareceNumeroSei(registro.processoSEI);

    return {
      ...registro,
      eixo: registro.eixo || registro.segmento,
      motivo: registro.motivo || registro.observacao || "Solicitação de instrutor",
      observacao:
        registro.observacao || (temSei ? "" : "Processo SEI pendente — preencher manualmente"),
      status: temSei ? registro.status || "Solicitada" : "Pendente",
    };
  });

  if (registrosComEixo.length < 3) {
    return registrosComEixo;
  }

  return registrosComEixo;
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
    "Título - Nome do Curso  ",
    "CURSO",
    "Curso",
    "Nome do Curso",
  ]);

  const tituloNormalizado = normalizarTexto(titulo);

  if (!titulo || titulo.length < 3) return false;
  if (["total", "quantidades", "modalidade", "segmento"].includes(tituloNormalizado)) return false;
  if (tituloNormalizado.startsWith("portfolio")) return false;

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

        const observacaoConferencia = pick(row, [
          "Observações de Conferência",
          "Observacoes de Conferencia",
          "Observações de conferência",
          "Observações / Orientações",
          "Observacoes / Orientacoes",
          "Observações/Orientações",
          "Observacoes/Orientacoes",
          "Observação",
          "Observacao",
          "OBSERVAÇÃO",
        ]);
        const observacaoEixo = pick(row, ["Observações Eixo", "Observacoes Eixo"]);
        const observacao = observacaoConferencia || observacaoEixo;

        const valor = pick(row, [
          "Valores ",
          "Valores",
          "Valor",
          "Valor ",
          "Precificação",
          "Precificacao",
        ]);

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
          ultimaRevisao: pick(row, [
            "Última Revisão",
            "Última revisão",
            "Ultima Revisao",
            "Ultima revisao",
          ]),
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

/* ─────────────────────────────
   AÇÕES EXTENSIVAS E EVENTOS
───────────────────────────── */

export async function importarAcoesExtensivasExcel(file: File) {
  const wb = await lerWorkbook(file);

  const rows = lerAba(
    wb,
    [
      "Ações Extensivas",
      "Acoes Extensivas",
      "Ação Extensiva",
      "Acoes Extensiva",
      "Extensivas",
    ],
    1,
  );

  return rows
    .filter((row) => pick(row, ["Título", "Titulo", "titulo", "Nome"]))
    .map((row) => ({
      ano: pick(row, ["Ano"]) || "2025",
      titulo: pick(row, ["Título", "Titulo", "titulo", "Nome"]),
      eixo: pick(row, ["Eixo", "Segmento"]),
      unidade: pick(row, ["Unidade"]),
      cargaHoraria: pick(row, ["Carga Horária", "Carga Horaria", "CH"]),
      data: pick(row, ["Data"]),
      processoSEI: pick(row, ["Processo SEI", "PROCESSO SEI", "SEI"]),
      status: pick(row, ["Status"]) || "Ativa",
      observacao: pick(row, ["Observação", "Observacao", "OBSERVAÇÃO"]),
    }));
}

export async function importarEventosExcel(file: File) {
  const wb = await lerWorkbook(file);

  const rows = lerAba(
    wb,
    ["Eventos", "Eventos Institucionais", "Evento"],
    1,
  );

  return rows
    .filter((row) => pick(row, ["Nome", "Evento", "nome"]))
    .map((row) => ({
      ano: pick(row, ["Ano"]) || "2025",
      nome: pick(row, ["Nome", "Evento", "nome"]),
      data: pick(row, ["Data"]),
      unidade: pick(row, ["Unidade"]),
      eixo: pick(row, ["Eixo", "Segmento"]),
      quantidadePessoas: pick(row, [
        "Quantidade de Pessoas",
        "Público",
        "Publico",
        "Qtd Pessoas",
      ]),
      equipe: pick(row, ["Equipe"]),
      possuiAcaoExtensiva:
        pick(row, [
          "Possui Ação Extensiva",
          "Possui Acao Extensiva",
          "Ação Extensiva",
          "Vinculado Extensiva",
        ]) || "Não",
      acaoVinculada: pick(row, [
        "Ação Vinculada",
        "Acao Vinculada",
        "Ação Extensiva Vinculada",
      ]),
      status: pick(row, ["Status"]) || "Planejado",
      observacao: pick(row, ["Observação", "Observacao", "OBSERVAÇÃO"]),
    }));
}
