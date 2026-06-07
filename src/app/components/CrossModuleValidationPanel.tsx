import { Link } from "react-router";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { runCrossModuleValidation } from "../utils/crossModuleValidation";

export function CrossModuleValidationPanel() {
  const issues = runCrossModuleValidation();

  if (!issues.length) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Nenhuma inconsistência cruzada detectada entre os módulos importados.
      </div>
    );
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <ShieldAlert size={16} className="text-amber-600" />
        <span>
          <strong>{issues.length}</strong> inconsistência(s) —{" "}
          {errors.length} crítica(s), {warnings.length} aviso(s)
        </span>
      </div>
      <ul className="max-h-64 space-y-2 overflow-y-auto">
        {issues.slice(0, 20).map((issue) => (
          <li
            key={issue.id}
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
              issue.severity === "error"
                ? "border-red-200 bg-red-50 text-red-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="font-medium">{issue.modulo}:</span> {issue.message}
              <Link
                to={issue.href}
                className="ml-2 text-xs font-semibold underline underline-offset-2"
              >
                Ver módulo
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {issues.length > 20 && (
        <p className="text-xs text-gray-500">Exibindo 20 de {issues.length} inconsistências.</p>
      )}
    </div>
  );
}
