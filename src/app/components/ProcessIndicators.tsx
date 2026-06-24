import type { HorasIndicators, IndicatorEntry, VisitasIndicators } from "../utils/processIndicators";
import { percent } from "../utils/processIndicators";

function statusClass(status: string) {
  const normalized = String(status ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("realizada") || normalized.includes("concluida")) {
    return "border-green-200 bg-green-100 text-green-700";
  }

  if (normalized.includes("aprovada")) {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }

  if (normalized.includes("analise")) {
    return "border-yellow-300 bg-yellow-50 text-yellow-700";
  }

  if (normalized.includes("solicitada")) {
    return "border-blue-200 bg-blue-100 text-blue-700";
  }

  if (normalized.includes("devolvida") || normalized.includes("recusada")) {
    return "border-red-200 bg-red-100 text-red-700";
  }

  if (normalized.includes("inativa")) {
    return "border-gray-200 bg-gray-100 text-gray-500";
  }

  return "border-gray-200 bg-gray-100 text-gray-700";
}

function IndicatorCard({
  title,
  value,
  subtitle,
  barPercent,
  colorClass,
}: {
  title: string;
  value: number;
  subtitle: string;
  barPercent: number;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-3xl font-bold text-[#003F7D]">{value}</p>
      <p className="mt-1 text-sm text-gray-600">{title}</p>
      <div className="mt-3 h-1.5 rounded-full bg-gray-100">
        <div className={`h-1.5 rounded-full ${colorClass}`} style={{ width: `${Math.min(barPercent, 100)}%` }} />
      </div>
      <p className="mt-2 text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

function BarPanel({ title, subtitle, data }: { title: string; subtitle: string; data: IndicatorEntry[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-[#003F7D]">{title}</h3>
      <p className="text-sm text-gray-400">{subtitle}</p>

      <div className="mt-6 space-y-4">
        {data.slice(0, 8).map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-xs text-gray-600">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-[#003F7D]" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}

        {!data.length && <p className="py-8 text-center text-sm text-gray-400">Nenhum dado para exibir.</p>}
      </div>
    </div>
  );
}

function StatusPanel({
  title,
  subtitle,
  data,
  total,
}: {
  title: string;
  subtitle: string;
  data: IndicatorEntry[];
  total: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-[#003F7D]">{title}</h3>
      <p className="text-sm text-gray-400">{subtitle}</p>

      <div className="mt-6 space-y-3">
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className={`rounded-full border px-2 py-0.5 font-bold ${statusClass(item.label)}`}>{item.label}</span>
              <span className="font-semibold text-gray-700">
                {item.value} <span className="font-normal text-gray-400">{percent(item.value, total)}%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-[#003F7D]" style={{ width: `${percent(item.value, total)}%` }} />
            </div>
          </div>
        ))}

        {!data.length && <p className="py-8 text-center text-sm text-gray-400">Nenhum dado para exibir.</p>}
      </div>
    </div>
  );
}

function RankingPanel({
  title,
  subtitle,
  data,
  total,
}: {
  title: string;
  subtitle: string;
  data: IndicatorEntry[];
  total: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-[#003F7D]">{title}</h3>
      <p className="text-sm text-gray-400">{subtitle}</p>

      <div className="mt-6 space-y-3">
        {data.slice(0, 8).map((item, index) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">
                {index + 1}. {item.label}
              </span>
              <span className="font-semibold text-gray-700">
                {item.value} <span className="font-normal text-gray-400">{percent(item.value, total)}%</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-[#F57C00]" style={{ width: `${percent(item.value, total)}%` }} />
            </div>
          </div>
        ))}

        {!data.length && <p className="py-8 text-center text-sm text-gray-400">Nenhum dado para exibir.</p>}
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-[#003F7D]">{title}</h2>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

export function VisitasIndicatorsView({ data }: { data: VisitasIndicators }) {
  return (
    <div className="space-y-6">
      <SectionTitle
        title={"Indicadores de Visitas T\u00e9cnicas"}
        subtitle={"Dados consolidados a partir dos registros de visitas t\u00e9cnicas."}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <IndicatorCard title={"Total no per\u00edodo"} value={data.total} subtitle="100% do total" barPercent={100} colorClass="bg-[#003F7D]" />
        <IndicatorCard title="Realizadas" value={data.realizadas} subtitle={`${percent(data.realizadas, data.total)}% do total`} barPercent={percent(data.realizadas, data.total)} colorClass="bg-green-700" />
        <IndicatorCard title="Pendentes" value={data.pendentes} subtitle={`${percent(data.pendentes, data.total)}% do total`} barPercent={percent(data.pendentes, data.total)} colorClass="bg-yellow-700" />
        <IndicatorCard title="Fora do prazo" value={data.foraPrazoCount} subtitle={`${percent(data.foraPrazoCount, data.total)}% do total`} barPercent={percent(data.foraPrazoCount, data.total)} colorClass="bg-red-700" />
        <IndicatorCard title="Dentro do prazo" value={data.dentroPrazo} subtitle={`${percent(data.dentroPrazo, data.total)}% do total`} barPercent={percent(data.dentroPrazo, data.total)} colorClass="bg-blue-700" />
        <IndicatorCard title="Devolvidas/Recusadas" value={data.devolvidasRecusadas} subtitle={`${percent(data.devolvidasRecusadas, data.total)}% do total`} barPercent={percent(data.devolvidasRecusadas, data.total)} colorClass="bg-purple-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BarPanel title={"Visitas por Eixo Tecnol\u00f3gico"} subtitle={"Quantas visitas cada eixo realizou no per\u00edodo"} data={data.porEixo} />
        <StatusPanel title={"Distribui\u00e7\u00e3o por Status"} subtitle={"Situa\u00e7\u00e3o atual de cada solicita\u00e7\u00e3o"} data={data.porStatus} total={data.total} />
        <RankingPanel title="Visitas por Unidade Solicitante" subtitle={"Qual unidade mais solicitou visitas t\u00e9cnicas"} data={data.porUnidade} total={data.total} />
        <RankingPanel title="Pessoas Mais Acionadas" subtitle="Quantas vezes cada pessoa foi chamada" data={data.porResponsavel} total={data.total} />
      </div>
    </div>
  );
}

export function HorasIndicatorsView({ data }: { data: HorasIndicators }) {
  return (
    <div className="space-y-6">
      <SectionTitle
        title={"Indicadores de Horas Pedag\u00f3gicas"}
        subtitle={"Dados consolidados a partir das solicita\u00e7\u00f5es de horas pedag\u00f3gicas."}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <IndicatorCard title={"Total no per\u00edodo"} value={data.total} subtitle="100% do total" barPercent={100} colorClass="bg-[#003F7D]" />
        <IndicatorCard title={"Conclu\u00eddas"} value={data.concluidas} subtitle={`${percent(data.concluidas, data.total)}% do total`} barPercent={percent(data.concluidas, data.total)} colorClass="bg-green-700" />
        <IndicatorCard title="Aprovadas" value={data.aprovadas} subtitle={`${percent(data.aprovadas, data.total)}% do total`} barPercent={percent(data.aprovadas, data.total)} colorClass="bg-emerald-700" />
        <IndicatorCard title={"Em an\u00e1lise"} value={data.emAnalise} subtitle={`${percent(data.emAnalise, data.total)}% do total`} barPercent={percent(data.emAnalise, data.total)} colorClass="bg-yellow-700" />
        <IndicatorCard title="Solicitadas" value={data.solicitadas} subtitle={`${percent(data.solicitadas, data.total)}% do total`} barPercent={percent(data.solicitadas, data.total)} colorClass="bg-blue-700" />
        <IndicatorCard title="Recusadas" value={data.recusadas} subtitle={`${percent(data.recusadas, data.total)}% do total`} barPercent={percent(data.recusadas, data.total)} colorClass="bg-red-700" />
        <IndicatorCard title="Inativas" value={data.inativos} subtitle={`${percent(data.inativos, data.total)}% do total`} barPercent={percent(data.inativos, data.total)} colorClass="bg-gray-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BarPanel title={"Solicita\u00e7\u00f5es por Eixo Tecnol\u00f3gico"} subtitle={"Distribui\u00e7\u00e3o das solicita\u00e7\u00f5es por eixo"} data={data.porEixo} />
        <StatusPanel title={"Distribui\u00e7\u00e3o por Status"} subtitle={"Situa\u00e7\u00e3o atual das solicita\u00e7\u00f5es"} data={data.porStatus} total={data.total} />
        <RankingPanel title={"Solicita\u00e7\u00f5es por Segmento"} subtitle={"Segmentos com maior volume de solicita\u00e7\u00f5es"} data={data.porSegmento} total={data.total} />
        <RankingPanel title="Pessoas Mais Acionadas" subtitle={"Quantidade de solicita\u00e7\u00f5es por pessoa"} data={data.porPessoa} total={data.total} />
      </div>
    </div>
  );
}
