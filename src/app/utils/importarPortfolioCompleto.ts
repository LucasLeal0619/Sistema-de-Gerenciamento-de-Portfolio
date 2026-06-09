import {
  importarAcoesExtensivasExcel,
  importarCursosEixoExcel,
  importarCursosPortfolio,
  importarEventosExcel,
  importarHorasPedagogicasExcel,
  importarPlanoMetasExcel,
  importarValoresPCAExcel,
  importarVisitasTecnicasExcel,
} from "./importExcel";
import {
  adaptarCursoImportado,
  limparDadosPortfolio,
  replaceAcoesExtensivas,
  replaceCourses,
  replaceCursosEixo,
  replaceEventos,
  replaceHoras,
  replacePlanoMetas,
  replaceValoresPCA,
  replaceVisitas,
} from "./store";
import { analisarPortfolioCompleto } from "./analisarPortfolio";
import { logActivity } from "./activityLog";
import { notifyDataChanged } from "./dataRefresh";
import { recordImportHistory } from "./importHistory";

export type ModuloImportacao =
  | "cursos"
  | "planoMetas"
  | "pca"
  | "cursosEixo"
  | "visitas"
  | "horas"
  | "acoes"
  | "eventos";

export type ResultadoModulo = {
  modulo: ModuloImportacao;
  label: string;
  quantidade: number;
  ok: boolean;
  mensagem?: string;
};

export type ResultadoPortfolioCompleto = {
  resultados: ResultadoModulo[];
  totalImportado: number;
  sucesso: boolean;
};

const MODULOS: { key: ModuloImportacao; label: string }[] = [
  { key: "cursos", label: "Cursos" },
  { key: "planoMetas", label: "Plano de Metas" },
  { key: "pca", label: "PCA" },
  { key: "cursosEixo", label: "Cursos por Eixo" },
  { key: "visitas", label: "Visitas Técnicas" },
  { key: "horas", label: "Horas Pedagógicas" },
  { key: "acoes", label: "Ações Extensivas" },
  { key: "eventos", label: "Eventos" },
];

const MODULOS_NUCLEO: ModuloImportacao[] = ["cursos", "planoMetas", "pca"];

async function importarModulo(
  file: File,
  key: ModuloImportacao,
): Promise<ResultadoModulo> {
  const label = MODULOS.find((m) => m.key === key)?.label ?? key;

  try {
    switch (key) {
      case "cursos": {
        const rows = await importarCursosPortfolio(file);
        if (!rows.length) {
          return { modulo: key, label, quantidade: 0, ok: false, mensagem: "Nenhum curso encontrado" };
        }

        replaceCourses(rows.map(adaptarCursoImportado));

        return { modulo: key, label, quantidade: rows.length, ok: true };
      }

      case "planoMetas": {
        const rows = await importarPlanoMetasExcel(file);
        if (!rows.length) {
          return { modulo: key, label, quantidade: 0, ok: false, mensagem: "Aba não encontrada ou vazia" };
        }

        replacePlanoMetas(
          rows.map((r) => {
            const curso = String(r.curso || r.tipo || "").trim();
            return {
              segmento: r.segmento,
              curso,
              categoria: r.categoria || "Não informado",
              tipo: curso,
              numeroSEI: r.numeroSEI,
              codigoSIG: r.codigoSIG,
              mesEntrega: r.mesEntrega,
              status: r.status,
              origem: r.origem,
              observacao: r.observacao,
              responsavel: r.responsavel ?? "",
              statusFinal: r.statusFinal,
            };
          }),
        );

        return { modulo: key, label, quantidade: rows.length, ok: true };
      }

      case "pca": {
        const rows = await importarValoresPCAExcel(file);
        if (!rows.length) {
          return { modulo: key, label, quantidade: 0, ok: false, mensagem: "Aba PCA não encontrada ou vazia" };
        }

        replaceValoresPCA(
          rows.map((row) => ({
            ano: String(row.ano || "2025"),
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
          })),
        );

        return { modulo: key, label, quantidade: rows.length, ok: true };
      }

      case "cursosEixo": {
        const rows = await importarCursosEixoExcel(file);
        const validos = rows.filter((r) => String(r.curso || "").trim());

        if (!validos.length) {
          return { modulo: key, label, quantidade: 0, ok: false, mensagem: "Aba detalhada não encontrada" };
        }

        replaceCursosEixo(
          validos.map((row) => ({
            ano: String(row.ano || "2025"),
            eixo: String(row.eixo || row.segmento || ""),
            unidade: String(row.unidade || ""),
            curso: String(row.curso || ""),
            ch: String(row.ch || ""),
            status: String(row.status || "Ativo"),
            observacao: String(row.observacao || ""),
            quantidadeCursosSegmento: String(row.quantidadeCursosSegmento || ""),
            turmas: String(row.turmas || ""),
            codigo: String(row.codigo || ""),
            alunos: String(row.alunos || ""),
            instrutores: String(row.instrutores || ""),
            isNovo: Boolean(row.isNovo),
          })),
        );

        return { modulo: key, label, quantidade: validos.length, ok: true };
      }

      case "visitas": {
        const rows = await importarVisitasTecnicasExcel(file);
        if (!rows.length) {
          return { modulo: key, label, quantidade: 0, ok: false, mensagem: "Nenhuma visita válida" };
        }

        replaceVisitas(
          rows.map((r) => ({
            ano: r.ano,
            unidade: r.unidade,
            eixo: r.eixo,
            processoSEI: r.processoSEI,
            dataSolicitacao: r.dataSolicitacao,
            dataVisitaPrevista: r.dataVisitaPrevista,
            prazoLimite: r.prazoLimite,
            status: r.status,
            responsavel: r.responsavel,
            relatorio: r.relatorio,
            observacao: r.observacao,
          })),
        );

        return { modulo: key, label, quantidade: rows.length, ok: true };
      }

      case "horas": {
        const rows = await importarHorasPedagogicasExcel(file);
        if (!rows.length) {
          return { modulo: key, label, quantidade: 0, ok: false, mensagem: "Nenhuma solicitação válida" };
        }

        replaceHoras(
          rows.map((r) => ({
            ano: r.ano || "2025",
            processoSEI: r.processoSEI || "",
            eixo: r.eixo || "",
            segmento: r.segmento || "",
            nomePessoa: r.nomePessoa || "",
            matricula: r.matricula || "",
            motivo: r.motivo || "",
            observacao: r.observacao || "",
            status: r.status || "Solicitada",
            ativo: r.ativo ?? true,
          })),
        );

        return { modulo: key, label, quantidade: rows.length, ok: true };
      }

      case "acoes": {
        const rows = await importarAcoesExtensivasExcel(file);
        if (!rows.length) {
          return { modulo: key, label, quantidade: 0, ok: false, mensagem: "Aba não encontrada ou vazia" };
        }

        replaceAcoesExtensivas(
          rows.map((r) => ({
            ano: String(r.ano || "2025"),
            titulo: String(r.titulo || ""),
            eixo: String(r.eixo || ""),
            unidade: String(r.unidade || ""),
            cargaHoraria: String(r.cargaHoraria || ""),
            data: String(r.data || ""),
            processoSEI: String(r.processoSEI || ""),
            status: String(r.status || "Ativa"),
            observacao: String(r.observacao || ""),
          })),
        );

        return { modulo: key, label, quantidade: rows.length, ok: true };
      }

      case "eventos": {
        const rows = await importarEventosExcel(file);
        if (!rows.length) {
          return { modulo: key, label, quantidade: 0, ok: false, mensagem: "Aba não encontrada ou vazia" };
        }

        replaceEventos(
          rows.map((r) => ({
            ano: String(r.ano || "2025"),
            nome: String(r.nome || ""),
            data: String(r.data || ""),
            unidade: String(r.unidade || ""),
            eixo: String(r.eixo || ""),
            quantidadePessoas: String(r.quantidadePessoas || ""),
            equipe: String(r.equipe || ""),
            possuiAcaoExtensiva: String(r.possuiAcaoExtensiva || "Não"),
            acaoVinculada: String(r.acaoVinculada || ""),
            status: String(r.status || "Planejado"),
            observacao: String(r.observacao || ""),
          })),
        );

        return { modulo: key, label, quantidade: rows.length, ok: true };
      }

      default:
        return { modulo: key, label, quantidade: 0, ok: false, mensagem: "Módulo desconhecido" };
    }
  } catch (error) {
    console.error(`Erro ao importar ${label}:`, error);
    return {
      modulo: key,
      label,
      quantidade: 0,
      ok: false,
      mensagem: "Erro ao processar aba",
    };
  }
}

export async function importarPortfolioCompleto(
  file: File,
  options?: { fileName?: string },
): Promise<ResultadoPortfolioCompleto> {
  const preview = await analisarPortfolioCompleto(file);
  if (!preview.podeImportar) {
    return {
      resultados: MODULOS.map(({ key, label }) => ({
        modulo: key,
        label,
        quantidade: 0,
        ok: false,
        mensagem: preview.avisosGerais[0] ?? "Planilha não reconhecida",
      })),
      totalImportado: 0,
      sucesso: false,
    };
  }

  const resultados = await Promise.all(
    MODULOS.map(({ key }) => importarModulo(file, key)),
  );

  const totalImportado = resultados.reduce((sum, item) => sum + item.quantidade, 0);
  const importouNucleo = resultados.some(
    (item) => item.ok && item.quantidade > 0 && MODULOS_NUCLEO.includes(item.modulo),
  );
  const sucesso = importouNucleo;

  if (sucesso) {
    const resumo = resultados
      .filter((r) => r.quantidade > 0)
      .map((r) => `${r.label}: ${r.quantidade}`)
      .join("; ");
    logActivity("Planilha importada", resumo);
    recordImportHistory(options?.fileName || file.name, resultados, totalImportado);
    notifyDataChanged("import");
  }

  return { resultados, totalImportado, sucesso };
}

export function limparPortfolioCompleto(): ResultadoPortfolioCompleto {
  limparDadosPortfolio();

  const resultados: ResultadoModulo[] = MODULOS.map(({ key, label }) => ({
    modulo: key,
    label,
    quantidade: 0,
    ok: true,
    mensagem: "Limpo",
  }));

  logActivity(
    "Dados do portfólio limpos",
    "Cursos, Metas, PCA, Eixo, Visitas, Horas, Acoes e Eventos zerados",
  );
  notifyDataChanged("clear");
  return { resultados, totalImportado: 0, sucesso: true };
}
