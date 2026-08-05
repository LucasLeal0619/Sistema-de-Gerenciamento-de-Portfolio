import { useMemo, useState } from "react";
import { Eye, Search, X, FileText, CalendarDays, Users } from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";

const AUDITORIA_EVENTS = [
  {
    id: "1",
    data: "2026-07-10T10:18:00",
    usuario: "Ana Souza",
    email: "ana.souza@df.senac.br",
    acao: "Criado",
    modulo: "Cursos",
    resumo: "Cadastro de curso Gestão de Pessoas - Turma 1",
  },
  {
    id: "2",
    data: "2026-07-09T14:23:00",
    usuario: "Bruno Lima",
    email: "bruno.lima@df.senac.br",
    acao: "Importado",
    modulo: "Importações",
    resumo: "Planilha de PCA importada com 182 registros",
  },
  {
    id: "3",
    data: "2026-07-08T09:12:00",
    usuario: "Carla Melo",
    email: "carla.melo@df.senac.br",
    acao: "Atualizado",
    modulo: "Plano de Metas",
    resumo: "Alteração do status do curso de 2025 para Publicado",
  },
  {
    id: "4",
    data: "2026-07-07T16:45:00",
    usuario: "Diego Rabelo",
    email: "diego.rabelo@df.senac.br",
    acao: "Excluído",
    modulo: "Cursos",
    resumo: "Remoção de curso duplicado do eixo Tecnologia",
  },
  {
    id: "5",
    data: "2026-07-05T11:05:00",
    usuario: "Equipe SGP",
    email: "sistema@df.senac.br",
    acao: "Visualizado",
    modulo: "Auditoria",
    resumo: "Consulta ao histórico de auditoria do dia 05/07/2026",
  },
];

const MODULE_OPTIONS = ["Todos os módulos", "Cursos", "Importações", "Plano de Metas", "Auditoria"];
const ACTION_OPTIONS = ["Todas as ações", "Criado", "Atualizado", "Excluído", "Importado", "Visualizado"];

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

export function Auditoria() {
  const { canManageUsers } = usePermissions();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState(MODULE_OPTIONS[0]);
  const [actionFilter, setActionFilter] = useState(ACTION_OPTIONS[0]);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selected, setSelected] = useState<typeof AUDITORIA_EVENTS[0] | null>(null);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return AUDITORIA_EVENTS.filter((item) => {
      if (moduleFilter !== MODULE_OPTIONS[0] && item.modulo !== moduleFilter) return false;
      if (actionFilter !== ACTION_OPTIONS[0] && item.acao !== actionFilter) return false;
      if (query) {
        const content = `${item.usuario} ${item.email} ${item.acao} ${item.modulo} ${item.resumo}`.toLowerCase();
        if (!content.includes(query)) return false;
      }
      if (dateStart && new Date(item.data) < new Date(dateStart)) return false;
      if (dateEnd && new Date(item.data) > new Date(`${dateEnd}T23:59:59`)) return false;
      return true;
    });
  }, [search, moduleFilter, actionFilter, dateStart, dateEnd]);

  if (!canManageUsers) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] p-6 pt-20 lg:p-8 lg:pt-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          <h1 className="text-xl font-semibold">Acesso negado</h1>
          <p className="mt-2 text-sm text-red-700">
            Você não possui permissão para visualizar o histórico de auditoria. Entre em contato com o administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6 pt-20 lg:p-8 lg:pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#003F7D]">Auditoria</h1>
              <p className="mt-1 text-sm text-gray-600">
                Histórico de cadastros, edições, exclusões e importações.
              </p>
            </div>
            <div className="rounded-2xl border border-[#003F7D]/10 bg-[#E8EFF7] px-4 py-3 text-sm text-[#003F7D]">
              Registro automático de quem alterou cada módulo do SGP.
              Disponível apenas para administradores.
            </div>
          </div>
        </header>

        <section className="grid gap-3 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-[#003F7D]">Filtros de auditoria</h2>
              <p className="mt-1 text-sm text-gray-500">
                Busque por ações, módulo ou período para encontrar eventos específicos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setModuleFilter(MODULE_OPTIONS[0]);
                  setActionFilter(ACTION_OPTIONS[0]);
                  setDateStart("");
                  setDateEnd("");
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50"
              >
                <X size={16} /> Limpar filtros
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block text-sm text-gray-700">
              Busca
              <div className="mt-2 flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2">
                <Search size={16} className="text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar no resumo, módulo ou ação..."
                  className="ml-2 w-full border-none bg-transparent text-sm outline-none"
                />
              </div>
            </label>

            <label className="block text-sm text-gray-700">
              Módulo
              <select
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none"
              >
                {MODULE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-gray-700">
              Ação
              <select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none"
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-gray-700">
                Data início
                <input
                  type="date"
                  value={dateStart}
                  onChange={(event) => setDateStart(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none"
                />
              </label>
              <label className="block text-sm text-gray-700">
                Data fim
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(event) => setDateEnd(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#003F7D]">Eventos de auditoria</h2>
              <p className="text-sm text-gray-500">
                {filteredEvents.length} registro{filteredEvents.length !== 1 ? "s" : ""} encontrado{filteredEvents.length !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="border-b border-gray-200 bg-[#F5F7FA] text-xs uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th className="px-3 py-3">Quando</th>
                  <th className="px-3 py-3">Usuário</th>
                  <th className="px-3 py-3">Ação</th>
                  <th className="px-3 py-3">Módulo</th>
                  <th className="px-3 py-3">Resumo</th>
                  <th className="px-3 py-3 text-center">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-gray-400">
                      Nenhum evento de auditoria encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3 align-top text-sm text-gray-600">{formatDate(item.data)}</td>
                      <td className="px-3 py-3 align-top">
                        <div className="text-sm font-semibold text-gray-900">{item.usuario}</div>
                        <div className="text-xs text-gray-500">{item.email}</div>
                      </td>
                      <td className="px-3 py-3 align-top text-sm text-gray-700">{item.acao}</td>
                      <td className="px-3 py-3 align-top text-sm text-gray-700">{item.modulo}</td>
                      <td className="px-3 py-3 align-top text-sm text-gray-600">{item.resumo}</td>
                      <td className="px-3 py-3 align-top text-center">
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#003F7D] bg-[#E8EFF7] px-3 text-sm font-semibold text-[#003F7D] hover:bg-[#003F7D]/10"
                        >
                          <Eye size={16} /> Ver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#003F7D]">Detalhe do evento</h2>
                <p className="mt-1 text-sm text-gray-500">Informações completas do registro selecionado.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Quando</p>
                <p className="mt-1 text-sm text-gray-700">{formatDate(selected.data)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Usuário</p>
                <p className="mt-1 text-sm text-gray-700">{selected.usuario}</p>
                <p className="text-xs text-gray-500">{selected.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Ação</p>
                <p className="mt-1 text-sm text-gray-700">{selected.acao}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Módulo</p>
                <p className="mt-1 text-sm text-gray-700">{selected.modulo}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-[#F8FAFC] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Resumo</p>
              <p className="mt-2 text-sm text-gray-700">{selected.resumo}</p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#003F7D] px-4 text-sm font-semibold text-white hover:bg-[#002D5A]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
