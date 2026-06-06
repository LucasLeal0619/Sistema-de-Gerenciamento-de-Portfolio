import fs from "fs";
import { importarPlanoMetasExcel } from "../src/app/utils/importExcel";
import { classificarStatusPlanoMetas } from "../src/app/utils/planoMetasStatus";

const PLANILHA =
  "C:\\Users\\lucas\\OneDrive\\Desktop\\Portfólio 2025 - Grupo da Aprendizagem G4F.xlsx";

(globalThis as { alert?: (msg: string) => void }).alert = () => {};

const file = new File([fs.readFileSync(PLANILHA)], "planilha.xlsx", {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
});

const rows = await importarPlanoMetasExcel(file);
const grupos = { PUBLICADO: 0, "EM ANALISE": 0, PENDENTE: 0, OUTRO: 0 };

for (const row of rows) {
  const g = classificarStatusPlanoMetas(row.status);
  grupos[g]++;
}

console.log("Total:", rows.length);
console.log("Grupos:", grupos);
