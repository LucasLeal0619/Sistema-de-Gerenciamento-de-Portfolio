import { Outlet } from "react-router";
import { Sidebar } from "../components/Sidebar";

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto w-full lg:ml-0">
        <Outlet />
      </main>
    </div>
  );
}