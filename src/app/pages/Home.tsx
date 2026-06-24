import { Link } from "react-router";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
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
    description: "Visão geral do portfólio, gráficos e indicadores",
    icon: LayoutDashboard,
    to: "/app/dashboard",
  },
  {
    label: "Importações",
    description: "Carga centralizada de planilhas por módulo",
    icon: Upload,
    to: "/app/importacoes",
  },
  {
    label: "Relatórios",
    description: "Relatórios gerenciais e exportação em PDF",
    icon: FileText,
    to: "/app/relatorios",
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
    description: "Mapeamento de produção e estratégias por ano",
    icon: Target,
    to: "/app/plano-metas",
  },
  {
    label: "Eixos",
    description: "Comparativo anual de cursos por eixo tecnológico",
    icon: BarChart2,
    to: "/app/quantidade-cursos-por-eixo",
  },
  {
    label: "CPED",
    description: "Organograma, equipe e carômetro institucional",
    icon: GraduationCap,
    to: "/app/ceped",
  },
];

export function Home() {
  const { canManageUsers } = usePermissions();

  const cards = [
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
  ];

  return (
    <div className="min-h-screen w-full overflow-auto bg-white">
      <div
        className="w-full px-6 py-5 lg:py-6"
        style={{ background: "linear-gradient(135deg, #003F7D 0%, #002A56 100%)" }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3.5 text-center">
          <img
            src={senacLogo}
            alt="SENAC"
            className="h-10 w-auto lg:h-11"
            style={{ filter: "brightness(0) invert(1)" }}
          />

          <div>
            <p className="mb-1.5 text-xs uppercase tracking-[0.2em] text-white/55">SENAC DF - CPED</p>
            <h1
              className="text-white"
              style={{ fontSize: "1.55rem", fontWeight: 800, lineHeight: 1.25 }}
            >
              SGP - Sistema de Gerenciamento de Portfólio
            </h1>
            <p
              className="mx-auto mt-2 max-w-2xl text-white/65"
              style={{ fontSize: "0.875rem", lineHeight: 1.6 }}
            >
              Plataforma institucional para gestão e acompanhamento do portfólio de cursos,
              processos educacionais e indicadores do SENAC DF.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.35rem", fontWeight: 700 }}>
                8
              </p>
              <p className="text-xs uppercase tracking-wide text-white/50">Eixos</p>
            </div>
            <div className="h-7 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.35rem", fontWeight: 700 }}>
                2025-26
              </p>
              <p className="text-xs uppercase tracking-wide text-white/50">Portfólio</p>
            </div>
            <div className="h-7 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.35rem", fontWeight: 700 }}>
                CPED
              </p>
              <p className="text-xs uppercase tracking-wide text-white/50">Unidade</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-1 w-full" style={{ background: "#F57C00" }} />

      <div className="mx-auto max-w-6xl px-6 py-4 lg:py-5">
        <section>
          <div className="mb-3.5">
            <h2 className="text-lg font-bold text-[#003F7D]">Acesso Rápido</h2>
            <p className="mt-1 text-sm text-gray-500">
              {cards.length} módulos disponíveis — navegue pelos principais recursos do sistema
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.label}
                  to={card.to}
                  className="group flex h-full flex-col gap-2.5 rounded-xl border border-gray-200 bg-white p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#003F7D]/40 hover:shadow-md"
                  style={{ textDecoration: "none" }}
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#E8EFF7] transition-colors group-hover:bg-[#003F7D]">
                    <Icon
                      size={18}
                      className="text-[#003F7D] transition-colors group-hover:text-white"
                    />
                  </div>
                  <div>
                    <p
                      className="font-semibold text-[#003F7D]"
                      style={{ fontSize: "0.8rem", lineHeight: 1.3 }}
                    >
                      {card.label}
                    </p>
                    <p
                      className="mt-0.5 line-clamp-2 text-gray-400"
                      style={{ fontSize: "0.72rem", lineHeight: 1.4 }}
                    >
                      {card.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="border-t border-gray-100 bg-white py-4 text-center">
        <p className="text-xs text-gray-400">
          {new Date().getFullYear()} SENAC DF - SGP v1.0-beta - Uso interno
        </p>
      </div>
    </div>
  );
}
