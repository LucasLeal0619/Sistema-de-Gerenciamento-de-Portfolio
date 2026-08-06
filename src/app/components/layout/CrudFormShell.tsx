import type { ReactNode } from "react";

type CrudFormShellProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: ReactNode;
};

/** Página de cadastro/edição (laranja no topo), igual ao sistema real / Cursos. */
export function CrudFormShell({ title, subtitle, onBack, children }: CrudFormShellProps) {
  return (
    <div className="form-page">
      <div className="form-top-bar" />
      <header className="form-header">
        <button type="button" className="btn-voltar" onClick={onBack} aria-label="Voltar">
          ←
        </button>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </header>
      {children}
    </div>
  );
}
