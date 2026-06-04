import { useState, useMemo } from "react";
import {
  Search, Plus, Eye, Pencil, CornerDownLeft, X, Save, AlertTriangle,
  CheckCircle, Clock, FileText, BarChart2, List,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { Label } from "../components/ui/label";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  getStoredVisitas, saveVisita, updateVisita,
  VisitaTecnicaRecord,
} from "../utils/store";

// ── Helpers ───────────────────────────────────────────────────────────────────
const EIXOS = [
  "Gastronomia", "Ambiente e Saúde", "Gestão e Moda",
  "Tecnologia e Economia Criativa", "Beleza e Cuidado Pessoal", "60+", "Ensino Médio",
];
const UNIDADES = [
  "Jessé Freire", "Jo Rufino e Carlos Aguiar", "Joaquim Loiola",
  "Miguel Setembrino — Gastronomia", "Miguel Setembrino — Saúde",
  "Sobradinho", "Talal Abu-Allan", "Taguatinga", "Ceilândia", "Gama", "Santa Maria",
];
const STATUS_OPTS = ["Solicitada", "Em análise", "Aprovada", "Realizada", "Devolvida", "Recusada"];
const ANO_OPTS = ["Todos", "2025", "2026"];

function addBusinessDays(dateStr: string, days: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function isPrazoVencido(prazo: string, status: string): boolean {
  if (!prazo || ["Realizada", "Devolvida", "Recusada"].includes(status)) return false;
  return new Date(prazo) < new Date();
}

function diasRestantes(prazo: string): number {
  if (!prazo) return 0;
  return Math.ceil((new Date(prazo).getTime() - Date.now()) / 86400000);
}

type ModalItem = Omit<VisitaTecnicaRecord, "id" | "cep">;

const EMPTY: ModalItem = {
  ano: "2026", unidade: "", eixo: "", processoSEI: "",
  dataSolicitacao: new Date().toISOString().slice(0, 10),
  dataVisitaPrevista: "", prazoLimite: "",
  status: "Solicitada", responsavel: "", relatorio: "", observacao: "",
};

// ── Status style map (usado apenas nos gráficos de indicadores) ───────────────
const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  "Solicitada":  { bg: "#EFF6FF", text: "#1D4ED8" },
  "Em análise":  { bg: "#FEF9C3", text: "#854D0E" },
  "Aprovada":    { bg: "#DCFCE7", text: "#166534" },
  "Realizada":   { bg: "#D1FAE5", text: "#065F46" },
  "Devolvida":   { bg: "#FEE2E2", text: "#991B1B" },
  "Recusada":    { bg: "#FCE7F3", text: "#9D174D" },
};

// ── Componente principal ──────────────────────────────────────────────────────
export function ProcessosVisitasTecnicas() {
  const [all, setAll] = useState<VisitaTecnicaRecord[]>(getStoredVisitas);
  const [activeTab, setActiveTab]       = useState<"registros" | "indicadores">("registros");
  const [search, setSearch]             = useState("");
  const [filterAno, setFilterAno]       = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todos");
  const [filterEixo, setFilterEixo]     = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterPrazo, setFilterPrazo]   = useState("Todos");
  const [toast, setToast]               = useState("");
  const [viewItem, setViewItem]         = useState<VisitaTecnicaRecord | null>(null);
  const [modal, setModal]               = useState<{ open: boolean; item: ModalItem; editId: string | null }>({
    open: false, item: EMPTY, editId: null,
  });

  const hasFilter = search || filterAno !== "Todos" || filterUnidade !== "Todos" ||
    filterEixo !== "Todos" || filterStatus !== "Todos" || filterPrazo !== "Todos";

  const clearFilters = () => {
    setSearch(""); setFilterAno("Todos"); setFilterUnidade("Todos");
    setFilterEixo("Todos"); setFilterStatus("Todos"); setFilterPrazo("Todos");
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return all.filter((v) => {
      if (filterAno !== "Todos" && v.ano !== filterAno) return false;
      if (filterUnidade !== "Todos" && v.unidade !== filterUnidade) return false;
      if (filterEixo !== "Todos" && v.eixo !== filterEixo) return false;
      if (filterStatus !== "Todos" && v.status !== filterStatus) return false;
      if (filterPrazo === "Vencido" && !isPrazoVencido(v.prazoLimite, v.status)) return false;
      if (filterPrazo === "Próximo" && (isPrazoVencido(v.prazoLimite, v.status) || diasRestantes(v.prazoLimite) > 5)) return false;
      if (filterPrazo === "OK" && (isPrazoVencido(v.prazoLimite, v.status) || diasRestantes(v.prazoLimite) <= 5)) return false;
      if (q && ![v.unidade, v.eixo, v.processoSEI, v.responsavel].some((f) => f?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [all, search, filterAno, filterUnidade, filterEixo, filterStatus, filterPrazo]);

  const refresh = () => setAll(getStoredVisitas());

  const showToast = (msg: string) => {
    setToast(msg); setTimeout(() => setToast(""), 3500);
  };

  const openNew = () => setModal({ open: true, item: { ...EMPTY }, editId: null });
  const openEdit = (v: VisitaTecnicaRecord) => setModal({
    open: true, editId: v.id,
    item: {
      ano: v.ano, unidade: v.unidade, eixo: v.eixo, processoSEI: v.processoSEI,
      dataSolicitacao: v.dataSolicitacao, dataVisitaPrevista: v.dataVisitaPrevista,
      prazoLimite: v.prazoLimite, status: v.status,
      responsavel: v.responsavel, relatorio: v.relatorio, observacao: v.observacao,
    },
  });
  const closeModal = () => setModal({ open: false, item: EMPTY, editId: null });

  const setField = (field: keyof ModalItem, value: string) =>
    setModal((m) => {
      const updated = { ...m.item, [field]: value };
      if (field === "dataSolicitacao" && value) {
        updated.prazoLimite = addBusinessDays(value, 30);
      }
      return { ...m, item: updated };
    });

  const handleSave = () => {
    if (!modal.item.unidade.trim() || !modal.item.eixo.trim()) return;
    const rec = { ...modal.item };
    if (modal.editId) {
      updateVisita(modal.editId, rec);
      showToast("Visita atualizada com sucesso!");
    } else {
      saveVisita(rec);
      showToast("Visita cadastrada com sucesso!");
    }
    refresh(); closeModal();
  };

  const handleDevolver = (v: VisitaTecnicaRecord) => {
    updateVisita(v.id, { status: "Devolvida" });
    refresh(); showToast("Visita marcada como Devolvida.");
  };

  const inputCls = "w-full h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]";
  const selectCls = "h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]";

  // Summary counts
  const vencidas = all.filter((v) => isPrazoVencido(v.prazoLimite, v.status)).length;

  // ── Dados para indicadores (usa os filtros de ano/unidade/eixo/status, ignora busca e prazo) ──
  const baseIndicadores = useMemo(() => {
    return all.filter((v) => {
      if (filterAno !== "Todos" && v.ano !== filterAno) return false;
      if (filterUnidade !== "Todos" && v.unidade !== filterUnidade) return false;
      if (filterEixo !== "Todos" && v.eixo !== filterEixo) return false;
      if (filterStatus !== "Todos" && v.status !== filterStatus) return false;
      return true;
    });
  }, [all, filterAno, filterUnidade, filterEixo, filterStatus]);

  const ind = useMemo(() => {
    const total       = baseIndicadores.length;
    const realizadas  = baseIndicadores.filter((v) => v.status === "Realizada").length;
    const pendentes   = baseIndicadores.filter((v) => ["Solicitada", "Em análise", "Aprovada"].includes(v.status)).length;
    const fora        = baseIndicadores.filter((v) => isPrazoVencido(v.prazoLimite, v.status)).length;
    const dentro      = baseIndicadores.filter((v) => !isPrazoVencido(v.prazoLimite, v.status) && !["Devolvida", "Recusada"].includes(v.status)).length;
    const devolvidas  = baseIndicadores.filter((v) => ["Devolvida", "Recusada"].includes(v.status)).length;

    const porEixoMap: Record<string, number> = {};
    baseIndicadores.forEach((v) => { porEixoMap[v.eixo] = (porEixoMap[v.eixo] || 0) + 1; });
    const porEixo = EIXOS.map((e) => ({ name: e.replace("Tecnologia e Economia Criativa", "Tec. e Econ."), value: porEixoMap[e] || 0 })).filter((e) => e.value > 0);

    const porUnidadeMap: Record<string, number> = {};
    baseIndicadores.forEach((v) => { porUnidadeMap[v.unidade] = (porUnidadeMap[v.unidade] || 0) + 1; });
    const porUnidade = Object.entries(porUnidadeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const porStatusMap: Record<string, number> = {};
    baseIndicadores.forEach((v) => { porStatusMap[v.status] = (porStatusMap[v.status] || 0) + 1; });
    const porStatus = STATUS_OPTS.map((s) => ({ name: s, value: porStatusMap[s] || 0 })).filter((s) => s.value > 0);

    return { total, realizadas, pendentes, fora, dentro, devolvidas, porEixo, porUnidade, porStatus };
  }, [baseIndicadores]);

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1>Visitas Técnicas</h1>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: "0.8rem" }}>
              {all.length} registro{all.length !== 1 ? "s" : ""}
              {vencidas > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-red-600 font-medium">
                  <AlertTriangle size={12} /> {vencidas} fora do prazo
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Tab switcher */}
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
              <Plus size={14} /> Nova Visita Técnica
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
              placeholder="Buscar por unidade, eixo, SEI ou responsável..."
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
            {ANO_OPTS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Unidade</label>
          <select value={filterUnidade} onChange={(e) => setFilterUnidade(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todos">Todas</option>
            {UNIDADES.map((o) => <option key={o}>{o}</option>)}
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
          <label className="text-xs font-medium text-gray-500">Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todos">Todos</option>
            {STATUS_OPTS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        {activeTab === "registros" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Prazo</label>
            <select value={filterPrazo} onChange={(e) => setFilterPrazo(e.target.value)}
              className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
              <option value="Todos">Todos</option>
              <option value="Vencido">Fora do prazo</option>
              <option value="Próximo">Prazo próximo (≤5 dias)</option>
              <option value="OK">Dentro do prazo</option>
            </select>
          </div>
        )}
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

          {/* Cards de métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total no período",   value: ind.total,      color: "#003F7D", bg: "#E8EFF7" },
              { label: "Realizadas",         value: ind.realizadas, color: "#065F46", bg: "#D1FAE5" },
              { label: "Pendentes",          value: ind.pendentes,  color: "#854D0E", bg: "#FEF9C3" },
              { label: "Fora do prazo",      value: ind.fora,       color: "#991B1B", bg: "#FEE2E2" },
              { label: "Dentro do prazo",    value: ind.dentro,     color: "#1D4ED8", bg: "#DBEAFE" },
              { label: "Devolvidas/Recusadas", value: ind.devolvidas, color: "#6B21A8", bg: "#F3E8FF" },
            ].map((c) => (
              <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p
                  className="tabular-nums"
                  style={{ fontSize: "2rem", fontWeight: 700, color: c.color, lineHeight: 1 }}
                >
                  {c.value}
                </p>
                <p className="text-gray-500 mt-1.5" style={{ fontSize: "0.775rem" }}>{c.label}</p>
                <div className="mt-3 h-1.5 w-full rounded-full" style={{ background: "#f3f4f6" }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: ind.total > 0 ? `${Math.round((c.value / ind.total) * 100)}%` : "0%",
                      background: c.color,
                    }}
                  />
                </div>
                <p className="text-gray-400 mt-1" style={{ fontSize: "0.7rem" }}>
                  {ind.total > 0 ? Math.round((c.value / ind.total) * 100) : 0}% do total
                </p>
              </div>
            ))}
          </div>

          {/* Gráficos — linha 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Visitas por Eixo */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="mb-1">Visitas por Eixo Tecnológico</h3>
              <p className="text-gray-400 mb-4" style={{ fontSize: "0.775rem" }}>
                Quantas visitas cada eixo realizou no período
              </p>
              {ind.porEixo.length === 0 ? (
                <p className="text-center text-gray-300 py-10 text-sm">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={ind.porEixo} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} angle={-15} textAnchor="end" height={55} />
                    <YAxis allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                      formatter={(v: any) => [v, "Visitas"]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false} maxBarSize={52}>
                      {ind.porEixo.map((_, i) => (
                        <Cell key={i} fill={["#003F7D","#1A5FA8","#3375C8","#4D8CE0","#66A3F5","#80B9FF","#99CCFF"][i % 7]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Visitas por Status */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="mb-1">Distribuição por Status</h3>
              <p className="text-gray-400 mb-4" style={{ fontSize: "0.775rem" }}>
                Situação atual de cada solicitação
              </p>
              {ind.porStatus.length === 0 ? (
                <p className="text-center text-gray-300 py-10 text-sm">Sem dados</p>
              ) : (
                <div className="space-y-3 pt-1">
                  {ind.porStatus.map((s) => {
                    const style = STATUS_STYLE[s.name] ?? { bg: "#F3F4F6", text: "#374151" };
                    const pct = ind.total > 0 ? Math.round((s.value / ind.total) * 100) : 0;
                    return (
                      <div key={s.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: style.bg, color: style.text }}
                            >
                              {s.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800" style={{ fontSize: "0.8rem" }}>{s.value}</span>
                            <span className="text-gray-400" style={{ fontSize: "0.75rem" }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${pct}%`, background: style.text }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Gráfico — Visitas por Unidade */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="mb-1">Visitas por Unidade Solicitante</h3>
            <p className="text-gray-400 mb-4" style={{ fontSize: "0.775rem" }}>
              Qual unidade solicitou mais visitas técnicas no período
            </p>
            {ind.porUnidade.length === 0 ? (
              <p className="text-center text-gray-300 py-8 text-sm">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {ind.porUnidade.map((u, i) => {
                  const pct = ind.total > 0 ? Math.round((u.value / ind.total) * 100) : 0;
                  const isTop = i === 0;
                  return (
                    <div key={u.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          {isTop && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0"
                              style={{ background: "#FEF9C3", color: "#854D0E" }}>
                              Top
                            </span>
                          )}
                          <span className="text-gray-700 truncate" style={{ fontSize: "0.8rem" }}>{u.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <span className="font-bold text-gray-800" style={{ fontSize: "0.8rem" }}>{u.value}</span>
                          <span className="text-gray-400" style={{ fontSize: "0.75rem" }}>{pct}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${pct}%`, background: isTop ? "#F57C00" : "#003F7D" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prazo — resumo visual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#D1FAE5] border border-green-200 rounded-xl p-5">
              <p className="text-green-700 text-xs font-semibold uppercase tracking-wider mb-2">Dentro do prazo</p>
              <p className="text-green-800" style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}>{ind.dentro}</p>
              <p className="text-green-600 mt-2" style={{ fontSize: "0.775rem" }}>
                {ind.total > 0 ? Math.round((ind.dentro / ind.total) * 100) : 0}% das visitas estão no prazo
              </p>
            </div>
            <div className="bg-[#FEF9C3] border border-yellow-200 rounded-xl p-5">
              <p className="text-yellow-700 text-xs font-semibold uppercase tracking-wider mb-2">Pendentes de conclusão</p>
              <p className="text-yellow-800" style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}>{ind.pendentes}</p>
              <p className="text-yellow-600 mt-2" style={{ fontSize: "0.775rem" }}>
                Solicitadas, em análise ou aprovadas
              </p>
            </div>
            <div className="bg-[#FEE2E2] border border-red-200 rounded-xl p-5">
              <p className="text-red-700 text-xs font-semibold uppercase tracking-wider mb-2">Fora do prazo</p>
              <p className="text-red-800" style={{ fontSize: "2.5rem", fontWeight: 800, lineHeight: 1 }}>{ind.fora}</p>
              <p className="text-red-600 mt-2" style={{ fontSize: "0.775rem" }}>
                Ultrapassaram os 30 dias úteis
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabela ── */}
      {activeTab === "indicadores" ? null : <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#003F7D] text-white">
            <tr>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold min-w-40">Unidade</th>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold min-w-36">Eixo</th>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold w-40">Processo SEI</th>
              <th className="text-center px-4 py-3 text-xs uppercase font-bold w-28">Solicitação</th>
              <th className="text-center px-4 py-3 text-xs uppercase font-bold w-28">Visita Prevista</th>
              <th className="text-center px-4 py-3 text-xs uppercase font-bold w-28">Prazo Limite</th>
              <th className="text-center px-4 py-3 text-xs uppercase font-bold w-28">Status</th>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold min-w-36">Relatório</th>
              <th className="text-left px-4 py-3 text-xs uppercase font-bold min-w-36">Observação</th>
              <th className="text-center px-4 py-3 text-xs uppercase font-bold w-28">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 text-center text-gray-400 text-sm">
                  Nenhum registro encontrado para os filtros aplicados.
                </td>
              </tr>
            ) : filtered.map((v, i) => {
              const vencido  = isPrazoVencido(v.prazoLimite, v.status);
              const diasRest = diasRestantes(v.prazoLimite);
              const proximoPrazo = !vencido && diasRest <= 5 && !["Realizada", "Devolvida", "Recusada"].includes(v.status);

              return (
                <tr
                  key={v.id}
                  className={`border-b border-gray-100 transition-colors ${
                    vencido ? "bg-red-50 hover:bg-red-100/60" :
                    proximoPrazo ? "bg-amber-50 hover:bg-amber-100/60" :
                    i % 2 === 0 ? "bg-white hover:bg-[#E8EFF7]/40" : "bg-gray-50/50 hover:bg-[#E8EFF7]/40"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {vencido && <AlertTriangle size={13} className="text-red-500 flex-shrink-0" title="Fora do prazo" />}
                      {proximoPrazo && !vencido && <Clock size={13} className="text-amber-500 flex-shrink-0" title="Prazo próximo" />}
                      <span className="font-medium text-gray-900" style={{ fontSize: "0.8rem" }}>{v.unidade}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={{ background: "#E8EFF7", color: "#003F7D" }}>
                      {v.eixo}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600" style={{ fontSize: "0.75rem" }}>
                    {v.processoSEI || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600" style={{ fontSize: "0.8rem" }}>
                    {fmtDate(v.dataSolicitacao)}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600" style={{ fontSize: "0.8rem" }}>
                    {fmtDate(v.dataVisitaPrevista)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: vencido ? 600 : 400,
                          color: vencido ? "#dc2626" : proximoPrazo ? "#d97706" : "#4b5563",
                        }}
                      >
                        {fmtDate(v.prazoLimite)}
                      </span>
                      {vencido && (
                        <span className="text-[10px] text-red-500 font-medium">Vencido</span>
                      )}
                      {proximoPrazo && (
                        <span className="text-[10px] text-amber-600 font-medium">{diasRest}d restantes</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600" style={{ fontSize: "0.8rem" }}>
                    {v.relatorio ? (
                      <div className="flex items-center gap-1.5">
                        <FileText size={13} className="text-[#F57C00] flex-shrink-0" />
                        <span className="truncate max-w-32">{v.relatorio}</span>
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600" style={{ fontSize: "0.8rem" }}>
                    <span className="truncate block max-w-36">{v.observacao || <span className="text-gray-300">—</span>}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setViewItem(v)} title="Visualizar"
                        style={{ display: "inline-flex", padding: "5px", borderRadius: "6px", background: "transparent", border: "none", cursor: "pointer", color: "#003F7D" }}>
                        <Eye size={15} />
                      </button>
                      <button onClick={() => openEdit(v)} title="Editar"
                        style={{ display: "inline-flex", padding: "5px", borderRadius: "6px", background: "transparent", border: "none", cursor: "pointer", color: "#2563eb" }}>
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDevolver(v)}
                        title="Devolver / Recusar"
                        disabled={["Realizada", "Devolvida", "Recusada"].includes(v.status)}
                        style={{
                          display: "inline-flex", padding: "5px", borderRadius: "6px",
                          background: "transparent", border: "none",
                          cursor: ["Realizada", "Devolvida", "Recusada"].includes(v.status) ? "not-allowed" : "pointer",
                          color: ["Realizada", "Devolvida", "Recusada"].includes(v.status) ? "#d1d5db" : "#ef4444",
                        }}
                      >
                        <CornerDownLeft size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}

      {/* ── Modal Visualizar ── */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setViewItem(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#003F7D] px-6 py-4 flex items-start justify-between">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">{viewItem.eixo} · {viewItem.ano}</p>
                <h3 className="text-white" style={{ fontSize: "1rem" }}>{viewItem.unidade}</h3>
              </div>
              <button onClick={() => setViewItem(null)} className="text-white/70 hover:text-white mt-0.5"><X size={18} /></button>
            </div>
            {isPrazoVencido(viewItem.prazoLimite, viewItem.status) && (
              <div className="flex items-center gap-2 px-6 py-2.5 bg-red-50 border-b border-red-100">
                <AlertTriangle size={14} className="text-red-500" />
                <p className="text-red-600 text-sm font-medium">Prazo vencido — visita fora do prazo de 30 dias úteis</p>
              </div>
            )}
            <div className="p-6 space-y-3">
              {[
                ["Status", <StatusBadge status={viewItem.status} />],
                ["Processo SEI", viewItem.processoSEI || "—"],
                ["Data de Solicitação", fmtDate(viewItem.dataSolicitacao)],
                ["Data Prevista da Visita", fmtDate(viewItem.dataVisitaPrevista)],
                ["Prazo Limite (30 dias úteis)", fmtDate(viewItem.prazoLimite)],
                ["Responsável", viewItem.responsavel || "—"],
                ["Relatório", viewItem.relatorio || "—"],
                ["Observação", viewItem.observacao || "—"],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-start gap-3">
                  <span className="text-gray-400 w-44 flex-shrink-0" style={{ fontSize: "0.8rem" }}>{label}</span>
                  <span className="text-gray-800 flex-1" style={{ fontSize: "0.8rem" }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex justify-between">
              <button onClick={() => setViewItem(null)} className="h-9 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Fechar</button>
              <button onClick={() => { openEdit(viewItem); setViewItem(null); }}
                className="h-9 px-4 rounded-lg text-sm text-white font-medium flex items-center gap-2"
                style={{ background: "#003F7D" }}>
                <Pencil size={14} /> Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Cadastrar / Editar ── */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#003F7D] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white" style={{ fontSize: "1rem", fontWeight: 600 }}>
                {modal.editId ? "Editar Visita Técnica" : "Nova Visita Técnica"}
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
                <Label className="mb-1.5 block">Unidade Solicitante <span className="text-red-500">*</span></Label>
                <select value={modal.item.unidade} onChange={(e) => setField("unidade", e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  {UNIDADES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block">Eixo Tecnológico <span className="text-red-500">*</span></Label>
                <select value={modal.item.eixo} onChange={(e) => setField("eixo", e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  {EIXOS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label className="mb-1.5 block">Processo SEI</Label>
                <input value={modal.item.processoSEI} onChange={(e) => setField("processoSEI", e.target.value)}
                  placeholder="Ex: 2026.000000000-00" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Data de Solicitação</Label>
                  <input type="date" value={modal.item.dataSolicitacao} onChange={(e) => setField("dataSolicitacao", e.target.value)} className={inputCls} />
                </div>
                <div>
                  <Label className="mb-1.5 block">Data Prevista da Visita</Label>
                  <input type="date" value={modal.item.dataVisitaPrevista} onChange={(e) => setField("dataVisitaPrevista", e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Prazo Limite</Label>
                <input type="date" value={modal.item.prazoLimite} onChange={(e) => setField("prazoLimite", e.target.value)} className={inputCls} />
                {modal.item.dataSolicitacao && (
                  <p className="text-xs text-gray-400 mt-1">
                    Calculado automaticamente: 30 dias úteis a partir de {fmtDate(modal.item.dataSolicitacao)}
                  </p>
                )}
              </div>
              <div>
                <Label className="mb-1.5 block">Responsável</Label>
                <input value={modal.item.responsavel} onChange={(e) => setField("responsavel", e.target.value)}
                  placeholder="Nome do responsável" className={inputCls} />
              </div>
              <div>
                <Label className="mb-1.5 block">Relatório da Visita</Label>
                <input value={modal.item.relatorio} onChange={(e) => setField("relatorio", e.target.value)}
                  placeholder="Ex: relatorio_visita.xlsx" className={inputCls} />
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
            <div className="border-t border-gray-100 px-6 py-4 flex justify-between">
              <button onClick={closeModal} className="h-10 px-5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!modal.item.unidade || !modal.item.eixo}
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
