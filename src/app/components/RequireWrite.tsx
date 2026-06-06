import { Navigate } from "react-router";
import { canWrite } from "../utils/permissions";

export function RequireWrite({ children }: { children: React.ReactNode }) {
  if (!canWrite()) {
    return <Navigate to="/app/inicio" replace />;
  }
  return <>{children}</>;
}
