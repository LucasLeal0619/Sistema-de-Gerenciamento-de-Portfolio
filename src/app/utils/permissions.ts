import { getSession } from "./auth";
import { perfilToSlug } from "./userHelpers";

export function getSessionPerfilSlug(): string {
  return perfilToSlug(getSession()?.perfil ?? "");
}

export function canWrite(perfil?: string): boolean {
  const slug = perfil ? perfilToSlug(perfil) : getSessionPerfilSlug();
  return slug === "admin" || slug === "editor";
}

export function canManageUsers(perfil?: string): boolean {
  const slug = perfil ? perfilToSlug(perfil) : getSessionPerfilSlug();
  return slug === "admin";
}

export function isConsultivo(perfil?: string): boolean {
  const slug = perfil ? perfilToSlug(perfil) : getSessionPerfilSlug();
  return slug === "consultivo";
}

/** Alias do perfil de leitura no sistema real (Consultor). */
export const isConsultor = isConsultivo;

export function canImportarDados(perfil?: string): boolean {
  return canWrite(perfil);
}

export function canConsultarAuditoria(perfil?: string): boolean {
  return canManageUsers(perfil);
}
