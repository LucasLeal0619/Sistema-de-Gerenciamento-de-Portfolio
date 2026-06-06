import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { importarHorasPedagogicasExcel } from "../src/app/utils/importExcel";

const PLANILHA =
  "C:\\Users\\lucas\\OneDrive\\Desktop\\Portfólio 2025 - Grupo da Aprendizagem G4F.xlsx";

(globalThis as { alert?: (msg: string) => void }).alert = () => {};

const buffer = fs.readFileSync(PLANILHA);
const file = new File([buffer], path.basename(PLANILHA), {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
});

const wb = XLSX.read(buffer, { type: "buffer", cellDates: false, raw: false });
const ws = wb.Sheets["Processos Horas Pedagógicas"];
const matriz = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: false });

console.log("Linhas na aba Horas:", matriz.length);
console.log("Conteúdo bruto:");
for (let i = 0; i < matriz.length; i++) {
  const row = matriz[i] || [];
  if (Array.isArray(row) && row.some((c) => String(c).trim())) {
    console.log(`  ${i}:`, row.slice(0, 8));
  }
}

const imported = await importarHorasPedagogicasExcel(file);
console.log("\nImportados:", imported.length);
for (const r of imported) {
  console.log(`  - ${r.nomePessoa || "?"} | SEI: ${r.processoSEI} | ${r.segmento}`);
}
