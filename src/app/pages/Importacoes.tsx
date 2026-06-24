import { useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  Landmark,
  MapPin,
  Target,
  Upload,
  Zap,
  BarChart2,
} from "lucide-react";
import {
  importarAcoesExtensivasExcel,
  importarCursosEixoExcel,
  importarCursosPortfolio,
  importarEventosExcel,
  importarHorasPedagogicasExcel,
  importarPlanoMetasExcel,
  importarValoresPCAExcel,
  importarVisitasTecnicasExcel,
} from "../utils/importExcel";
import { inferPlanoMetaYear } from "../utils/planoMetasYear";
import {
  adaptarCursoImportado,
  replaceAcoesExtensivas,
  replaceCourses,
  replaceCursosEixo,
  replaceEventos,
  replaceHoras,
  replacePlanoMetas,
  replaceValoresPCA,
  replaceVisitas,
} from "../utils/store";
import { toastError, toastSuccess } from "../utils/toast";

type ImportKey =
  | "cursos"
  | "plano"
  | "pca"
  | "cursosEixo"
  | "visitas"
  | "horas"
  | "acoes"
  | "eventos";

type ImportAction = {
  key: ImportKey;
  title: string;
  description: string;
  sheetHint: string;
  icon: typeof BookOpen;
  run: (file: File) => Promise<number>;
};

function normalizeCursoEixoRow(row: any) {
  return {
    ano: String(row.ano || "2025"),
    eixo: String(row.eixo || row.segmento || ""),
    unidade: String(row.unidade || ""),
    curso: String(row.curso || row.titulo || row.nomeCurso || ""),
    ch: String(row.ch || row.cargaHoraria || ""),
    status: String(row.status || "Ativo"),
    observacao: String(row.observacao || row.observacoes || ""),
    quantidadeCursosSegmento: String(row.quantidadeCursosSegmento || ""),
    turmas: String(row.turmas || ""),
    codigo: String(row.codigo || row.codSIG || row.codigoSIG || ""),
    alunos: String(row.alunos || ""),
    instrutores: String(row.instrutores || ""),
    isNovo: Boolean(row.isNovo),
  };
}

function normalizePcaRow(row: any) {
  return {
    ano: String(row.ano || "2025").replace(/\s*\/\s*[12]\s*$/, ""),
    semestre: String(row.semestre || ""),
    sei: String(row.sei || ""),
    sig: String(row.sig || ""),
    titulo: String(row.titulo || ""),
    eixo: String(row.eixo || ""),
    unidade: String(row.unidade || ""),
    ch: String(row.ch || ""),
    valor: String(row.valor || row.precificacao || ""),
    status: String(row.status || "Vigente"),
    observacao: String(row.observacao || ""),
    precificacao: String(row.precificacao || row.valor || ""),
    valorPrimeiroModulo: String(row.valorPrimeiroModulo || ""),
    parcelasBoleto: String(row.parcelasBoleto || ""),
    valorParcelaBoleto: String(row.valorParcelaBoleto || ""),
    parcelasCartao: String(row.parcelasCartao || ""),
    valorCartao: String(row.valorCartao || ""),
    parcelaDesc20: String(row.parcelaDesc20 || ""),
    parcelaDesc15: String(row.parcelaDesc15 || ""),
  };
}

function normalizePlanoRow(row: any) {
  const curso = String(row.curso || row.tipo || "").trim();
  const tipo = String(row.categoria || row.tipoPlanilha || "").trim();

  return {
    ano: inferPlanoMetaYear(row),
    segmento: row.segmento,
    curso,
    categoria: tipo || "Não informado",
    tipo: curso,
    numeroSEI: row.numeroSEI,
    codigoSIG: row.codigoSIG,
    mesEntrega: row.mesEntrega,
    status: row.status,
    origem: row.origem,
    observacao: row.observacao,
    responsavel: "",
    statusFinal: row.statusFinal,
  };
}

function normalizeVisitaRow(row: any) {
  return {
    ano: row.ano,
    unidade: row.unidade,
    eixo: row.eixo,
    processoSEI: row.processoSEI,
    dataSolicitacao: row.dataSolicitacao,
    dataVisitaPrevista: row.dataVisitaPrevista,
    prazoLimite: row.prazoLimite,
    status: row.status,
    responsavel: row.responsavel,
    relatorio: row.relatorio,
    observacao: row.observacao,
  };
}

function normalizeHoraRow(row: any) {
  return {
    ano: row.ano || "2025",
    processoSEI: row.processoSEI || "",
    eixo: row.eixo || "",
    segmento: row.segmento || "",
    nomePessoa: row.nomePessoa || "",
    matricula: row.matricula || "",
    motivo: row.motivo || "",
    observacao: row.observacao || "",
    status: row.status || "Solicitada",
    ativo: row.ativo ?? true,
  };
}

export function Importacoes() {
  const inputRefs = useRef<Record<ImportKey, HTMLInputElement | null>>({
    cursos: null,
    plano: null,
    pca: null,
    cursosEixo: null,
    visitas: null,
    horas: null,
    acoes: null,
    eventos: null,
  });
  const [loadingKey, setLoadingKey] = useState<ImportKey | null>(null);
  const [lastResult, setLastResult] = useState<string>("");

  const actions: ImportAction[] = [
    {
      key: "cursos",
      title: "Cursos",
      description: "Substitui o catálogo importado de cursos.",
      sheetHint: "Abas de portfólio/cursos",
      icon: BookOpen,
      run: async (file) => {
        const rows = await importarCursosPortfolio(file);
        const normalized = rows.map(adaptarCursoImportado);
        replaceCourses(normalized);
        return normalized.length;
      },
    },
    {
      key: "plano",
      title: "Plano de Metas",
      description: "Atualiza produção, produtividade e estratégias.",
      sheetHint: "Aba Plano de Metas",
      icon: Target,
      run: async (file) => {
        const rows = await importarPlanoMetasExcel(file);
        replacePlanoMetas(rows.map(normalizePlanoRow));
        return rows.length;
      },
    },
    {
      key: "pca",
      title: "PCA",
      description: "Atualiza cursos previstos e precificação.",
      sheetHint: "Abas PCA / Títulos Retificativos",
      icon: Landmark,
      run: async (file) => {
        const rows = await importarValoresPCAExcel(file);
        const normalized = rows.map(normalizePcaRow);
        replaceValoresPCA(normalized);
        return normalized.length;
      },
    },
    {
      key: "cursosEixo",
      title: "Eixos",
      description: "Atualiza a visão comparativa anual por eixo.",
      sheetHint: "Aba Quantidade de Cursos por Eixo",
      icon: BarChart2,
      run: async (file) => {
        const rows = await importarCursosEixoExcel(file);
        const normalized = rows.map(normalizeCursoEixoRow).filter((row) => row.curso.trim());
        replaceCursosEixo(normalized);
        return normalized.length;
      },
    },
    {
      key: "visitas",
      title: "Visitas Técnicas",
      description: "Atualiza solicitações, prazos e relatórios.",
      sheetHint: "Aba Visitas Técnicas",
      icon: MapPin,
      run: async (file) => {
        const rows = await importarVisitasTecnicasExcel(file);
        replaceVisitas(rows.map(normalizeVisitaRow));
        return rows.length;
      },
    },
    {
      key: "horas",
      title: "Horas Pedagógicas",
      description: "Atualiza processos e solicitações de horas.",
      sheetHint: "Aba Horas Pedagógicas",
      icon: Clock,
      run: async (file) => {
        const rows = await importarHorasPedagogicasExcel(file);
        const normalized = rows.map(normalizeHoraRow);
        replaceHoras(normalized);
        return normalized.length;
      },
    },
    {
      key: "acoes",
      title: "Ações Extensivas",
      description: "Substitui registros de ações extensivas.",
      sheetHint: "Aba Ações Extensivas",
      icon: Zap,
      run: async (file) => {
        const rows = await importarAcoesExtensivasExcel(file);
        replaceAcoesExtensivas(rows);
        return rows.length;
      },
    },
    {
      key: "eventos",
      title: "Eventos",
      description: "Substitui registros de eventos institucionais.",
      sheetHint: "Aba Eventos",
      icon: CalendarDays,
      run: async (file) => {
        const rows = await importarEventosExcel(file);
        replaceEventos(rows);
        return rows.length;
      },
    },
  ];

  const handleFile = async (action: ImportAction, file?: File) => {
    if (!file) return;

    setLoadingKey(action.key);
    setLastResult("");

    try {
      const count = await action.run(file);

      if (!count) {
        toastError(`Nenhum registro válido encontrado para ${action.title}.`);
        return;
      }

      const message = `${count} registro${count !== 1 ? "s" : ""} importado${count !== 1 ? "s" : ""} em ${action.title}.`;
      setLastResult(message);
      toastSuccess(`${message} Dados anteriores substituídos.`);
    } catch (error) {
      console.error(error);
      toastError(`Erro ao importar ${action.title}. Verifique a planilha e a aba esperada.`);
    } finally {
      setLoadingKey(null);
      const input = inputRefs.current[action.key];
      if (input) input.value = "";
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="border-b border-gray-200 px-5 pb-6 pt-20 lg:px-8 lg:pt-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F57C00]">
              Ferramentas operacionais
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#003F7D] lg:text-3xl">
              Importações
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Centralize aqui as cargas de planilhas. Cada importação substitui os dados atuais do módulo selecionado.
            </p>
          </div>

          {lastResult && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
              <CheckCircle size={16} />
              {lastResult}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {actions.map((action) => {
            const Icon = action.icon;
            const isLoading = loadingKey === action.key;

            return (
              <div
                key={action.key}
                className="flex min-h-[190px] flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <input
                  ref={(el) => {
                    inputRefs.current[action.key] = el;
                  }}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(event) => handleFile(action, event.target.files?.[0])}
                />

                <div>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E8EFF7] text-[#003F7D]">
                      <Icon size={20} />
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-500">
                      {action.sheetHint}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-gray-900">{action.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{action.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => inputRefs.current[action.key]?.click()}
                  disabled={Boolean(loadingKey)}
                  className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#003F7D] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#002D5A] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Upload size={15} />
                  {isLoading ? "Importando..." : "Selecionar planilha"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <div className="flex items-start gap-3">
            <FileSpreadsheet size={18} className="mt-0.5 flex-shrink-0" />
            <p>
              Use a planilha principal quando ela contiver as abas esperadas. Para Ações Extensivas e Eventos, a mesma área também aceita arquivos específicos desses módulos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}