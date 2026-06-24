import { useEffect, useState } from "react";
import senacLogo from "../../imports/senac_sem_fundo.png";
import { useLocation, useNavigate } from "react-router";
import { Eye, EyeOff, Mail, Lock, FlaskConical, AlertCircle } from "lucide-react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD,
  getLastLoginEmail,
  login,
  setLastLoginEmail,
  setSession,
} from "../utils/auth";

function resolveInitialEmail(location: ReturnType<typeof useLocation>) {
  const fromLogout = (location.state as { email?: string } | null)?.email;
  if (fromLogout) return fromLogout;
  const last = getLastLoginEmail();
  return last || DEMO_ADMIN_EMAIL;
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(() => resolveInitialEmail(location));
  const [password, setPassword] = useState(DEMO_ADMIN_PASSWORD);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fromLogout = (location.state as { email?: string } | null)?.email;
    if (fromLogout) {
      setEmail(fromLogout || DEMO_ADMIN_EMAIL);
      setPassword(DEMO_ADMIN_PASSWORD);
    }
  }, [location.state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = login(email, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setLastLoginEmail(result.user.email);
    setSession(result.user);
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from && from.startsWith("/app") ? from : "/app/inicio");
  };

  return (
    <div className="min-h-screen bg-[#003F7D] flex flex-col items-center justify-center p-5 relative overflow-hidden">

      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-[#F57C00]/10 pointer-events-none" />

      <div className="relative z-10 mb-8 flex w-full max-w-md flex-col items-center text-center">
        <img
          src={senacLogo}
          alt="SENAC"
          className="mb-6 w-14 sm:mb-7 sm:w-16"
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <h1 className="text-4xl font-black uppercase tracking-wide text-white sm:text-5xl">SGP</h1>
        <p className="mt-3 text-sm uppercase tracking-widest text-blue-200 sm:mt-3.5 sm:text-base">
          Sistema de Gerenciamento de Portfólio
        </p>
      </div>

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-[#F57C00]" />

        <div className="px-8 py-8">
          <p className="text-center text-gray-700 mb-6 text-base">
            Entre para iniciar uma nova sessão
          </p>

          {(location.state as { motivo?: string } | null)?.motivo === "inatividade" && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 text-center">
              Sessão encerrada por inatividade (30 minutos). Entre novamente para continuar.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="seu@df.senac.br"
                  className={`pl-10 h-11 bg-gray-50 border-gray-200 text-sm rounded-lg ${error ? "border-red-400" : ""}`}
                />
              </div>
            </div>

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
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className={`pl-10 pr-11 h-11 bg-gray-50 border-gray-200 text-sm rounded-lg ${error ? "border-red-400" : ""}`}
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

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertCircle size={14} className="flex-shrink-0 text-red-500 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F57C00] hover:bg-[#E86D00] text-white h-11 rounded-lg text-sm font-semibold mt-2"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-5 space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5">
              <FlaskConical size={13} className="flex-shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700">
                <span className="font-semibold">Protótipo MVP</span> — acesso criado pelo administrador
                em Usuários.
              </p>
            </div>
            <div className="rounded-lg border border-[#003F7D]/15 bg-[#E8EFF7] px-3 py-2.5 text-xs text-[#003F7D]">
              <strong>Acesso de administrador para demonstração</strong>
              <p className="mt-1 font-mono">
                {DEMO_ADMIN_EMAIL}
                <br />
                Senha: {DEMO_ADMIN_PASSWORD}
              </p>
              <p className="mt-1.5 text-[#003F7D]/80">
                Campos já preenchidos — clique em Entrar para acessar.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
            Acesso restrito a colaboradores autorizados do SENAC DF.
          </p>
        </div>
      </div>

      <p className="relative z-10 text-white/30 text-xs mt-8">
        © {new Date().getFullYear()} SENAC DF · SGP v1.0-beta · Uso interno
      </p>
    </div>
  );
}
