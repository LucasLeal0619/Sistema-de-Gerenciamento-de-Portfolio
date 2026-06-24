import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

type PageWarningAlertProps = {
  title: string;
  children: ReactNode;
};

export function PageWarningAlert({ title, children }: PageWarningAlertProps) {
  return (
    <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-yellow-900">
      <div className="flex items-start gap-3">
        <TriangleAlert size={20} className="mt-0.5 flex-shrink-0 text-yellow-600" />
        <div>
          <strong>{title}</strong>
          <div className="mt-1 text-sm text-yellow-800">{children}</div>
        </div>
      </div>
    </div>
  );
}
