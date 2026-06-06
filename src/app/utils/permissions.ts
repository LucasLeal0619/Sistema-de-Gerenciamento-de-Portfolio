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
