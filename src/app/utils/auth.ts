import { getUsuarios, updateUsuario, type UsuarioRecord } from "./store";
import { isStatusAtivo } from "./userHelpers";

const SESSION_KEY = "sgp_sessao";
const LAST_EMAIL_KEY = "sgp_ultimo_email";

/** Credenciais padrão do administrador para demonstração / primeiro acesso. */
export const DEMO_ADMIN_EMAIL = "administrador@df.senac.br";
export const DEMO_ADMIN_PASSWORD = "senac2025";

export interface SessionData {
  userId: string;
  nome: string;
  email: string;
  perfil: string;
  unidade?: string;
}

export function getSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function setSession(user: UsuarioRecord) {
  const session: SessionData = {
    userId: user.id,
    nome: user.nome,
    email: user.email,
    perfil: user.perfil,
    unidade: user.unidade,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function setLastLoginEmail(email: string) {
  localStorage.setItem(LAST_EMAIL_KEY, email.trim());
}

export function getLastLoginEmail(): string {
  return localStorage.getItem(LAST_EMAIL_KEY) ?? DEMO_ADMIN_EMAIL;
}

export function login(
  email: string,
  senha: string,
): { ok: true; user: UsuarioRecord } | { ok: false; error: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedSenha = senha.trim();

  if (!normalizedEmail || !trimmedSenha) {
    return { ok: false, error: "Informe e-mail e senha." };
  }

  const user = getUsuarios().find(
    (u) => u.email.trim().toLowerCase() === normalizedEmail,
  );

  if (!user) {
    return { ok: false, error: "E-mail ou senha incorretos." };
  }

  if (!isStatusAtivo(user.status)) {
    return {
      ok: false,
      error: "Usuário inativo ou suspenso. Contate o administrador.",
    };
  }

  if (!user.senha) {
    return {
      ok: false,
      error: "Este usuário não possui senha cadastrada. Cadastre novamente em Usuários.",
    };
  }

  if (user.senha !== trimmedSenha) {
    return { ok: false, error: "E-mail ou senha incorretos." };
  }

  updateUsuario(user.id, { ultimoAcesso: "Agora" });

  return { ok: true, user: { ...user, ultimoAcesso: "Agora" } };
}
