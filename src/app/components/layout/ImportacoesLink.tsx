import { Link } from "react-router";

type ImportacoesLinkProps = {
  variant?: "orange" | "yellow";
};

const variantClasses = {
  orange:
    "font-semibold underline hover:text-orange-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 focus-visible:ring-offset-1 rounded-sm",
  yellow:
    "font-semibold underline text-yellow-900 hover:text-yellow-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-600 focus-visible:ring-offset-1 rounded-sm",
};

export function ImportacoesLink({ variant = "orange" }: ImportacoesLinkProps) {
  return (
    <Link to="/app/importacoes" className={variantClasses[variant]}>
      Importações
    </Link>
  );
}
