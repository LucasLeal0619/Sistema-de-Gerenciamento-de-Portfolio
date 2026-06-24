import type { ReactNode } from "react";

type PageLayoutProps = {
  children: ReactNode;
};

export function PageLayout({ children }: PageLayoutProps) {
  return <div className="min-h-screen w-full bg-white">{children}</div>;
}
