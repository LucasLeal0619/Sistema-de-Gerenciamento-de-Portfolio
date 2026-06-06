/**
 * Executa os importadores reais do SGP contra a planilha do cliente.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const PLANILHA = "C:\\Users\\lucas\\OneDrive\\Desktop\\Portfólio 2025 - Grupo da Aprendizagem G4F.xlsx";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Mock alert usado nos importadores
globalThis.alert = (msg) => console.warn("[alert]", String(msg).slice(0, 120));

const buffer = fs.readFileSync(PLANILHA);
const file = new File([buffer], path.basename(PLANILHA), {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
});

const importPath = pathToFileURL(
  path.join(projectRoot, "src/app/utils/importExcel.ts"),
).href;

const {
  importarCursosPortfolio,
  importarPlanoMetasExcel,
  importarValoresPCAExcel,
  importarCursosEixoExcel,
  importarVisitasTecnicasExcel,
  importarHorasPedagogicasExcel,
} = await import(importPath);

const modulos = [
  { nome: "Cursos (catálogo)", fn: importarCursosPortfolio },
  { nome: "Plano de Metas", fn: importarPlanoMetasExcel },
  { nome: "Valores PCA", fn: importarValoresPCAExcel },
  { nome: "Cursos por Eixo", fn: importarCursosEixoExcel },
  { nome: "Visitas Técnicas", fn: importarVisitasTecnicasExcel },
  { nome: "Horas Pedagógicas", fn: importarHorasPedagogicasExcel },
];

console.log("=".repeat(70));
console.log("IMPORTAÇÃO REAL — Resultados por módulo");
console.log("=".repeat(70));

const resultados = [];

for (const { nome, fn } of modulos) {
  try {
    const rows = await fn(file);
    const count = Array.isArray(rows) ? rows.length : 0;
    resultados.push({ nome, count, ok: count > 0, erro: null });

    // Amostra de campos
    const amostra = rows[0];
    const campos =
      amostra && typeof amostra === "object"
        ? Object.keys(amostra).slice(0, 6).join(", ")
        : "—";

    console.log(`\n✓ ${nome}: ${count} registros`);
    if (count > 0) console.log(`  Campos (amostra): ${campos}`);
  } catch (err) {
    resultados.push({ nome, count: 0, ok: false, erro: String(err) });
    console.log(`\n✗ ${nome}: ERRO — ${err.message || err}`);
  }
}

// Detalhes cursos por eixo
const cursosEixo = await importarCursosEixoExcel(file);
if (cursosEixo.length) {
  const porAno = {};
  const porEixo = {};
  for (const r of cursosEixo) {
    const ano = String(r.ano || "?");
    const eixo = String(r.eixo || r.segmento || "?");
    porAno[ano] = (porAno[ano] || 0) + 1;
    porEixo[eixo] = (porEixo[eixo] || 0) + 1;
  }
  console.log("\n  Cursos por Eixo — por ano:", porAno);
  console.log("  Top eixos:", Object.entries(porEixo).sort((a, b) => b[1] - a[1]).slice(0, 5));
}

const cursos = await importarCursosPortfolio(file);
if (cursos.length) {
  const porEixo = {};
  for (const r of cursos) {
    const eixo = String(r.eixo || r.segmento || "?");
    porEixo[eixo] = (porEixo[eixo] || 0) + 1;
  }
  console.log("\n  Catálogo Cursos — por eixo:", porEixo);
}

console.log("\n" + "=".repeat(70));
console.log("TOTAL importado:", resultados.reduce((s, r) => s + r.count, 0));
console.log("Módulos OK:", resultados.filter((r) => r.ok).length, "/", resultados.length);
