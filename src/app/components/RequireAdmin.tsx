import { Navigate } from "react-router";
import { canManageUsers } from "../utils/permissions";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  if (!canManageUsers()) {
    return <Navigate to="/app/inicio" replace />;
  }
  return <>{children}</>;
}
