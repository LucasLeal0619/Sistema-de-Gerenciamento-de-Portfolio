import type { ReactNode } from "react";

type PageContentSectionProps = {
  children: ReactNode;
  className?: string;
};

export function PageContentSection({ children, className = "" }: PageContentSectionProps) {
  return <div className={`mx-4 lg:mx-8 ${className}`.trim()}>{children}</div>;
}
