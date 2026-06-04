import { useState, useMemo } from "react";
import { BookOpen, CheckCircle, XCircle, Layers, Building2, MapPin, Zap, CalendarDays, X } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { gastronomiaCourses } from "../data/gastronomiaData";
import { saudeSegurancaCourses } from "../data/saudeSegurancaData";
import { gestaoModaCourses } from "../data/gestaoModaData";
import { tecnologiaEconomiaCourses } from "../data/tecnologiaEconomiaData";
import { belezaCuidadoCourses } from "../data/belezaCuidadoData";
import { sessentaMaisCourses } from "../data/sessentaMaisData";
import { ensinoMedioCourses } from "../data/ensinoMedioData";

// ── Dados ─────────────────────────────────────────────────────────────────────
const EIXOS = [
  { label: "Gastronomia",                    courses: gastronomiaCourses },
  { label: "Ambiente e Saúde",               courses: saudeSegurancaCourses },
  { label: "Gestão e Moda",                  courses: gestaoModaCourses },
  { label: "Tecnologia e Econ. Criativa",    courses: tecnologiaEconomiaCourses },
  { label: "Beleza e Cuidado Pessoal",       courses: belezaCuidadoCourses },
  { label: "60+",                            courses: sessentaMaisCourses },
  { label: "Ensino Médio",                   courses: ensinoMedioCourses },
];

const allRaw = EIXOS.flatMap((e) =>
  e.courses.map((c: any) => ({ ...c, _eixo: e.label }))
);

function normalizaTipo(raw: string): string {
  const v = (raw || "").trim().toUpperCase();
  if (!v) return "Outros";
  if (v.startsWith("APERFEI"))    return "Aperfeiçoamento";
  if (v.startsWith("QUALIFICA"))  return "Qualificação Profissional";
  if (v.includes("HABILITA"))     return "Habilitação Técnica";
  if (v.startsWith("APRENDIZA"))  return "Aprendizagem Profissional";
  if (v.startsWith("ESPECIALIZA")) return "Especialização Técnica";
  if (v.includes("SOCIO") || v.includes("SOCIOCUL")) return "Prog. Socioprofissional";
  if (v.includes("INSTRUMENTAL")) return "Prog. Instrumental";
  if (v.includes("EXTENS"))       return "Ação Extensiva";
  return raw.trim() || "Outros";
}

// Unidades únicas
const UNIDADES = ["Todos", ...Array.from(new Set(allRaw.map((c) => (c.unidade || "").trim()).filter(Boolean))).sort()];
const EIXO_OPTS = ["Todos", ...EIXOS.map((e) => e.label)];
const STATUS_OPTS = ["Todos", "ATIVO", "INATIVO"];
const ANO_OPTS = ["Todos", "2025", "2024", "2023"];

// Cores institucionais para gráficos
const EIXO_COLORS = ["#003F7D", "#0056A8", "#1A6FC4", "#3385D6", "#4D9AE3", "#80B9F0", "#B3D4F7"];

// ── Componentes auxiliares ────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, accent = false, warn = false,
}: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; accent?: boolean; warn?: boolean;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{
            background: accent ? "#F57C00" : warn ? "#fee2e2" : "#E8EFF7",
          }}
        >
          <Icon
            size={18}
            style={{ color: accent ? "#fff" : warn ? "#dc2626" : "#003F7D" }}
          />
        </div>
        {sub && (
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">{sub}</span>
        )}
      </div>
      <div>
        <p
          className="tabular-nums"
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: accent ? "#F57C00" : warn ? "#dc2626" : "#003F7D",
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        <p className="text-gray-500 mt-1" style={{ fontSize: "0.775rem" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

const TooltipStyle = { borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" };

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard() {
  const [filterEixo, setFilterEixo]     = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todos");
  const [filterAno, setFilterAno]       = useState("Todos");

  const hasFilter = filterEixo !== "Todos" || filterStatus !== "Todos" || filterUnidade !== "Todos" || filterAno !== "Todos";

  const filtered = useMemo(() => {
    return allRaw.filter((c) => {
      if (filterEixo !== "Todos" && c._eixo !== filterEixo) return false;
      if (filterStatus !== "Todos" && (c.status || "ATIVO").trim().toUpperCase() !== filterStatus) return false;
      if (filterUnidade !== "Todos" && (c.unidade || "").trim() !== filterUnidade) return false;
      return true;
    });
  }, [filterEixo, filterStatus, filterUnidade, filterAno]);

  // ── Métricas ────────────────────────────────────────────────────────────────
  const totalCursos  = filtered.length;
  const ativos       = filtered.filter((c) => (c.status || "ATIVO").trim().toUpperCase() === "ATIVO").length;
  const inativos     = filtered.filter((c) => (c.status || "").trim().toUpperCase() === "INATIVO").length;
  const totalEixos   = filterEixo === "Todos" ? EIXOS.length : 1;
  const totalUnidades = filterUnidade === "Todos"
    ? new Set(filtered.map((c) => (c.unidade || "").trim()).filter(Boolean)).size
    : 1;

  // ── Dados dos gráficos (excluindo inativos por padrão se filterStatus = Todos) ──
  const baseParaGraficos = filterStatus === "INATIVO"
    ? filtered
    : filtered.filter((c) => (c.status || "ATIVO").trim().toUpperCase() === "ATIVO");

  // Cursos por eixo
  const porEixo = EIXOS.map((e, i) => ({
    name: e.label.replace("Tecnologia e Econ. Criativa", "Tec. e Econ."),
    cursos: baseParaGraficos.filter((c) => c._eixo === e.label).length,
    fill: EIXO_COLORS[i],
  })).filter((e) => e.cursos > 0);

  // Tipos de curso
  const tiposMap: Record<string, number> = {};
  baseParaGraficos.forEach((c) => {
    const t = normalizaTipo(c.tipo);
    tiposMap[t] = (tiposMap[t] || 0) + 1;
  });
  const porTipo = Object.entries(tiposMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Distribuição status (para pie)
  const statusDist = [
    { name: "Ativos",   value: ativos,   fill: "#003F7D" },
    { name: "Inativos", value: inativos, fill: "#fca5a5" },
  ].filter((s) => s.value > 0);

  // CH ranges
  const chRanges = [
    { name: "≤100h",    min: 0,    max: 100,  count: 0 },
    { name: "101–300h", min: 101,  max: 300,  count: 0 },
    { name: "301–800h", min: 301,  max: 800,  count: 0 },
    { name: ">800h",    min: 801,  max: 9999, count: 0 },
  ];
  baseParaGraficos.forEach((c) => {
    const ch = parseInt(c.ch) || 0;
    chRanges.forEach((r) => { if (ch >= r.min && ch <= r.max) r.count++; });
  });

  const selectCls = "h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]";

  return (
    <div className="min-h-screen bg-white w-full overflow-auto">

      {/* ── Header ── */}
      <div className="border-b border-gray-200 px-6 py-5 pt-16 lg:pt-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1>Dashboard</h1>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: "0.8rem" }}>
              Indicadores do portfólio de cursos — SENAC DF · CPED
            </p>
          </div>
          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterAno} onChange={(e) => setFilterAno(e.target.value)} className={selectCls}>
              {ANO_OPTS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <select value={filterUnidade} onChange={(e) => setFilterUnidade(e.target.value)} className={selectCls}>
              {UNIDADES.map((o) => <option key={o}>{o}</option>)}
            </select>
            <select value={filterEixo} onChange={(e) => setFilterEixo(e.target.value)} className={selectCls}>
              {EIXO_OPTS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
              {STATUS_OPTS.map((o) => <option key={o}>{o}</option>)}
            </select>
            {hasFilter && (
              <button
                onClick={() => { setFilterEixo("Todos"); setFilterStatus("Todos"); setFilterUnidade("Todos"); setFilterAno("Todos"); }}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
              >
                <X size={13} /> Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">

        {/* ── 8 Cards de indicadores ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total de Cursos"         value={totalCursos}  icon={BookOpen}      sub="portfólio" />
          <StatCard label="Cursos Ativos"            value={ativos}       icon={CheckCircle}   accent />
          <StatCard label="Cursos Inativos"          value={inativos}     icon={XCircle}       warn />
          <StatCard label="Eixos Tecnológicos"       value={totalEixos}   icon={Layers}        sub="eixos" />
          <StatCard label="Unidades"                 value={totalUnidades || "—"} icon={Building2} sub="unidades" />
          <StatCard label="Visitas Técnicas"         value="—"            icon={MapPin}        sub="processos" />
          <StatCard label="Ações Extensivas"         value="—"            icon={Zap}           sub="em breve" />
          <StatCard label="Eventos"                  value="—"            icon={CalendarDays}  sub="em breve" />
        </div>

        {/* ── Nota sobre gráficos ── */}
        {filterStatus === "Todos" && (
          <p className="text-xs text-gray-400 -mt-2">
            * Gráficos exibem apenas cursos <strong>ativos</strong>. Use o filtro de Status para incluir inativos.
          </p>
        )}

        {/* ── Gráficos — linha 1 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Cursos por Eixo */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="mb-4">Cursos por Eixo Tecnológico</h3>
            {porEixo.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={porEixo} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} angle={-20} textAnchor="end" height={55} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <Tooltip contentStyle={TooltipStyle} formatter={(v: any) => [v, "Cursos"]} />
                  <Bar dataKey="cursos" radius={[6, 6, 0, 0]} isAnimationActive={false} maxBarSize={48}>
                    {porEixo.map((entry, i) => (
                      <Cell key={`eixo-${i}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tipos de Curso */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="mb-4">Tipos de Curso</h3>
            {porTipo.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={porTipo} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#6b7280", fontSize: 10 }} width={160} />
                  <Tooltip contentStyle={TooltipStyle} formatter={(v: any) => [v, "Cursos"]} />
                  <Bar dataKey="value" fill="#003F7D" radius={[0, 6, 6, 0]} isAnimationActive={false} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Gráficos — linha 2 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Status — Pie */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="mb-4">Status dos Cursos</h3>
            {statusDist.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Sem dados</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {statusDist.map((entry, i) => (
                        <Cell key={`st-${i}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {statusDist.map((s) => (
                    <div key={s.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.fill }} />
                        <span className="text-gray-600" style={{ fontSize: "0.8rem" }}>{s.name}</span>
                      </div>
                      <span className="font-semibold text-gray-800" style={{ fontSize: "0.8rem" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Carga Horária */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="mb-4">Faixas de Carga Horária</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chRanges} margin={{ left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                <Tooltip contentStyle={TooltipStyle} formatter={(v: any) => [v, "Cursos"]} />
                <Bar dataKey="count" fill="#F57C00" radius={[6, 6, 0, 0]} isAnimationActive={false} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Resumo por Eixo — lista */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="mb-4">Resumo por Eixo</h3>
            <div className="space-y-2.5">
              {EIXOS.map((e, i) => {
                const cnt = baseParaGraficos.filter((c) => c._eixo === e.label).length;
                const max = Math.max(...EIXOS.map((ex) => baseParaGraficos.filter((c) => c._eixo === ex.label).length), 1);
                return (
                  <div key={e.label}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-gray-700 truncate pr-2" style={{ fontSize: "0.775rem" }}>{e.label}</span>
                      <span className="font-semibold text-gray-900 flex-shrink-0" style={{ fontSize: "0.775rem" }}>{cnt}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${(cnt / max) * 100}%`, background: EIXO_COLORS[i] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
