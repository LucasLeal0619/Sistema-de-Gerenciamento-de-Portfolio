import { Eye } from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";

export function ReadOnlyBanner() {
  const { isConsultivo } = usePermissions();
  if (!isConsultivo) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-purple-900">
      <Eye size={16} className="mt-0.5 flex-shrink-0" />
      <p className="text-sm">
        <strong>Perfil Consultor.</strong> Você pode visualizar e exportar dados, mas não cadastrar,
        editar, importar ou excluir registros.
      </p>
    </div>
  );
}
