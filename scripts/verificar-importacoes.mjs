import fs from "fs";
import * as XLSX from "xlsx";

const path =
  process.argv[2] ||
  "C:/Users/lucas/Downloads/Portfólio 2025 - Grupo da Aprendizagem G4F (1).xlsx";

const normalizarTexto = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u2000-\u200F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const txt = (v) =>
  String(v ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u2000-\u200F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const PATTERN_SEI = /^\d{4}\.\d{6,}/;
const pareceNumeroSei = (value) => PATTERN_SEI.test(txt(value));

const wb = XLSX.read(fs.readFileSync(path), { cellDates: false });

console.log("=== VISITAS TÉCNICAS ===");
const visitasSheet = wb.SheetNames.find((n) =>
  normalizarTexto(n).includes("visitas"),
);
if (visitasSheet) {
  const ws = wb.Sheets[visitasSheet];
  const rows = XLSX.utils.sheet_to_json(ws, { range: 1, defval: "", raw: false });
  const pick = (row, aliases) => {
    for (const [key, value] of Object.entries(row)) {
      const kn = normalizarTexto(key);
      for (const alias of aliases) {
        if (kn === normalizarTexto(alias) && txt(value)) return txt(value);
      }
    }
    for (const [key, value] of Object.entries(row)) {
      const kn = normalizarTexto(key);
      for (const alias of aliases) {
        const palavras = normalizarTexto(alias).split(" ").filter(Boolean);
        if (palavras.every((p) => kn.includes(p)) && txt(value)) return txt(value);
      }
    }
    return "";
  };

  let total = 0;
  let comSei = 0;
  let semSeiComUnidade = 0;
  let semSeiSemUnidade = 0;
  const semSei = [];

  for (const row of rows) {
    const unidade = pick(row, [
      "Relação dos CEP´s",
      "Relação dos CEP's",
      "Relação dos CEPs",
      "Unidade",
      "UNIDADE",
    ]);
    const processoSEI = pick(row, ["PROCESSO SEI", "Processo SEI", "Processo", "SEI"]);
    const observacao = pick(row, ["Observação", "Observacao", "OBSERVAÇÃO"]);
    const linha = normalizarTexto(
      [unidade, processoSEI, observacao, ...Object.values(row).map(txt)].join(" "),
    );
    if (!linha) continue;
    if (normalizarTexto(unidade).includes("relacao dos cep")) continue;
    if (normalizarTexto(processoSEI) === "processo sei") continue;
    if (!unidade && !processoSEI) continue;

    total++;
    if (pareceNumeroSei(processoSEI)) {
      comSei++;
    } else {
      if (unidade) semSeiComUnidade++;
      else semSeiSemUnidade++;
      semSei.push({ unidade, processoSEI, observacao: observacao.slice(0, 60) });
    }
  }

  console.log(`Aba: ${visitasSheet}`);
  console.log(`Total linhas com conteúdo: ${total}`);
  console.log(`Com SEI válido (importados hoje): ${comSei}`);
  console.log(`Sem SEI mas com unidade (excluídos): ${semSeiComUnidade}`);
  console.log(`Sem SEI e sem unidade: ${semSeiSemUnidade}`);
  if (semSei.length) {
    console.log("Registros sem SEI:");
    semSei.forEach((r, i) =>
      console.log(`  ${i + 1}. unidade="${r.unidade}" sei="${r.processoSEI}" obs="${r.observacao}"`),
    );
  }
}

console.log("\n=== HORAS PEDAGÓGICAS ===");
const horasSheet = wb.SheetNames.find((n) => {
  const s = normalizarTexto(n);
  return s.includes("horas") && s.includes("pedagog");
});
if (horasSheet) {
  const ws = wb.Sheets[horasSheet];
  const matriz = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
  let total = 0;
  let comSei = 0;
  const semSei = [];

  for (const row of matriz) {
    if (!Array.isArray(row)) continue;
    const processoSEI = txt(row[0]);
    const segmento = txt(row[1]);
    const linha = normalizarTexto(`${processoSEI} ${segmento}`);
    if (!linha) continue;
    if (linha.includes("processos de solicitacao") && linha.includes("instrutor")) continue;
    if (normalizarTexto(processoSEI) === "processo sei") continue;
    if (!segmento) continue;

    total++;
    if (pareceNumeroSei(processoSEI)) {
      comSei++;
    } else {
      semSei.push({ processoSEI, segmento });
    }
  }

  console.log(`Aba: ${horasSheet}`);
  console.log(`Total linhas com segmento: ${total}`);
  console.log(`Com SEI válido (importados hoje): ${comSei}`);
  console.log(`Sem SEI (excluídos): ${semSei.length}`);
  semSei.forEach((r, i) =>
    console.log(`  ${i + 1}. sei="${r.processoSEI}" segmento="${r.segmento}"`),
  );
}

console.log("\n=== CURSOS POR 8 EIXOS ===");
const candidatas = wb.SheetNames.filter((name) => {
  const n = normalizarTexto(name);
  return n.includes("quantidade") && n.includes("eixo");
});
console.log("Abas candidatas:", candidatas.join(", "));

let melhorNome = "";
let melhorPontuacao = 0;
for (const name of candidatas) {
  const ws = wb.Sheets[name];
  const ref = ws["!ref"];
  const range = XLSX.utils.decode_range(ref || "A1");
  range.e.r = Math.min(range.e.r, 40);
  const matriz = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, range });
  const textoCabecalho = matriz
    .slice(0, 8)
    .flat()
    .map(normalizarTexto)
    .join(" | ");
  let pontuacao = matriz.length;
  if (textoCabecalho.includes("ch do curso") || textoCabecalho.includes("carga horaria")) pontuacao += 800;
  if (textoCabecalho.includes("turmas")) pontuacao += 400;
  if (textoCabecalho.includes("alunos")) pontuacao += 200;
  if (textoCabecalho.includes("instrutores")) pontuacao += 200;
  if (textoCabecalho.includes("codigo")) pontuacao += 100;
  console.log(`  Seleção: "${name}" → pontuação ${pontuacao}`);
  if (pontuacao > melhorPontuacao) {
    melhorPontuacao = pontuacao;
    melhorNome = name;
  }
}
console.log(`Aba escolhida pelo sistema: "${melhorNome}" (pontuação ${melhorPontuacao})`);

const normalizarHeader = (value) =>
  normalizarTexto(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

for (const sheetName of candidatas) {
  const ws = wb.Sheets[sheetName];
  const matriz = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
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
    if (temSegmento && temCurso && (temQuantidade || temCh || temTurmas)) {
      headerRow = i;
      break;
    }
  }
  if (headerRow < 0) {
    console.log(`${sheetName}: cabeçalho não encontrado`);
    continue;
  }

  const headers = (matriz[headerRow] || []).map(normalizarHeader);
  const findIndex = (aliases) => {
    const normalizedAliases = aliases.map(normalizarHeader);
    const exact = headers.findIndex((h) => normalizedAliases.includes(h));
    if (exact >= 0) return exact;
    return headers.findIndex((h) =>
      normalizedAliases.some((alias) => {
        if (!alias) return false;
        if (h === alias) return true;
        if (h.includes(alias)) return true;
        const palavras = alias.split(" ").filter(Boolean);
        return palavras.every((p) => h.includes(p));
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

  const getCell = (row, index) => (index < 0 ? "" : txt(row[index]));

  let segmentoAtual = "";
  let quantidadeAtual = "";
  let cursoAtual = "";
  let chAtual = "";
  const registrosBrutos = [];
  const excluidos = [];

  for (let ri = headerRow + 1; ri < matriz.length; ri++) {
    const linha = matriz[ri] || [];
    const textoLinha = linha.map((c) => txt(c)).join(" ");
    const textoNorm = normalizarTexto(textoLinha);

    const pareceSeparadorAno = (() => {
      const ano = detectarAno(textoLinha);
      if (!ano) return false;
      if (/\bquantidade de cursos\b/.test(textoNorm)) return true;
      if (/\bcursos por eixo\b/.test(textoNorm)) return true;
      if (/\bquantidade\b/.test(textoNorm) && /\bpor eixo\b/.test(textoNorm)) return true;
      const celulas = linha.filter((c) => txt(c)).length;
      if (celulas > 3) return false;
      return linha.every((cell) => {
        const valor = txt(cell);
        if (!valor) return true;
        const n = normalizarTexto(valor);
        return (
          n === ano ||
          /\bquantidade\b/.test(n) ||
          /\bcurso(s)?\b/.test(n) ||
          /\beixo\b/.test(n) ||
          /\bsegmento\b/.test(n)
        );
      });
    })();
    if (pareceSeparadorAno) continue;

    const segmento = getCell(linha, idxSegmento);
    const quantidadeCursos = getCell(linha, idxQuantidadeCursos);
    const curso = getCell(linha, idxCurso);
    const ch = getCell(linha, idxCh);
    const turmas = getCell(linha, idxTurmas);
    const codigo = getCell(linha, idxCodigo);
    const alunos = getCell(linha, idxAlunos);
    const instrutores = getCell(linha, idxInstrutores);

    if (segmento) segmentoAtual = segmento;
    if (quantidadeCursos) quantidadeAtual = quantidadeCursos;
    if (curso) cursoAtual = curso;
    if (ch) chAtual = ch;

    const reg = {
      linhaPlanilha: ri + 1,
      eixo: segmentoAtual,
      curso: curso || cursoAtual,
      ch: ch || chAtual,
      turmas,
      codigo,
      alunos,
      instrutores,
      quantidadeCursosSegmento: quantidadeCursos || quantidadeAtual,
    };
    registrosBrutos.push(reg);

    const eixo = normalizarTexto(reg.eixo);
    const cursoN = normalizarTexto(reg.curso);
    const chN = normalizarTexto(reg.ch);
    const turmasN = normalizarTexto(reg.turmas);
    const codigoN = normalizarTexto(reg.codigo);
    const alunosN = normalizarTexto(reg.alunos);
    const instrutoresN = normalizarTexto(reg.instrutores);

    const linhaVazia =
      !eixo && !cursoN && !chN && !turmasN && !codigoN && !alunosN && !instrutoresN;
    const cabecalhoRepetido =
      eixo === "segmento" ||
      eixo === "eixo" ||
      cursoN === "curso" ||
      cursoN === "cursos" ||
      chN === "ch" ||
      codigoN === "codigo" ||
      codigoN === "código";
    const linhaTitulo =
      eixo.includes("quantidade de cursos") ||
      cursoN.includes("quantidade de cursos") ||
      cursoN.includes("cursos por eixo");
    const pareceRegistro =
      cursoN && (eixo || chN || turmasN || codigoN || alunosN || instrutoresN);

    if (linhaVazia || cabecalhoRepetido || linhaTitulo || !pareceRegistro) {
      if (!linhaVazia && !cabecalhoRepetido && !linhaTitulo) {
        excluidos.push({ ...reg, motivo: "sem eixo/ch/turmas/codigo/alunos/instrutores" });
      }
    }
  }

  const importados = registrosBrutos.filter((reg) => {
    const eixo = normalizarTexto(reg.eixo);
    const cursoN = normalizarTexto(reg.curso);
    const chN = normalizarTexto(reg.ch);
    const turmasN = normalizarTexto(reg.turmas);
    const codigoN = normalizarTexto(reg.codigo);
    const alunosN = normalizarTexto(reg.alunos);
    const instrutoresN = normalizarTexto(reg.instrutores);
    const linhaVazia =
      !eixo && !cursoN && !chN && !turmasN && !codigoN && !alunosN && !instrutoresN;
    const cabecalhoRepetido =
      eixo === "segmento" ||
      eixo === "eixo" ||
      cursoN === "curso" ||
      cursoN === "cursos" ||
      chN === "ch" ||
      codigoN === "codigo" ||
      codigoN === "código";
    const linhaTitulo =
      eixo.includes("quantidade de cursos") ||
      cursoN.includes("quantidade de cursos") ||
      cursoN.includes("cursos por eixo");
    const pareceRegistro =
      cursoN && (eixo || chN || turmasN || codigoN || alunosN || instrutoresN);
    return !linhaVazia && !cabecalhoRepetido && !linhaTitulo && pareceRegistro;
  });

  // Linhas com nome de curso na coluna mas excluídas
  const comNomeCurso = registrosBrutos.filter((r) => normalizarTexto(r.curso).length >= 3);
  const nomesExcluidos = comNomeCurso.filter(
    (r) => !importados.some((i) => i.linhaPlanilha === r.linhaPlanilha),
  );

  console.log(`\nAba: ${sheetName} (cabeçalho linha ${headerRow + 1})`);
  console.log(`Importados pelo filtro atual: ${importados.length}`);
  console.log(`Linhas com nome de curso (>=3 chars): ${comNomeCurso.length}`);
  console.log(`Linhas com curso mas EXCLUÍDAS: ${nomesExcluidos.length}`);
  if (nomesExcluidos.length) {
    nomesExcluidos.forEach((r) => {
      console.log(
        `  L${r.linhaPlanilha}: eixo="${r.eixo}" curso="${r.curso}" ch="${r.ch}" turmas="${r.turmas}" cod="${r.codigo}" alunos="${r.alunos}" instr="${r.instrutores}"`,
      );
    });
  }

  // Linhas com algum conteúdo mas sem curso identificável
  const incompletas = registrosBrutos.filter((r) => {
    const cursoN = normalizarTexto(r.curso);
    const eixo = normalizarTexto(r.eixo);
    const chN = normalizarTexto(r.ch);
    const turmasN = normalizarTexto(r.turmas);
    const codigoN = normalizarTexto(r.codigo);
    const alunosN = normalizarTexto(r.alunos);
    const instrutoresN = normalizarTexto(r.instrutores);
    const temAlgo = eixo || chN || turmasN || codigoN || alunosN || instrutoresN;
    const importada = importados.some((i) => i.linhaPlanilha === r.linhaPlanilha);
    return temAlgo && !importada && cursoN.length < 3;
  });
  if (incompletas.length) {
    console.log(`Linhas com dados parciais sem curso (candidatas a edição): ${incompletas.length}`);
    incompletas.forEach((r) => {
      console.log(
        `  L${r.linhaPlanilha}: eixo="${r.eixo}" curso="${r.curso}" ch="${r.ch}" turmas="${r.turmas}" cod="${r.codigo}"`,
      );
    });
  }

  // Linhas só com segmento/quantidade (sem nome de curso na coluna)
  const soSegmento = [];
  let segCtx = "";
  let qtdCtx = "";
  for (let ri = headerRow + 1; ri < matriz.length; ri++) {
    const linha = matriz[ri] || [];
    const segmento = getCell(linha, idxSegmento);
    const quantidadeCursos = getCell(linha, idxQuantidadeCursos);
    const curso = getCell(linha, idxCurso);
    const ch = getCell(linha, idxCh);
    const turmas = getCell(linha, idxTurmas);
    const codigo = getCell(linha, idxCodigo);
    const alunos = getCell(linha, idxAlunos);
    const instrutores = getCell(linha, idxInstrutores);
    if (segmento) segCtx = segmento;
    if (quantidadeCursos) qtdCtx = quantidadeCursos;
    const cursoEff = curso;
    const temDetalhe = ch || turmas || codigo || alunos || instrutores;
    if ((segmento || quantidadeCursos) && !cursoEff && !temDetalhe) {
      soSegmento.push({
        linha: ri + 1,
        segmento: segmento || segCtx,
        quantidade: quantidadeCursos || qtdCtx,
      });
    }
  }
  if (soSegmento.length) {
    console.log(`Linhas só segmento/qtd (sem curso na coluna): ${soSegmento.length}`);
    soSegmento.slice(0, 15).forEach((r) =>
      console.log(`  L${r.linha}: segmento="${r.segmento}" qtd="${r.quantidade}"`),
    );
  }

  const linhasComConteudo = matriz.slice(headerRow + 1).filter((row) =>
    (row || []).some((c) => txt(c).length > 0),
  ).length;
  console.log(`Total linhas com alguma célula preenchida após cabeçalho: ${linhasComConteudo}`);
  console.log(`Diferença vs importados: ${linhasComConteudo - importados.length}`);

  const naoImportadas = registrosBrutos.filter((r) => {
    const temConteudo = normalizarTexto(
      [r.eixo, r.curso, r.ch, r.turmas, r.codigo, r.alunos, r.instrutores, r.quantidadeCursosSegmento].join(" "),
    );
    if (!temConteudo) return false;
    return !importados.some((i) => i.linhaPlanilha === r.linhaPlanilha);
  });
  if (naoImportadas.length) {
    console.log(`Linhas com conteúdo NÃO importadas (${naoImportadas.length}):`);
    naoImportadas.forEach((r) => {
      console.log(
        `  L${r.linhaPlanilha}: eixo="${r.eixo}" qtd="${r.quantidadeCursosSegmento}" curso="${r.curso}" ch="${r.ch}" turmas="${r.turmas}" cod="${r.codigo}" alunos="${r.alunos}"`,
      );
    });
  }

  const importadasLinhas = new Set(importados.map((i) => i.linhaPlanilha));
  const puladas = [];
  for (let ri = headerRow + 1; ri < matriz.length; ri++) {
    const linha = matriz[ri] || [];
    const temConteudo = linha.some((c) => txt(c).length > 0);
    if (!temConteudo) continue;
    if (importadasLinhas.has(ri + 1)) continue;
    const textoLinha = linha.map((c) => txt(c)).join(" | ");
    puladas.push({ linha: ri + 1, texto: textoLinha.slice(0, 120) });
  }
  if (puladas.length) {
    console.log(`Linhas preenchidas na planilha mas fora dos importados (${puladas.length}):`);
    puladas.forEach((r) => console.log(`  L${r.linha}: ${r.texto}`));
  }
}

function detectarAno(texto) {
  const m = String(texto).match(/\b(202[4-9])\b/);
  return m ? m[1] : null;
}
