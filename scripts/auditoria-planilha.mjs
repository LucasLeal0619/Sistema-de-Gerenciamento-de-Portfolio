/**
 * Auditoria da planilha do cliente vs importadores do SGP.
 * Uso: node scripts/auditoria-planilha.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLANILHA = "C:\\Users\\lucas\\OneDrive\\Desktop\\Portfólio 2025 - Grupo da Aprendizagem G4F.xlsx";

const normalizarTexto = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const txt = (v) =>
  String(v ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const PATTERN_SEI = /^\d{4}\.\d{6,}/;
const pareceNumeroSei = (value) => PATTERN_SEI.test(txt(value));

function contarLinhasComDados(ws, maxRows = 5000) {
  const ref = ws["!ref"];
  if (!ref) return 0;
  const range = XLSX.utils.decode_range(ref);
  range.e.r = Math.min(range.e.r, maxRows);
  const matriz = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, range });
  return matriz.filter((row) => {
    if (!Array.isArray(row)) return false;
    return row.some((cell) => txt(cell).length > 0);
  }).length;
}

function contarSeiNaAba(ws, maxRows = 2000) {
  const ref = ws["!ref"];
  if (!ref) return 0;
  const range = XLSX.utils.decode_range(ref);
  range.e.r = Math.min(range.e.r, maxRows);
  const matriz = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, range });
  let count = 0;
  for (const row of matriz) {
    if (!Array.isArray(row)) continue;
    if (row.some((cell) => pareceNumeroSei(cell))) count++;
  }
  return count;
}

function contarCursosNaAba(ws) {
  const matriz = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
  let headerRow = -1;
  for (let i = 0; i < Math.min(matriz.length, 15); i++) {
    const texto = (matriz[i] || []).map(normalizarTexto).join(" ");
    if (
      (texto.includes("titulo") || texto.includes("curso")) &&
      (texto.includes("ch") || texto.includes("status"))
    ) {
      headerRow = i;
      break;
    }
  }
  if (headerRow < 0) return { headerRow, count: 0 };

  const cabecalho = (matriz[headerRow] || []).map((c) => normalizarTexto(c));
  const idxTitulo = cabecalho.findIndex(
    (h) => h.includes("titulo") || h.includes("nome do curso") || h === "curso",
  );
  const idxCh = cabecalho.findIndex((h) => h === "ch" || h.includes("carga horaria"));

  let count = 0;
  for (let i = headerRow + 1; i < matriz.length; i++) {
    const row = matriz[i] || [];
    const titulo = idxTitulo >= 0 ? txt(row[idxTitulo]) : "";
    const ch = idxCh >= 0 ? txt(row[idxCh]) : "";
    if (titulo.length > 5 || ch.length > 0) count++;
  }
  return { headerRow, count };
}

if (!fs.existsSync(PLANILHA)) {
  console.error("Planilha não encontrada:", PLANILHA);
  process.exit(1);
}

const buffer = fs.readFileSync(PLANILHA);
const wb = XLSX.read(buffer, { type: "buffer", cellDates: false, raw: false });

console.log("=".repeat(70));
console.log("AUDITORIA — Planilha do Cliente");
console.log("Arquivo:", path.basename(PLANILHA));
console.log("Total de abas:", wb.SheetNames.length);
console.log("=".repeat(70));
console.log("\n## Todas as abas\n");

const abaStats = wb.SheetNames.map((name) => {
  const ws = wb.Sheets[name];
  const linhas = contarLinhasComDados(ws);
  const seis = contarSeiNaAba(ws);
  return { name, linhas, seis };
});

for (const a of abaStats) {
  console.log(`  • ${a.name}`);
  console.log(`      Linhas com dados: ~${a.linhas} | Linhas com SEI: ~${a.seis}`);
}

// Módulos importados pelo SGP
const MODULOS_IMPORTADOS = [
  "Gastronomia",
  "Ambiente e Saúde",
  "Gestão e Moda",
  "Tecnologia e Economia Criativa",
  "Beleza e Cuidado Pessoal",
  "60+",
  "Ensino Médio",
  "Plano de Metas",
  "Retificativos PCA 2025",
  "Valores PCA 2025 - Retificativo",
  "Quantidade de Cursos por Eixo",
  "Processos de Visitas Técnicas",
  "Processos Horas Pedagógicas",
];

const ABAS_SEM_IMPORTACAO = abaStats
  .filter((a) => !MODULOS_IMPORTADOS.some((m) => normalizarTexto(a.name).includes(normalizarTexto(m).slice(0, 12))))
  .map((a) => a.name);

console.log("\n## Abas provavelmente SEM importação automática\n");
for (const name of ABAS_SEM_IMPORTACAO) {
  const stat = abaStats.find((a) => a.name === name);
  console.log(`  ⚠ ${name} (~${stat?.linhas} linhas)`);
}

// Estimativas por módulo
console.log("\n## Estimativa de registros na planilha (heurística)\n");

const planoAba = wb.SheetNames.find((n) => normalizarTexto(n).includes("plano de metas"));
if (planoAba) {
  console.log(`  Plano de Metas [${planoAba}]: ~${contarSeiNaAba(wb.Sheets[planoAba])} linhas com SEI`);
}

const pcaAba = wb.SheetNames.find((n) => normalizarTexto(n).includes("pca") || normalizarTexto(n).includes("retificativ"));
if (pcaAba) {
  console.log(`  Valores PCA [${pcaAba}]: ~${contarSeiNaAba(wb.Sheets[pcaAba])} linhas com SEI`);
}

const eixoAbas = wb.SheetNames.filter((n) => {
  const t = normalizarTexto(n);
  return t.includes("quantidade") && t.includes("eixo");
});
for (const name of eixoAbas) {
  const ws = wb.Sheets[name];
  const matriz = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false });
  const comCurso = matriz.filter((row) => {
    if (!Array.isArray(row)) return false;
    return row.some((c) => txt(c).length > 15);
  }).length;
  console.log(`  Cursos por Eixo [${name}]: ~${comCurso} linhas com texto longo`);
}

const visitasAba = wb.SheetNames.find((n) => normalizarTexto(n).includes("visitas"));
if (visitasAba) {
  console.log(`  Visitas [${visitasAba}]: ~${contarSeiNaAba(wb.Sheets[visitasAba], 200)} linhas com SEI`);
}

const horasAba = wb.SheetNames.find((n) => normalizarTexto(n).includes("horas"));
if (horasAba) {
  console.log(`  Horas [${horasAba}]: ~${contarLinhasComDados(wb.Sheets[horasAba], 200)} linhas`);
}

const eixosCurso = [
  "Gastronomia",
  "Ambiente e Saúde",
  "Gestão e Moda",
  "Tecnologia e Economia Criativa",
  "Beleza e Cuidado Pessoal",
  "60+",
  "Ensino Médio",
];
let totalCursosEst = 0;
console.log("\n  Cursos (catálogo por eixo):");
for (const eixo of eixosCurso) {
  const aba = wb.SheetNames.find((n) => normalizarTexto(n) === normalizarTexto(eixo) || n === eixo);
  if (aba) {
    const { count } = contarCursosNaAba(wb.Sheets[aba]);
    totalCursosEst += count;
    console.log(`    ${aba}: ~${count} cursos`);
  } else {
    console.log(`    ${eixo}: aba não encontrada`);
  }
}
console.log(`    TOTAL estimado catálogo: ~${totalCursosEst}`);

console.log("\n## Próximo passo: rodar importadores reais via vite-node ou app\n");
