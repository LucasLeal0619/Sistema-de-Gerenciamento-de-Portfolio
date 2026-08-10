import { Link, NavLink, useNavigate } from "react-router";
import {
  Home,
  LayoutDashboard,
  BookOpen,
  Zap,
  CalendarDays,
  Target,
  MapPin,
  Clock,
  Landmark,
  BarChart2,
  GraduationCap,
  Users,
  Upload,
  FileText,
  Wrench,
  FileSearch,
} from "lucide-react";
import senacLogo from "../../imports/senac_sem_fundo.png";
import { clearSession, getSession } from "../utils/auth";
import { getUsuarios } from "../utils/store";
import { getInitials } from "../utils/userHelpers";
import { usePermissions } from "../hooks/usePermissions";

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { label: "Início", icon: Home, to: "/app/inicio" },
      { label: "Dashboard", icon: LayoutDashboard, to: "/app/dashboard" },
      { label: "Relatórios", icon: FileText, to: "/app/relatorios" },
      { label: "Importações", icon: Upload, to: "/app/importacoes" },
    ],
  },
  {
    label: "PORTFÓLIO",
    items: [
      { label: "Cursos", icon: BookOpen, to: "/app/cursos" },
      { label: "Plano de Metas", icon: Target, to: "/app/plano-de-metas" },
      { label: "PCA", icon: Landmark, to: "/app/pca" },
      { label: "Eixos", icon: BarChart2, to: "/app/eixos" },
    ],
  },
  {
    label: "PROCESSOS",
    items: [
      { label: "Visitas Técnicas", icon: MapPin, to: "/app/visitas-tecnicas" },
      { label: "Horas Pedagógicas", icon: Clock, to: "/app/horas-pedagogicas" },
      { label: "Ações Extensivas", icon: Zap, to: "/app/acoes-extensivas" },
      { label: "Eventos", icon: CalendarDays, to: "/app/eventos" },
    ],
  },
  {
    label: "INSTITUCIONAL",
    items: [
      { label: "Ferramentas", icon: Wrench, to: "/app/ferramentas" },
      { label: "CPED", icon: GraduationCap, to: "/app/cped" },
      { label: "Auditoria", icon: FileSearch, to: "/app/auditoria" },
      { label: "Usuários", icon: Users, to: "/app/usuarios" },
    ],
  },
];

type SidebarProps = {
  aberto?: boolean;
  onFechar?: () => void;
};

export function Sidebar({ aberto = false, onFechar }: SidebarProps) {
  const navigate = useNavigate();
  const session = getSession();
  const { canManageUsers, canWrite } = usePermissions();

  const usuarioAtual = session
    ? getUsuarios().find((u) => u.id === session.userId) ?? null
    : null;
  const displayNome = usuarioAtual?.nome?.trim() || session?.nome || "";

  const navGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.to === "/app/importacoes") return canWrite;
      if (item.to === "/app/usuarios") return canManageUsers;
      if (item.to === "/app/auditoria") return canManageUsers;
      return true;
    }),
  })).filter((group) => group.items.length > 0);

  const handleNavigate = () => {
    onFechar?.();
  };

  const handleLogout = () => {
    clearSession();
    onFechar?.();
    navigate("/");
  };

  return (
    <nav
      id="sgp-sidebar"
      className={`sidebar${aberto ? " sidebar--open" : ""}`}
    >
      <div className="sidebar-header">
        <Link
          to="/app/inicio"
          className="sidebar-logo-link"
          title="Ir para o início"
          onClick={handleNavigate}
        >
          <img
            src={senacLogo}
            alt="Senac"
            className="sidebar-logo"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </Link>
      </div>

      <div className="sidebar-nav">
        {navGroups.map((group) => (
          <div key={group.label ?? "main"} className="sidebar-section">
            {group.label ? (
              <p className="sidebar-section-title">{group.label}</p>
            ) : null}

            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/app/inicio"}
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? " router-link-active" : ""}`
                  }
                  onClick={handleNavigate}
                >
                  <span className="sidebar-link-icon">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span className="sidebar-link-label">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        {session ? (
          <div className="sidebar-user-card">
            <span className="sidebar-avatar" aria-hidden="true">
              {getInitials(displayNome)}
            </span>
            <p className="sidebar-user-nome" title={displayNome}>
              {displayNome}
            </p>
          </div>
        ) : null}

        <button type="button" className="sidebar-logout" onClick={handleLogout}>
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
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          Sair
        </button>
      </div>
    </nav>
  );
}
