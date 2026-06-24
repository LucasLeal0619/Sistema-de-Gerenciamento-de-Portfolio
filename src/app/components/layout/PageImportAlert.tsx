import type { ReactNode } from "react";

type PageImportAlertProps = {
  title: string;
  children: ReactNode;
};

export function PageImportAlert({ title, children }: PageImportAlertProps) {
  return (
    <div className="mx-4 mt-6 rounded-xl border border-orange-200 bg-orange-50 p-5 text-orange-800 lg:mx-8">
      <strong>{title}</strong>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
