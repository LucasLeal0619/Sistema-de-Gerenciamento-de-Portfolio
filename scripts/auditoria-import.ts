import fs from "fs";
import path from "path";
import {
  importarCursosPortfolio,
  importarPlanoMetasExcel,
  importarValoresPCAExcel,
  importarCursosEixoExcel,
  importarVisitasTecnicasExcel,
  importarHorasPedagogicasExcel,
} from "../src/app/utils/importExcel";

const PLANILHA =
  "C:\\Users\\lucas\\OneDrive\\Desktop\\Portfólio 2025 - Grupo da Aprendizagem G4F.xlsx";

(globalThis as { alert?: (msg: string) => void }).alert = (msg) =>
  console.warn("[alert]", String(msg).slice(0, 150));

const buffer = fs.readFileSync(PLANILHA);
const file = new File([buffer], path.basename(PLANILHA), {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
});

const modulos = [
  { nome: "Cursos (catálogo)", fn: importarCursosPortfolio },
  { nome: "Plano de Metas", fn: importarPlanoMetasExcel },
  { nome: "Valores PCA", fn: importarValoresPCAExcel },
  { nome: "Cursos por Eixo", fn: importarCursosEixoExcel },
  { nome: "Visitas Técnicas", fn: importarVisitasTecnicasExcel },
  { nome: "Horas Pedagógicas", fn: importarHorasPedagogicasExcel },
] as const;

console.log("=".repeat(70));
console.log("IMPORTAÇÃO REAL — Resultados por módulo");
console.log("=".repeat(70));

for (const { nome, fn } of modulos) {
  const rows = await fn(file);
  console.log(`\n${rows.length > 0 ? "✓" : "✗"} ${nome}: ${rows.length} registros`);
}

const cursosEixo = await importarCursosEixoExcel(file);
const porAno: Record<string, number> = {};
const porEixo: Record<string, number> = {};
for (const r of cursosEixo) {
  const ano = String(r.ano || "?");
  const eixo = String(r.eixo || r.segmento || "?");
  porAno[ano] = (porAno[ano] || 0) + 1;
  porEixo[eixo] = (porEixo[eixo] || 0) + 1;
}
console.log("\nCursos por Eixo — por ano:", porAno);
console.log(
  "Top eixos:",
  Object.entries(porEixo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8),
);

const cursos = await importarCursosPortfolio(file);
const catPorEixo: Record<string, number> = {};
for (const r of cursos) {
  const eixo = String(r.eixo || r.segmento || "?");
  catPorEixo[eixo] = (catPorEixo[eixo] || 0) + 1;
}
console.log("\nCatálogo Cursos — por eixo:", catPorEixo);
console.log("Total catálogo:", cursos.length);

const plano = await importarPlanoMetasExcel(file);
const statusPlano: Record<string, number> = {};
for (const r of plano) {
  const s = String(r.status || "?");
  statusPlano[s] = (statusPlano[s] || 0) + 1;
}
console.log("\nPlano Metas — status:", statusPlano);

const pca = await importarValoresPCAExcel(file);
console.log("PCA — amostra titulo:", pca[0]?.titulo?.slice(0, 50));
