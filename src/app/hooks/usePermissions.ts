import { useMemo } from "react";
import { getSession } from "../utils/auth";
import { canManageUsers, canWrite, isConsultivo } from "../utils/permissions";

export function usePermissions() {
  const session = getSession();

  return useMemo(
    () => ({
      session,
      canWrite: canWrite(session?.perfil),
      canManageUsers: canManageUsers(session?.perfil),
      isConsultivo: isConsultivo(session?.perfil),
    }),
    [session?.perfil, session?.userId],
  );
}
