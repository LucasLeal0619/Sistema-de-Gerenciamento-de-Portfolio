import { Navigate, Outlet, useLocation } from "react-router";
import { Database } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { getSession } from "../utils/auth";

export function DashboardLayout() {
  const location = useLocation();
  const session = getSession();

  if (!session) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden items-center justify-end gap-2 border-b border-gray-100 bg-[#F5F7FA] px-4 py-1.5 lg:flex">
          <Database size={12} className="text-[#003F7D]/60" />
          <span className="text-[11px] text-gray-500">
            SGP beta · dados salvos localmente neste navegador
          </span>
        </div>
        <main className="w-full flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}