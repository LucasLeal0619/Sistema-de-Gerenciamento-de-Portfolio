// SGP SENAC - Sistema de Rotas
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
import { Importacoes } from "./pages/Importacoes";
import { Relatorios } from "./pages/Relatorios";
import { Auditoria } from "./pages/Auditoria";
import { Ferramentas } from "./pages/Ferramentas";
import { KanbanQuadros } from "./pages/ferramentas/KanbanQuadros";
import { Kanban } from "./pages/ferramentas/Kanban";
import { OrganogramaFerramentas } from "./pages/ferramentas/OrganogramaFerramentas";
import { CarometroFerramentas } from "./pages/ferramentas/CarometroFerramentas";
import { Fluxogramas } from "./pages/ferramentas/Fluxogramas";
import { FluxogramaEditor } from "./pages/ferramentas/FluxogramaEditor";
import { RequireAdmin } from "./components/RequireAdmin";
import { RequireWrite } from "./components/RequireWrite";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/plano-de-metas",
    element: <Navigate to="/app/plano-de-metas" replace />,
  },
  {
    path: "/pca",
    element: <Navigate to="/app/pca" replace />,
  },
  {
    path: "/eixos",
    element: <Navigate to="/app/eixos" replace />,
  },
  {
    path: "/auditoria",
    element: <Navigate to="/app/auditoria" replace />,
  },
  {
    path: "/ferramentas",
    element: <Navigate to="/app/ferramentas" replace />,
  },
  {
    path: "/cped",
    element: <Navigate to="/app/cped" replace />,
  },
  {
    path: "/ceped",
    element: <Navigate to="/app/cped" replace />,
  },
  {
    path: "/plano-metas",
    element: <Navigate to="/app/plano-de-metas" replace />,
  },
  {
    path: "/app/plano-metas",
    element: <Navigate to="/app/plano-de-metas" replace />,
  },
  {
    path: "/app/processos-visitas-tecnicas",
    element: <Navigate to="/app/visitas-tecnicas" replace />,
  },
  {
    path: "/app/processos-horas-pedagogicas",
    element: <Navigate to="/app/horas-pedagogicas" replace />,
  },
  {
    path: "/app/valores-pca-2025",
    element: <Navigate to="/app/pca" replace />,
  },
  {
    path: "/app/quantidade-cursos-por-eixo",
    element: <Navigate to="/app/eixos" replace />,
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
        path: "relatorios",
        Component: Relatorios,
      },
      {
        path: "importacoes",
        element: (
          <RequireWrite>
            <Importacoes />
          </RequireWrite>
        ),
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
        element: (
          <RequireWrite>
            <NewCourse />
          </RequireWrite>
        ),
      },
      {
        path: "usuarios",
        element: (
          <RequireAdmin>
            <Users />
          </RequireAdmin>
        ),
      },
      {
        path: "usuarios/novo",
        element: (
          <RequireAdmin>
            <NewUser />
          </RequireAdmin>
        ),
      },
      {
        path: "plano-de-metas",
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
        path: "visitas-tecnicas",
        Component: ProcessosVisitasTecnicas,
      },
      {
        path: "horas-pedagogicas",
        Component: ProcessosHorasPedagogicas,
      },
      {
        path: "ferramentas",
        Component: Ferramentas,
      },
      {
        path: "ferramentas/kanban",
        Component: KanbanQuadros,
      },
      {
        path: "ferramentas/kanban/:slug",
        Component: Kanban,
      },
      {
        path: "ferramentas/organograma",
        Component: OrganogramaFerramentas,
      },
      {
        path: "ferramentas/carometro",
        Component: CarometroFerramentas,
      },
      {
        path: "ferramentas/fluxograma",
        Component: Fluxogramas,
      },
      {
        path: "ferramentas/fluxograma/:slug",
        Component: FluxogramaEditor,
      },
      {
        path: "pca",
        Component: ValoresPCA2025,
      },
      {
        path: "eixos",
        Component: QuantidadeCursosPorEixo,
      },
      {
        path: "auditoria",
        element: (
          <RequireAdmin>
            <Auditoria />
          </RequireAdmin>
        ),
      },
      {
        path: "cped",
        Component: Ceped,
      },
      {
        path: "ceped",
        element: <Navigate to="/app/cped" replace />,
      },
      {
        path: "cursos/editar/:id",
        element: (
          <RequireWrite>
            <EditCourse />
          </RequireWrite>
        ),
      },
      {
        path: "usuarios/editar/:id",
        element: (
          <RequireAdmin>
            <EditUser />
          </RequireAdmin>
        ),
      },
    ],
  },
]);
