import type { ReactNode } from "react";

type PageInfoAlertProps = {
  title: string;
  children?: ReactNode;
};

export function PageInfoAlert({ title, children }: PageInfoAlertProps) {
  return (
    <div className="crud-info">
      <strong>{title}</strong>
      {children ? <div className="mt-1">{children}</div> : null}
    </div>
  );
}
