import fs from "fs";
import * as XLSX from "xlsx";

const p = "C:\\Users\\lucas\\OneDrive\\Desktop\\Portfólio 2025 - Grupo da Aprendizagem G4F.xlsx";
const wb = XLSX.read(fs.readFileSync(p), { type: "buffer" });
console.log("Total de abas:", wb.SheetNames.length);
wb.SheetNames.forEach((n, i) => console.log(`${i + 1}. ${n}`));
