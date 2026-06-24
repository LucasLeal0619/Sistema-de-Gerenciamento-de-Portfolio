import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Search, Shield, Users as UsersIcon, UserCheck, Eye, X,
  CheckCircle, Info, Clock, Filter, Plus, Pencil, Trash2,
} from "lucide-react";
import { HorizontalScrollContainer } from "../components/layout";
import { Button } from "../components/ui/button";
import { useConfirm } from "../components/ConfirmProvider";
import { deleteUser, getStoredUsers, UserRecord } from "../utils/store";
import { getSession } from "../utils/auth";
import { toastError } from "../utils/toast";
import { logActivity } from "../utils/activityLog";
import {
  PERFIL_LABELS,
  PERFIL_STYLE,
  STATUS_STYLE,
  getInitials,
  isStatusAtivo,
  normalizeStatusLabel,
  perfilToLabel,
  perfilToSlug,
} from "../utils/userHelpers";

function Avatar({ nome, perfil }: { nome: string; perfil: string }) {
  const slug = perfilToSlug(perfil);
  const color = slug === "admin" ? "#003F7D" : slug === "editor" ? "#2E7D32" : "#6A1B9A";
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 shadow-sm"
      style={{ backgroundColor: color }}
    >
      {getInitials(nome)}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = normalizeStatusLabel(status);
  const s = STATUS_STYLE[label] ?? STATUS_STYLE.Inativo;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

function ModalView({ user, onClose, onEdit }: { user: UserRecord; onClose: () => void; onEdit: () => void }) {
  const slug = perfilToSlug(user.perfil);
  const ps = PERFIL_STYLE[slug] ?? { bg: "bg-gray-100", text: "text-gray-700" };
  const telefone = user.telefone && user.telefone !== "—" ? user.telefone : "Não informado";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="h-1 w-full bg-[#003F7D]" />
        <div className="px-7 py-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-[#003F7D]">Detalhes do Usuário</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <Avatar nome={user.nome} perfil={user.perfil} />
            <div>
              <p className="font-bold text-gray-900">{user.nome}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ps.bg} ${ps.text}`}>
                  {perfilToLabel(user.perfil)}
                </span>
                <StatusBadge status={user.status} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Telefone</p>
              <p className="text-gray-800 font-medium">{telefone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Unidade</p>
              <p className="text-gray-800 font-medium">{user.unidade || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Último acesso</p>
              <p className="text-gray-800 flex items-center gap-1">
                <Clock size={12} className="text-gray-400" />
                {user.ultimoAcesso || "—"}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button className="bg-[#F57C00] hover:bg-[#E06900] h-10 px-5 gap-2 text-sm" onClick={onEdit}>
              <Pencil size={14} /> Editar Usuário
            </Button>
            <Button variant="outline" className="h-10 px-5 text-sm" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ModalState =
  | { type: "none" }
  | { type: "view"; user: UserRecord };

export function Users() {
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [users, setUsers] = useState<UserRecord[]>(getStoredUsers);
  const [search, setSearch] = useState("");
  const [filterPerfil, setFilterPerfil] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [successMsg, setSuccessMsg] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const refresh = () => setUsers(getStoredUsers());

  useEffect(() => {
    refresh();
    const msg = (location.state as { success?: string } | null)?.success;
    if (msg) {
      setSuccessMsg(msg);
      const t = setTimeout(() => setSuccessMsg(""), 4000);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(t);
    }
  }, [location.pathname, location.state]);

  const filtered = useMemo(() => users.filter(u => {
    if (filterPerfil !== "Todos" && perfilToLabel(u.perfil) !== filterPerfil) return false;
    if (filterStatus !== "Todos" && normalizeStatusLabel(u.status) !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const telefone = (u.telefone ?? "").toLowerCase();
      if (
        !u.nome.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q) &&
        !(u.unidade ?? "").toLowerCase().includes(q) &&
        !telefone.includes(q)
      ) return false;
    }
    return true;
  }), [users, search, filterPerfil, filterStatus]);

  const total = users.length;
  const ativos = users.filter(u => isStatusAtivo(u.status)).length;
  const admins = users.filter(u => perfilToSlug(u.perfil) === "admin").length;
  const editores = users.filter(u => perfilToSlug(u.perfil) === "editor").length;
  const consultivos = users.filter(u => perfilToSlug(u.perfil) === "consultivo").length;

  const hasFilters = search || filterPerfil !== "Todos" || filterStatus !== "Todos";
  const clearFilters = () => { setSearch(""); setFilterPerfil("Todos"); setFilterStatus("Todos"); };

  const handleDelete = async (user: UserRecord) => {
    const session = getSession();
    if (session?.userId === user.id) {
      toastError("Você não pode excluir o próprio usuário enquanto está logado.");
      return;
    }

    const admins = users.filter(u => perfilToSlug(u.perfil) === "admin");
    if (perfilToSlug(user.perfil) === "admin" && admins.length <= 1) {
      toastError("Não é possível excluir o último administrador do sistema.");
      return;
    }

    const ok = await confirm({
      title: "Excluir usuário",
      message: `Deseja excluir o usuário "${user.nome}"?\n\nEsta ação não pode ser desfeita.`,
      destructive: true,
      confirmLabel: "Excluir",
    });
    if (!ok) return;

    deleteUser(user.id);
    logActivity("Usuário excluído", user.nome);
    refresh();
    setSuccessMsg(`Usuário "${user.nome}" excluído com sucesso.`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="min-h-screen w-full bg-white">
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      <div className="border-b border-gray-200 pt-20 px-4 pb-6 lg:pt-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#003F7D]">Usuários</h1>
            <p className="text-sm text-gray-500 mt-1">Controle de acesso e perfis do SGP — SENAC DF</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/app/usuarios/novo">
              <Button className="h-11 px-5 gap-2 bg-[#F57C00] hover:bg-[#E67300] text-white font-semibold">
                <Plus size={18} />
                Novo Usuário
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-blue-100 bg-blue-50">
          <Info size={14} className="text-blue-500 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            A gestão de usuários poderá ser integrada à API institucional do SENAC, SEI ou SIG, conforme definição técnica.
          </p>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          className={`rounded-xl p-5 cursor-pointer transition-all ${filterStatus === "Todos" && filterPerfil === "Todos" ? "bg-gradient-to-br from-[#003F7D] to-[#00355C] text-white shadow-lg" : "bg-white border border-gray-200 hover:border-[#003F7D] hover:shadow-sm"}`}
          onClick={clearFilters}
        >
          <div className="flex items-center gap-2 mb-3">
            <UsersIcon size={16} className={filterStatus === "Todos" && filterPerfil === "Todos" ? "opacity-80" : "text-gray-400"} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${filterStatus === "Todos" && filterPerfil === "Todos" ? "opacity-70" : "text-gray-400"}`}>Total</span>
          </div>
          <p className={`text-3xl font-bold ${filterStatus === "Todos" && filterPerfil === "Todos" ? "" : "text-[#003F7D]"}`}>{total}</p>
          <p className={`text-xs mt-1 ${filterStatus === "Todos" && filterPerfil === "Todos" ? "opacity-70" : "text-gray-500"}`}>usuários cadastrados</p>
        </div>

        <div
          className={`rounded-xl p-5 cursor-pointer transition-all ${filterStatus === "Ativo" ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg" : "bg-white border border-gray-200 hover:border-emerald-400 hover:shadow-sm"}`}
          onClick={() => setFilterStatus(filterStatus === "Ativo" ? "Todos" : "Ativo")}
        >
          <div className="flex items-center gap-2 mb-3">
            <UserCheck size={16} className={filterStatus === "Ativo" ? "opacity-80" : "text-gray-400"} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${filterStatus === "Ativo" ? "opacity-70" : "text-gray-400"}`}>Ativos</span>
          </div>
          <p className={`text-3xl font-bold ${filterStatus === "Ativo" ? "" : "text-emerald-600"}`}>{ativos}</p>
          <p className={`text-xs mt-1 ${filterStatus === "Ativo" ? "opacity-70" : "text-gray-500"}`}>com acesso ativo</p>
        </div>

        <div
          className={`rounded-xl p-5 cursor-pointer transition-all ${filterPerfil === "Administrador" ? "bg-gradient-to-br from-[#F57C00] to-[#E06900] text-white shadow-lg" : "bg-white border border-gray-200 hover:border-orange-300 hover:shadow-sm"}`}
          onClick={() => setFilterPerfil(filterPerfil === "Administrador" ? "Todos" : "Administrador")}
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className={filterPerfil === "Administrador" ? "opacity-80" : "text-gray-400"} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${filterPerfil === "Administrador" ? "opacity-70" : "text-gray-400"}`}>Admins</span>
          </div>
          <p className={`text-3xl font-bold ${filterPerfil === "Administrador" ? "" : "text-[#F57C00]"}`}>{admins}</p>
          <p className={`text-xs mt-1 ${filterPerfil === "Administrador" ? "opacity-70" : "text-gray-500"}`}>administradores</p>
        </div>

        <div
          className={`rounded-xl p-5 cursor-pointer transition-all ${filterPerfil === "Editor" ? "bg-gradient-to-br from-green-600 to-green-800 text-white shadow-lg" : "bg-white border border-gray-200 hover:border-green-400 hover:shadow-sm"}`}
          onClick={() => setFilterPerfil(filterPerfil === "Editor" ? "Todos" : "Editor")}
        >
          <div className="flex items-center gap-2 mb-3">
            <UserCheck size={16} className={filterPerfil === "Editor" ? "opacity-80" : "text-gray-400"} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${filterPerfil === "Editor" ? "opacity-70" : "text-gray-400"}`}>Editores</span>
          </div>
          <p className={`text-3xl font-bold ${filterPerfil === "Editor" ? "" : "text-green-700"}`}>{editores}</p>
          <p className={`text-xs mt-1 ${filterPerfil === "Editor" ? "opacity-70" : "text-gray-500"}`}>perfis de edição</p>
        </div>

        <div
          className={`rounded-xl p-5 cursor-pointer transition-all col-span-2 lg:col-span-1 ${filterPerfil === "Consultivo" ? "bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-lg" : "bg-white border border-gray-200 hover:border-purple-400 hover:shadow-sm"}`}
          onClick={() => setFilterPerfil(filterPerfil === "Consultivo" ? "Todos" : "Consultivo")}
        >
          <div className="flex items-center gap-2 mb-3">
            <Eye size={16} className={filterPerfil === "Consultivo" ? "opacity-80" : "text-gray-400"} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${filterPerfil === "Consultivo" ? "opacity-70" : "text-gray-400"}`}>Consultivos</span>
          </div>
          <p className={`text-3xl font-bold ${filterPerfil === "Consultivo" ? "" : "text-purple-700"}`}>{consultivos}</p>
          <p className={`text-xs mt-1 ${filterPerfil === "Consultivo" ? "opacity-70" : "text-gray-500"}`}>somente leitura</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-xl px-4 py-3 mx-4 lg:mx-8 mb-6 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou unidade..."
            className="w-full pl-9 pr-3 h-9 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
          />
        </div>
        <Filter size={14} className="text-gray-400" />
        <select value={filterPerfil} onChange={e => setFilterPerfil(e.target.value)}
          className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
          <option value="Todos">Todos os perfis</option>
          {PERFIL_LABELS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
          <option value="Todos">Todos os status</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
          <option value="Suspenso">Suspenso</option>
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="h-9 px-3 flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
            <X size={13} /> Limpar
          </button>
        )}
      </div>

      <div className="px-4 lg:px-8 pb-10">
        <div className="rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-700">
              {filtered.length} usuário{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <HorizontalScrollContainer>
            <table className="w-full text-sm">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="text-left font-semibold px-5 py-3 text-xs uppercase tracking-wide">Usuário</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wide">Telefone</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wide">Perfil</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wide">Unidade</th>
                  <th className="text-center font-semibold px-4 py-3 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wide">Último acesso</th>
                  <th className="text-center font-semibold px-4 py-3 text-xs uppercase tracking-wide w-28">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <UsersIcon size={32} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-400 text-sm">Nenhum usuário encontrado para os filtros selecionados.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, idx) => {
                    const slug = perfilToSlug(u.perfil);
                    const ps = PERFIL_STYLE[slug] ?? { bg: "bg-gray-100", text: "text-gray-600" };
                    const telefone = u.telefone && u.telefone !== "—" ? u.telefone : "—";
                    return (
                      <tr key={u.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/40 transition-colors`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar nome={u.nome} perfil={u.perfil} />
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{u.nome}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 text-sm">{telefone}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ps.bg} ${ps.text}`}>
                            {perfilToLabel(u.perfil)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 text-sm">{u.unidade || "—"}</td>
                        <td className="px-4 py-3.5 text-center">
                          <StatusBadge status={u.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={11} className="text-gray-300" /> {u.ultimoAcesso || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setModal({ type: "view", user: u })}
                              className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                              title="Visualizar"
                            >
                              <Eye size={14} />
                            </button>
                            <Link
                              to={`/app/usuarios/editar/${u.id}`}
                              className="p-1.5 rounded hover:bg-amber-100 text-amber-600 transition-colors inline-flex"
                              title="Editar usuário"
                              onClick={() => refresh()}
                            >
                              <Pencil size={14} />
                            </Link>
                            <button
                              onClick={() => handleDelete(u)}
                              className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                              title="Excluir usuário"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </HorizontalScrollContainer>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 text-right">
            {total} usuário{total !== 1 ? "s" : ""} no total · {ativos} ativo{ativos !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {modal.type === "view" && (
        <ModalView
          user={modal.user}
          onClose={() => setModal({ type: "none" })}
          onEdit={() => {
            const id = modal.user.id;
            setModal({ type: "none" });
            navigate(`/app/usuarios/editar/${id}`);
          }}
        />
      )}
    </div>
  );
}
