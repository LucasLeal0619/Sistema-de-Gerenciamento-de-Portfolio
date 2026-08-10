import type { ReactNode } from "react";
import { HorizontalScrollContainer } from "./HorizontalScrollContainer";

type PageTableCardProps = {
  summary?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageTableCard({ summary, meta, footer, children, className = "" }: PageTableCardProps) {
  const hasHeader = Boolean(summary || meta);

  return (
    <section className={`tabela-card${className ? ` ${className}` : ""}`}>
      {hasHeader ? (
        <div className="tabela-header">
          {summary ? <span className="tabela-contador">{summary}</span> : <span />}
          {meta ? <span>{meta}</span> : null}
        </div>
      ) : null}

      <div className="tabela-wrap">
        <HorizontalScrollContainer>{children}</HorizontalScrollContainer>
      </div>

      {footer ? <div className="border-t border-gray-200 bg-gray-50">{footer}</div> : null}
    </section>
  );
}
