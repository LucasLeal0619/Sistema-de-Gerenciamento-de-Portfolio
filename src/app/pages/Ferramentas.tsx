import { Link } from "react-router";
import {
  ExternalLink,
  GitBranch,
  Images,
  LayoutGrid,
  Network,
  Palette,
  RefreshCw,
} from "lucide-react";

type FerramentaItem =
  | {
      key: string;
      label: string;
      description: string;
      type: "internal";
      route: string;
      icon: React.ReactNode;
      status: "Disponível";
    }
  | {
      key: string;
      label: string;
      description: string;
      type: "external";
      url: string;
      icon: React.ReactNode;
      status: "Externo";
    };

const FERRAMENTAS: FerramentaItem[] = [
  {
    key: "kanban",
    label: "Kanban",
    description: "Organização das atividades e responsabilidades da equipe.",
    type: "internal",
    route: "/app/ferramentas/kanban",
    icon: <LayoutGrid size={22} />,
    status: "Disponível",
  },
  {
    key: "organograma",
    label: "Organograma",
    description: "Estrutura visual da CPED, cargos e responsáveis.",
    type: "internal",
    route: "/app/ferramentas/organograma",
    icon: <Network size={22} />,
    status: "Disponível",
  },
  {
    key: "carometro",
    label: "Carômetro",
    description: "Álbum da equipe CPED com fotos, cargos e contatos.",
    type: "internal",
    route: "/app/ferramentas/carometro",
    icon: <Images size={22} />,
    status: "Disponível",
  },
  {
    key: "fluxograma",
    label: "Fluxograma",
    description: "Mapeamento visual dos processos da CPED com símbolos padronizados.",
    type: "internal",
    route: "/app/ferramentas/fluxograma",
    icon: <GitBranch size={22} />,
    status: "Disponível",
  },
  {
    key: "microsoft_loop",
    label: "Microsoft Loop",
    description: "Atalho para espaços colaborativos da CPED no Loop.",
    type: "external",
    url: "https://loop.microsoft.com/",
    icon: <RefreshCw size={22} />,
    status: "Externo",
  },
  {
    key: "canva",
    label: "Canva",
    description: "Atalho para materiais visuais e apresentações.",
    type: "external",
    url: "https://www.canva.com/",
    icon: <Palette size={22} />,
    status: "Externo",
  },
];

export function Ferramentas() {
  return (
    <div className="ferramentas-page">
      <header className="ferramentas-top">
        <div className="ferramentas-top-row">
          <div>
            <h1>Ferramentas</h1>
            <p className="ferramentas-subtitle">
              Recursos de apoio à organização e aos processos da CPED
            </p>
          </div>
        </div>
        <div className="ferramentas-info">
          Clique em uma ferramenta disponível para abrir. Links externos abrem em nova aba.
          O catálogo é controlado pelo sistema — não há cadastro manual nesta versão.
        </div>
      </header>

      <section className="ferramentas-content" aria-label="Catálogo de ferramentas">
        <div className="ferramentas-grid">
          {FERRAMENTAS.map((item) => {
            const content = (
              <article
                className={`ferramenta-card${item.type === "external" ? " ferramenta-card-external" : ""}`}
              >
                <div className="ferramenta-card-top">
                  <span className="ferramenta-icon">
                    {item.icon}
                  </span>
                  <span className="ferramenta-badge badge-disponivel">
                    {item.status}
                  </span>
                </div>

                <h2 className="ferramenta-label">{item.label}</h2>
                <p className="ferramenta-desc">
                  {item.description}
                </p>

                {item.type === "external" ? (
                  <span className="ferramenta-hint ferramenta-hint-external">
                    Abrir em nova aba
                    <ExternalLink size={14} />
                  </span>
                ) : null}
              </article>
            );

            if (item.type === "external") {
              return (
                <a
                  key={item.key}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block h-full outline-none"
                >
                  {content}
                </a>
              );
            }

            return (
              <Link key={item.key} to={item.route} className="block h-full outline-none">
                {content}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
