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
} from "lucide-react";
import senacLogo from "../../imports/senac_sem_fundo.png";
import { usePermissions } from "../hooks/usePermissions";

const quickAccessCards = [
  {
    label: "Dashboard",
    description: "Visão geral do portfólio, gráficos e indicadores",
    icon: LayoutDashboard,
    to: "/app/dashboard",
  },
  {
    label: "Cursos",
    description: "Catálogo completo de cursos por eixo tecnológico",
    icon: BookOpen,
    to: "/app/cursos",
  },
  {
    label: "Visitas Técnicas",
    description: "Processos de visitas técnicas registradas",
    icon: MapPin,
    to: "/app/processos-visitas-tecnicas",
  },
  {
    label: "Horas Pedagógicas",
    description: "Controle de horas pedagógicas e processos SEI",
    icon: Clock,
    to: "/app/processos-horas-pedagogicas",
  },
  {
    label: "PCA",
    description: "Cursos previstos no planejamento do período",
    icon: Landmark,
    to: "/app/valores-pca-2025",
  },
  {
    label: "Ações Extensivas",
    description: "Registro e acompanhamento de ações extensivas",
    icon: Zap,
    to: "/app/acoes-extensivas",
  },
  {
    label: "Eventos",
    description: "Gestão de eventos e atividades institucionais",
    icon: CalendarDays,
    to: "/app/eventos",
  },
  {
    label: "Plano de Metas",
    description: "Mapeamento de produção e estratégias 2025-2026",
    icon: Target,
    to: "/app/plano-metas",
  },
  {
    label: "Cursos por Eixo",
    description: "Comparativo anual de cursos por eixo tecnológico",
    icon: BarChart2,
    to: "/app/quantidade-cursos-por-eixo",
  },
  {
    label: "CEPED",
    description: "Organograma, equipe e carômetro institucional",
    icon: GraduationCap,
    to: "/app/ceped",
  },
];

export function Home() {
  const { canManageUsers } = usePermissions();

  return (
    <div className="min-h-screen w-full overflow-auto bg-white">
      <div
        className="w-full px-6 py-12 lg:py-16"
        style={{ background: "linear-gradient(135deg, #003F7D 0%, #002A56 100%)" }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
          <img
            src={senacLogo}
            alt="SENAC"
            className="h-12 w-auto"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/55">SENAC DF - CPED</p>
            <h1
              className="text-white"
              style={{ fontSize: "1.85rem", fontWeight: 800, lineHeight: 1.2 }}
            >
              SGP - Sistema de Gerenciamento de Portfólio
            </h1>
            <p
              className="mx-auto mt-3 max-w-xl text-white/65"
              style={{ fontSize: "0.9rem", lineHeight: 1.7 }}
            >
              Plataforma institucional para gestão e acompanhamento do portfólio de cursos,
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
              <p className="text-xs uppercase tracking-wide text-white/50">Portfólio</p>
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
              <p className="text-xs text-white/75">Versão beta — uso interno para validação</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
              <p className="text-xs text-white/65">Dados salvos neste navegador</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-1 w-full" style={{ background: "#F57C00" }} />

      <div className="mx-auto max-w-5xl bg-white px-6 py-10">
        <section>
          <div className="mb-6">
            <h2 style={{ color: "#003F7D", fontWeight: 700 }}>Acesso Rápido</h2>
            <p className="mt-1 text-gray-500" style={{ fontSize: "0.875rem" }}>
              Navegue pelos módulos do sistema
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[
              ...quickAccessCards,
              ...(canManageUsers
                ? [
                    {
                      label: "Usuários",
                      description: "Gestão de perfis e acessos ao sistema",
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
                  className="group flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#003F7D]/40 hover:shadow-md"
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-[#003F7D]"
                    style={{ backgroundColor: "#E8EFF7" }}
                  >
                    <Icon
                      size={18}
                      className="transition-colors group-hover:text-white"
                      style={{ color: "#003F7D" }}
                    />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "#003F7D",
                        lineHeight: 1.3,
                      }}
                    >
                      {card.label}
                    </p>
                    <p className="mt-0.5 text-gray-400" style={{ fontSize: "0.72rem", lineHeight: 1.4 }}>
                      {card.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="border-t border-gray-100 bg-white py-5 text-center">
        <p className="text-gray-400" style={{ fontSize: "0.75rem" }}>
          {new Date().getFullYear()} SENAC DF - SGP v1.0-beta - Uso interno
        </p>
      </div>
    </div>
  );
}
