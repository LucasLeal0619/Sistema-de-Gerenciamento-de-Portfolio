import * as XLSX from "xlsx";

const normalizarTexto = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const txt = (v: unknown) =>
  String(v ?? "")
    .replace(/\u00A0/g, " ")
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

const fillDown = <T extends Record<string, unknown>>(rows: T[], keys: string[]) => {
  const carry: Record<string, string> = {};

  return rows.map((row) => {
    const next = { ...row };

    keys.forEach((key) => {
      const value = txt(next[key]);

      if (value) {
        carry[key] = value;
      } else if (carry[key]) {
        next[key] = carry[key];
      }
    });

    return next;
  });
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

  if (exata) {
    return exata;
  }

  const porPalavras = abas.find((aba) => {
    const abaNormalizada = normalizarTexto(aba);

    return nomesNormalizados.some((nome) => {
      const palavras = nome.split(" ").filter(Boolean);
      return palavras.every((palavra) => abaNormalizada.includes(palavra));
    });
  });

  if (porPalavras) {
    return porPalavras;
  }

  const parcial = abas.find((aba) => {
    const abaNormalizada = normalizarTexto(aba);

    return nomesNormalizados.some((nome) => {
      return abaNormalizada.includes(nome) || nome.includes(abaNormalizada);
    });
  });

  return parcial;
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
    .filter((row) => pick(row, ["NÚMERO SEI", "Numero SEI", "SEI"]) || pick(row, ["SEGMENTO"]))
    .map((row) => ({
      segmento: pick(row, ["SEGMENTO", "Segmento"]),
      categoria: pick(row, ["TIPO", "Categoria"]),
      tipo: pick(row, [" ", "__EMPTY", "CURSO", "TIPO/NOME", "Tipo Nome", "Nome do Curso"]),
      numeroSEI: pick(row, ["NÚMERO SEI", "Numero SEI", "SEI"]),
      codigoSIG: pick(row, ["CÓDIGO SIG", "Codigo SIG", "SIG"]),
      mesEntrega: pick(row, ["MÊS DE ENTREGA", "Mes de Entrega", "Mês Entrega"]),
      status: pick(row, ["STATUS", "Status"]) || "EM ANÁLISE",
      origem: pick(row, ["ORIGEM", "Origem"]),
      observacao: pick(row, ["OBSERVAÇÃO", "Observacao", "Observação"]),
      responsavel: pick(row, ["Unnamed: 0", "Responsável", "Responsavel"]),
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
    ["Valores PCA 2025 - Retificativo", "Valores PCA", "PCA 2025", "PCA"],
    0,
  )
    .filter((row) => pick(row, ["SEI", "Processo SEI"]))
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

  return fillDown(raw, ["SEGMENTO", "Segmento", "Quantidade de Cursos"])
    .filter((row) => pick(row, ["Cursos", "Curso", "Nome do Curso"]))
    .map((row) => {
      const curso = pick(row, ["Cursos", "Curso", "Nome do Curso"]);

      return {
        ano: "2025",
        eixo: pick(row, ["SEGMENTO", "Segmento", "Eixo"]),
        unidade: pick(row, ["Unidade"]),
        curso,
        ch: pick(row, ["CH do curso", "CH", "Carga Horária", "Carga Horaria"]),
        status: pick(row, ["Status"]) || "Ativo",
        observacao: pick(row, ["Observação", "Observacao", "OBSERVAÇÃO"]),
        quantidadeCursosSegmento: pick(row, ["Quantidade de Cursos", "Qtd Cursos"]),
        turmas: pick(row, ["Turmas (2º Semestre)", "Turmas", "Turmas 2 Semestre"]),
        codigo: pick(row, ["Codigo", "Código", "Código SIG", "Codigo SIG"]),
        alunos: pick(row, ["Alunos (Matriculas)", "Alunos", "Matrículas", "Matriculas"]),
        instrutores: pick(row, ["instrutores", "Instrutores"]),
        isNovo: cursosNovos.includes(curso.toLowerCase()),
      };
    });
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
  { sheet: ["Gastronomia e Turismo", "Gastronomia", "Turismo"], headerRow: 4 },
  { sheet: ["Saúde", "Saude", "Ambiente e Saúde", "Ambiente e Saude"], headerRow: 4 },
  { sheet: ["Gestão e Moda", "Gestao e Moda"], headerRow: 4 },
  {
    sheet: ["Tecnologia e Economia Criativa", "Tecnologia", "Economia Criativa"],
    headerRow: 5,
  },
  { sheet: ["Beleza e Cuidado Pessoal", "Beleza"], headerRow: 4 },
  { sheet: ["60+", "Sessenta Mais"], headerRow: 4 },
  { sheet: ["Ensino Médio 2025", "Ensino Medio 2025", "Ensino Médio", "Ensino Medio"], headerRow: 4 },
] as const;

function normalizarEixoCurso(sheetName: string, segmentoRaw: string) {
  const sheet = normalizarTexto(sheetName);

  if (sheet.includes("gastronomia") || sheet.includes("turismo")) {
    return segmentoRaw || "Gastronomia e Turismo";
  }

  if (sheet.includes("saude")) {
    return "Ambiente, Saúde e Segurança";
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

  return segmentoRaw || sheetName;
}

export async function importarCursosPortfolio(file: File) {
  const wb = await lerWorkbook(file);

  return COURSE_SHEETS.flatMap(({ sheet, headerRow }) => {
    const sheetName = encontrarNomeAba(wb, [...sheet]);

    if (!sheetName) {
      console.warn(`Aba de curso não encontrada: ${sheet.join(" / ")}`);
      return [];
    }

    const linhas = lerAba(wb, [...sheet], headerRow);

    return linhas
      .filter((row) => {
        return (
          pick(row, ["Titulo - Nome do Curso"]) ||
          pick(row, ["Título - Nome do Curso "]) ||
          pick(row, ["Título - Nome do Curso"]) ||
          pick(row, ["CURSO", "Curso", "Nome do Curso"])
        );
      })
      .map((row) => {
        const segmento = pick(row, ["Segmento ", "Segmento", "SEGMENTO"]);
        const titulo = pick(row, [
          "Titulo - Nome do Curso",
          "Título - Nome do Curso ",
          "Título - Nome do Curso",
          "CURSO",
          "Curso",
          "Nome do Curso",
        ]);

        return {
          id: crypto.randomUUID(),
          origemSheet: sheetName,
          ano: pick(row, ["Última Revisão", "Última revisão", "Ultima Revisao", "Ident.", "Ident"]),
          status:
            pick(row, [
              "Status SIG\n(Ativo ou Inativo)",
              "Status SIG",
              "Status",
              "Observações / Orientações",
            ]) || "ATIVO",
          eixo: normalizarEixoCurso(sheetName, segmento),
          segmento: segmento || normalizarEixoCurso(sheetName, ""),
          modalidade: pick(row, ["Modalidade ", "Modalidade"]),
          titulo,
          ch: pick(row, ["CH", "Carga Horária", "Carga Horaria"]),
          codDN: pick(row, ["Cód. DN", "Cod. DN", "Código DN", "Codigo DN"]),
          codSIG: pick(row, ["Cód. SIG", "Cod. SIG", "Código SIG", "Codigo SIG"]),
          ident: pick(row, ["Ident.", "Ident"]),
          tipo: pick(row, ["TIPO", "Tipo"]),
          ultimaRevisao: pick(row, ["Última Revisão", "Última revisão", "Ultima Revisao"]),
          processoSEI: pick(row, ["Processo SEI", "NÚMERO SEI", "Numero SEI", "SEI"]),
          valor: pick(row, ["Valores ", "Valores", "Valor"]),
          unidade: pick(row, ["UNIDADE QUE PODE SER RODADO", "Unidade que pode ser rodado", "Unidade"]),
          observacao: pick(row, [
            "Observações de Conferência",
            "Observacoes de Conferencia",
            "Observações / Orientações",
            "Observacoes / Orientacoes",
            "Observações/Orientações",
            "Observacoes/Orientacoes",
            "Observações de conferência",
            "Observações Eixo",
            "Observacao",
            "Observação",
          ]),
          compativelBolsa: pick(row, ["Compatível com bolsa", "Compativel com bolsa"]),
          comercial: pick(row, ["Comercial*"]),
          pcn: pick(row, ["PCN"]),
          pcr: pick(row, ["PCR"]),
          resolucao: pick(row, ["Resolução", "Resolucao"]),
        };
      });
  });
}