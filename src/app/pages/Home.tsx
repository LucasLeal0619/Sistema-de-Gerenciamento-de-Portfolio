import { Link } from "react-router";
import {
  LayoutDashboard,
  BookOpen,
  MapPin,
  Clock,
  Landmark,
  Zap,
  CalendarDays,
  GraduationCap,
  Target,
  BarChart2,
  Users,
  Upload,
} from "lucide-react";
import senacLogo from "../../imports/senac_sem_fundo.png";
import { usePermissions } from "../hooks/usePermissions";

const quickAccessCards = [
  {
    label: "Dashboard",
    description: "Vis\u00e3o geral do portf\u00f3lio, gr\u00e1ficos e indicadores",
    icon: LayoutDashboard,
    to: "/app/dashboard",
  },
  {
    label: "Cursos",
    description: "Cat\u00e1logo completo de cursos por eixo tecnol\u00f3gico",
    icon: BookOpen,
    to: "/app/cursos",
  },
  {
    label: "Visitas T\u00e9cnicas",
    description: "Processos de visitas t\u00e9cnicas registradas",
    icon: MapPin,
    to: "/app/processos-visitas-tecnicas",
  },
  {
    label: "Horas Pedag\u00f3gicas",
    description: "Controle de horas pedag\u00f3gicas e processos SEI",
    icon: Clock,
    to: "/app/processos-horas-pedagogicas",
  },
  {
    label: "PCA",
    description: "Cursos previstos no planejamento do per\u00edodo",
    icon: Landmark,
    to: "/app/valores-pca-2025",
  },
  {
    label: "A\u00e7\u00f5es Extensivas",
    description: "Registro e acompanhamento de a\u00e7\u00f5es extensivas",
    icon: Zap,
    to: "/app/acoes-extensivas",
  },
  {
    label: "Eventos",
    description: "Gest\u00e3o de eventos e atividades institucionais",
    icon: CalendarDays,
    to: "/app/eventos",
  },
  {
    label: "Plano de Metas",
    description: "Mapeamento de produ\u00e7\u00e3o e estrat\u00e9gias 2025-2026",
    icon: Target,
    to: "/app/plano-metas",
  },
  {
    label: "Cursos por Eixo",
    description: "Comparativo anual de cursos por eixo tecnol\u00f3gico",
    icon: BarChart2,
    to: "/app/quantidade-cursos-por-eixo",
  },
  {
    label: "CEPED",
    description: "Organograma, equipe e car\u00f4metro institucional",
    icon: GraduationCap,
    to: "/app/ceped",
  },
  {
    label: "Importa\u00e7\u00e3o",
    description: "Planilha principal, backup, valida\u00e7\u00e3o e hist\u00f3rico",
    icon: Upload,
    to: "/app/importacao",
  },
];

export function Home() {
  const { canManageUsers } = usePermissions();

  return (
    <div
      className="min-h-screen w-full overflow-auto"
      style={{ background: "linear-gradient(180deg, #003F7D 0%, #002A56 55%, #001F3F 100%)" }}
    >
      <div className="w-full px-6 py-12 lg:py-14">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
          <img
            src={senacLogo}
            alt="SENAC"
            className="h-12 w-auto"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/55">SENAC DF \u00b7 CPED</p>
            <h1
              className="text-white"
              style={{ fontSize: "1.85rem", fontWeight: 800, lineHeight: 1.2 }}
            >
              SGP - Sistema de Gerenciamento de Portf\u00f3lio
            </h1>
            <p
              className="mx-auto mt-3 max-w-xl text-white/65"
              style={{ fontSize: "0.9rem", lineHeight: 1.7 }}
            >
              Plataforma institucional para gest\u00e3o e acompanhamento do portf\u00f3lio de cursos,
              processos educacionais e indicadores do SENAC DF.
            </p>
          </div>

          <div className="mt-1 flex items-center gap-6">
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                8
              </p>
              <p className="text-xs uppercase tracking-wide text-white/50">Eixos</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                2025-26
              </p>
              <p className="text-xs uppercase tracking-wide text-white/50">Portf\u00f3lio</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                CPED
              </p>
              <p className="text-xs uppercase tracking-wide text-white/50">Unidade</p>
            </div>
          </div>

          <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row">
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#F57C00]" />
              <p className="text-xs text-white/75">Vers\u00e3o beta - uso interno para valida\u00e7\u00e3o</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
              <p className="text-xs text-white/65">Dados salvos neste navegador</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-1 w-full" style={{ background: "#F57C00" }} />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <section>
          <div className="mb-6">
            <h2 className="text-white" style={{ fontWeight: 700 }}>Acesso R\u00e1pido</h2>
            <p className="mt-1 text-white/55" style={{ fontSize: "0.875rem" }}>
              Navegue pelos m\u00f3dulos do sistema
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              ...quickAccessCards,
              ...(canManageUsers
                ? [
                    {
                      label: "Usu\u00e1rios",
                      description: "Gest\u00e3o de perfis e acessos ao sistema",
                      icon: Users,
                      to: "/app/usuarios",
                    },
                  ]
                : []),
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.label}
                  to={card.to}
                  className="group flex h-full flex-col gap-3 rounded-xl border border-white/15 bg-white/10 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F57C00]/50 hover:bg-white/15"
                  style={{ textDecoration: "none" }}
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/15 transition-colors group-hover:bg-[#F57C00]">
                    <Icon
                      size={18}
                      className="text-white/90 transition-colors group-hover:text-white"
                    />
                  </div>
                  <div>
                    <p
                      className="text-white"
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        lineHeight: 1.3,
                      }}
                    >
                      {card.label}
                    </p>
                    <p className="mt-0.5 text-white/50" style={{ fontSize: "0.72rem", lineHeight: 1.4 }}>
                      {card.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="border-t border-white/10 py-5 text-center">
        <p className="text-white/40" style={{ fontSize: "0.75rem" }}>
          {"\u00a9"} {new Date().getFullYear()} SENAC DF \u00b7 SGP v1.0-beta \u00b7 Uso interno
        </p>
      </div>
    </div>
  );
}
