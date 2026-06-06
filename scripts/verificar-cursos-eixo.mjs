import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const path = process.argv[2] || "C:/Users/lucas/Downloads/Portfólio 2025 - Grupo da Aprendizagem G4F (1).xlsx";

// Dynamic import compiled via vite would be heavy; use xlsx + inline logic check
import * as XLSX from "xlsx";

const wb = XLSX.read(fs.readFileSync(path), { sheetRows: 200 });
const sheets = [
  "Gastronomia e Turismo",
  "Saúde",
  "Gestão e Moda",
  "Tecnologia e Economia Criativa",
  "Beleza e Cuidado Pessoal",
  "60+",
  "Ensino Médio 2025",
];

for (const name of sheets) {
  const ws = wb.Sheets[name];
  if (!ws) {
    console.log(name, "— aba não encontrada");
    continue;
  }
  const matriz = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  let headerIdx = -1;
  for (let i = 0; i < matriz.length; i++) {
    const linha = matriz[i].map((c) => String(c).toLowerCase()).join(" ");
    if (linha.includes("titulo") && linha.includes("modalidade") && linha.includes("ch")) {
      headerIdx = i;
      break;
    }
  }
  const rows = XLSX.utils.sheet_to_json(ws, { range: headerIdx, defval: "", raw: false });
  const valid = rows.filter((r) => {
    const t = String(r["Titulo - Nome do Curso"] || r["Título - Nome do Curso"] || "").trim();
    return t.length >= 3;
  });
  const comDN = valid.filter((r) => r["Cód. DN"] || r["Cod. DN"]).length;
  const comBolsa = valid.filter((r) => r["Compatível com bolsa"] || r["Compativel com bolsa"]).length;
  console.log(`${name}: ${valid.length} cursos | DN: ${comDN} | Bolsa: ${comBolsa}`);
}
