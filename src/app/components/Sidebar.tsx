import { Link, useLocation } from "react-router";
import {
  Home, LayoutDashboard, BookOpen, Zap, CalendarDays,
  Target, MapPin, Clock, Landmark, BarChart2, GraduationCap,
  Users, LogOut, Menu, X, ChevronLeft, FlaskConical,
} from "lucide-react";
import { SenacLogo } from "./SenacLogo";
import { useState } from "react";

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { label: "Início",    icon: Home,            to: "/app/inicio" },
      { label: "Dashboard", icon: LayoutDashboard,  to: "/app/dashboard" },
    ],
  },
  {
    label: "Portfólio",
    items: [
      { label: "Cursos",               icon: BookOpen,  to: "/app/cursos" },
      { label: "Plano de Metas",       icon: Target,    to: "/app/plano-metas" },
      { label: "Valores PCA",          icon: Landmark,  to: "/app/valores-pca-2025" },
      { label: "Cursos por Eixo",      icon: BarChart2, to: "/app/quantidade-cursos-por-eixo" },
    ],
  },
  {
    label: "Processos",
    items: [
      { label: "Visitas Técnicas",  icon: MapPin,       to: "/app/processos-visitas-tecnicas" },
      { label: "Horas Pedagógicas", icon: Clock,        to: "/app/processos-horas-pedagogicas" },
      { label: "Ações Extensivas",  icon: Zap,          to: "/app/acoes-extensivas" },
      { label: "Eventos",           icon: CalendarDays, to: "/app/eventos" },
    ],
  },
  {
    label: "Institucional",
    items: [
      { label: "CEPED",    icon: GraduationCap, to: "/app/ceped" },
      { label: "Usuários", icon: Users,         to: "/app/usuarios" },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const expanded = !isCollapsed || hovered;

  const isActive = (to: string) => location.pathname.startsWith(to);

  const itemClass = (active: boolean) =>
    [
      "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-sm relative group",
      active
        ? "bg-[#F57C00] text-white"
        : "text-white/70 hover:text-white hover:bg-white/10 cursor-pointer",
    ].join(" ");

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link
        to="/app/inicio"
        onClick={() => setIsMobileOpen(false)}
        className="flex items-center border-b border-white/10 hover:bg-white/5 transition-colors flex-shrink-0"
        style={{ padding: expanded ? "16px" : "14px", justifyContent: expanded ? "flex-start" : "center", paddingTop: "64px" }}
      >
        {expanded ? (
          <SenacLogo variant="white" />
        ) : (
          <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-xs font-bold text-white">
            S
          </div>
        )}
      </Link>

      {/* Nav groups */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label ?? "main"}>
            {group.label && expanded && (
              <p className="px-3 mb-1 text-[9px] font-bold text-white/35 uppercase tracking-widest">
                {group.label}
              </p>
            )}
            {group.label && !expanded && (
              <div className="mx-3 mb-1 h-px bg-white/10" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setIsMobileOpen(false)}
                    className={itemClass(active)}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    {expanded && <span className="truncate">{item.label}</span>}
                    {/* Tooltip when icon-only */}
                    {!expanded && (
                      <span className="absolute left-full ml-3 hidden group-hover:block bg-[#001F3F] text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl z-50 pointer-events-none">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/10 p-2 flex-shrink-0">
        {expanded && (
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#F57C00] flex items-center justify-center text-xs font-bold flex-shrink-0">
              C
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Administrador CPED</p>
              <p className="text-[10px] text-white/45">SENAC DF</p>
            </div>
          </div>
        )}
        <Link
          to="/"
          onClick={() => setIsMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors relative group"
          style={{ justifyContent: expanded ? "flex-start" : "center" }}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {expanded && <span>Sair</span>}
          {!expanded && (
            <span className="absolute left-full ml-3 hidden group-hover:block bg-[#001F3F] text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl z-50 pointer-events-none">
              Sair
            </span>
          )}
        </Link>

        {/* MVP indicator */}
        {expanded && (
          <div className="mx-3 mt-2 mb-1 space-y-1">
            <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
              <FlaskConical size={11} className="flex-shrink-0 text-[#F57C00]" />
              <span className="truncate text-[10px] text-white/40">Protótipo MVP · v1.0-beta</span>
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
              <span className="text-[10px] leading-snug text-white/45">
                Dados salvos neste navegador
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Desktop collapse toggle */}
      <button
        onClick={() => { setIsCollapsed(!isCollapsed); setHovered(false); }}
        className="hidden lg:flex absolute -right-3 top-7 w-6 h-6 bg-[#003F7D] border border-white/25 rounded-full items-center justify-center text-white hover:bg-[#F57C00] transition-colors shadow z-50"
        title={isCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        <ChevronLeft
          size={12}
          className={`transition-transform ${isCollapsed ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#003F7D] text-white p-2.5 rounded-lg shadow-lg hover:bg-[#002D5A] transition-colors"
      >
        {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar — hover-to-expand when collapsed */}
      <div
        className={`hidden lg:flex flex-col bg-[#003F7D] text-white h-screen flex-shrink-0 relative transition-all duration-250 z-40 ${
          expanded ? "w-56" : "w-14"
        }`}
        onMouseEnter={() => isCollapsed && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {SidebarContent}
      </div>

      {/* Mobile sidebar */}
      <div
        className={`lg:hidden fixed left-0 top-0 h-full w-56 bg-[#003F7D] text-white z-40 flex flex-col transition-transform duration-250 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {SidebarContent}
      </div>
    </>
  );
}
