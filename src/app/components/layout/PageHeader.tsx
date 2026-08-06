import type { ReactNode } from "react";
import { ExportHint } from "../ExportHint";

type PageHeaderProps = {
  title: string;
  description?: string;
  info?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  filteredCount?: number;
  totalCount?: number;
  showExportHint?: boolean;
};

export function PageHeader({
  title,
  description,
  info,
  meta,
  actions,
  filteredCount,
  totalCount,
  showExportHint = false,
}: PageHeaderProps) {
  return (
    <header className="crud-top">
      <div className="crud-top-row">
        <div>
          <h1>{title}</h1>
          {description ? <p className="crud-subtitle">{description}</p> : null}
          {meta ? <div className="mt-1">{meta}</div> : null}
        </div>

        {actions ? <div>{actions}</div> : null}
      </div>

      {info ? <div className="crud-info">{info}</div> : null}

      {showExportHint && typeof filteredCount === "number" ? (
        <div className="mt-4">
          <ExportHint filteredCount={filteredCount} totalCount={totalCount} />
        </div>
      ) : null}
    </header>
  );
}
