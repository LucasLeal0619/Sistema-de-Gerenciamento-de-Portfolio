import { useState } from "react";
import senacLogo from "../../imports/senac_sem_fundo.png";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Mail, Lock, FlaskConical } from "lucide-react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("administrador@df.senac.br");
  const [password, setPassword] = useState("senac2025");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/app/inicio");
  };

  return (
    <div className="min-h-screen bg-[#003F7D] flex flex-col items-center justify-center p-5 relative overflow-hidden">

      {/* Círculos decorativos de fundo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-[#F57C00]/10 pointer-events-none" />

      {/* Logo SENAC — topo da tela */}
      <div className="absolute top-8 z-10 flex justify-center w-full">
        <img
          src={senacLogo}
          alt="SENAC"
          className="w-16 sm:w-20"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </div>

      {/* Nome do sistema */}
      <div className="relative z-10 flex flex-col items-center text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-wide uppercase">SGP</h1>
        <p className="text-blue-200 text-sm sm:text-base mt-1 tracking-widest uppercase">
          Sistema de Gerenciamento de Portfólio
        </p>
      </div>

      {/* Card branco */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Faixa laranja topo do card */}
        <div className="h-1 w-full bg-[#F57C00]" />

        <div className="px-8 py-8">
          <p className="text-center text-gray-700 mb-6 text-base">
            Entre para iniciar uma nova sessão
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail */}
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-1.5 block">
                E-mail
              </Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@df.senac.br"
                  className="pl-10 h-11 bg-gray-50 border-gray-200 text-sm rounded-lg"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Senha
              </Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-11 h-11 bg-gray-50 border-gray-200 text-sm rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#F57C00] hover:bg-[#E86D00] text-white h-11 rounded-lg text-sm font-semibold mt-2"
            >
              Entrar
            </Button>
          </form>

          {/* Aviso protótipo */}
          <div className="mt-5 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-100">
            <FlaskConical size={13} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              <span className="font-semibold">Protótipo MVP</span> — credenciais pré-preenchidas para demonstração.
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
            Acesso restrito a colaboradores autorizados do SENAC DF.
          </p>
        </div>
      </div>

      {/* Rodapé da página de login */}
      <p className="relative z-10 text-white/30 text-xs mt-8">
        © {new Date().getFullYear()} SENAC DF · SGP v1.0-beta · Uso interno
      </p>
    </div>
  );
}
