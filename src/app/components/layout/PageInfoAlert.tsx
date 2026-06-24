import type { ReactNode } from "react";
import { Info } from "lucide-react";

type PageInfoAlertProps = {
  title: string;
  children: ReactNode;
};

export function PageInfoAlert({ title, children }: PageInfoAlertProps) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
      <div className="flex items-start gap-3">
        <Info size={20} className="mt-0.5 flex-shrink-0" />
        <div>
          <strong>{title}</strong>
          <div className="mt-1 text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
