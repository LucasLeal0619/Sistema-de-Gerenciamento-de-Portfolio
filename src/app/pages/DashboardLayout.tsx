import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Database } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { getValidSession } from "../utils/auth";
import { subscribeDataChanged } from "../utils/dataRefresh";
import { useSessionTimeout } from "../hooks/useSessionTimeout";

export function DashboardLayout() {
  const location = useLocation();
  const session = getValidSession();
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  useSessionTimeout();

  useEffect(() => subscribeDataChanged(() => setDataRefreshKey((k) => k + 1)), []);

  if (!session) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden items-center justify-end gap-2 border-b border-[#002A56] bg-[#003F7D] px-4 py-2 lg:flex">
          <Database size={12} className="text-white/50" />
          <span className="text-[11px] text-white/70">
            SGP beta {"\u00b7"} dados salvos localmente neste navegador
          </span>
        </div>
        <main className="w-full flex-1 overflow-auto">
          <Outlet key={dataRefreshKey} />
        </main>
      </div>
    </div>
  );
}