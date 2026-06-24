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
    <div className={`px-4 pb-10 lg:px-8 ${className}`.trim()}>
      <div className="rounded-xl border border-gray-200 shadow-sm">
        {hasHeader ? (
          <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-gray-50 px-5 py-3">
            {summary ? (
              <span className="text-sm font-semibold text-gray-700">{summary}</span>
            ) : (
              <span />
            )}
            {meta ? <span className="text-xs text-gray-500">{meta}</span> : null}
          </div>
        ) : null}
        <HorizontalScrollContainer className={!footer && !hasHeader ? "rounded-xl" : undefined}>
          {children}
        </HorizontalScrollContainer>
        {footer ? (
          <div className="rounded-b-xl border-t border-gray-200 bg-gray-50">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
