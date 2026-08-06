import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronDown, Network, Search } from "lucide-react";
import { usePermissions } from "../../hooks/usePermissions";
import {
  getCepedEquipe,
  type CepedPessoaRecord,
  type CepedTipo,
} from "../../utils/store";

const TIPO_LABEL: Record<CepedTipo, string> = {
  ordenador: "Ordenador",
  assistente: "Assistente Administrativo",
  responsavel: "Responsável de Eixo",
  instrutor: "Instrutor",
  administrativo: "Administrativo",
};

const EIXO_CORES: Record<string, string> = {
  Gastronomia: "#E65100",
  "Beleza e Cuidado Pessoal": "#AD1457",
  "Gestão e Negócios": "#1565C0",
  "Tecnologia e Economia Criativa": "#6A1B9A",
  "Ambiente e Saúde": "#2E7D32",
  "Gestão e Moda": "#C2185B",
};

function textoBusca(pessoa: CepedPessoaRecord) {
  return [pessoa.nome, pessoa.cargo, pessoa.setor, pessoa.eixoVinculo, pessoa.contato]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function Avatar({
  pessoa,
  size = "md",
}: {
  pessoa: CepedPessoaRecord;
  size?: "xs" | "sm" | "lg" | "xl";
}) {
  const sz = {
    xs: "h-8 w-8 text-[0.65rem]",
    sm: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
  }[size];

  if (pessoa.foto) {
    return (
      <img
        src={pessoa.foto}
        alt={pessoa.nome}
        className={`${sz} flex-shrink-0 rounded-full object-cover ring-2 ring-white shadow`}
      />
    );
  }

  return (
    <span
      className={`${sz} inline-flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white shadow`}
      style={{ backgroundColor: pessoa.cor || "#003F7D" }}
    >
      {pessoa.iniciais || "?"}
    </span>
  );
}

export function OrganogramaFerramentas() {
  const { podeEditar } = usePermissions();
  const equipe = useMemo(() => getCepedEquipe(), []);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<CepedPessoaRecord | null>(null);
  const [eixosAbertos, setEixosAbertos] = useState<string[]>([]);

  const termo = busca.trim().toLowerCase();

  const ordenador = equipe.find((p) => p.tipo === "ordenador") ?? null;
  const assistentes = equipe.filter((p) => p.tipo === "assistente");
  const administrativos = equipe.filter((p) => p.tipo === "administrativo");

  const ramos = useMemo(() => {
    const responsaveis = equipe.filter((p) => p.tipo === "responsavel");
    const instrutores = equipe.filter((p) => p.tipo === "instrutor");
    const eixos = new Set<string>();
    responsaveis.forEach((p) => eixos.add(p.eixoVinculo || p.setor || "Sem eixo"));
    instrutores.forEach((p) => eixos.add(p.eixoVinculo || p.setor || "Sem eixo"));

    return [...eixos].sort().map((eixo) => {
      const responsavel =
        responsaveis.find((p) => (p.eixoVinculo || p.setor) === eixo) ?? null;
      const instrs = instrutores.filter((p) => (p.eixoVinculo || p.setor) === eixo);
      return {
        eixo,
        cor: EIXO_CORES[eixo] || responsavel?.cor || "#003F7D",
        responsavel,
        instrutores: instrs,
        total: (responsavel ? 1 : 0) + instrs.length,
      };
    });
  }, [equipe]);

  const destaca = (pessoa: CepedPessoaRecord) =>
    !termo || textoBusca(pessoa).includes(termo);

  useEffect(() => {
    if (ramos.length) {
      setEixosAbertos((prev) => (prev.length ? prev : ramos.slice(0, 2).map((r) => r.eixo)));
    }
  }, [ramos]);

  useEffect(() => {
    if (!termo) return;
    const abrir = ramos
      .filter((ramo) => {
        if (ramo.eixo.toLowerCase().includes(termo)) return true;
        if (ramo.responsavel && destaca(ramo.responsavel)) return true;
        return ramo.instrutores.some(destaca);
      })
      .map((r) => r.eixo);
    setEixosAbertos((prev) => [...new Set([...prev, ...abrir])]);
  }, [termo, ramos]);

  const assistentesVisiveis = termo
    ? assistentes.filter(destaca)
    : assistentes;

  const ramosVisiveis = termo
    ? ramos.filter((ramo) => {
        if (ramo.eixo.toLowerCase().includes(termo)) return true;
        if (ramo.responsavel && destaca(ramo.responsavel)) return true;
        return ramo.instrutores.some(destaca);
      })
    : ramos;

  const administrativosVisiveis = termo
    ? administrativos.filter(destaca)
    : administrativos;

  const ordenadorVisivel =
    Boolean(ordenador) &&
    (!termo ||
      destaca(ordenador!) ||
      assistentesVisiveis.length > 0 ||
      ramosVisiveis.length > 0);

  const meta = {
    total: equipe.length,
    totalEixos: ramos.length,
    totalInstrutores: equipe.filter((p) => p.tipo === "instrutor").length,
  };

  const temDados = Boolean(
    ordenador || assistentes.length || ramos.length || administrativos.length,
  );

  const toggleEixo = (eixo: string) => {
    setEixosAbertos((prev) =>
      prev.includes(eixo) ? prev.filter((e) => e !== eixo) : [...prev, eixo],
    );
  };

  const nodeClass = (pessoa: CepedPessoaRecord, extra = "") =>
    [
      "flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left shadow-sm transition",
      destaca(pessoa) && termo ? "border-[#F57C00] ring-2 ring-orange-100" : "border-gray-200",
      selecionado?.id === pessoa.id ? "border-[#003F7D] ring-2 ring-blue-100" : "",
      "hover:border-[#003F7D]",
      extra,
    ].join(" ");

  return (
    <div className="org-page">
      <header className="org-top">
        <div className="org-top-inner">
        <div className="org-top-row">
          <div>
            <Link
              to="/app/ferramentas"
              className="org-back"
            >
              ← Voltar para Ferramentas
            </Link>
            <h1>Organograma</h1>
            <p className="org-subtitle">
              Visão hierárquica da CPED — consulta sincronizada com a equipe
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
        </div>
      </header>

      <section className="org-content">
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={busca}
              onChange={(ev) => setBusca(ev.target.value)}
              placeholder="Buscar por nome, cargo ou eixo..."
              aria-label="Buscar no organograma"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#003F7D] focus:ring-2 focus:ring-[#003F7D]/15"
            />
          </div>

          <div className="flex gap-3" aria-label="Resumo">
            {[
              { label: "Pessoas", value: meta.total },
              { label: "Eixos", value: meta.totalEixos },
              { label: "Instrutores", value: meta.totalInstrutores },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-2 text-center"
              >
                <strong className="block text-lg text-[#003F7D]">{stat.value}</strong>
                <span className="text-[0.7rem] uppercase tracking-wide text-gray-500">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {!temDados ? (
          <div className="py-16 text-center text-sm text-gray-400">
            <p>Nenhum membro ativo encontrado.</p>
            {podeEditar ? (
              <Link to="/app/cped" className="mt-2 inline-block font-semibold text-[#1d4ed8]">
                Cadastrar na CPED
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-8">
              {ordenadorVisivel && ordenador ? (
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    className={nodeClass(ordenador, "max-w-md")}
                    onClick={() => setSelecionado(ordenador)}
                  >
                    <Avatar pessoa={ordenador} size="lg" />
                    <span className="min-w-0">
                      <em className="block text-[0.7rem] not-italic font-semibold uppercase tracking-wide text-[#F57C00]">
                        {TIPO_LABEL[ordenador.tipo]}
                      </em>
                      <strong className="block truncate text-[#003F7D]">{ordenador.nome}</strong>
                      <small className="block truncate text-gray-500">{ordenador.cargo}</small>
                    </span>
                  </button>
                  {assistentesVisiveis.length || ramosVisiveis.length ? (
                    <div className="mt-2 h-6 w-px bg-slate-300" aria-hidden />
                  ) : null}
                </div>
              ) : null}

              {assistentesVisiveis.length ? (
                <div>
                  <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                    Assistência
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {assistentesVisiveis.map((pessoa) => (
                      <button
                        key={pessoa.id}
                        type="button"
                        className={nodeClass(pessoa, "max-w-xs")}
                        onClick={() => setSelecionado(pessoa)}
                      >
                        <Avatar pessoa={pessoa} size="sm" />
                        <span className="min-w-0">
                          <strong className="block truncate text-sm text-[#003F7D]">
                            {pessoa.nome}
                          </strong>
                          <small className="block truncate text-gray-500">{pessoa.cargo}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {ramosVisiveis.length ? (
                <div>
                  <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                    Eixos técnicos
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {ramosVisiveis.map((ramo) => {
                      const aberto = eixosAbertos.includes(ramo.eixo) || Boolean(termo);
                      const instrutoresVis = termo
                        ? ramo.instrutores.filter(destaca)
                        : ramo.instrutores;
                      return (
                        <article
                          key={ramo.eixo}
                          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                          style={{ borderTopColor: ramo.cor, borderTopWidth: 3 }}
                        >
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-3 text-left"
                            onClick={() => toggleEixo(ramo.eixo)}
                          >
                            <ChevronDown
                              size={14}
                              className={`text-gray-400 transition ${aberto ? "rotate-0" : "-rotate-90"}`}
                            />
                            <strong className="flex-1 text-sm text-[#003F7D]">{ramo.eixo}</strong>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                              {ramo.total}
                            </span>
                          </button>

                          {aberto ? (
                            <div className="space-y-2 border-t border-gray-100 px-3 pb-3 pt-2">
                              {ramo.responsavel &&
                              (!termo || destaca(ramo.responsavel) || ramo.eixo.toLowerCase().includes(termo)) ? (
                                <button
                                  type="button"
                                  className={nodeClass(ramo.responsavel)}
                                  onClick={() => setSelecionado(ramo.responsavel!)}
                                >
                                  <Avatar pessoa={ramo.responsavel} size="sm" />
                                  <span className="min-w-0">
                                    <em className="block text-[0.65rem] not-italic font-semibold uppercase text-[#F57C00]">
                                      Responsável
                                    </em>
                                    <strong className="block truncate text-sm text-[#003F7D]">
                                      {ramo.responsavel.nome}
                                    </strong>
                                    <small className="block truncate text-gray-500">
                                      {ramo.responsavel.cargo}
                                    </small>
                                  </span>
                                </button>
                              ) : null}

                              {instrutoresVis.length ? (
                                <div className="space-y-1.5 pl-2">
                                  <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-400">
                                    Instrutores
                                  </p>
                                  {instrutoresVis.map((pessoa) => (
                                    <button
                                      key={pessoa.id}
                                      type="button"
                                      className={nodeClass(pessoa)}
                                      onClick={() => setSelecionado(pessoa)}
                                    >
                                      <Avatar pessoa={pessoa} size="xs" />
                                      <span className="min-w-0">
                                        <strong className="block truncate text-xs text-[#003F7D]">
                                          {pessoa.nome}
                                        </strong>
                                        <small className="block truncate text-[0.7rem] text-gray-500">
                                          {pessoa.cargo}
                                        </small>
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {administrativosVisiveis.length ? (
                <div>
                  <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                    Apoio administrativo
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {administrativosVisiveis.map((pessoa) => (
                      <button
                        key={pessoa.id}
                        type="button"
                        className={nodeClass(pessoa, "max-w-xs")}
                        onClick={() => setSelecionado(pessoa)}
                      >
                        <Avatar pessoa={pessoa} size="sm" />
                        <span className="min-w-0">
                          <strong className="block truncate text-sm text-[#003F7D]">
                            {pessoa.nome}
                          </strong>
                          <small className="block truncate text-gray-500">{pessoa.cargo}</small>
                          <em className="block truncate text-[0.7rem] not-italic text-slate-400">
                            {pessoa.setor}
                          </em>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="h-fit rounded-2xl border border-gray-200 bg-white shadow-sm xl:sticky xl:top-4">
              {selecionado ? (
                <div className="relative overflow-hidden">
                  <button
                    type="button"
                    aria-label="Fechar"
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-xl text-gray-600"
                    onClick={() => setSelecionado(null)}
                  >
                    ×
                  </button>
                  <div
                    className="h-20"
                    style={{ background: selecionado.cor || "#003F7D" }}
                  />
                  <div className="-mt-10 px-5 pb-6 text-center">
                    <div className="flex justify-center">
                      <Avatar pessoa={selecionado} size="xl" />
                    </div>
                    <h2 className="mt-3 text-lg font-bold text-[#003F7D]">{selecionado.nome}</h2>
                    <p className="text-sm text-gray-500">{selecionado.cargo}</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[0.7rem] font-semibold text-[#003F7D]">
                        {TIPO_LABEL[selecionado.tipo]}
                      </span>
                      {selecionado.setor ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[0.7rem] text-slate-600">
                          {selecionado.setor}
                        </span>
                      ) : null}
                      {selecionado.eixoVinculo ? (
                        <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[0.7rem] text-[#F57C00]">
                          {selecionado.eixoVinculo}
                        </span>
                      ) : null}
                    </div>
                    {selecionado.contato ? (
                      <a
                        href={`mailto:${selecionado.contato}`}
                        className="mt-4 block text-sm font-medium text-[#1d4ed8] hover:underline"
                      >
                        {selecionado.contato}
                      </a>
                    ) : null}
                    <p className="mt-4 text-xs text-gray-400">
                      Cadastro gerenciado na página CPED.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 py-14 text-center text-sm text-gray-400">
                  <Network size={28} className="text-slate-300" />
                  <p>Selecione uma pessoa na árvore para ver os detalhes.</p>
                </div>
              )}
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
