import fs from "fs";
import * as XLSX from "xlsx";

const PLANILHA =
  "C:\\Users\\lucas\\OneDrive\\Desktop\\Portfólio 2025 - Grupo da Aprendizagem G4F.xlsx";

const buffer = fs.readFileSync(PLANILHA);
const wb = XLSX.read(buffer, { type: "buffer", cellDates: false, raw: false });

const abas = [
  "PCA 2026 | Propostas",
  "CURSOS NOVOS PCA_2025",
  "Titulos novos 16-05",
  "Planilha1",
  "Valores PCA 1°",
  "Quantidade de Cursos por Eixo ",
];

for (const nome of abas) {
  const ws = wb.Sheets[nome];
  if (!ws) {
    console.log(`\n[${nome}] — aba não encontrada`);
    continue;
  }
  const matriz = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: false });
  console.log(`\n[${nome}] — ${matriz.length} linhas`);
  for (let i = 0; i < Math.min(4, matriz.length); i++) {
    console.log(`  L${i}:`, (matriz[i] || []).slice(0, 8));
  }
}
