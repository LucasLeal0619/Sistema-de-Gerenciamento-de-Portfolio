import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { Trash2 } from "lucide-react";
import { usePermissions } from "../../hooks/usePermissions";
import { toastSuccess } from "../../utils/toast";
import {
  getFluxogramaBySlug,
  newEdgeId,
  newNodeId,
  NODE_COLORS,
  saveFluxogramaDiagrama,
  type FluxogramaEdge,
  type FluxogramaItem,
  type FluxogramaNode,
  type FluxoNodeType,
} from "./fluxogramaStorage";

const PALETA: { type: FluxoNodeType; descricao: string }[] = [
  { type: "inicio", descricao: "Entrada do processo" },
  { type: "processo", descricao: "Atividade ou etapa" },
  { type: "decisao", descricao: "Ramificação Sim/Não" },
  { type: "fim", descricao: "Saída do processo" },
];

export function FluxogramaEditor() {
  const { slug } = useParams<{ slug: string }>();
  const { podeEditar } = usePermissions();
  const [item, setItem] = useState<FluxogramaItem | null>(() =>
    slug ? getFluxogramaBySlug(slug) : null,
  );
  const [nodes, setNodes] = useState<FluxogramaNode[]>(() => item?.nodes ?? []);
  const [edges, setEdges] = useState<FluxogramaEdge[]>(() => item?.edges ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [sujo, setSujo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    const found = getFluxogramaBySlug(slug);
    setItem(found);
    setNodes(found?.nodes ?? []);
    setEdges(found?.edges ?? []);
    setSelectedId(null);
    setConnectFrom(null);
    setSujo(false);
  }, [slug]);

  const selected = nodes.find((n) => n.id === selectedId) ?? null;

  useEffect(() => {
    if (selected) setLabel(selected.label);
  }, [selected?.id]);

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const marcarSujo = () => setSujo(true);

  const adicionarNo = (type: FluxoNodeType) => {
    if (!podeEditar) return;
    const count = nodes.filter((n) => n.type === type).length;
    const novo: FluxogramaNode = {
      id: newNodeId(),
      type,
      label: count ? `${NODE_COLORS[type].label} ${count + 1}` : NODE_COLORS[type].label,
      x: 60 + (nodes.length % 4) * 40,
      y: 60 + Math.floor(nodes.length / 4) * 30,
    };
    setNodes((prev) => [...prev, novo]);
    setSelectedId(novo.id);
    setLabel(novo.label);
    marcarSujo();
  };

  const aplicarLabel = (value: string) => {
    setLabel(value);
    if (!selectedId || !podeEditar) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedId ? { ...n, label: value } : n)),
    );
    marcarSujo();
  };

  const excluirSelecionado = () => {
    if (!podeEditar || !selectedId) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedId));
    setEdges((prev) =>
      prev.filter((e) => e.source !== selectedId && e.target !== selectedId),
    );
    setSelectedId(null);
    setConnectFrom((c) => (c === selectedId ? null : c));
    marcarSujo();
  };

  const onNodeClick = (node: FluxogramaNode) => {
    if (connectFrom && podeEditar) {
      if (connectFrom === "__pick__") {
        setConnectFrom(node.id);
        setSelectedId(node.id);
        return;
      }
      if (connectFrom !== node.id) {
        const exists = edges.some((e) => e.source === connectFrom && e.target === node.id);
        if (!exists) {
          setEdges((prev) => [
            ...prev,
            { id: newEdgeId(), source: connectFrom, target: node.id },
          ]);
          marcarSujo();
        }
      }
      setConnectFrom(null);
      setSelectedId(node.id);
      return;
    }
    setSelectedId(node.id);
  };

  const onPointerDown = (e: React.PointerEvent, node: FluxogramaNode) => {
    if (!podeEditar || connectFrom) return;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    dragRef.current = {
      id: node.id,
      ox: e.clientX - node.x,
      oy: e.clientY - node.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !podeEditar) return;
    const { id, ox, oy } = dragRef.current;
    const x = Math.max(8, e.clientX - ox);
    const y = Math.max(8, e.clientY - oy);
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    marcarSujo();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      dragRef.current = null;
    }
  };

  const salvar = () => {
    if (!podeEditar || !item || salvando) return;
    setSalvando(true);
    const saved = saveFluxogramaDiagrama({ ...item, nodes, edges });
    setItem(saved);
    setSujo(false);
    setSalvando(false);
    toastSuccess("Fluxograma salvo.");
  };

  const statusTexto = salvando ? "Salvando..." : sujo ? "Alterações não salvas" : "Salvo";

  if (!slug) {
    return <Navigate to="/app/ferramentas/fluxograma" replace />;
  }

  if (!item) {
    return (
      <div className="min-h-full bg-[#F5F7FA] px-6 py-8 lg:px-8">
        <Link
          to="/app/ferramentas/fluxograma"
          className="mb-3 inline-block text-[0.8rem] font-semibold text-[#1d4ed8] hover:underline"
        >
          ← Voltar para a lista
        </Link>
        <p className="text-sm text-red-700">Fluxograma não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F5F7FA]">
      <header className="border-b border-gray-200 bg-white px-6 py-4 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/app/ferramentas/fluxograma"
              className="mb-2 inline-block text-[0.8rem] font-semibold text-[#1d4ed8] hover:underline"
            >
              ← Voltar para a lista
            </Link>
            <h1 className="text-[1.5rem] font-bold text-[#003F7D]">{item.titulo}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {item.tipo === "funcional" ? "Funcional (raias)" : "Linear"}
              {item.descricao ? ` · ${item.descricao}` : ""}
              {!podeEditar ? " · Somente leitura" : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full px-3 py-1 text-xs font-semibold",
                sujo ? "bg-orange-50 text-[#F57C00]" : "bg-emerald-50 text-emerald-700",
              ].join(" ")}
            >
              {statusTexto}
            </span>
            {podeEditar ? (
              <>
                <button
                  type="button"
                  onClick={() => setConnectFrom((c) => (c ? null : selectedId || "__pick__"))}
                  className={[
                    "h-9 rounded-lg border px-3 text-sm font-semibold",
                    connectFrom
                      ? "border-[#F57C00] bg-orange-50 text-[#F57C00]"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {connectFrom ? "Cancelar conexão" : "↗ Conectar seta"}
                </button>
                <button
                  type="button"
                  disabled={!sujo || salvando}
                  onClick={salvar}
                  className="h-9 rounded-lg bg-[#003F7D] px-4 text-sm font-semibold text-white hover:bg-[#002A56] disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {connectFrom && connectFrom !== "__pick__" ? (
        <div className="border-b border-orange-200 bg-orange-50 px-6 py-2 text-sm text-[#F57C00] lg:px-8">
          Clique em outro símbolo para ligar a seta.
        </div>
      ) : connectFrom === "__pick__" ? (
        <div className="border-b border-orange-200 bg-orange-50 px-6 py-2 text-sm text-[#F57C00] lg:px-8">
          Clique no símbolo de origem e depois no destino.
        </div>
      ) : null}

      <div
        className={[
          "grid flex-1 gap-0",
          podeEditar ? "lg:grid-cols-[14rem_minmax(0,1fr)_16rem]" : "lg:grid-cols-[minmax(0,1fr)_16rem]",
        ].join(" ")}
      >
        {podeEditar ? (
          <aside className="border-r border-gray-200 bg-white p-4" aria-label="Símbolos">
            <h2 className="text-sm font-bold text-[#003F7D]">Símbolos</h2>
            <p className="mt-1 text-xs text-gray-400">Clique para adicionar ao canvas</p>
            <div className="mt-4 space-y-2">
              {PALETA.map((itemPaleta) => {
                const cor = NODE_COLORS[itemPaleta.type];
                return (
                  <button
                    key={itemPaleta.type}
                    type="button"
                    onClick={() => adicionarNo(itemPaleta.type)}
                    className="flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition hover:shadow-sm"
                    style={{ borderColor: cor.borda, background: cor.fundo }}
                  >
                    <span
                      className={[
                        "flex h-8 w-10 flex-shrink-0 items-center justify-center border-2 text-[0.6rem] font-bold",
                        itemPaleta.type === "inicio" || itemPaleta.type === "fim"
                          ? "rounded-full"
                          : itemPaleta.type === "decisao"
                            ? "rotate-45 scale-75 rounded-sm"
                            : "rounded-md",
                      ].join(" ")}
                      style={{ borderColor: cor.borda, color: cor.texto }}
                    >
                      {itemPaleta.type === "decisao" ? (
                        <span className="-rotate-45">?</span>
                      ) : (
                        "·"
                      )}
                    </span>
                    <span>
                      <strong className="block text-xs" style={{ color: cor.texto }}>
                        {cor.label}
                      </strong>
                      <small className="text-[0.65rem] text-gray-500">
                        {itemPaleta.descricao}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Legenda
              </h3>
              <div className="mt-2 space-y-1.5">
                {PALETA.map((p) => (
                  <div key={p.type} className="flex items-center gap-2 text-xs text-gray-600">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: NODE_COLORS[p.type].borda }}
                    />
                    {NODE_COLORS[p.type].label}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[0.65rem] leading-relaxed text-gray-400">
                Cores alinhadas à identidade (#003F7D / #F57C00).
              </p>
            </div>
          </aside>
        ) : null}

        <div
          ref={canvasRef}
          className="relative min-h-[28rem] overflow-auto bg-[linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] bg-[size:18px_18px] bg-[#f8fafc]"
        >
          <svg className="pointer-events-none absolute inset-0 h-full w-full min-h-[28rem] min-w-[48rem]">
            <defs>
              <marker
                id="arrow"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 Z" fill="#003F7D" />
              </marker>
            </defs>
            {edges.map((edge) => {
              const a = nodeMap.get(edge.source);
              const b = nodeMap.get(edge.target);
              if (!a || !b) return null;
              const x1 = a.x + 70;
              const y1 = a.y + 28;
              const x2 = b.x + 70;
              const y2 = b.y + 28;
              return (
                <line
                  key={edge.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#003F7D"
                  strokeWidth={2}
                  markerEnd="url(#arrow)"
                />
              );
            })}
          </svg>

          <div className="relative min-h-[28rem] min-w-[48rem]">
            {nodes.map((node) => {
              const cor = NODE_COLORS[node.type];
              const selected = selectedId === node.id;
              const isOrigin = connectFrom === node.id;
              return (
                  <div
                  key={node.id}
                  onClick={() => onNodeClick(node)}
                  onPointerDown={(e) => onPointerDown(e, node)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  className={[
                    "absolute select-none border-2 px-3 py-2 text-center text-xs font-semibold shadow-sm transition",
                    podeEditar && !connectFrom ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                    node.type === "inicio" || node.type === "fim" ? "rounded-full" : "",
                    node.type === "processo" ? "rounded-lg" : "",
                    node.type === "decisao" ? "rotate-45 rounded-md" : "",
                    selected || isOrigin ? "ring-2 ring-offset-2" : "",
                  ].join(" ")}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: 140,
                    minHeight: 56,
                    borderColor: cor.borda,
                    background: cor.fundo,
                    color: cor.texto,
                    boxShadow: selected || isOrigin ? `0 0 0 2px ${cor.borda}` : undefined,
                  }}
                >
                  <span className={node.type === "decisao" ? "-rotate-45 block py-2" : "block"}>
                    {node.label}
                  </span>
                </div>
              );
            })}

            {!nodes.length ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                Adicione símbolos pela paleta para montar o fluxo.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="border-l border-gray-200 bg-white p-4" aria-label="Propriedades">
          <h2 className="text-sm font-bold text-[#003F7D]">Propriedades</h2>

          {selected ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {NODE_COLORS[selected.type].label}
              </p>
              <label className="block text-sm font-medium text-gray-700">
                Texto
                <input
                  value={label}
                  onChange={(ev) => aplicarLabel(ev.target.value)}
                  disabled={!podeEditar}
                  maxLength={120}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#003F7D] focus:ring-2 focus:ring-[#003F7D]/15 disabled:bg-slate-50"
                />
              </label>
              {podeEditar ? (
                <>
                  <button
                    type="button"
                    onClick={() => setConnectFrom(selected.id)}
                    className="w-full rounded-lg border border-[#F57C00] px-3 py-2 text-sm font-semibold text-[#F57C00] hover:bg-orange-50"
                  >
                    ↗ Ligar seta a outro símbolo
                  </button>
                  <button
                    type="button"
                    onClick={excluirSelecionado}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                  >
                    <Trash2 size={14} />
                    Excluir etapa
                  </button>
                </>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 text-sm text-gray-400">
              <p>Selecione uma etapa para editar.</p>
              <p className="mt-2 text-xs">
                {nodes.length} etapa(s) · {edges.length} conexão(ões)
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
