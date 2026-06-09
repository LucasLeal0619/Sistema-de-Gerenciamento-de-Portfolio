import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Layers,
  Building2,
  MapPin,
  Zap,
  CalendarDays,
  Clock,
  X,
  Upload,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DASHBOARD_EIXO_LABELS,
  getDashboardComparativoAnos,
  getDashboardCourses,
  getDashboardProcessCharts,
  getDashboardProcessMetrics,
  type DashboardCourse,
} from "../utils/dashboardData";
import { DeadlineAlertsPanel } from "../components/DeadlineAlertsPanel";

function normalizaTipo(raw: string): string {
  const v = (raw || "").trim().toUpperCase();
  if (!v) return "Outros";
  if (v.startsWith("APERFEI")) return "Aperfeiçoamento";
  if (v.startsWith("QUALIFICA")) return "Qualificação Profissional";
  if (v.includes("HABILITA")) return "Habilitação Técnica";
  if (v.startsWith("APRENDIZA")) return "Aprendizagem Profissional";
  if (v.startsWith("ESPECIALIZA")) return "Especialização Técnica";
  if (v.includes("SOCIO") || v.includes("SOCIOCUL")) return "Prog. Socioprofissional";
  if (v.includes("INSTRUMENTAL")) return "Prog. Instrumental";
  if (v.includes("EXTENS")) return "Ação Extensiva";
  return raw.trim() || "Outros";
}

const EIXO_COLORS = ["#003F7D", "#0056A8", "#1A6FC4", "#3385D6", "#4D9AE3", "#80B9F0", "#B3D4F7", "#F57C00"];

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
  warn = false,
  to,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
  warn?: boolean;
  to?: string;
}) {
  const content = (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow flex flex-col gap-3 ${
        to ? "hover:border-[#003F7D]/30 hover:shadow-md" : "hover:shadow-md"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
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
          <span className="text-[10px] uppercase tracking-wider text-gray-400">{sub}</span>
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
        <p className="mt-1 text-gray-500" style={{ fontSize: "0.775rem" }}>
          {label}
        </p>
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return content;
}

const TooltipStyle = { borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" };

export function Dashboard() {
  const { fonte, courses: allCourses } = getDashboardCourses();
  const processos = getDashboardProcessMetrics();
  const processCharts = getDashboardProcessCharts();
  const comparativoAnos = getDashboardComparativoAnos();
  const temIndicadoresProcessos =
    processos.visitas > 0 || processos.horas > 0 || processos.cursosNovos > 0;

  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todos");
  const [filterAno, setFilterAno] = useState("Todos");

  const unidades = useMemo(
    () => [
      "Todos",
      ...Array.from(new Set(allCourses.map((c) => (c.unidade || "").trim()).filter(Boolean))).sort(),
    ],
    [allCourses],
  );

  const anos = useMemo(
    () => [
      "Todos",
      ...Array.from(new Set(allCourses.map((c) => (c.ano || "").trim()).filter(Boolean))).sort(
        (a, b) => b.localeCompare(a),
      ),
    ],
    [allCourses],
  );

  const eixoOpts = useMemo(() => {
    const dinamicos = Array.from(new Set(allCourses.map((c) => c._eixo).filter(Boolean))).sort();
    return ["Todos", ...(dinamicos.length ? dinamicos : [...DASHBOARD_EIXO_LABELS])];
  }, [allCourses]);

  const hasFilter =
    filterEixo !== "Todos" ||
    filterStatus !== "Todos" ||
    filterUnidade !== "Todos" ||
    filterAno !== "Todos";

  const filtered = useMemo(() => {
    return allCourses.filter((curso) => {
      if (filterEixo !== "Todos" && curso._eixo !== filterEixo) return false;
      if (filterStatus !== "Todos" && curso.status !== filterStatus) return false;
      if (filterUnidade !== "Todos" && (curso.unidade || "").trim() !== filterUnidade) return false;
      if (filterAno !== "Todos" && (curso.ano || "").trim() !== filterAno) return false;
      return true;
    });
  }, [allCourses, filterEixo, filterStatus, filterUnidade, filterAno]);

  const totalCursos = filtered.length;
  const ativos = filtered.filter((c) => c.status === "ATIVO").length;
  const inativos = filtered.filter((c) => c.status === "INATIVO").length;

  const eixosNoFiltro = useMemo(() => {
    const labels = Array.from(new Set(filtered.map((c) => c._eixo).filter(Boolean))).sort();
    return labels.length ? labels : [...DASHBOARD_EIXO_LABELS];
  }, [filtered]);

  const totalEixos = filterEixo === "Todos" ? eixosNoFiltro.length : 1;
  const totalUnidades =
    filterUnidade === "Todos"
      ? new Set(filtered.map((c) => (c.unidade || "").trim()).filter(Boolean)).size
      : 1;

  const baseParaGraficos =
    filterStatus === "INATIVO"
      ? filtered
      : filtered.filter((c) => c.status === "ATIVO");

  const porEixo = eixosNoFiltro
    .map((label, i) => ({
      name: label.replace("Tecnologia e Econ. Criativa", "Tec. e Econ."),
      cursos: baseParaGraficos.filter((c) => c._eixo === label).length,
      fill: EIXO_COLORS[i % EIXO_COLORS.length],
    }))
    .filter((e) => e.cursos > 0);

  const tiposMap: Record<string, number> = {};
  baseParaGraficos.forEach((curso) => {
    const tipo = normalizaTipo(curso.tipo || "");
    tiposMap[tipo] = (tiposMap[tipo] || 0) + 1;
  });

  const porTipo = Object.entries(tiposMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const statusDist = [
    { name: "Ativos", value: ativos, fill: "#003F7D" },
    { name: "Inativos", value: inativos, fill: "#fca5a5" },
  ].filter((s) => s.value > 0);

  const chRanges = [
    { name: "≤100h", min: 0, max: 100, count: 0 },
    { name: "101–300h", min: 101, max: 300, count: 0 },
    { name: "301–800h", min: 301, max: 800, count: 0 },
    { name: ">800h", min: 801, max: 9999, count: 0 },
  ];

  baseParaGraficos.forEach((curso) => {
    const ch = parseInt(String(curso.ch).replace(/\D/g, ""), 10) || 0;
    chRanges.forEach((range) => {
      if (ch >= range.min && ch <= range.max) range.count++;
    });
  });

  const selectCls =
    "h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]";

  return (
    <div className="min-h-screen w-full overflow-auto bg-[#F5F7FA]">
      <div className="border-b border-gray-200 bg-white px-6 py-5 pt-16 lg:pt-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1>Dashboard</h1>
            <p className="mt-0.5 text-gray-500" style={{ fontSize: "0.8rem" }}>
              Indicadores do portfólio de cursos — SENAC DF · CPED
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={filterAno} onChange={(e) => setFilterAno(e.target.value)} className={selectCls}>
              {anos.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select
              value={filterUnidade}
              onChange={(e) => setFilterUnidade(e.target.value)}
              className={selectCls}
            >
              {unidades.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select value={filterEixo} onChange={(e) => setFilterEixo(e.target.value)} className={selectCls}>
              {eixoOpts.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={selectCls}
            >
              {["Todos", "ATIVO", "INATIVO"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            {hasFilter && (
              <button
                onClick={() => {
                  setFilterEixo("Todos");
                  setFilterStatus("Todos");
                  setFilterUnidade("Todos");
                  setFilterAno("Todos");
                }}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:bg-gray-50"
              >
                <X size={13} /> Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        {fonte === "vazio" ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Info size={20} className="mt-0.5 flex-shrink-0 text-gray-500" />
              <div>
                <strong>Portfólio sem dados importados</strong>
                <p className="mt-1 text-sm">
                  Os dados da planilha principal foram limpos. Os indicadores de cursos estão zerados.
                  {temIndicadoresProcessos
                    ? " Visitas, horas e outros cadastros manuais ainda podem aparecer abaixo."
                    : " Importe novamente em Início para repovoar o dashboard."}
                </p>
              </div>
            </div>
            <Link
              to="/app/inicio"
              className="inline-flex items-center gap-2 rounded-xl bg-[#003F7D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00355C]"
              style={{ textDecoration: "none" }}
            >
              <Upload size={16} />
              Importar planilha
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
              <div>
                <strong>Portfólio importado ativo</strong>
                <p className="mt-1 text-sm">
                  {allCourses.length} cursos carregados do navegador
                  {processos.totalCursosEixo > 0
                    ? ` · ${processos.totalCursosEixo} registros em Cursos por Eixo`
                    : ""}
                  {processos.cursosNovos > 0 ? ` · ${processos.cursosNovos} cursos novos` : ""}.
                  Visitas ({processos.visitas}), horas ({processos.horas}), ações extensivas (
                  {processos.acoes}) e eventos ({processos.eventos}) refletem importações e cadastros
                  desta sessão.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#003F7D]">Alertas de prazo</h2>
              <p className="text-xs text-gray-500">Visitas e metas com entrega nos próximos 15 dias ou vencidas</p>
            </div>
            <Clock size={18} className="text-[#003F7D]/40" />
          </div>
          <DeadlineAlertsPanel />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total de Cursos" value={totalCursos} icon={BookOpen} sub="portfólio" />
          <StatCard label="Cursos Ativos" value={ativos} icon={CheckCircle} accent />
          <StatCard label="Cursos Inativos" value={inativos} icon={XCircle} warn />
          <StatCard label="Eixos Tecnológicos" value={totalEixos} icon={Layers} sub="eixos" />
          <StatCard label="Unidades" value={totalUnidades || "—"} icon={Building2} sub="unidades" />
          <StatCard
            label="Visitas Técnicas"
            value={processos.visitas || "—"}
            icon={MapPin}
            sub="processos"
            to="/app/processos-visitas-tecnicas"
          />
          <StatCard
            label="Horas Pedagógicas"
            value={processos.horas || "—"}
            icon={Clock}
            sub="solicitações"
            to="/app/processos-horas-pedagogicas"
          />
          <StatCard
            label="Ações Extensivas"
            value={processos.acoes || "—"}
            icon={Zap}
            sub="cadastradas"
            to="/app/acoes-extensivas"
          />
          <StatCard
            label="Eventos"
            value={processos.eventos || "—"}
            icon={CalendarDays}
            sub="cadastrados"
            to="/app/eventos"
          />
          {processos.cursosNovos > 0 && (
            <StatCard
              label="Cursos Novos"
              value={processos.cursosNovos}
              icon={CheckCircle}
              accent
              sub="por eixo"
              to="/app/quantidade-cursos-por-eixo"
            />
          )}
        </div>

        {filterStatus === "Todos" && (
          <p className="-mt-2 text-xs text-gray-400">
            * Gráficos exibem apenas cursos <strong>ativos</strong>. Use o filtro de Status para incluir
            inativos.
          </p>
        )}

        {comparativoAnos && (
          <div>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#003F7D]">Comparativo 2025 × 2026</h2>
                <p className="text-xs text-gray-500">
                  Cursos por Eixo e catálogo importado · processos de horas por ano
                </p>
              </div>
              <Link
                to="/app/quantidade-cursos-por-eixo"
                className="text-sm font-semibold text-[#003F7D] hover:underline"
                style={{ textDecoration: "none" }}
              >
                Ver detalhes por eixo →
              </Link>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Cursos em 2025"
                value={comparativoAnos.totais["2025"]}
                icon={BookOpen}
                sub="por eixo"
              />
              <StatCard
                label="Cursos em 2026"
                value={comparativoAnos.totais["2026"]}
                icon={BookOpen}
                accent
                sub="por eixo"
              />
              <StatCard
                label="Horas — processos 2025"
                value={comparativoAnos.horasPorAno["2025"] || "—"}
                icon={Clock}
                sub="solicitações"
              />
              <StatCard
                label="Horas — processos 2026"
                value={comparativoAnos.horasPorAno["2026"] || "—"}
                icon={Clock}
                accent
                sub="solicitações"
              />
            </div>
            <div className="mb-4 rounded-xl border border-[#003F7D]/15 bg-[#E8EFF7] px-4 py-3">
              <div className="flex items-start gap-2 text-sm text-[#003F7D]">
                <Info size={16} className="mt-0.5 shrink-0" />
                <p>
                  Este bloco compara <strong>quantos registros</strong> existem em{" "}
                  <strong>Cursos por Eixo</strong> (2025) com a soma de Cursos por Eixo + catálogo
                  importado (2026). Não é meta nem projeção — apenas diferença entre os dados
                  salvos no sistema.
                </p>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8EFF7]">
                    <Layers size={18} className="text-[#003F7D]" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400">
                    Cursos por eixo
                  </span>
                </div>
                <p className="text-3xl font-bold tabular-nums text-[#003F7D]">
                  {comparativoAnos.totais["2025"]} → {comparativoAnos.totais["2026"]}
                </p>
                <p className="mt-1 text-sm text-gray-600">Total de registros: 2025 → 2026</p>
                <p className="mt-3 text-sm text-gray-500">
                  {comparativoAnos.totais["2026"] - comparativoAnos.totais["2025"] >= 0 ? (
                    <>
                      <strong className="text-emerald-700">
                        +{comparativoAnos.totais["2026"] - comparativoAnos.totais["2025"]} registros
                      </strong>{" "}
                      a mais em 2026
                      {comparativoAnos.totais["2025"] > 0 && (
                        <>
                          {" "}
                          (
                          {comparativoAnos.variacao >= 0 ? "+" : ""}
                          {comparativoAnos.variacao}% em relação a 2025)
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <strong className="text-amber-800">
                        {comparativoAnos.totais["2026"] - comparativoAnos.totais["2025"]} registros
                      </strong>{" "}
                      a menos em 2026
                      {comparativoAnos.totais["2025"] > 0 && (
                        <>
                          {" "}
                          (
                          {comparativoAnos.variacao}% em relação a 2025)
                        </>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
            {comparativoAnos.complemento2026 && (
              <p className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                Os cursos de 2026 no comparativo podem vir do catálogo importado. Processos de horas
                de 2026: <strong>{comparativoAnos.horasPorAno["2026"]}</strong>.
              </p>
            )}
            <ChartCard title="Cursos por Eixo — 2025 vs 2026">
              {comparativoAnos.porEixo.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={comparativoAnos.porEixo} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#6b7280", fontSize: 9 }}
                      angle={-18}
                      textAnchor="end"
                      height={55}
                    />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={TooltipStyle} />
                    <Bar dataKey="2025" fill="#003F7D" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="2026" fill="#F57C00" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Cursos por Eixo Tecnológico">
            {porEixo.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={porEixo} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    angle={-20}
                    textAnchor="end"
                    height={55}
                  />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <Tooltip contentStyle={TooltipStyle} formatter={(v: number) => [v, "Cursos"]} />
                  <Bar dataKey="cursos" radius={[6, 6, 0, 0]} isAnimationActive={false} maxBarSize={48}>
                    {porEixo.map((entry, i) => (
                      <Cell key={`eixo-${i}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Tipos de Curso">
            {porTipo.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={porTipo} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    width={160}
                  />
                  <Tooltip contentStyle={TooltipStyle} formatter={(v: number) => [v, "Cursos"]} />
                  <Bar
                    dataKey="value"
                    fill="#003F7D"
                    radius={[0, 6, 6, 0]}
                    isAnimationActive={false}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {temIndicadoresProcessos && (
          <div>
            <h2 className="mb-4 text-lg font-bold text-[#003F7D]">Indicadores de Processos</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {processCharts.visitasPorEixo.length > 0 && (
                <ChartCard title="Visitas Técnicas por Eixo">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={processCharts.visitasPorEixo} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#6b7280", fontSize: 9 }}
                        angle={-18}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} allowDecimals={false} />
                      <Tooltip contentStyle={TooltipStyle} />
                      <Bar dataKey="value" fill="#003F7D" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {processCharts.horasPorEixo.length > 0 && (
                <ChartCard title="Horas Pedagógicas por Eixo">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={processCharts.horasPorEixo} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#6b7280", fontSize: 9 }}
                        angle={-18}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} allowDecimals={false} />
                      <Tooltip contentStyle={TooltipStyle} />
                      <Bar dataKey="value" fill="#F57C00" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {processCharts.instrutoresAcionados.length > 0 && (
                <ChartCard title="Pessoas Mais Acionadas">
                  <div className="space-y-2.5">
                    {processCharts.instrutoresAcionados.map((item, index) => {
                      const max = processCharts.instrutoresAcionados[0]?.value || 1;
                      return (
                        <div key={item.name}>
                          <div className="mb-0.5 flex items-center justify-between">
                            <span
                              className="truncate pr-2 text-gray-700"
                              style={{ fontSize: "0.775rem" }}
                            >
                              {item.name}
                            </span>
                            <span
                              className="flex-shrink-0 font-semibold text-gray-900"
                              style={{ fontSize: "0.775rem" }}
                            >
                              {item.value}x
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-100">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${(item.value / max) * 100}%`,
                                background: EIXO_COLORS[index % EIXO_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ChartCard>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartCard title="Status dos Cursos">
            {statusDist.length === 0 ? (
              <EmptyChart />
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
                <div className="mt-2 space-y-2">
                  {statusDist.map((s) => (
                    <div key={s.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                          style={{ background: s.fill }}
                        />
                        <span className="text-gray-600" style={{ fontSize: "0.8rem" }}>
                          {s.name}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-800" style={{ fontSize: "0.8rem" }}>
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ChartCard>

          <ChartCard title="Faixas de Carga Horária">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chRanges} margin={{ left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                <Tooltip contentStyle={TooltipStyle} formatter={(v: number) => [v, "Cursos"]} />
                <Bar
                  dataKey="count"
                  fill="#F57C00"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={false}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Resumo por Eixo">
            <div className="space-y-2.5">
              {eixosNoFiltro.map((label, i) => {
                const cnt = baseParaGraficos.filter((c: DashboardCourse) => c._eixo === label).length;
                const max = Math.max(
                  ...eixosNoFiltro.map((eixo) =>
                    baseParaGraficos.filter((c) => c._eixo === eixo).length,
                  ),
                  1,
                );

                return (
                  <div key={label}>
                    <div className="mb-0.5 flex items-center justify-between">
                      <span className="truncate pr-2 text-gray-700" style={{ fontSize: "0.775rem" }}>
                        {label}
                      </span>
                      <span
                        className="flex-shrink-0 font-semibold text-gray-900"
                        style={{ fontSize: "0.775rem" }}
                      >
                        {cnt}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${(cnt / max) * 100}%`,
                          background: EIXO_COLORS[i % EIXO_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  return <p className="py-12 text-center text-sm text-gray-400">Sem dados para os filtros selecionados</p>;
}
