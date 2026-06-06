import { Link } from "react-router";
import { Info } from "lucide-react";
import { SenacLogo } from "../components/SenacLogo";
import { Button } from "../components/ui/button";

export function ResetPassword() {
  return (
    <div className="min-h-screen bg-[#003F7D] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md overflow-hidden">
        <div className="h-1 w-full bg-[#F57C00] -mx-8 -mt-8 mb-6" style={{ width: "calc(100% + 4rem)" }} />
        <div className="flex justify-center mb-6">
          <SenacLogo />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#003F7D] mb-1">Redefinir senha</h1>
          <p className="text-gray-600 text-sm">SGP — Sistema de Gerenciamento de Portfólio</p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-900">
          <Info size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">
            A redefinição de senha por link de e-mail será disponibilizada em uma versão futura,
            integrada à TI do SENAC. Nesta versão beta, o administrador pode alterar a senha em{" "}
            <strong>Usuários → Editar usuário</strong>.
          </p>
        </div>

        <Link to="/" className="block mt-6">
          <Button variant="outline" className="w-full h-11">
            Voltar para login
          </Button>
        </Link>
      </div>
    </div>
  );
}
