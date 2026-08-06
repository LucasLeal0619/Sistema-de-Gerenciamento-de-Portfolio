import { useMemo, useState, type ElementType } from "react";
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
} from "lucide-react";
import {
  DASHBOARD_EIXO_LABELS,
  getDashboardCourses,
  getDashboardProcessMetrics,
} from "../utils/dashboardData";
import { getHoras, getVisitas } from "../utils/store";
import {
  buildHorasIndicators,
  buildVisitasIndicators,
  percent,
  type HorasIndicators,
  type IndicatorEntry,
  type VisitasIndicators,
} from "../utils/processIndicators";

/* ── palette & helpers ───────────────────────────────────────────── */

const CORES_EIXO = [
  "#003F7D",
  "#F57C00",
  "#0d9488",
  "#7c3aed",
  "#db2777",
  "#2563eb",
  "#ca8a04",
  "#64748b",
];

type BarItem = {
  label: string;
  value: number;
  color: string;
  share: number;
  bar: number;
};

type KpiCard = {
  title: string;
  value: number;
  subtitle: string;
  percent: number;
  color: string;
};

type IndicatorGroup = "gerais" | "visitas" | "horas";

const INDICATOR_GROUPS: Array<{ value: IndicatorGroup; label: string }> = [
  { value: "gerais", label: "Indicadores Gerais" },
  { value: "visitas", label: "Indicadores de Visitas T\u00e9cnicas" },
  { value: "horas", label: "Indicadores de Horas Pedag\u00f3gicas" },
];

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

function enriquecerBarras(
  items: Array<{ label: string; value: number; color?: string }>,
  { orange = false }: { orange?: boolean } = {},
): BarItem[] {
  const total = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const max = Math.max(...items.map((item) => Number(item.value) || 0), 1);

  return items.map((item, index) => {
    const value = Number(item.value) || 0;
    return {
      label: item.label,
      value,
      color: item.color ?? (orange ? "#F57C00" : CORES_EIXO[index % CORES_EIXO.length]),
      share: total ? Math.round((value / total) * 100) : 0,
      bar: Math.round((value / max) * 100),
    };
  });
}

function entriesToBars(entries: IndicatorEntry[], orange = false): BarItem[] {
  return enriquecerBarras(
    entries.map(({ label, value }) => ({ label, value })),
    { orange },
  );
}

function statusToBars(entries: IndicatorEntry[], total: number): BarItem[] {
  return entries.map((entry, index) => ({
    label: entry.label,
    value: entry.value,
    color:
      entry.label === "ATIVO"
        ? "#003F7D"
        : entry.label === "INATIVO"
          ? "#ef4444"
          : CORES_EIXO[index % CORES_EIXO.length],
    share: percent(entry.value, total),
    bar: percent(entry.value, total),
  }));
}

function buildVisitasKpiCards(data: VisitasIndicators): KpiCard[] {
  const { total } = data;
  return [
    { title: "Total no período", value: total, subtitle: "100% do total", percent: 100, color: "#003F7D" },
    {
      title: "Realizadas",
      value: data.realizadas,
      subtitle: `${percent(data.realizadas, total)}% do total`,
      percent: percent(data.realizadas, total),
      color: "#15803d",
    },
    {
      title: "Pendentes",
      value: data.pendentes,
      subtitle: `${percent(data.pendentes, total)}% do total`,
      percent: percent(data.pendentes, total),
      color: "#a16207",
    },
    {
      title: "Fora do prazo",
      value: data.foraPrazoCount,
      subtitle: `${percent(data.foraPrazoCount, total)}% do total`,
      percent: percent(data.foraPrazoCount, total),
      color: "#b91c1c",
    },
    {
      title: "Dentro do prazo",
      value: data.dentroPrazo,
      subtitle: `${percent(data.dentroPrazo, total)}% do total`,
      percent: percent(data.dentroPrazo, total),
      color: "#1d4ed8",
    },
    {
      title: "Devolvidas/Recusadas",
      value: data.devolvidasRecusadas,
      subtitle: `${percent(data.devolvidasRecusadas, total)}% do total`,
      percent: percent(data.devolvidasRecusadas, total),
      color: "#7e22ce",
    },
  ];
}

function buildHorasKpiCards(data: HorasIndicators): KpiCard[] {
  const { total } = data;
  return [
    { title: "Total no período", value: total, subtitle: "100% do total", percent: 100, color: "#003F7D" },
    {
      title: "Concluídas",
      value: data.concluidas,
      subtitle: `${percent(data.concluidas, total)}% do total`,
      percent: percent(data.concluidas, total),
      color: "#15803d",
    },
    {
      title: "Aprovadas",
      value: data.aprovadas,
      subtitle: `${percent(data.aprovadas, total)}% do total`,
      percent: percent(data.aprovadas, total),
      color: "#047857",
    },
    {
      title: "Em análise",
      value: data.emAnalise,
      subtitle: `${percent(data.emAnalise, total)}% do total`,
      percent: percent(data.emAnalise, total),
      color: "#a16207",
    },
    {
      title: "Solicitadas",
      value: data.solicitadas,
      subtitle: `${percent(data.solicitadas, total)}% do total`,
      percent: percent(data.solicitadas, total),
      color: "#1d4ed8",
    },
    {
      title: "Recusadas",
      value: data.recusadas,
      subtitle: `${percent(data.recusadas, total)}% do total`,
      percent: percent(data.recusadas, total),
      color: "#b91c1c",
    },
    {
      title: "Inativas",
      value: data.inativos,
      subtitle: `${percent(data.inativos, total)}% do total`,
      percent: percent(data.inativos, total),
      color: "#6b7280",
    },
  ];
}

/* ── sub-components ────────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = false,
  warn = false,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: ElementType;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <article
      className={`dashboard-metric-card${accent ? " is-accent" : ""}${warn ? " is-warn" : ""}`}
    >
      <div className="dashboard-metric-top">
        <div className="dashboard-metric-icon">
          <Icon size={18} />
        </div>
        {sub && <span className="dashboard-metric-sub">{sub}</span>}
      </div>
      <p className="dashboard-metric-value">{value}</p>
      <p className="dashboard-metric-title">{label}</p>
    </article>
  );
}

function DashboardBars({ items }: { items: BarItem[] }) {
  if (items.length === 0) {
    return <div className="dashboard-chart-empty">Sem dados para os filtros selecionados</div>;
  }

  return (
    <div className="dashboard-bars">
      {items.map((item) => (
        <div key={item.label} className="dashboard-bar-item">
          <div className="dashboard-bar-head">
            <span className="dashboard-bar-dot" style={{ background: item.color }} />
            <span className="dashboard-bar-label" title={item.label}>
              {item.label}
            </span>
            <span className="dashboard-bar-meta">
              <strong>{item.value}</strong>
              <small>{item.share}%</small>
            </span>
          </div>
          <div className="dashboard-bar-track">
            <div
              className="dashboard-bar-fill"
              style={{
                width: `${Math.max(item.bar, item.value ? 4 : 0)}%`,
                background: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardStatusGrid({ items }: { items: BarItem[] }) {
  if (items.length === 0) {
    return <div className="dashboard-chart-empty">Sem dados para os filtros selecionados</div>;
  }

  return (
    <div className="dashboard-status-grid">
      {items.map((item) => (
        <div key={item.label} className="dashboard-status-card">
          <span className="dashboard-status-dot" style={{ background: item.color }} />
          <div>
            <p className="dashboard-status-value">{item.value}</p>
            <p className="dashboard-status-label">{item.label}</p>
            <p className="dashboard-status-share">{item.share}% do total</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiGrid({ cards, variant }: { cards: KpiCard[]; variant: "visitas" | "horas" }) {
  return (
    <section className={`dashboard-kpi-grid ${variant}`}>
      {cards.map((card) => (
        <article key={card.title} className="dashboard-kpi-card">
          <p className="dashboard-kpi-value">{card.value}</p>
          <p className="dashboard-kpi-title">{card.title}</p>
          <p className="dashboard-kpi-subtitle">{card.subtitle}</p>
          <div className="dashboard-kpi-track">
            <div
              className="dashboard-kpi-fill"
              style={{ width: `${card.percent}%`, background: card.color }}
            />
          </div>
        </article>
      ))}
    </section>
  );
}

function BarsChartCard({
  title,
  subtitle,
  items,
  emptyMessage = "Nenhum dado para exibir.",
}: {
  title: string;
  subtitle: string;
  items: BarItem[];
  emptyMessage?: string;
}) {
  return (
    <section className="dashboard-chart-card">
      <h3>{title}</h3>
      <p className="dashboard-chart-subtitle">{subtitle}</p>
      {items.length === 0 ? (
        <div className="dashboard-chart-empty">{emptyMessage}</div>
      ) : (
        <DashboardBars items={items} />
      )}
    </section>
  );
}

function StatusChartCard({
  title,
  subtitle,
  items,
  emptyMessage = "Nenhum dado para exibir.",
}: {
  title: string;
  subtitle: string;
  items: BarItem[];
  emptyMessage?: string;
}) {
  return (
    <section className="dashboard-chart-card">
      <h3>{title}</h3>
      <p className="dashboard-chart-subtitle">{subtitle}</p>
      {items.length === 0 ? (
        <div className="dashboard-chart-empty">{emptyMessage}</div>
      ) : (
        <DashboardStatusGrid items={items} />
      )}
    </section>
  );
}

/* ── main page ───────────────────────────────────────────────────── */

export function Dashboard() {
  const { courses: allCourses } = getDashboardCourses();
  const processos = getDashboardProcessMetrics();
  const visitasIndicators = useMemo(() => buildVisitasIndicators(getVisitas()), []);
  const horasIndicators = useMemo(() => buildHorasIndicators(getHoras()), []);

  const [indicatorGroup, setIndicatorGroup] = useState<IndicatorGroup>("gerais");
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

  const metricCards = [
    { label: "Total de Cursos", value: totalCursos, sub: "portfólio", icon: BookOpen },
    { label: "Cursos Ativos", value: ativos, icon: CheckCircle, accent: true },
    { label: "Cursos Inativos", value: inativos, icon: XCircle, warn: true },
    { label: "Eixos Tecnológicos", value: totalEixos, sub: "eixos", icon: Layers },
    { label: "Unidades", value: totalUnidades, sub: "unidades", icon: Building2 },
    { label: "Visitas Técnicas", value: processos.visitas, sub: "processos", icon: MapPin },
    { label: "Horas Pedagógicas", value: processos.horas, sub: "solicitações", icon: Clock },
    { label: "Ações Extensivas", value: processos.acoes, sub: "cadastradas", icon: Zap },
    { label: "Eventos", value: processos.eventos, sub: "cadastrados", icon: CalendarDays },
  ];

  const chartEixos = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((curso) => {
      if (!curso._eixo) return;
      counts.set(curso._eixo, (counts.get(curso._eixo) || 0) + 1);
    });
    const items = Array.from(counts.entries())
      .map(([label, value], index) => ({
        label,
        value,
        color: CORES_EIXO[index % CORES_EIXO.length],
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
    return enriquecerBarras(items);
  }, [filtered]);

  const chartTipos = useMemo(() => {
    const tiposMap: Record<string, number> = {};
    filtered.forEach((curso) => {
      const tipo = normalizaTipo(curso.tipo || "");
      tiposMap[tipo] = (tiposMap[tipo] || 0) + 1;
    });
    const items = Object.entries(tiposMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    return enriquecerBarras(items, { orange: true });
  }, [filtered]);

  const chartStatus = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((curso) => {
      const status = curso.status || "Sem status";
      counts.set(status, (counts.get(status) || 0) + 1);
    });
    const items = Array.from(counts.entries())
      .map(([label, value], index) => ({
        label,
        value,
        color:
          label === "ATIVO"
            ? "#003F7D"
            : label === "INATIVO"
              ? "#ef4444"
              : CORES_EIXO[index % CORES_EIXO.length],
      }))
      .sort((a, b) => b.value - a.value);
    return enriquecerBarras(items);
  }, [filtered]);

  const chartCargaHoraria = useMemo(() => {
    const faixas = [
      { label: "Até 100h", min: 0, max: 100, value: 0 },
      { label: "101 a 300h", min: 101, max: 300, value: 0 },
      { label: "301 a 800h", min: 301, max: 800, value: 0 },
      { label: "Acima de 800h", min: 801, max: 99999, value: 0 },
    ];
    filtered.forEach((curso) => {
      const ch = parseInt(String(curso.ch).replace(/\D/g, ""), 10) || 0;
      faixas.forEach((faixa) => {
        if (ch >= faixa.min && ch <= faixa.max) faixa.value += 1;
      });
    });
    return enriquecerBarras(faixas, { orange: true });
  }, [filtered]);

  const resumoPorEixo = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((curso) => {
      if (!curso._eixo) return;
      counts.set(curso._eixo, (counts.get(curso._eixo) || 0) + 1);
    });
    const items = Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
    return enriquecerBarras(items, { orange: true });
  }, [filtered]);

  const visitasKpiCards = useMemo(() => buildVisitasKpiCards(visitasIndicators), [visitasIndicators]);
  const horasKpiCards = useMemo(() => buildHorasKpiCards(horasIndicators), [horasIndicators]);

  const visitasPorEixo = useMemo(
    () => entriesToBars(visitasIndicators.porEixo),
    [visitasIndicators.porEixo],
  );
  const visitasPorStatus = useMemo(
    () => statusToBars(visitasIndicators.porStatus, visitasIndicators.total),
    [visitasIndicators.porStatus, visitasIndicators.total],
  );
  const visitasPorUnidade = useMemo(
    () => entriesToBars(visitasIndicators.porUnidade),
    [visitasIndicators.porUnidade],
  );
  const visitasPorResponsavel = useMemo(
    () => entriesToBars(visitasIndicators.porResponsavel),
    [visitasIndicators.porResponsavel],
  );

  const horasPorEixo = useMemo(() => entriesToBars(horasIndicators.porEixo), [horasIndicators.porEixo]);
  const horasPorStatus = useMemo(
    () => statusToBars(horasIndicators.porStatus, horasIndicators.total),
    [horasIndicators.porStatus, horasIndicators.total],
  );
  const horasPorSegmento = useMemo(
    () => entriesToBars(horasIndicators.porSegmento),
    [horasIndicators.porSegmento],
  );
  const horasPorPessoa = useMemo(
    () => entriesToBars(horasIndicators.porPessoa),
    [horasIndicators.porPessoa],
  );

  function limparFiltros() {
    setFilterEixo("Todos");
    setFilterStatus("Todos");
    setFilterUnidade("Todos");
    setFilterAno("Todos");
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-description">
            Indicadores do portfólio de cursos — SENAC DF · CPED
          </p>
        </div>

        <div className="dashboard-toolbar">
          <select
            aria-label="Grupo de indicadores"
            value={indicatorGroup}
            onChange={(e) => setIndicatorGroup(e.target.value as IndicatorGroup)}
          >
            {INDICATOR_GROUPS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {indicatorGroup === "gerais" && (
            <>
              <select aria-label="Ano" value={filterAno} onChange={(e) => setFilterAno(e.target.value)}>
                {anos.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>

              <select
                aria-label="Unidade"
                value={filterUnidade}
                onChange={(e) => setFilterUnidade(e.target.value)}
              >
                {unidades.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>

              <select aria-label="Eixo" value={filterEixo} onChange={(e) => setFilterEixo(e.target.value)}>
                {eixoOpts.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>

              <select
                aria-label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                {["Todos", "ATIVO", "INATIVO"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>

              {hasFilter && (
                <button type="button" className="btn-limpar" onClick={limparFiltros}>
                  Limpar
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {indicatorGroup === "gerais" && (
        <>
          <section className="dashboard-metrics-grid">
            {metricCards.map((card) => (
              <MetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                sub={card.sub}
                icon={card.icon}
                accent={card.accent}
                warn={card.warn}
              />
            ))}
          </section>

          <div className="dashboard-content-grid">
            <div className="dashboard-charts-grid">
              <section className="dashboard-chart-card">
                <h3>Eixos Tecnológicos</h3>
                <p className="dashboard-chart-subtitle">Quantidade de cursos por eixo</p>
                <DashboardBars items={chartEixos} />
              </section>

              <section className="dashboard-chart-card">
                <h3>Tipos de Curso</h3>
                <p className="dashboard-chart-subtitle">Distribuição por tipo de oferta</p>
                <DashboardBars items={chartTipos} />
              </section>

              <section className="dashboard-chart-card">
                <h3>Status dos Cursos</h3>
                <p className="dashboard-chart-subtitle">Situação atual do portfólio</p>
                <DashboardStatusGrid items={chartStatus} />
              </section>

              <section className="dashboard-chart-card">
                <h3>Faixas de Carga Horária</h3>
                <p className="dashboard-chart-subtitle">Cursos agrupados por carga horária</p>
                <DashboardBars items={chartCargaHoraria} />
              </section>
            </div>

            <section className="dashboard-summary-panel">
              <h3>Resumo por Eixo</h3>
              <p className="dashboard-chart-subtitle">Participação de cada eixo no resultado filtrado</p>
              {resumoPorEixo.length === 0 ? (
                <div className="dashboard-chart-empty">Sem dados para exibir.</div>
              ) : (
                <div className="dashboard-summary-list">
                  {resumoPorEixo.map((item) => (
                    <div key={item.label} className="dashboard-summary-item">
                      <div className="dashboard-summary-row">
                        <span className="dashboard-summary-name" title={item.label}>
                          {item.label}
                        </span>
                        <span className="dashboard-summary-meta">
                          <strong>{item.value}</strong>
                          <small>{item.share}%</small>
                        </span>
                      </div>
                      <div className="dashboard-summary-track">
                        <div
                          className="dashboard-summary-fill"
                          style={{ width: `${Math.max(item.bar, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {indicatorGroup === "visitas" && (
        <>
          <section className="dashboard-group-intro">
            <h2>Indicadores de Visitas Técnicas</h2>
            <p>Dados consolidados a partir dos registros de visitas técnicas.</p>
          </section>

          <KpiGrid cards={visitasKpiCards} variant="visitas" />

          <div className="dashboard-split-grid">
            <BarsChartCard
              title="Visitas por Eixo Tecnológico"
              subtitle="Quantas visitas cada eixo realizou no período"
              items={visitasPorEixo}
            />
            <StatusChartCard
              title="Distribuição por Status"
              subtitle="Situação atual de cada solicitação"
              items={visitasPorStatus}
            />
            <BarsChartCard
              title="Visitas por Unidade Solicitante"
              subtitle="Qual unidade mais solicitou visitas técnicas"
              items={visitasPorUnidade}
            />
            <BarsChartCard
              title="Pessoas Mais Acionadas"
              subtitle="Quantas vezes cada pessoa foi chamada"
              items={visitasPorResponsavel}
            />
          </div>
        </>
      )}

      {indicatorGroup === "horas" && (
        <>
          <section className="dashboard-group-intro">
            <h2>Indicadores de Horas Pedagógicas</h2>
            <p>Dados consolidados a partir das solicitações de horas pedagógicas.</p>
          </section>

          <KpiGrid cards={horasKpiCards} variant="horas" />

          <div className="dashboard-split-grid">
            <BarsChartCard
              title="Solicitações por Eixo Tecnológico"
              subtitle="Distribuição das solicitações por eixo"
              items={horasPorEixo}
            />
            <StatusChartCard
              title="Distribuição por Status"
              subtitle="Situação atual das solicitações"
              items={horasPorStatus}
            />
            <BarsChartCard
              title="Solicitações por Segmento"
              subtitle="Segmentos com maior volume de solicitações"
              items={horasPorSegmento}
            />
            <BarsChartCard
              title="Pessoas Mais Acionadas"
              subtitle="Quantidade de solicitações por pessoa"
              items={horasPorPessoa}
            />
          </div>
        </>
      )}
    </div>
  );
}
