import * as XLSX from "xlsx";

const txt = (v: unknown) =>
  String(v ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const pick = (row: Record<string, unknown>, aliases: string[]) => {
  for (const key of aliases) {
    const value = row[key];
    if (txt(value)) return txt(value);
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
    if (day !== 0 && day !== 6) added++;
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
  return XLSX.read(data, { type: "array" });
}

function lerAba(wb: XLSX.WorkBook, sheetName: string, headerRowZeroBased: number) {
  const ws = wb.Sheets[sheetName];

  if (!ws) {
    alert(`Aba não encontrada na planilha: ${sheetName}`);
    return [];
  }

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

  return lerAba(wb, "PLANO DE METAS 2025", 1)
    .filter((row) => pick(row, ["NÚMERO SEI"]) || pick(row, ["SEGMENTO"]))
    .map((row) => ({
      segmento: pick(row, ["SEGMENTO"]),
      categoria: pick(row, ["TIPO"]),
      tipo: pick(row, [" ", "__EMPTY", "CURSO", "TIPO/NOME"]),
      numeroSEI: pick(row, ["NÚMERO SEI"]),
      codigoSIG: pick(row, ["CÓDIGO SIG"]),
      mesEntrega: pick(row, ["MÊS DE ENTREGA"]),
      status: pick(row, ["STATUS"]) || "EM ANÁLISE",
      origem: pick(row, ["ORIGEM"]),
      observacao: pick(row, ["OBSERVAÇÃO"]),
      responsavel: pick(row, ["Unnamed: 0"]),
      statusFinal: pick(row, ["STATUS.1"]),
    }));
}

/* ─────────────────────────────
   VALORES PCA
───────────────────────────── */

export async function importarValoresPCAExcel(file: File) {
  const wb = await lerWorkbook(file);

  return lerAba(wb, "Valores PCA 2025 - Retificativo", 0)
    .filter((row) => pick(row, ["SEI"]))
    .map((row) => ({
      ano: "2025",
      sei: pick(row, ["SEI"]),
      sig: pick(row, ["SIG"]),
      titulo: pick(row, ["Títulos Retificativos PCA 2025 - CPED"]),
      eixo: "",
      unidade: "",
      ch: pick(row, ["CH"]),
      valor: pick(row, ["Precificação"]),
      status: "Vigente",
      observacao: "",
      precificacao: pick(row, ["Precificação"]),
      valorPrimeiroModulo: pick(row, ["Valor 1º Módulo"]),
      parcelasBoleto: pick(row, ["N° Parcelas - Boleto"]),
      valorParcelaBoleto: pick(row, ["Valor Parcela - Boleto"]),
      parcelasCartao: pick(row, ["N° Parcelas - Cartão"]),
      valorCartao: pick(row, ["Valor - Cartão"]),
      parcelaDesc20: pick(row, ["Parcela com desc de 20%", "Parcelas 20%"]),
      parcelaDesc15: pick(row, ["Parcela com desc de 15%", "Parcela com 15%"]),
    }));
}

/* ─────────────────────────────
   QUANTIDADE DE CURSOS POR EIXO
───────────────────────────── */

export async function importarCursosEixoExcel(file: File) {
  const wb = await lerWorkbook(file);

  const raw = lerAba(wb, "Quantidade de cursos por eixo", 0);

  const cursosNovos = lerAba(wb, "CURSOS NOVOS PCA_2025", 2)
    .map((row) => pick(row, ["CURSO"]).toLowerCase())
    .filter(Boolean);

  return fillDown(raw, ["SEGMENTO", "Quantidade de Cursos"])
    .filter((row) => pick(row, ["Cursos"]))
    .map((row) => {
      const curso = pick(row, ["Cursos"]);

      return {
        ano: "2025",
        eixo: pick(row, ["SEGMENTO"]),
        unidade: "",
        curso,
        ch: pick(row, ["CH do curso"]),
        status: "Ativo",
        observacao: "",
        quantidadeCursosSegmento: pick(row, ["Quantidade de Cursos"]),
        turmas: pick(row, ["Turmas (2º Semestre)"]),
        codigo: pick(row, ["Codigo"]),
        alunos: pick(row, ["Alunos (Matriculas)"]),
        instrutores: pick(row, ["instrutores"]),
        isNovo: cursosNovos.includes(curso.toLowerCase()),
      };
    });
}

/* ─────────────────────────────
   VISITAS TÉCNICAS
───────────────────────────── */

export async function importarVisitasTecnicasExcel(file: File) {
  const wb = await lerWorkbook(file);

  return lerAba(wb, "Processos de Visitas Técnicas", 1)
    .filter((row) => pick(row, ["PROCESSO SEI"]))
    .map((row) => {
      const dataSolicitacao = new Date().toISOString().slice(0, 10);

      return {
        ano: "2025",
        unidade: pick(row, ["Relação dos CEP´s", "Relação dos CEP's"]),
        eixo: "",
        processoSEI: pick(row, ["PROCESSO SEI"]),
        dataSolicitacao,
        dataVisitaPrevista: "",
        prazoLimite: addBusinessDays(dataSolicitacao, 30),
        status: "Solicitada",
        responsavel: "",
        relatorio: "",
        observacao: pick(row, ["Observação"]),
      };
    });
}

/* ─────────────────────────────
   HORAS PEDAGÓGICAS
───────────────────────────── */

export async function importarHorasPedagogicasExcel(file: File) {
  const wb = await lerWorkbook(file);

  return lerAba(wb, "Processos Horas Pedagógicas", 1)
    .filter((row) => pick(row, ["PROCESSO SEI"]))
    .map((row) => ({
      ano: "2025",
      processoSEI: pick(row, ["PROCESSO SEI"]),
      eixo: "",
      segmento: pick(row, ["Segmentos"]),
      nomePessoa: "",
      matricula: "",
      motivo: "",
      observacao: "",
      status: "Solicitada",
    }));
}