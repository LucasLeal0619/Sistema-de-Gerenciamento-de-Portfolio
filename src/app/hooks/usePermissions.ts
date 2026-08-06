import { useMemo } from "react";
import { getSession } from "../utils/auth";
import { canManageUsers, canWrite, isConsultivo } from "../utils/permissions";

export function usePermissions() {
  const session = getSession();

  return useMemo(() => {
    const write = canWrite(session?.perfil);
    return {
      session,
      canWrite: write,
      /** Alias alinhado ao Vue (`podeEditarDados`). */
      podeEditar: write,
      canManageUsers: canManageUsers(session?.perfil),
      isConsultivo: isConsultivo(session?.perfil),
    };
  }, [session?.perfil, session?.userId]);
}
