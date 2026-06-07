import * as XLSX from "xlsx";
import { saveUsuario, getUsuarios, emailJaCadastrado } from "./store";
import { perfilToLabel, perfilToSlug, UNIDADES } from "./userHelpers";
import { logActivity } from "./activityLog";
import { notifyDataChanged } from "./dataRefresh";

export type UsuarioImportRow = {
  nome: string;
  email: string;
  unidade: string;
  perfil: string;
  senha: string;
  telefone: string;
};

export type ResultadoImportUsuarios = {
  importados: number;
  ignorados: number;
  erros: string[];
};

function normHeader(h: string) {
  return h.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function pickField(row: Record<string, unknown>, aliases: string[]): string {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const found = keys.find((k) => normHeader(k) === normHeader(alias));
    if (found && row[found] != null) return String(row[found]).trim();
  }
  return "";
}

export function parseUsuariosRows(rows: Record<string, unknown>[]): UsuarioImportRow[] {
  return rows
    .map((row) => ({
      nome: pickField(row, ["nome", "name", "nome completo"]),
      email: pickField(row, ["email", "e-mail", "e mail"]),
      unidade: pickField(row, ["unidade", "lotacao", "lotação"]),
      perfil: pickField(row, ["perfil", "nivel", "nível", "acesso", "role"]),
      senha: pickField(row, ["senha", "password"]),
      telefone: pickField(row, ["telefone", "tel", "celular"]),
    }))
    .filter((r) => r.nome || r.email);
}

export async function importarUsuariosArquivo(file: File): Promise<ResultadoImportUsuarios> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return importarUsuariosLista(parseUsuariosRows(rows));
}

export function importarUsuariosLista(lista: UsuarioImportRow[]): ResultadoImportUsuarios {
  let importados = 0;
  let ignorados = 0;
  const erros: string[] = [];

  lista.forEach((row, idx) => {
    const linha = idx + 2;
    if (!row.nome.trim()) {
      erros.push(`Linha ${linha}: nome obrigatório`);
      ignorados++;
      return;
    }
    if (!row.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      erros.push(`Linha ${linha}: e-mail inválido (${row.email || "vazio"})`);
      ignorados++;
      return;
    }
    if (emailJaCadastrado(row.email)) {
      erros.push(`Linha ${linha}: e-mail já cadastrado (${row.email})`);
      ignorados++;
      return;
    }

    const slug = perfilToSlug(row.perfil || "consultivo");
    if (!["admin", "editor", "consultivo"].includes(slug)) {
      erros.push(`Linha ${linha}: perfil inválido (${row.perfil || "vazio"})`);
      ignorados++;
      return;
    }

    const unidade = UNIDADES.includes(row.unidade) ? row.unidade : row.unidade || "SENAC DF";
    const senha = row.senha.trim() || "senac2025";

    saveUsuario({
      nome: row.nome.trim(),
      email: row.email.trim().toLowerCase(),
      cpf: "",
      perfil: perfilToLabel(slug),
      status: "Ativo",
      senha,
      ultimoAcesso: "—",
      unidade,
      telefone: row.telefone.trim() || "—",
    });
    importados++;
  });

  if (importados) {
    logActivity(
      "Usuários importados em lote",
      `${importados} cadastro(s); ${ignorados} ignorado(s)`,
    );
    notifyDataChanged("import");
  }

  return { importados, ignorados, erros };
}
