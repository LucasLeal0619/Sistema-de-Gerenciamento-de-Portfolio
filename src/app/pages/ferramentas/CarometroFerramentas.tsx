import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Search } from "lucide-react";
import { usePermissions } from "../../hooks/usePermissions";
import {
  getCepedEquipe,
  type CepedPessoaRecord,
  type CepedTipo,
} from "../../utils/store";

const ORDEM_TIPOS: CepedTipo[] = [
  "ordenador",
  "assistente",
  "responsavel",
  "instrutor",
  "administrativo",
];

const TIPO_LABEL: Record<CepedTipo, string> = {
  ordenador: "Ordenador",
  assistente: "Assistente Administrativo",
  responsavel: "Responsável de Eixo",
  instrutor: "Instrutor",
  administrativo: "Administrativo",
};

const CORES_TIPO: Record<CepedTipo, string> = {
  ordenador: "#003F7D",
  assistente: "#5C6BC0",
  responsavel: "#F57C00",
  instrutor: "#00897B",
  administrativo: "#64748B",
};

const EIXO_CORES: Record<string, string> = {
  Gastronomia: "#E65100",
  "Beleza e Cuidado Pessoal": "#AD1457",
  "Gestão e Negócios": "#1565C0",
  "Tecnologia e Economia Criativa": "#6A1B9A",
  "Ambiente e Saúde": "#2E7D32",
  "Gestão e Moda": "#C2185B",
};

function corPessoa(pessoa: CepedPessoaRecord) {
  return (
    pessoa.cor ||
    (pessoa.eixoVinculo ? EIXO_CORES[pessoa.eixoVinculo] : undefined) ||
    CORES_TIPO[pessoa.tipo] ||
    "#003F7D"
  );
}

export function CarometroFerramentas() {
  const { podeEditar } = usePermissions();
  const membros = useMemo(() => getCepedEquipe(), []);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | CepedTipo>("todos");
  const [filtroArea, setFiltroArea] = useState("todos");
  const [selecionado, setSelecionado] = useState<CepedPessoaRecord | null>(null);

  const areasFiltro = useMemo(() => {
    const set = new Set<string>();
    membros.forEach((p) => {
      const area = p.eixoVinculo || p.setor;
      if (area) set.add(area);
    });
    return [...set].sort();
  }, [membros]);

  const porTipo = useMemo(() => {
    const map: Partial<Record<CepedTipo, number>> = {};
    membros.forEach((p) => {
      map[p.tipo] = (map[p.tipo] || 0) + 1;
    });
    return map;
  }, [membros]);

  const membrosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return membros.filter((pessoa) => {
      if (filtroTipo !== "todos" && pessoa.tipo !== filtroTipo) return false;
      if (filtroArea !== "todos") {
        const area = pessoa.eixoVinculo || pessoa.setor;
        if (area !== filtroArea) return false;
      }
      if (!termo) return true;
      const texto = [pessoa.nome, pessoa.cargo, pessoa.setor, pessoa.eixoVinculo, pessoa.contato]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return texto.includes(termo);
    });
  }, [membros, busca, filtroTipo, filtroArea]);

  const gruposVisiveis = ORDEM_TIPOS.map((tipo) => ({
    tipo,
    label: TIPO_LABEL[tipo],
    membros: membrosFiltrados.filter((p) => p.tipo === tipo),
  })).filter((g) => g.membros.length > 0);

  const limparFiltros = () => {
    setBusca("");
    setFiltroTipo("todos");
    setFiltroArea("todos");
  };

  const temFiltro = filtroTipo !== "todos" || filtroArea !== "todos" || Boolean(busca.trim());

  return (
    <div className="caro-page">
      <header className="caro-top">
        <div className="caro-top-inner">
        <div className="caro-top-row">
          <div>
            <Link
              to="/app/ferramentas"
              className="caro-back"
            >
              ← Voltar para Ferramentas
            </Link>
            <h1>Carômetro</h1>
            <p className="caro-subtitle">
              Álbum da equipe CPED — consulte fotos, cargos e contatos
            </p>
          </div>

          {podeEditar ? (
            <Link
              to="/app/cped"
              className="inline-flex h-10 items-center rounded-lg bg-[#003F7D] px-4 text-sm font-semibold text-white hover:bg-[#002A56]"
            >
              Gerenciar equipe na CPED
            </Link>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xl flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={busca}
              onChange={(ev) => setBusca(ev.target.value)}
              placeholder="Buscar por nome, cargo, setor ou e-mail..."
              aria-label="Buscar no carômetro"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#003F7D] focus:ring-2 focus:ring-[#003F7D]/15"
            />
          </div>
          <div className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-2 text-center">
            <strong className="text-lg text-[#003F7D]">{membrosFiltrados.length}</strong>
            <span className="ml-1.5 text-xs text-gray-500">
              {membrosFiltrados.length === 1 ? "pessoa" : "pessoas"}
            </span>
          </div>
        </div>
        </div>
      </header>

      <section className="caro-content">
        <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-4 shadow-sm" aria-label="Filtros">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#003F7D]">Filtros</h2>
              {temFiltro ? (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="text-xs font-semibold text-[#1d4ed8] hover:underline"
                >
                  Limpar
                </button>
              ) : null}
            </div>

            <div className="mb-5 space-y-1.5">
              <h3 className="mb-2 text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                Função
              </h3>
              <button
                type="button"
                onClick={() => setFiltroTipo("todos")}
                className={[
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm",
                  filtroTipo === "todos"
                    ? "bg-[#003F7D] font-semibold text-white"
                    : "text-gray-700 hover:bg-slate-50",
                ].join(" ")}
              >
                <span>Todos</span>
                <strong>{membros.length}</strong>
              </button>
              {ORDEM_TIPOS.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setFiltroTipo(tipo)}
                  className={[
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm",
                    filtroTipo === tipo
                      ? "bg-[#003F7D] font-semibold text-white"
                      : "text-gray-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: CORES_TIPO[tipo] }}
                  />
                  <span className="flex-1">{TIPO_LABEL[tipo]}</span>
                  <strong>{porTipo[tipo] || 0}</strong>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <h3 className="mb-2 text-[0.7rem] font-bold uppercase tracking-wide text-slate-400">
                Área / Eixo
              </h3>
              <button
                type="button"
                onClick={() => setFiltroArea("todos")}
                className={[
                  "flex w-full rounded-lg px-2.5 py-2 text-left text-sm",
                  filtroArea === "todos"
                    ? "bg-[#F57C00] font-semibold text-white"
                    : "text-gray-700 hover:bg-slate-50",
                ].join(" ")}
              >
                Todas
              </button>
              {areasFiltro.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => setFiltroArea(area)}
                  className={[
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm",
                    filtroArea === area
                      ? "font-semibold text-white"
                      : "text-gray-700 hover:bg-slate-50",
                  ].join(" ")}
                  style={
                    filtroArea === area
                      ? { background: EIXO_CORES[area] || "#64748B" }
                      : undefined
                  }
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: EIXO_CORES[area] || "#64748B" }}
                  />
                  <span className="flex-1 truncate">{area}</span>
                </button>
              ))}
            </div>
          </aside>

          <div>
            {!membrosFiltrados.length ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center text-sm text-gray-400">
                Nenhuma pessoa encontrada com esses filtros.
              </div>
            ) : (
              <div className="space-y-8">
                {gruposVisiveis.map((grupo) => (
                  <article key={grupo.tipo}>
                    <header className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: CORES_TIPO[grupo.tipo] }}
                        />
                        <h2 className="text-base font-bold text-[#003F7D]">{grupo.label}</h2>
                      </div>
                      <span className="text-sm text-gray-400">{grupo.membros.length}</span>
                    </header>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {grupo.membros.map((pessoa) => {
                        const cor = corPessoa(pessoa);
                        return (
                          <button
                            key={pessoa.id}
                            type="button"
                            onClick={() => setSelecionado(pessoa)}
                            className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#003F7D] hover:shadow-md"
                          >
                            <div
                              className="relative flex h-48 items-end p-4"
                              style={{
                                background: `linear-gradient(165deg, ${cor} 0%, #0b1220 130%)`,
                              }}
                            >
                              {pessoa.foto ? (
                                <img
                                  src={pessoa.foto}
                                  alt={pessoa.nome}
                                  className="absolute inset-0 h-full w-full object-cover"
                                />
                              ) : (
                                <span className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-white/90">
                                  {pessoa.iniciais || "?"}
                                </span>
                              )}
                              <div className="relative z-10 w-full rounded-xl bg-black/45 p-3 text-white backdrop-blur-[2px]">
                                <span className="text-[0.65rem] font-bold uppercase tracking-wide text-orange-300">
                                  {TIPO_LABEL[pessoa.tipo]}
                                </span>
                                <strong className="mt-0.5 block text-sm">{pessoa.nome}</strong>
                                <small className="block text-white/80">{pessoa.cargo}</small>
                              </div>
                            </div>
                            <div className="flex items-center justify-between px-3 py-2.5 text-xs">
                              <em className="truncate not-italic text-gray-500">
                                {pessoa.eixoVinculo || pessoa.setor || "—"}
                              </em>
                              <span className="font-semibold text-[#1d4ed8]">Ver ficha →</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {selecionado ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setSelecionado(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selecionado.nome}
            className="relative grid w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-2"
            onClick={(ev) => ev.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Fechar"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-xl text-gray-600"
              onClick={() => setSelecionado(null)}
            >
              ×
            </button>
            <div
              className="relative flex min-h-64 items-center justify-center"
              style={{
                background: `linear-gradient(165deg, ${corPessoa(selecionado)} 0%, #0b1220 130%)`,
              }}
            >
              {selecionado.foto ? (
                <img
                  src={selecionado.foto}
                  alt={selecionado.nome}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <span className="text-6xl font-bold text-white">
                  {selecionado.iniciais || "?"}
                </span>
              )}
            </div>
            <div className="p-6">
              <p
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: corPessoa(selecionado) }}
              >
                {TIPO_LABEL[selecionado.tipo]}
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#003F7D]">{selecionado.nome}</h2>
              <p className="text-sm text-gray-500">{selecionado.cargo}</p>

              <dl className="mt-5 space-y-3 text-sm">
                {selecionado.setor ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-400">Setor</dt>
                    <dd className="text-gray-800">{selecionado.setor}</dd>
                  </div>
                ) : null}
                {selecionado.eixoVinculo ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-400">Eixo</dt>
                    <dd className="text-gray-800">{selecionado.eixoVinculo}</dd>
                  </div>
                ) : null}
                {selecionado.contato ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-400">Contato</dt>
                    <dd>
                      <a
                        href={`mailto:${selecionado.contato}`}
                        className="font-medium text-[#1d4ed8] hover:underline"
                      >
                        {selecionado.contato}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>

              <p className="mt-6 text-xs text-gray-400">Cadastro gerenciado na página CPED.</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
