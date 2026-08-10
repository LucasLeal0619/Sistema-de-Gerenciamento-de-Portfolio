import { useMemo, useState } from "react";
import { usePermissions } from "../hooks/usePermissions";
import { getActivityLog, type ActivityEntry } from "../utils/activityLog";
import { matchesSearchQuery } from "../utils/textSearch";
import { TabelaContador } from "../components/layout";

type AuditEvent = {
  id: string;
  data: string;
  usuario: string;
  email: string;
  acao: string;
  acaoClass: string;
  modulo: string;
  resumo: string;
  detalhes?: string;
};

const DEMO_EVENTS: AuditEvent[] = [
  {
    id: "demo-1",
    data: "2026-07-10T10:18:00",
    usuario: "Ana Souza",
    email: "ana.souza@df.senac.br",
    acao: "Criado",
    acaoClass: "acao-criar",
    modulo: "Cursos",
    resumo: "Cadastro de curso Gestão de Pessoas - Turma 1",
  },
  {
    id: "demo-2",
    data: "2026-07-09T14:23:00",
    usuario: "Bruno Lima",
    email: "bruno.lima@df.senac.br",
    acao: "Importado",
    acaoClass: "acao-importar",
    modulo: "Importações",
    resumo: "Planilha de PCA importada com 182 registros",
  },
  {
    id: "demo-3",
    data: "2026-07-08T09:12:00",
    usuario: "Carla Melo",
    email: "carla.melo@df.senac.br",
    acao: "Editado",
    acaoClass: "acao-editar",
    modulo: "Plano de Metas",
    resumo: "Alteração do status do curso de 2025 para Publicado",
  },
  {
    id: "demo-4",
    data: "2026-07-07T16:45:00",
    usuario: "Diego Rabelo",
    email: "diego.rabelo@df.senac.br",
    acao: "Excluído",
    acaoClass: "acao-excluir",
    modulo: "Cursos",
    resumo: "Remoção de curso duplicado do eixo Tecnologia",
  },
];

const MODULE_OPTIONS = [
  "Todos os módulos",
  "Cursos",
  "Importações",
  "Plano de Metas",
  "Usuários",
  "Auditoria",
  "Sistema",
];
const ACTION_OPTIONS = ["Todas as ações", "Criado", "Editado", "Excluído", "Importado"];

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapAction(acao: string): { label: string; className: string } {
  const text = acao.toLowerCase();
  if (text.includes("cadastr") || text.includes("criad")) {
    return { label: "Criado", className: "acao-criar" };
  }
  if (text.includes("import")) {
    return { label: "Importado", className: "acao-importar" };
  }
  if (text.includes("exclu") || text.includes("remov")) {
    return { label: "Excluído", className: "acao-excluir" };
  }
  if (text.includes("atualiz") || text.includes("alter") || text.includes("edit")) {
    return { label: "Editado", className: "acao-editar" };
  }
  return { label: "Editado", className: "acao-editar" };
}

function inferModule(acao: string, detalhes?: string): string {
  const content = `${acao} ${detalhes ?? ""}`.toLowerCase();
  if (content.includes("usuário") || content.includes("usuario")) return "Usuários";
  if (content.includes("import")) return "Importações";
  if (content.includes("plano")) return "Plano de Metas";
  if (content.includes("curso")) return "Cursos";
  if (content.includes("sessão") || content.includes("sessao")) return "Sistema";
  return "Sistema";
}

function mapLogEntry(entry: ActivityEntry): AuditEvent {
  const mapped = mapAction(entry.acao);
  return {
    id: entry.id,
    data: entry.timestamp,
    usuario: entry.usuario,
    email: entry.email,
    acao: mapped.label,
    acaoClass: mapped.className,
    modulo: inferModule(entry.acao, entry.detalhes),
    resumo: entry.detalhes ? `${entry.acao}: ${entry.detalhes}` : entry.acao,
    detalhes: entry.detalhes,
  };
}

function loadEvents(): AuditEvent[] {
  const logged = getActivityLog().map(mapLogEntry);
  if (logged.length) {
    return [...logged, ...DEMO_EVENTS].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }
  return DEMO_EVENTS;
}

export function Auditoria() {
  const { canManageUsers } = usePermissions();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState(MODULE_OPTIONS[0]);
  const [actionFilter, setActionFilter] = useState(ACTION_OPTIONS[0]);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const allEvents = useMemo(() => loadEvents(), []);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((item) => {
      if (moduleFilter !== MODULE_OPTIONS[0] && item.modulo !== moduleFilter) return false;
      if (actionFilter !== ACTION_OPTIONS[0] && item.acao !== actionFilter) return false;
      if (!matchesSearchQuery(search, item.usuario, item.email, item.acao, item.modulo, item.resumo)) {
        return false;
      }
      if (dateStart && new Date(item.data) < new Date(dateStart)) return false;
      if (dateEnd && new Date(item.data) > new Date(`${dateEnd}T23:59:59`)) return false;
      return true;
    });
  }, [allEvents, search, moduleFilter, actionFilter, dateStart, dateEnd]);

  if (!canManageUsers) {
    return (
      <div className="auditoria-page">
        <div className="alert alert-error">
          Você não possui permissão para visualizar o histórico de auditoria. Entre em contato com o administrador.
        </div>
      </div>
    );
  }

  return (
    <div className="auditoria-page">
      <header className="auditoria-top">
        <div className="auditoria-top-row">
          <div>
            <h1>Auditoria</h1>
            <p className="auditoria-subtitle">Histórico de cadastros, edições, exclusões e importações</p>
          </div>
        </div>
        <div className="auditoria-info">
          Registro automático de quem alterou cada módulo do SGP. Disponível apenas para administradores.
        </div>
      </header>

      <div className="filtros-bar">
        <div className="filtro-busca">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar no resumo, módulo ou ação..."
            type="search"
          />
        </div>
        <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
          {MODULE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
          {ACTION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateStart}
          onChange={(event) => setDateStart(event.target.value)}
          aria-label="Data início"
        />
        <input
          type="date"
          value={dateEnd}
          onChange={(event) => setDateEnd(event.target.value)}
          aria-label="Data fim"
        />
      </div>

      <section className="tabela-card">
        <div className="tabela-header">
          <TabelaContador count={filteredEvents.length} />
        </div>
        <div className="tabela-wrap">
          <table className="auditoria-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Módulo</th>
                <th>Resumo</th>
                <th className="text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="tabela-vazia">
                    Nenhum evento de auditoria encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.data)}</td>
                    <td>
                      <p className="user-nome">{item.usuario}</p>
                      <p className="user-email">{item.email}</p>
                    </td>
                    <td>
                      <span className={`badge-acao ${item.acaoClass}`}>{item.acao}</span>
                    </td>
                    <td>{item.modulo}</td>
                    <td className="resumo-cell">{item.resumo}</td>
                    <td className="text-center">
                      <button type="button" onClick={() => setSelected(item)} className="btn-link">
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalhe do evento</h2>
              <button type="button" className="btn-fechar" onClick={() => setSelected(null)} aria-label="Fechar">
                ×
              </button>
            </div>
            <div className="modal-body">
              <dl className="detalhe-lista">
                <div>
                  <dt>Quando</dt>
                  <dd>{formatDate(selected.data)}</dd>
                </div>
                <div>
                  <dt>Usuário</dt>
                  <dd>
                    {selected.usuario}
                    <br />
                    <span className="user-email">{selected.email}</span>
                  </dd>
                </div>
                <div>
                  <dt>Ação</dt>
                  <dd>
                    <span className={`badge-acao ${selected.acaoClass}`}>{selected.acao}</span>
                  </dd>
                </div>
                <div>
                  <dt>Módulo</dt>
                  <dd>{selected.modulo}</dd>
                </div>
                <div>
                  <dt>Resumo</dt>
                  <dd>{selected.resumo}</dd>
                </div>
                {selected.detalhes ? (
                  <div>
                    <dt>Detalhes</dt>
                    <dd>
                      <pre>{selected.detalhes}</pre>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
