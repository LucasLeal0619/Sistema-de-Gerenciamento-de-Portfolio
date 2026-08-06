import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { getValidSession } from "../utils/auth";
import { subscribeDataChanged } from "../utils/dataRefresh";
import { useSessionTimeout } from "../hooks/useSessionTimeout";

const MOBILE_BREAKPOINT = 768;

export function DashboardLayout() {
  const location = useLocation();
  const session = getValidSession();
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  useSessionTimeout();

  useEffect(() => subscribeDataChanged(() => setDataRefreshKey((k) => k + 1)), []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT && menuOpen) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [menuOpen]);

  if (!session) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen((open) => !open);

  return (
    <div className={`app-layout${menuOpen ? " menu-open" : ""}`}>
      <header className="app-topbar">
        <button
          type="button"
          className="app-menu-toggle"
          aria-expanded={menuOpen ? "true" : "false"}
          aria-controls="sgp-sidebar"
          aria-label="Abrir ou fechar menu"
          onClick={toggleMenu}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>
        <span className="app-topbar-title">SGP</span>
      </header>

      <div className="app-overlay" aria-hidden="true" onClick={closeMenu} />

      <Sidebar aberto={menuOpen} onFechar={closeMenu} />

      <main className="app-main">
        <Outlet key={dataRefreshKey} />
      </main>
    </div>
  );
}
