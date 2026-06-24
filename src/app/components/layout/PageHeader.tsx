import type { ReactNode } from "react";
import { ExportHint } from "../ExportHint";

type PageHeaderProps = {
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  filteredCount?: number;
  totalCount?: number;
  showExportHint?: boolean;
};

export function PageHeader({
  title,
  description,
  meta,
  actions,
  filteredCount,
  totalCount,
  showExportHint = true,
}: PageHeaderProps) {
  return (
    <div className="border-b border-gray-200 px-4 pb-5 pt-20 lg:px-8 lg:pt-6">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#003F7D] lg:text-3xl">{title}</h1>
          {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
          {meta ? <div className="mt-1">{meta}</div> : null}
        </div>

        {actions ? (
          <div className="flex flex-wrap justify-start gap-2 lg:justify-end">{actions}</div>
        ) : null}
      </div>

      {showExportHint && typeof filteredCount === "number" ? (
        <div className="mt-4">
          <ExportHint filteredCount={filteredCount} totalCount={totalCount} />
        </div>
      ) : null}
    </div>
  );
}
