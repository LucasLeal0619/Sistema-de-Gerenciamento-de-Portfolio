import { useMemo } from "react";
import { ExternalLink, Globe, LayoutGrid, ShieldCheck, Wrench, Zap } from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";

const FERRAMENTAS = [
  {
    key: "kanban",
    label: "Kanban",
    description: "Organização das atividades e responsabilidades da equipe.",
    status: "Disponível",
    type: "internal",
    route: "/app/ferramentas/kanban",
    icon: "kanban",
    hint: "Abrir ferramenta",
  },
  {
    key: "organograma",
    label: "Organograma",
    description: "Estrutura visual da CPED, cargos e responsáveis.",
    status: "Disponível",
    type: "internal",
    route: "/app/ferramentas/organograma",
    icon: "organograma",
    hint: "Abrir ferramenta",
  },
  {
    key: "carometro",
    label: "Carômetro",
    description: "Painel de atividades e distribuição de carga interna.",
    status: "Disponível",
    type: "internal",
    route: "/app/ferramentas/carometro",
    icon: "carometro",
    hint: "Abrir ferramenta",
  },
  {
    key: "fluxograma",
    label: "Fluxograma",
    description: "Mapeamento visual dos processos da CPED.",
    status: "Disponível",
    type: "internal",
    route: "/app/ferramentas/fluxograma",
    icon: "fluxograma",
    hint: "Abrir ferramenta",
  },
  {
    key: "microsoft_loop",
    label: "Microsoft Loop",
    description: "Atalho para espaços colaborativos da CPED no Loop.",
    status: "Disponível",
    type: "external",
    url: "https://loop.microsoft.com/",
    icon: "loop",
    hint: "Abrir em nova aba",
  },
  {
    key: "canva",
    label: "Canva",
    description: "Atalho para materiais visuais e apresentações.",
    status: "Disponível",
    type: "external",
    url: "https://www.canva.com/",
    icon: "canva",
    hint: "Abrir em nova aba",
  },
];

const ICONS: Record<string, React.ReactNode> = {
  kanban: <LayoutGrid size={22} />,
  organograma: <LayoutGrid size={22} />,
  carometro: <ShieldCheck size={22} />,
  fluxograma: <Zap size={22} />,
  microsoft_loop: <Globe size={22} />,
  canva: <Wrench size={22} />,
};

export function Ferramentas() {
  const { canManageUsers } = usePermissions();

  const items = useMemo(() => FERRAMENTAS, []);

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-6 px-4 lg:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#003F7D]">Ferramentas</h1>
              <p className="mt-2 text-sm text-gray-600">
                Recursos de apoio à organização e aos processos da CPED.
              </p>
            </div>
            <div className="rounded-2xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">
              Clique em uma ferramenta disponível para abrir. Links externos abrem em nova aba.
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => {
            const icon = ICONS[item.key];
            const available = item.status === "Disponível";
            const cardClasses = [
              "rounded-[1.5rem] border bg-white p-6 shadow-sm transition-transform duration-200",
              available ? "hover:-translate-y-1 hover:border-[#003F7D]/40 cursor-pointer" : "opacity-70 cursor-not-allowed border-gray-200",
            ].join(" ");

            const content = (
              <article className={cardClasses} aria-disabled={!available}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#003F7D]">
                    {icon}
                  </div>
                  <span
                    className={
                      "rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] " +
                      (available ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")
                    }
                  >
                    {item.status}
                  </span>
                </div>

                <h2 className="mt-6 text-lg font-semibold text-[#003F7D]">{item.label}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className="text-xs uppercase tracking-[0.2em] text-gray-400">{item.hint}</span>
                  {item.type === "external" && available ? (
                    <ExternalLink size={16} className="text-[#003F7D]" />
                  ) : null}
                </div>
              </article>
            );

            if (item.type === "external" && item.url && available) {
              return (
                <a key={item.key} href={item.url} target="_blank" rel="noreferrer" className="block">
                  {content}
                </a>
              );
            }

            return <div key={item.key}>{content}</div>;
          })}
        </section>
      </div>
    </div>
  );
}
