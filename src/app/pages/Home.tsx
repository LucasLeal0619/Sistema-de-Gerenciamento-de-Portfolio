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
  Wrench,
  FileSearch,
} from "lucide-react";
import senacLogo from "../../imports/senac_sem_fundo.png";
import { usePermissions } from "../hooks/usePermissions";

type QuickCard = {
  label: string;
  description: string;
  icon: React.ElementType;
  to: string;
  adminOnly?: boolean;
  writeOnly?: boolean;
};

/** Ordem e textos alinhados ao Inicio.js do sistema real. */
const quickAccessCards: QuickCard[] = [
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
    writeOnly: true,
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
    to: "/app/visitas-tecnicas",
  },
  {
    label: "Horas Pedagógicas",
    description: "Controle de horas pedagógicas e processos SEI",
    icon: Clock,
    to: "/app/horas-pedagogicas",
  },
  {
    label: "PCA",
    description: "Cursos previstos no planejamento do período",
    icon: Landmark,
    to: "/app/pca",
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
    label: "Ferramentas",
    description: "Hub de recursos de apoio: Kanban, organograma e atalhos",
    icon: Wrench,
    to: "/app/ferramentas",
  },
  {
    label: "Plano de Metas",
    description: "Mapeamento de produção e estratégias por ano",
    icon: Target,
    to: "/app/plano-de-metas",
  },
  {
    label: "Eixos",
    description: "Comparativo anual de cursos por eixo tecnológico",
    icon: BarChart2,
    to: "/app/eixos",
  },
  {
    label: "CPED",
    description: "Organograma, equipe e carômetro institucional",
    icon: GraduationCap,
    to: "/app/cped",
  },
  {
    label: "Auditoria",
    description: "Histórico de quem cadastrou e alterou dados",
    icon: FileSearch,
    to: "/app/auditoria",
    adminOnly: true,
  },
  {
    label: "Usuários",
    description: "Gestão de perfis e acessos ao sistema",
    icon: Users,
    to: "/app/usuarios",
    adminOnly: true,
  },
];

export function Home() {
  const { canManageUsers, canWrite } = usePermissions();

  const cards = quickAccessCards.filter((card) => {
    if (card.adminOnly && !canManageUsers) return false;
    if (card.writeOnly && !canWrite) return false;
    return true;
  });

  return (
    <div className="inicio-page">
      <header className="inicio-hero">
        <div className="inicio-hero-inner">
          <img
            src={senacLogo}
            alt="Senac"
            className="inicio-logo"
            style={{ filter: "brightness(0) invert(1)" }}
          />

          <div className="inicio-hero-text">
            <p className="inicio-hero-tag">SENAC DF · CPED</p>
            <h1 className="inicio-hero-title">SGP — Sistema de Gerenciamento de Portfólio</h1>
            <p className="inicio-hero-desc">
              Plataforma institucional para gestão e acompanhamento do portfólio de cursos,
              processos educacionais e indicadores do SENAC DF.
            </p>
          </div>

          <div className="inicio-stats">
            <div className="inicio-stat">
              <p className="inicio-stat-value">8</p>
              <p className="inicio-stat-label">Eixos</p>
            </div>
            <span className="inicio-stat-divider" aria-hidden="true" />
            <div className="inicio-stat">
              <p className="inicio-stat-value">2025-26</p>
              <p className="inicio-stat-label">Portfólio</p>
            </div>
            <span className="inicio-stat-divider" aria-hidden="true" />
            <div className="inicio-stat">
              <p className="inicio-stat-value">CPED</p>
              <p className="inicio-stat-label">Unidade</p>
            </div>
          </div>
        </div>
      </header>

      <div className="inicio-accent-bar" aria-hidden="true" />

      <section className="inicio-content">
        <div className="inicio-section-head">
          <h2>Acesso Rápido</h2>
          <p>
            {cards.length} módulos disponíveis — navegue pelos principais recursos do sistema
          </p>
        </div>

        <div className="inicio-modulos-grid">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.label} to={card.to} className="inicio-modulo-card">
                <span className="inicio-modulo-icon">
                  <Icon size={18} strokeWidth={2} />
                </span>
                <span className="inicio-modulo-label">{card.label}</span>
                <span className="inicio-modulo-desc">{card.description}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="inicio-footer">
        © 2026 SENAC DF · SGP v1.0-beta · Uso interno
      </footer>
    </div>
  );
}
