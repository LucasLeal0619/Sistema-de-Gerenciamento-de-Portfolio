import { useEffect, useState } from "react";
import senacLogo from "../../imports/senac_sem_fundo.png";
import { useLocation, useNavigate } from "react-router";
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

  const inactivityMessage =
    (location.state as { motivo?: string } | null)?.motivo === "inatividade";

  return (
    <div className="login-page">
      <div className="login-bg-circle login-bg-circle--1" aria-hidden="true" />
      <div className="login-bg-circle login-bg-circle--2" aria-hidden="true" />

      <header className="login-header">
        <div className="login-logo-wrap">
          <img
            src={senacLogo}
            alt="Senac"
            className="login-logo"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </div>
      </header>

      <div className="login-body">
        <div className="login-content">
          <h1 className="login-title">SGP</h1>
          <p className="login-subtitle">SISTEMA DE GERENCIAMENTO DE PORTFÓLIO</p>

          <div className="login-card">
            <p className="login-card-intro">Entre para iniciar uma nova sessão</p>

            <form className="login-form" onSubmit={handleSubmit}>
              {inactivityMessage ? (
                <div className="login-error" role="alert">
                  Sessão encerrada por inatividade (30 minutos). Entre novamente para continuar.
                </div>
              ) : null}

              {error ? (
                <div className="login-error" role="alert">
                  {error}
                </div>
              ) : null}

              <div className="form-group">
                <label htmlFor="email">E-mail</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    autoComplete="email"
                    placeholder="seu@email.senac.br"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="senha">Senha</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-entrar" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <p className="login-card-footer">
              Acesso restrito a colaboradores autorizados do SENAC DF.
              <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.65rem", opacity: 0.7 }}>
                Demo: {DEMO_ADMIN_EMAIL}
              </span>
            </p>
          </div>
        </div>
      </div>

      <footer className="login-page-footer">
        © {new Date().getFullYear()} SENAC DF · SGP v1.0-beta · Uso interno
      </footer>
    </div>
  );
}
