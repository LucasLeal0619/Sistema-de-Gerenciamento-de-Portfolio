import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { importarPlanoMetasExcel } from "../src/app/utils/importExcel";

const PLANILHA =
  "C:\\Users\\lucas\\OneDrive\\Desktop\\Portfólio 2025 - Grupo da Aprendizagem G4F.xlsx";

(globalThis as { alert?: (msg: string) => void }).alert = () => {};

const buffer = fs.readFileSync(PLANILHA);
const file = new File([buffer], path.basename(PLANILHA), {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
});

const rows = await importarPlanoMetasExcel(file);

const statusCount: Record<string, number> = {};
const semSig = rows.filter((r) => !r.codigoSIG).length;
const comSei = rows.filter((r) => r.numeroSEI).length;

for (const r of rows) {
  statusCount[r.status] = (statusCount[r.status] || 0) + 1;
}

console.log("Total importado:", rows.length);
console.log("Com SEI:", comSei);
console.log("Sem código SIG:", semSig);
console.log("\nDistribuição status (importado):");
console.log(statusCount);

// Ler cabeçalho real da planilha
const wb = XLSX.read(buffer, { type: "buffer", cellDates: false, raw: false });
const ws = wb.Sheets["PLANO DE METAS 2025"];
const matriz = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: false });

console.log("\nPrimeiras 3 linhas da aba (raw):");
for (let i = 0; i < 5; i++) {
  console.log(`Linha ${i}:`, (matriz[i] || []).slice(0, 12));
}

console.log("\nAmostra 5 registros importados:");
for (const r of rows.slice(0, 5)) {
  console.log({
    segmento: r.segmento?.slice(0, 30),
    curso: r.curso?.slice(0, 40),
    categoria: r.categoria?.slice(0, 20),
    sei: r.numeroSEI,
    sig: r.codigoSIG,
    mes: r.mesEntrega,
    status: r.status,
    origem: r.origem,
  });
}

// Status esperados na planilha - coluna manual
const headerRow = matriz.findIndex((row) =>
  Array.isArray(row) &&
  row.map((c) => String(c).toLowerCase()).join(" ").includes("segmento"),
);

if (headerRow >= 0) {
  const cab = (matriz[headerRow] as unknown[]).map((c) => String(c));
  console.log("\nCabeçalho detectado (linha", headerRow, "):", cab);
}
