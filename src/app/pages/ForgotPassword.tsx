import { Link } from "react-router";
import { Info, Mail } from "lucide-react";
import { SenacLogo } from "../components/SenacLogo";
import { Button } from "../components/ui/button";

export function ForgotPassword() {
  return (
    <div className="min-h-screen bg-[#003F7D] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md overflow-hidden">
        <div className="h-1 w-full bg-[#F57C00] -mx-8 -mt-8 mb-6" style={{ width: "calc(100% + 4rem)" }} />
        <div className="flex justify-center mb-6">
          <SenacLogo />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#003F7D] mb-1">Recuperação de senha</h1>
          <p className="text-gray-600 text-sm">SGP — Sistema de Gerenciamento de Portfólio</p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-900 mb-6">
          <Info size={18} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <p>
              Nesta versão beta, as senhas são gerenciadas <strong>localmente</strong> pelo
              administrador do sistema.
            </p>
            <p className="mt-2">
              Se você esqueceu a senha, solicite ao <strong>administrador SGP</strong> que redefina
              seu acesso em <strong>Usuários → Editar</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <Mail size={16} className="text-gray-400" />
          Recuperação por e-mail será integrada com a TI do SENAC futuramente.
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
