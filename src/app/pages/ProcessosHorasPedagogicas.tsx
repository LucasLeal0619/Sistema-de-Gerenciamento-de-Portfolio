import { useState, useMemo } from "react";
import {
  Search, Plus, Eye, Pencil, Trash2, X, Save, CheckCircle,
  ExternalLink, FileText, BarChart2, List, User,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { Label } from "../components/ui/label";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, ResponsiveContainer,
} from "recharts";
import {
  getStoredHoras, saveHora, updateHora, deleteHora,
  HoraPedagogicaRecord,
} from "../utils/store";

// ── Constantes ────────────────────────────────────────────────────────────────
const EIXOS = [
  "Gastronomia", "Ambiente e Saúde", "Gestão e Moda",
  "Tecnologia e Economia Criativa", "Beleza e Cuidado Pessoal", "60+", "Ensino Médio",
];

const SEGMENTOS = [
  "Gastronomia", "Saúde", "Segurança no Trabalho", "Gestão e Negócios",
  "Moda e Beleza", "Estética e Beleza", "Tecnologia da Informação",
  "Comércio, Turismo e Econ. Criativa", "60+", "Ensino Médio",
];

const STATUS_OPTS = ["Solicitada", "Em análise", "Aprovada", "Concluída", "Recusada", "Inativa"];

// STATUS_STYLE usado apenas nos gráficos de indicadores (pie + progress bars)
const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  "Solicitada":  { bg: "#EFF6FF", text: "#1D4ED8" },
  "Em análise":  { bg: "#FEF9C3", text: "#854D0E" },
  "Aprovada":    { bg: "#DCFCE7", text: "#166534" },
  "Concluída":   { bg: "#D1FAE5", text: "#065F46" },
  "Recusada":    { bg: "#FEE2E2", text: "#991B1B" },
  "Inativa":     { bg: "#F3F4F6", text: "#6B7280" },
};

// SEI base URL (ajustar conforme ambiente)
const SEI_BASE_URL = "https://sei.df.gov.br/sei/controlador.php?acao=procedimento_trabalhar&id_procedimento=";

function seiLink(sei: string) {
  if (!sei) return null;
  return `${SEI_BASE_URL}${encodeURIComponent(sei)}`;
}

type ModalItem = Omit<HoraPedagogicaRecord, "id">;
const EMPTY: ModalItem = {
  ano: "2026", processoSEI: "", eixo: "", segmento: "",
  nomePessoa: "", matricula: "", motivo: "", observacao: "", status: "Solicitada",
};

// ── Componente ────────────────────────────────────────────────────────────────
export function ProcessosHorasPedagogicas() {
  const [all, setAll]   = useState<HoraPedagogicaRecord[]>(getStoredHoras);
  const [activeTab, setActiveTab]         = useState<"registros" | "indicadores">("registros");
  const [search, setSearch]               = useState("");
  const [filterAno, setFilterAno]         = useState("Todos");
  const [filterEixo, setFilterEixo]       = useState("Todos");
  const [filterSegmento, setFilterSegmento] = useState("Todos");
  const [filterStatus, setFilterStatus]   = useState("Todos");
  const [toast, setToast]                 = useState("");
  const [viewItem, setViewItem]           = useState<HoraPedagogicaRecord | null>(null);
  const [modal, setModal]                 = useState<{ open: boolean; item: ModalItem; editId: string | null }>({
    open: false, item: EMPTY, editId: null,
  });

  const hasFilter = search || filterAno !== "Todos" || filterEixo !== "Todos" ||
    filterSegmento !== "Todos" || filterStatus !== "Todos";

  const clearFilters = () => {
    setSearch(""); setFilterAno("Todos"); setFilterEixo("Todos");
    setFilterSegmento("Todos"); setFilterStatus("Todos");
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return all.filter((h) => {
      if (filterAno !== "Todos" && h.ano !== filterAno) return false;
      if (filterEixo !== "Todos" && h.eixo !== filterEixo) return false;
      if (filterSegmento !== "Todos" && h.segmento !== filterSegmento) return false;
      if (filterStatus !== "Todos" && h.status !== filterStatus) return false;
      if (q && ![h.nomePessoa, h.matricula, h.segmento, h.eixo, h.processoSEI, h.motivo]
        .some((f) => f?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [all, search, filterAno, filterEixo, filterSegmento, filterStatus]);

  const refresh = () => setAll(getStoredHoras());

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(""), 3500);
  };

  const openNew  = () => setModal({ open: true, item: { ...EMPTY }, editId: null });
  const openEdit = (h: HoraPedagogicaRecord) =>
    setModal({ open: true, editId: h.id, item: { ...h } });
  const closeModal = () => setModal({ open: false, item: EMPTY, editId: null });

  const setField = (field: keyof ModalItem, value: string) =>
    setModal((m) => ({ ...m, item: { ...m.item, [field]: value } }));

  const handleSave = () => {
    if (!modal.item.eixo || !modal.item.segmento) return;
    if (modal.editId) {
      updateHora(modal.editId, modal.item);
      showToast("Solicitação atualizada com sucesso!");
    } else {
      saveHora(modal.item);
      showToast("Solicitação cadastrada com sucesso!");
    }
    refresh(); closeModal();
  };

  const handleDelete = (h: HoraPedagogicaRecord) => {
    if (!window.confirm(`Inativar solicitação de "${h.nomePessoa || h.segmento}"?`)) return;
    updateHora(h.id, { status: "Inativa" });
    refresh(); showToast("Solicitação inativada.");
  };

  // ── Base para indicadores (respeita filtros de ano/eixo/segmento/status, ignora busca) ──
  const baseInd = useMemo(() => all.filter((h) => {
    if (filterAno !== "Todos" && h.ano !== filterAno) return false;
    if (filterEixo !== "Todos" && h.eixo !== filterEixo) return false;
    if (filterSegmento !== "Todos" && h.segmento !== filterSegmento) return false;
    if (filterStatus !== "Todos" && h.status !== filterStatus) return false;
    return true;
  }), [all, filterAno, filterEixo, filterSegmento, filterStatus]);

  const ind = useMemo(() => {
    const total      = baseInd.length;
    const pendentes  = baseInd.filter((h) => ["Solicitada", "Em análise"].includes(h.status)).length;
    const aprovadas  = baseInd.filter((h) => h.status === "Aprovada").length;
    const concluidas = baseInd.filter((h) => h.status === "Concluída").length;
    const recusadas  = baseInd.filter((h) => ["Recusada", "Inativa"].includes(h.status)).length;

    // Por eixo
    const eixoMap: Record<string, number> = {};
    baseInd.forEach((h) => { eixoMap[h.eixo] = (eixoMap[h.eixo] || 0) + 1; });
    const porEixo = EIXOS
      .map((e) => ({ name: e.replace("Tecnologia e Economia Criativa", "Tec. e Econ."), full: e, value: eixoMap[e] || 0 }))
      .filter((e) => e.value > 0);

    // Por segmento
    const segMap: Record<string, number> = {};
    baseInd.forEach((h) => { segMap[h.segmento] = (segMap[h.segmento] || 0) + 1; });
    const porSegmento = Object.entries(segMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Por status (para pie)
    const statusMap: Record<string, number> = {};
    baseInd.forEach((h) => { statusMap[h.status] = (statusMap[h.status] || 0) + 1; });
    const porStatus = STATUS_OPTS.map((s) => ({ name: s, value: statusMap[s] || 0 })).filter((s) => s.value > 0);

    // Pessoas mais acionadas
    const pessoaMap: Record<string, number> = {};
    baseInd.forEach((h) => {
      if (h.nomePessoa?.trim()) pessoaMap[h.nomePessoa.trim()] = (pessoaMap[h.nomePessoa.trim()] || 0) + 1;
    });
    const topPessoas = Object.entries(pessoaMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return { total, pendentes, aprovadas, concluidas, recusadas, porEixo, porSegmento, porStatus, topPessoas };
  }, [baseInd]);

  const EIXO_COLORS = ["#003F7D","#1A5FA8","#3375C8","#4D8CE0","#66A3F5","#80B9FF","#99CCFF"];
  const TooltipStyle = { borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" };

  const inputCls  = "w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]";
  const selectCls = "h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]";

  return (
    <div className="min-h-screen bg-white w-full overflow-auto">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-[#003F7D] text-white text-sm px-4 py-3 rounded-xl shadow-xl">
          <CheckCircle size={16} /> {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div className="border-b border-gray-200 px-6 py-5 pt-16 lg:pt-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1>Horas Pedagógicas</h1>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: "0.8rem" }}>
              Solicitação de Instrutores por Segmento · {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab("registros")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${activeTab === "registros" ? "bg-white shadow text-[#003F7D] font-semibold" : "text-gray-500 hover:text-gray-700"}`}
              >
                <List size={14} /> Registros
              </button>
              <button
                onClick={() => setActiveTab("indicadores")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${activeTab === "indicadores" ? "bg-white shadow text-[#003F7D] font-semibold" : "text-gray-500 hover:text-gray-700"}`}
              >
                <BarChart2 size={14} /> Indicadores
              </button>
            </div>
            <button
              onClick={openNew}
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm text-white font-medium"
              style={{ background: "#F57C00" }}
            >
              <Plus size={14} /> Nova Solicitação
            </button>
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap gap-3 items-end bg-white border border-gray-200 rounded-xl px-4 py-4 mx-4 lg:mx-6 my-4 shadow-sm">
        {activeTab === "registros" && (
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, matrícula, segmento, eixo ou SEI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
            />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Ano</label>
          <select value={filterAno} onChange={(e) => setFilterAno(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todos">Todos</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Eixo Tecnológico</label>
          <select value={filterEixo} onChange={(e) => setFilterEixo(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todos">Todos</option>
            {EIXOS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Segmento</label>
          <select value={filterSegmento} onChange={(e) => setFilterSegmento(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todos">Todos</option>
            {SEGMENTOS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todos">Todos</option>
            {STATUS_OPTS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex gap-2 self-end">
          <button className="h-9 px-4 bg-[#003F7D] text-white rounded-lg text-sm font-medium hover:bg-[#002D5A] transition-colors">
            Filtrar
          </button>
          {hasFilter && (
            <button onClick={clearFilters}
              className="h-9 px-3 flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <X size={13} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── INDICADORES ── */}
      {activeTab === "indicadores" && (
        <div className="px-6 py-6 space-y-6">

          {/* Cards sumário */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: "Total de Solicitações", value: ind.total,      color: "#003F7D", bg: "#E8EFF7" },
              { label: "Pendentes",             value: ind.pendentes,  color: "#854D0E", bg: "#FEF9C3" },
              { label: "Aprovadas",             value: ind.aprovadas,  color: "#166534", bg: "#DCFCE7" },
              { label: "Concluídas",            value: ind.concluidas, color: "#065F46", bg: "#D1FAE5" },
              { label: "Recusadas/Inativas",    value: ind.recusadas,  color: "#991B1B", bg: "#FEE2E2" },
            ].map((c) => (
              <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p style={{ fontSize: "2rem", fontWeight: 700, color: c.color, lineHeight: 1 }} className="tabular-nums">
                  {c.value}
                </p>
                <p className="text-gray-500 mt-1.5" style={{ fontSize: "0.775rem" }}>{c.label}</p>
                <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full">
                  <div className="h-1.5 rounded-full" style={{
                    width: ind.total > 0 ? `${Math.round((c.value / ind.total) * 100)}%` : "0%",
                    background: c.color,
                  }} />
                </div>
                <p className="text-gray-400 mt-1" style={{ fontSize: "0.7rem" }}>
                  {ind.total > 0 ? Math.round((c.value / ind.total) * 100) : 0}% do total
                </p>
              </div>
            ))}
          </div>

          {/* Linha 1 — Eixo + Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Por Eixo */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="mb-1">Solicitações por Eixo Tecnológico</h3>
              <p className="text-gray-400 mb-4" style={{ fontSize: "0.775rem" }}>Quantos instrutores foram chamados por eixo</p>
              {ind.porEixo.length === 0 ? (
                <p className="text-center text-gray-300 py-10 text-sm">Sem dados para o período</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={ind.porEixo} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} angle={-15} textAnchor="end" height={55} />
                    <YAxis allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 10 }} />
                    <Tooltip contentStyle={TooltipStyle} formatter={(v: any) => [v, "Solicitações"]} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false} maxBarSize={52}>
                      {ind.porEixo.map((_, i) => <Cell key={i} fill={EIXO_COLORS[i % EIXO_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Status — Pie + lista */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="mb-1">Status das Solicitações</h3>
              <p className="text-gray-400 mb-4" style={{ fontSize: "0.775rem" }}>Distribuição por situação atual</p>
              {ind.porStatus.length === 0 ? (
                <p className="text-center text-gray-300 py-10 text-sm">Sem dados para o período</p>
              ) : (
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <ResponsiveContainer width={140} height={140}>
                      <PieChart>
                        <Pie data={ind.porStatus} cx="50%" cy="50%" innerRadius={38} outerRadius={62}
                          dataKey="value" isAnimationActive={false}>
                          {ind.porStatus.map((s, i) => {
                            const style = STATUS_STYLE[s.name] ?? { text: "#6B7280" };
                            return <Cell key={i} fill={style.text} />;
                          })}
                        </Pie>
                        <Tooltip contentStyle={TooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {ind.porStatus.map((s) => {
                      const style = STATUS_STYLE[s.name] ?? { bg: "#F3F4F6", text: "#374151" };
                      const pct = ind.total > 0 ? Math.round((s.value / ind.total) * 100) : 0;
                      return (
                        <div key={s.name}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: style.bg, color: style.text }}>
                              {s.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-800" style={{ fontSize: "0.8rem" }}>{s.value}</span>
                              <span className="text-gray-400" style={{ fontSize: "0.7rem" }}>{pct}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: style.text }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Linha 2 — Segmento + Pessoas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Por Segmento */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="mb-1">Qual segmento mais solicitou instrutores?</h3>
              <p className="text-gray-400 mb-4" style={{ fontSize: "0.775rem" }}>Ranking por número de solicitações</p>
              {ind.porSegmento.length === 0 ? (
                <p className="text-center text-gray-300 py-8 text-sm">Sem dados</p>
              ) : (
                <div className="space-y-3">
                  {ind.porSegmento.map((s, i) => {
                    const pct = ind.total > 0 ? Math.round((s.value / ind.total) * 100) : 0;
                    const isTop = i === 0;
                    return (
                      <div key={s.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-gray-400 font-mono flex-shrink-0" style={{ fontSize: "0.7rem", width: "16px" }}>
                              {i + 1}
                            </span>
                            {isTop && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0"
                                style={{ background: "#FEF9C3", color: "#854D0E" }}>Top</span>
                            )}
                            <span className="text-gray-700 truncate" style={{ fontSize: "0.8rem" }}>{s.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <span className="font-bold text-gray-800" style={{ fontSize: "0.8rem" }}>{s.value}</span>
                            <span className="text-gray-400" style={{ fontSize: "0.75rem" }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: isTop ? "#F57C00" : "#003F7D" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pessoas mais acionadas */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="mb-1">Pessoas Mais Acionadas</h3>
              <p className="text-gray-400 mb-4" style={{ fontSize: "0.775rem" }}>Quantas vezes cada pessoa foi chamada</p>
              {ind.topPessoas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-300">
                  <User size={32} />
                  <p className="text-sm">Nenhuma pessoa indicada no período</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ind.topPessoas.map((p, i) => {
                    const maxVal = ind.topPessoas[0]?.value || 1;
                    const pct = Math.round((p.value / maxVal) * 100);
                    const isTop = i === 0;
                    return (
                      <div key={p.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: isTop ? "#F57C00" : "#E8EFF7",
                                color: isTop ? "#fff" : "#003F7D",
                              }}
                            >
                              {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                            </div>
                            <span className="text-gray-800 truncate" style={{ fontSize: "0.8rem", fontWeight: isTop ? 600 : 400 }}>
                              {p.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                            <span className="font-bold" style={{ fontSize: "0.8rem", color: isTop ? "#F57C00" : "#003F7D" }}>
                              {p.value}×
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%`, background: isTop ? "#F57C00" : "#003F7D" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tabela ── */}
      {activeTab === "indicadores" ? null : <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#003F7D] text-white">
            <tr>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold w-40">Processo SEI</th>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold min-w-40">Eixo Tecnológico</th>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold min-w-36">Segmento</th>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold min-w-40">Nome da Pessoa</th>
              <th className="text-center px-4 py-3 text-xs uppercase font-bold w-24">Matrícula</th>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold min-w-52">Motivo da Solicitação</th>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold min-w-36">Observação</th>
              <th className="text-center px-4 py-3 text-xs uppercase font-bold w-28">Status</th>
              <th className="text-center px-4 py-3 text-xs uppercase font-bold w-28">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-gray-400 text-sm">
                  Nenhum registro encontrado para os filtros aplicados.
                </td>
              </tr>
            ) : filtered.map((h, i) => (
              <tr
                key={h.id}
                className={`border-b border-gray-100 transition-colors ${
                  h.status === "Inativa" ? "opacity-50" :
                  i % 2 === 0 ? "bg-white hover:bg-[#E8EFF7]/40" : "bg-gray-50/50 hover:bg-[#E8EFF7]/40"
                }`}
              >
                {/* Processo SEI com link */}
                <td className="px-4 py-3">
                  {h.processoSEI ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-gray-700" style={{ fontSize: "0.75rem" }}>{h.processoSEI}</span>
                      <a
                        href={seiLink(h.processoSEI)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir no SEI"
                        className="text-[#003F7D] hover:text-[#F57C00] flex-shrink-0 transition-colors"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={{ background: "#E8EFF7", color: "#003F7D" }}>
                    {h.eixo}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700" style={{ fontSize: "0.8rem" }}>{h.segmento}</td>
                <td className="px-4 py-3">
                  {h.nomePessoa ? (
                    <span className="font-medium text-gray-900" style={{ fontSize: "0.8rem" }}>{h.nomePessoa}</span>
                  ) : (
                    <span className="text-gray-300 italic" style={{ fontSize: "0.8rem" }}>A indicar</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center font-mono text-gray-600" style={{ fontSize: "0.8rem" }}>
                  {h.matricula || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-700" style={{ fontSize: "0.8rem" }}>
                  <span className="line-clamp-2">{h.motivo || <span className="text-gray-300">—</span>}</span>
                </td>
                <td className="px-4 py-3 text-gray-500" style={{ fontSize: "0.8rem" }}>
                  {h.observacao ? (
                    <div className="flex items-start gap-1.5">
                      <FileText size={12} className="text-[#F57C00] flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{h.observacao}</span>
                    </div>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={h.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setViewItem(h)} title="Visualizar"
                      style={{ display: "inline-flex", padding: "5px", borderRadius: "6px", background: "transparent", border: "none", cursor: "pointer", color: "#003F7D" }}>
                      <Eye size={15} />
                    </button>
                    <button onClick={() => openEdit(h)} title="Editar"
                      style={{ display: "inline-flex", padding: "5px", borderRadius: "6px", background: "transparent", border: "none", cursor: "pointer", color: "#2563eb" }}>
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(h)}
                      title={h.status === "Inativa" ? "Já inativa" : "Inativar"}
                      disabled={h.status === "Inativa"}
                      style={{ display: "inline-flex", padding: "5px", borderRadius: "6px", background: "transparent", border: "none", cursor: h.status === "Inativa" ? "not-allowed" : "pointer", color: h.status === "Inativa" ? "#d1d5db" : "#ef4444" }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}

      {/* ── Modal Visualizar ── */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setViewItem(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#003F7D] px-6 py-4 flex items-start justify-between">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">{viewItem.eixo} · {viewItem.segmento} · {viewItem.ano}</p>
                <h3 className="text-white" style={{ fontSize: "1rem" }}>
                  {viewItem.nomePessoa || "Pessoa a indicar"}
                </h3>
              </div>
              <button onClick={() => setViewItem(null)} className="text-white/70 hover:text-white mt-0.5"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-3">
              {([
                ["Status", <StatusBadge status={viewItem.status} />],
                ["Processo SEI", viewItem.processoSEI ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono" style={{ fontSize: "0.8rem" }}>{viewItem.processoSEI}</span>
                    <a href={seiLink(viewItem.processoSEI)!} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[#003F7D] hover:text-[#F57C00] underline font-medium transition-colors">
                      <ExternalLink size={11} /> Abrir no SEI
                    </a>
                  </div>
                ) : "—"],
                ["Eixo Tecnológico", viewItem.eixo],
                ["Segmento", viewItem.segmento],
                ["Matrícula", viewItem.matricula || "—"],
                ["Motivo", viewItem.motivo || "—"],
                ["Observação", viewItem.observacao || "—"],
              ] as [string, React.ReactNode][]).map(([label, value]) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-gray-400 w-36 flex-shrink-0" style={{ fontSize: "0.8rem" }}>{label}</span>
                  <span className="text-gray-800 flex-1" style={{ fontSize: "0.8rem" }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex justify-between">
              <button onClick={() => setViewItem(null)} className="h-9 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Fechar</button>
              <button onClick={() => { openEdit(viewItem); setViewItem(null); }}
                className="h-9 px-4 rounded-lg text-sm text-white font-medium flex items-center gap-2" style={{ background: "#003F7D" }}>
                <Pencil size={14} /> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Cadastrar / Editar ── */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#003F7D] px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-white" style={{ fontSize: "1rem", fontWeight: 600 }}>
                {modal.editId ? "Editar Solicitação" : "Nova Solicitação de Instrutor"}
              </h2>
              <button onClick={closeModal} className="text-white/70 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Ano</Label>
                  <select value={modal.item.ano} onChange={(e) => setField("ano", e.target.value)} className={inputCls}>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
                <div>
                  <Label className="mb-1.5 block">Status</Label>
                  <select value={modal.item.status} onChange={(e) => setField("status", e.target.value)} className={inputCls}>
                    {STATUS_OPTS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Eixo Tecnológico <span className="text-red-500">*</span></Label>
                <select value={modal.item.eixo} onChange={(e) => setField("eixo", e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  {EIXOS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block">Segmento <span className="text-red-500">*</span></Label>
                <select value={modal.item.segmento} onChange={(e) => setField("segmento", e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  {SEGMENTOS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block">Processo SEI</Label>
                <input
                  value={modal.item.processoSEI}
                  onChange={(e) => setField("processoSEI", e.target.value)}
                  placeholder="Ex: 2026.000000000-00"
                  className={inputCls}
                />
                {modal.item.processoSEI && (
                  <a
                    href={seiLink(modal.item.processoSEI)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 mt-1.5 text-xs text-[#003F7D] hover:text-[#F57C00] underline font-medium transition-colors w-fit"
                  >
                    <ExternalLink size={11} /> Consultar no SEI
                  </a>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Nome da Pessoa Chamada</Label>
                  <input
                    value={modal.item.nomePessoa}
                    onChange={(e) => setField("nomePessoa", e.target.value)}
                    placeholder="Nome completo"
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">Matrícula</Label>
                  <input
                    value={modal.item.matricula}
                    onChange={(e) => setField("matricula", e.target.value)}
                    placeholder="Ex: 1234567"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Motivo da Solicitação</Label>
                <textarea
                  value={modal.item.motivo}
                  onChange={(e) => setField("motivo", e.target.value)}
                  placeholder="Descreva o motivo da solicitação..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D] resize-none"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Observação</Label>
                <textarea
                  value={modal.item.observacao}
                  onChange={(e) => setField("observacao", e.target.value)}
                  placeholder="Informações adicionais..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D] resize-none"
                />
              </div>
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex justify-between flex-shrink-0">
              <button onClick={closeModal} className="h-10 px-5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!modal.item.eixo || !modal.item.segmento}
                className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm text-white font-medium disabled:opacity-40"
                style={{ background: "#F57C00" }}
              >
                <Save size={14} /> {modal.editId ? "Salvar Alterações" : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
