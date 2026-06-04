import { Link } from "react-router";
import { LayoutDashboard, BookOpen, MapPin, Clock, Landmark, Zap, CalendarDays, GraduationCap, Target, BarChart2 } from "lucide-react";
import senacLogo from "../../imports/senac_sem_fundo.png";

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
    label: "Valores PCA",
    description: "Precificação e valores do portfólio de cursos abertos",
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
    description: "Mapeamento de produção e estratégias 2025",
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
  return (
    <div className="min-h-screen w-full bg-white overflow-auto">

      {/* Hero Banner */}
      <div
        className="w-full px-6 py-12 lg:py-16"
        style={{ background: "linear-gradient(135deg, #003F7D 0%, #002A56 100%)" }}
      >
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-5">
          <img
            src={senacLogo}
            alt="SENAC"
            className="h-12 w-auto"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <div>
            <p className="text-white/55 uppercase tracking-[0.2em] text-xs mb-2">
              SENAC DF · CPED
            </p>
            <h1
              className="text-white"
              style={{ fontSize: "1.85rem", fontWeight: 800, lineHeight: 1.2 }}
            >
              SGP — Sistema de Gerenciamento de Portfólio
            </h1>
            <p className="mt-3 text-white/65 max-w-xl mx-auto" style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
              Plataforma institucional para gestão e acompanhamento do portfólio de cursos,
              processos educacionais e indicadores do SENAC DF.
            </p>
          </div>

          <div className="flex items-center gap-6 mt-1">
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.6rem", fontWeight: 700 }}>8</p>
              <p className="text-white/50 text-xs uppercase tracking-wide">Eixos</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.6rem", fontWeight: 700 }}>2025</p>
              <p className="text-white/50 text-xs uppercase tracking-wide">Portfólio</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.6rem", fontWeight: 700 }}>CPED</p>
              <p className="text-white/50 text-xs uppercase tracking-wide">Unidade</p>
            </div>
          </div>

          {/* Beta notice */}
          <div className="mt-2 flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10">
            <span className="w-2 h-2 rounded-full bg-[#F57C00] flex-shrink-0" />
            <p className="text-white/75 text-xs">Versão beta — uso interno para validação</p>
          </div>
        </div>
      </div>

      {/* Orange accent bar */}
      <div className="w-full h-1" style={{ background: "#F57C00" }} />

      {/* Quick Access Section */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h2 style={{ color: "#003F7D" }}>Acesso Rápido</h2>
          <p className="text-gray-500 mt-1" style={{ fontSize: "0.875rem" }}>
            Navegue pelos módulos do sistema
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickAccessCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                to={card.to}
                className="group flex flex-col gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-[#003F7D]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full"
                style={{ textDecoration: "none" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#003F7D] transition-colors"
                  style={{ backgroundColor: "#E8EFF7" }}
                >
                  <Icon size={18} className="group-hover:text-white transition-colors" style={{ color: "#003F7D" }} />
                </div>
                <div>
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#003F7D", lineHeight: 1.3 }}>
                    {card.label}
                  </p>
                  <p className="text-gray-400 mt-0.5" style={{ fontSize: "0.72rem", lineHeight: 1.4 }}>
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer strip */}
      <div className="border-t border-gray-100 py-5 text-center">
        <p className="text-gray-400" style={{ fontSize: "0.75rem" }}>
          © {new Date().getFullYear()} SENAC DF · SGP v1.0-beta · Uso interno
        </p>
      </div>
    </div>
  );
}
