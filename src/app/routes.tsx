// SGP SENAC - Sistema de Rotas
// Version: 2025-04-01-v2
// Cache-Buster: All pages updated with correct names
import { createBrowserRouter, Navigate } from "react-router";
import { Login } from "./pages/Login";
import { DashboardLayout } from "./pages/DashboardLayout";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { CourseArea } from "./pages/CourseArea";
import { NewCourse } from "./pages/NewCourse";
import { Users } from "./pages/Users";
import { NewUser } from "./pages/NewUser";
import { PlanoMetas } from "./pages/PlanoMetas";
import { ProcessosVisitasTecnicas } from "./pages/ProcessosVisitasTecnicas";
import { ProcessosHorasPedagogicas } from "./pages/ProcessosHorasPedagogicas";
import { ValoresPCA2025 } from "./pages/ValoresPCA2025";
import { QuantidadeCursosPorEixo } from "./pages/QuantidadeCursosPorEixo";
import { Courses } from "./pages/Courses";
import { EditCourse } from "./pages/EditCourse";
import { EditUser } from "./pages/EditUser";
import { AcoesExtensivas } from "./pages/AcoesExtensivas";
import { Eventos } from "./pages/Eventos";
import { Ceped } from "./pages/Ceped";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/app",
    Component: DashboardLayout,
    children: [
      {
        index: true,
        element: <Navigate to="/app/inicio" replace />,
      },
      {
        path: "inicio",
        Component: Home,
      },
      {
        path: "dashboard",
        Component: Dashboard,
      },
      {
        path: "cursos",
        Component: Courses,
      },
      {
        path: "cursos/:area",
        Component: CourseArea,
      },
      {
        path: "novo-curso",
        Component: NewCourse,
      },
      {
        path: "usuarios",
        Component: Users,
      },
      {
        path: "usuarios/novo",
        Component: NewUser,
      },
      {
        path: "plano-metas",
        Component: PlanoMetas,
      },
      {
        path: "acoes-extensivas",
        Component: AcoesExtensivas,
      },
      {
        path: "eventos",
        Component: Eventos,
      },
      {
        path: "processos-visitas-tecnicas",
        Component: ProcessosVisitasTecnicas,
      },
      {
        path: "processos-horas-pedagogicas",
        Component: ProcessosHorasPedagogicas,
      },
      {
        path: "valores-pca-2025",
        Component: ValoresPCA2025,
      },
      {
        path: "quantidade-cursos-por-eixo",
        Component: QuantidadeCursosPorEixo,
      },
      {
        path: "ceped",
        Component: Ceped,
      },
      {
        path: "cursos/editar/:id",
        Component: EditCourse,
      },
      {
        path: "usuarios/editar/:id",
        Component: EditUser,
      },
    ],
  },
]);