import { useRef, useState } from "react";
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
import { logActivity } from "../utils/activityLog";

type ImportKey =
  | "cursos"
  | "plano"
  | "pca"
  | "cursosEixo"
  | "visitas"
  | "horas"
  | "acoes"
  | "eventos";

type Stage = "catalogo" | "upload" | "previa";

type ImportModule = {
  key: ImportKey;
  title: string;
  description: string;
  sheetHint: string;
  available: boolean;
  parse: (file: File) => Promise<{
    rows: Record<string, unknown>[];
    totalCount: number;
    commit: () => void;
  }>;
};

function normalizeCursoEixoRow(row: Record<string, unknown>) {
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

function normalizePcaRow(row: Record<string, unknown>) {
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

function normalizePlanoRow(row: Record<string, unknown>) {
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

function normalizeVisitaRow(row: Record<string, unknown>) {
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

function normalizeHoraRow(row: Record<string, unknown>) {
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

function toPreviewRows(data: unknown[]): Record<string, unknown>[] {
  return data.slice(0, 50).map((item) => {
    if (item && typeof item === "object") return item as Record<string, unknown>;
    return { valor: item };
  });
}

function previewColumns(rows: Record<string, unknown>[]) {
  if (!rows.length) return [];
  return Object.keys(rows[0]).slice(0, 8);
}

const MODULES: ImportModule[] = [
  {
    key: "cursos",
    title: "Cursos",
    description: "Substitui o catálogo importado de cursos do portfólio.",
    sheetHint: "Abas de portfólio/cursos",
    available: true,
    parse: async (file) => {
      const rows = await importarCursosPortfolio(file);
      const normalized = rows.map(adaptarCursoImportado);
      return {
        rows: toPreviewRows(normalized),
        totalCount: normalized.length,
        commit: () => replaceCourses(normalized),
      };
    },
  },
  {
    key: "plano",
    title: "Plano de Metas",
    description: "Atualiza produção, produtividade e estratégias do plano.",
    sheetHint: "Aba Plano de Metas",
    available: true,
    parse: async (file) => {
      const rows = await importarPlanoMetasExcel(file);
      const normalized = rows.map(normalizePlanoRow);
      return {
        rows: toPreviewRows(normalized),
        totalCount: normalized.length,
        commit: () => replacePlanoMetas(normalized),
      };
    },
  },
  {
    key: "pca",
    title: "PCA",
    description: "Atualiza cursos previstos, valores e precificação.",
    sheetHint: "Abas PCA / Títulos Retificativos",
    available: true,
    parse: async (file) => {
      const rows = await importarValoresPCAExcel(file);
      const normalized = rows.map(normalizePcaRow);
      return {
        rows: toPreviewRows(normalized),
        totalCount: normalized.length,
        commit: () => replaceValoresPCA(normalized),
      };
    },
  },
  {
    key: "cursosEixo",
    title: "Eixos",
    description: "Atualiza a visão comparativa anual por eixo.",
    sheetHint: "Aba Quantidade de Cursos por Eixo",
    available: true,
    parse: async (file) => {
      const rows = await importarCursosEixoExcel(file);
      const normalized = rows.map(normalizeCursoEixoRow).filter((row) => row.curso.trim());
      return {
        rows: toPreviewRows(normalized),
        totalCount: normalized.length,
        commit: () => replaceCursosEixo(normalized),
      };
    },
  },
  {
    key: "visitas",
    title: "Visitas Técnicas",
    description: "Atualiza solicitações, prazos e relatórios de visitas.",
    sheetHint: "Aba Visitas Técnicas",
    available: true,
    parse: async (file) => {
      const rows = await importarVisitasTecnicasExcel(file);
      const normalized = rows.map(normalizeVisitaRow);
      return {
        rows: toPreviewRows(normalized),
        totalCount: normalized.length,
        commit: () => replaceVisitas(normalized),
      };
    },
  },
  {
    key: "horas",
    title: "Horas Pedagógicas",
    description: "Atualiza processos e solicitações de horas pedagógicas.",
    sheetHint: "Aba Horas Pedagógicas",
    available: true,
    parse: async (file) => {
      const rows = await importarHorasPedagogicasExcel(file);
      const normalized = rows.map(normalizeHoraRow);
      return {
        rows: toPreviewRows(normalized),
        totalCount: normalized.length,
        commit: () => replaceHoras(normalized),
      };
    },
  },
  {
    key: "acoes",
    title: "Ações Extensivas",
    description: "Substitui registros de ações extensivas.",
    sheetHint: "Aba Ações Extensivas",
    available: true,
    parse: async (file) => {
      const rows = await importarAcoesExtensivasExcel(file);
      return {
        rows: toPreviewRows(rows),
        totalCount: rows.length,
        commit: () => replaceAcoesExtensivas(rows),
      };
    },
  },
  {
    key: "eventos",
    title: "Eventos",
    description: "Substitui registros de eventos institucionais.",
    sheetHint: "Aba Eventos",
    available: true,
    parse: async (file) => {
      const rows = await importarEventosExcel(file);
      return {
        rows: toPreviewRows(rows),
        totalCount: rows.length,
        commit: () => replaceEventos(rows),
      };
    },
  },
];

type PendingImport = {
  module: ImportModule;
  file: File;
  rows: Record<string, unknown>[];
  totalCount: number;
  commit: () => void;
};

export function Importacoes() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("catalogo");
  const [selectedModule, setSelectedModule] = useState<ImportModule | null>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetFlow = () => {
    setStage("catalogo");
    setSelectedModule(null);
    setPending(null);
    setParseErrors([]);
    setSelectedFile(null);
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const openUpload = (mod: ImportModule) => {
    setSelectedModule(mod);
    setStage("upload");
    setErrorMsg("");
    setSuccessMsg("");
    setParseErrors([]);
    setSelectedFile(null);
    setPending(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onArquivoSelecionado = (file?: File) => {
    setSelectedFile(file ?? null);
    setErrorMsg("");
  };

  const gerarPrevia = async () => {
    if (!selectedFile || !selectedModule) return;

    setLoading(true);
    setErrorMsg("");
    setParseErrors([]);

    try {
      const parsed = await selectedModule.parse(selectedFile);
      if (!parsed.rows.length) {
        setErrorMsg(`Nenhum registro válido encontrado para ${selectedModule.title}.`);
        return;
      }

      setPending({
        module: selectedModule,
        file: selectedFile,
        rows: parsed.rows,
        totalCount: parsed.totalCount,
        commit: parsed.commit,
      });
      setStage("previa");
    } catch (error) {
      console.error(error);
      setErrorMsg(`Erro ao ler a planilha de ${selectedModule.title}. Verifique o arquivo e a aba esperada.`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pending) return;

    setCommitting(true);
    setErrorMsg("");

    try {
      pending.commit();
      const count = pending.totalCount;
      const message = `${count} registro${count !== 1 ? "s" : ""} importado${count !== 1 ? "s" : ""} em ${pending.module.title}. Dados anteriores substituídos.`;
      logActivity(`Importação — ${pending.module.title}`, pending.file.name);
      setSuccessMsg(message);
      resetFlow();
    } catch (error) {
      console.error(error);
      setErrorMsg(`Erro ao importar ${pending.module.title}.`);
    } finally {
      setCommitting(false);
    }
  };

  const previewCols = pending ? previewColumns(pending.rows) : [];

  return (
    <div className="importacoes-page">
      <header className="imp-header">
        <div>
          <h1>Importações</h1>
          <p className="imp-subtitle">
            Centralize aqui as cargas de planilhas. Cada importação substitui os dados atuais do módulo
            selecionado.
          </p>
        </div>
        {stage !== "catalogo" ? (
          <button type="button" className="btn-voltar" onClick={resetFlow} disabled={loading || committing}>
            ← Voltar
          </button>
        ) : null}
      </header>

      {successMsg ? <div className="alert alert-success">{successMsg}</div> : null}
      {errorMsg ? <div className="alert alert-error">{errorMsg}</div> : null}

      {stage === "catalogo" ? (
        <div className="imp-catalogo">
          <div className="imp-cards">
            {MODULES.map((mod) => (
              <div key={mod.key} className={`imp-card${mod.available ? "" : " is-soon"}`}>
                <div className="imp-card-top">
                  <span className={`imp-card-badge${mod.available ? "" : " soon"}`}>
                    {mod.available ? "Disponível" : "Em breve"}
                  </span>
                </div>
                <h2>{mod.title}</h2>
                <p>{mod.description}</p>
                <button
                  type="button"
                  className="btn-primario"
                  disabled={!mod.available}
                  onClick={() => openUpload(mod)}
                >
                  Importar planilha
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {stage === "upload" && selectedModule ? (
        <div className="imp-painel">
          <div className="imp-painel-head">
            <p className="imp-kicker">{selectedModule.title}</p>
            <h2>Enviar planilha</h2>
            <p className="imp-ajuda">
              Aceita <code>.xlsx</code> / <code>.xls</code>. {selectedModule.sheetHint}
            </p>
          </div>

          <label className={`imp-dropzone${selectedFile ? " has-file" : ""}`}>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={(event) => onArquivoSelecionado(event.target.files?.[0])}
            />
            {selectedFile ? selectedFile.name : "Clique para selecionar o arquivo Excel"}
          </label>

          <div className="imp-acoes">
            <button type="button" className="btn-secundario" disabled={loading} onClick={resetFlow}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primario"
              disabled={!selectedFile || loading}
              onClick={() => void gerarPrevia()}
            >
              {loading ? "Lendo planilha..." : "Gerar prévia"}
            </button>
          </div>
        </div>
      ) : null}

      {stage === "previa" && pending ? (
        <div className="imp-painel">
          <div className="imp-painel-head">
            <p className="imp-kicker">Prévia · {pending.file.name}</p>
            <h2>Confirmar importação</h2>
            <p className="imp-ajuda">
              {pending.totalCount} registro(s) válidos. A confirmação <strong>substitui todos</strong> os
              dados atuais de {pending.module.title}.
            </p>
          </div>

          {parseErrors.length ? (
            <div className="imp-erros">
              <h3>Avisos na planilha</h3>
              <ul>
                {parseErrors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="imp-tabela-card">
            <div className="imp-tabela-wrap">
              <table className="imp-table">
                <thead>
                  <tr>
                    {previewCols.map((col) => (
                      <th key={col} className={col === "curso" || col === "titulo" ? "col-assunto" : undefined}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pending.rows.map((row, index) => (
                    <tr key={index}>
                      {previewCols.map((col) => (
                        <td key={col} className={col === "curso" || col === "titulo" ? "col-assunto" : undefined}>
                          {String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="imp-tabela-nota">
              Mostrando {pending.rows.length} de {pending.totalCount} registro
              {pending.totalCount !== 1 ? "s" : ""} na prévia. A importação substituirá todos os dados atuais do
              módulo.
            </p>
          </div>

          <div className="imp-acoes">
            <button
              type="button"
              className="btn-secundario"
              onClick={() => {
                setStage("upload");
                setPending(null);
              }}
              disabled={committing}
            >
              Trocar arquivo
            </button>
            <button type="button" className="btn-perigo" onClick={handleConfirm} disabled={committing}>
              {committing ? "Importando..." : "Importar e substituir"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
