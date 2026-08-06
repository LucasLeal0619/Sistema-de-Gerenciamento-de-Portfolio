import type { ReactNode } from "react";

type PageLayoutProps = {
  children: ReactNode;
  className?: string;
};

export function PageLayout({ children, className = "" }: PageLayoutProps) {
  return <div className={`crud-page${className ? ` ${className}` : ""}`}>{children}</div>;
}
