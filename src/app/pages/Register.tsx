import { Link } from "react-router";
import { Info, Shield } from "lucide-react";
import { SenacLogo } from "../components/SenacLogo";
import { Button } from "../components/ui/button";

export function Register() {
  return (
    <div className="min-h-screen bg-[#003F7D] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md overflow-hidden">
        <div className="h-1 w-full bg-[#F57C00] -mx-8 -mt-8 mb-6" style={{ width: "calc(100% + 4rem)" }} />
        <div className="flex justify-center mb-6">
          <SenacLogo />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#003F7D] mb-1">Cadastro de usuário</h1>
          <p className="text-gray-600 text-sm">SGP — Sistema de Gerenciamento de Portfólio</p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 text-amber-900 mb-6">
          <Shield size={18} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <p>
              O auto-cadastro não está disponível nesta versão beta. Novos acessos são criados pelo{" "}
              <strong>administrador</strong> em <strong>Usuários → Novo Usuário</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-900">
          <Info size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            Se você precisa de acesso ao SGP, entre em contato com a equipe responsável pelo
            portfólio ou com o administrador do sistema no SENAC DF.
          </p>
        </div>

        <Link to="/" className="block mt-6">
          <Button className="w-full h-11 bg-[#F57C00] hover:bg-[#E86D00] text-white">
            Voltar para login
          </Button>
        </Link>
      </div>
    </div>
  );
}
