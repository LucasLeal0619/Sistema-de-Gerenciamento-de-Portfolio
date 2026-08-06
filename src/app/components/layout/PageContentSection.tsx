import type { ReactNode } from "react";

type PageContentSectionProps = {
  children: ReactNode;
  className?: string;
};

/** Alinha conteúdo auxiliar (alerts) às margens do CRUD real (≈ 2rem). */
export function PageContentSection({ children, className = "" }: PageContentSectionProps) {
  return (
    <div className={className || undefined} style={{ margin: "1rem 2rem 0" }}>
      {children}
    </div>
  );
}
