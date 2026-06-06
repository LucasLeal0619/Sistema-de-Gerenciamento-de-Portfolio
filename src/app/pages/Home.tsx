import { useRef, useState } from "react";
import { Link } from "react-router";
import {
  LayoutDashboard,
  BookOpen,
  MapPin,
  Clock,
  Landmark,
  Zap,
  CalendarDays,
  GraduationCap,
  Target,
  BarChart2,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Users,
} from "lucide-react";
import senacLogo from "../../imports/senac_sem_fundo.png";
import { useConfirm } from "../components/ConfirmProvider";
import { usePermissions } from "../hooks/usePermissions";
import { ImportReplaceHint } from "../components/ImportReplaceHint";
import {
  importarPortfolioCompleto,
  limparPortfolioCompleto,
  type ResultadoModulo,
} from "../utils/importarPortfolioCompleto";
import { toastError, toastSuccess } from "../utils/toast";

const quickAccessCards = [
  {
    label: "Dashboard",
    description: "Visão geral do portfólio, gráficos e indicadores",
    icon: LayoutDashboard,
    to: "/app/dashboard",
  },
  {
    label: "Cursos",
    description: "Catálogo completo de cursos por eixo tecnológico",
    icon: BookOpen,
    to: "/app/cursos",
  },
  {
    label: "Visitas Técnicas",
    description: "Processos de visitas técnicas registradas",
    icon: MapPin,
    to: "/app/processos-visitas-tecnicas",
  },
  {
    label: "Horas Pedagógicas",
    description: "Controle de horas pedagógicas e processos SEI",
    icon: Clock,
    to: "/app/processos-horas-pedagogicas",
  },
  {
    label: "Valores PCA",
    description: "Precificação e valores do portfólio de cursos abertos",
    icon: Landmark,
    to: "/app/valores-pca-2025",
  },
  {
    label: "Ações Extensivas",
    description: "Registro e acompanhamento de ações extensivas",
    icon: Zap,
    to: "/app/acoes-extensivas",
  },
  {
    label: "Eventos",
    description: "Gestão de eventos e atividades institucionais",
    icon: CalendarDays,
    to: "/app/eventos",
  },
  {
    label: "Plano de Metas",
    description: "Mapeamento de produção e estratégias 2025",
    icon: Target,
    to: "/app/plano-metas",
  },
  {
    label: "Cursos por Eixo",
    description: "Comparativo anual de cursos por eixo tecnológico",
    icon: BarChart2,
    to: "/app/quantidade-cursos-por-eixo",
  },
  {
    label: "CEPED",
    description: "Organograma, equipe e carômetro institucional",
    icon: GraduationCap,
    to: "/app/ceped",
  },
];

function ResultadoImportacao({
  item,
  modo = "importar",
}: {
  item: ResultadoModulo;
  modo?: "importar" | "limpar";
}) {
  const sucesso = modo === "limpar" ? item.ok : item.ok && item.quantidade > 0;

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
        sucesso
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-gray-200 bg-gray-50 text-gray-600"
      }`}
    >
      <div className="flex items-center gap-2">
        {sucesso ? (
          <CheckCircle2 size={16} className="text-emerald-600" />
        ) : (
          <AlertCircle size={16} className="text-gray-400" />
        )}
        <span className="font-medium">{item.label}</span>
      </div>
      <span>
        {item.quantidade > 0
          ? `${item.quantidade} registros`
          : item.mensagem || "Sem dados"}
      </span>
    </div>
  );
}

export function Home() {
  const confirm = useConfirm();
  const { canWrite, canManageUsers } = usePermissions();
  const inputRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);
  const [limpando, setLimpando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoModulo[] | null>(null);
  const [modoResultado, setModoResultado] = useState<"importar" | "limpar">("importar");

  const handleImportarPortfolio = async (file?: File) => {
    if (!file) return;

    setImportando(true);
    setResultados(null);
    setModoResultado("importar");

    try {
      const resultado = await importarPortfolioCompleto(file);

      setResultados(resultado.resultados);

      if (resultado.sucesso) {
        toastSuccess(
          `Planilha importada: ${resultado.totalImportado} registros distribuídos nos módulos.`,
        );
      } else {
        toastError("Nenhum módulo foi atualizado. Verifique se a planilha está correta.");
      }
    } catch (error) {
      console.error(error);
      toastError("Erro ao importar a planilha principal.");
    } finally {
      setImportando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleLimparPortfolio = async () => {
    const ok = await confirm({
      title: "Limpar dados importados",
      message:
        "Deseja limpar todos os dados da planilha principal?\n\nSerão removidos: Cursos, Plano de Metas, Valores PCA, Cursos por Eixo, Visitas Técnicas e Horas Pedagógicas. O Dashboard será zerado. Usuários e CEPED não são afetados.",
      destructive: true,
      confirmLabel: "Limpar tudo",
    });
    if (!ok) return;

    setLimpando(true);
    setResultados(null);
    setModoResultado("limpar");

    try {
      const resultado = limparPortfolioCompleto();
      setResultados(resultado.resultados);
      toastSuccess("Dados importados removidos. O Dashboard foi zerado.");
    } catch (error) {
      console.error(error);
      toastError("Erro ao limpar os dados importados.");
    } finally {
      setLimpando(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-auto bg-white">
      <div
        className="w-full px-6 py-12 lg:py-16"
        style={{ background: "linear-gradient(135deg, #003F7D 0%, #002A56 100%)" }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
          <img
            src={senacLogo}
            alt="SENAC"
            className="h-12 w-auto"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/55">SENAC DF · CPED</p>
            <h1
              className="text-white"
              style={{ fontSize: "1.85rem", fontWeight: 800, lineHeight: 1.2 }}
            >
              SGP — Sistema de Gerenciamento de Portfólio
            </h1>
            <p
              className="mx-auto mt-3 max-w-xl text-white/65"
              style={{ fontSize: "0.9rem", lineHeight: 1.7 }}
            >
              Plataforma institucional para gestão e acompanhamento do portfólio de cursos,
              processos educacionais e indicadores do SENAC DF.
            </p>
          </div>

          <div className="mt-1 flex items-center gap-6">
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                8
              </p>
              <p className="text-xs uppercase tracking-wide text-white/50">Eixos</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                2025
              </p>
              <p className="text-xs uppercase tracking-wide text-white/50">Portfólio</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                CPED
              </p>
              <p className="text-xs uppercase tracking-wide text-white/50">Unidade</p>
            </div>
          </div>

          <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row">
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#F57C00]" />
              <p className="text-xs text-white/75">Versão beta — uso interno para validação</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
              <p className="text-xs text-white/65">Dados salvos neste navegador</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-1 w-full" style={{ background: "#F57C00" }} />

      <div className="mx-auto max-w-5xl space-y-10 px-6 py-10">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 style={{ color: "#003F7D" }}>Planilha principal</h2>
              <p className="mt-1 text-sm text-gray-500">
                Um único arquivo alimenta Cursos, Plano de Metas, PCA, Cursos por Eixo, Visitas
                Técnicas e Horas Pedagógicas. O Dashboard é atualizado automaticamente. Use
                &quot;Limpar dados&quot; para voltar ao estado vazio.
              </p>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto md:flex-row">
              {canWrite && (
                <>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => handleImportarPortfolio(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    disabled={importando || limpando}
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#F57C00] px-5 py-3 text-sm font-semibold leading-none text-white transition-colors hover:bg-[#E67300] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {importando ? (
                      <>
                        <Loader2 size={18} className="shrink-0 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload size={18} className="shrink-0" />
                        Importar planilha completa
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={importando || limpando}
                    onClick={handleLimparPortfolio}
                    className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold leading-none text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {limpando ? (
                      <>
                        <Loader2 size={18} className="shrink-0 animate-spin" />
                        Limpando...
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} className="shrink-0" />
                        Limpar dados importados
                      </>
                    )}
                  </button>
                </>
              )}
              <Link
                to="/app/dashboard"
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#003F7D]/20 px-5 py-3 text-sm font-semibold leading-none text-[#003F7D] hover:bg-[#E8EFF7]"
                style={{ textDecoration: "none" }}
              >
                <LayoutDashboard size={18} />
                Ver Dashboard
              </Link>
            </div>
          </div>

          <ImportReplaceHint className="mt-5" />

          {resultados && (
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {resultados.map((item) => (
                <ResultadoImportacao key={item.modulo} item={item} modo={modoResultado} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-6">
            <h2 style={{ color: "#003F7D" }}>Acesso Rápido</h2>
            <p className="mt-1 text-gray-500" style={{ fontSize: "0.875rem" }}>
              Navegue pelos módulos do sistema
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ...quickAccessCards,
              ...(canManageUsers
                ? [
                    {
                      label: "Usuários",
                      description: "Gestão de perfis e acessos ao sistema",
                      icon: Users,
                      to: "/app/usuarios",
                    },
                  ]
                : []),
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.label}
                  to={card.to}
                  className="group flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#003F7D]/40 hover:shadow-md"
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-[#003F7D]"
                    style={{ backgroundColor: "#E8EFF7" }}
                  >
                    <Icon
                      size={18}
                      className="transition-colors group-hover:text-white"
                      style={{ color: "#003F7D" }}
                    />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "#003F7D",
                        lineHeight: 1.3,
                      }}
                    >
                      {card.label}
                    </p>
                    <p className="mt-0.5 text-gray-400" style={{ fontSize: "0.72rem", lineHeight: 1.4 }}>
                      {card.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="border-t border-gray-100 py-5 text-center">
        <p className="text-gray-400" style={{ fontSize: "0.75rem" }}>
          © {new Date().getFullYear()} SENAC DF · SGP v1.0-beta · Uso interno
        </p>
      </div>
    </div>
  );
}
