import { useState, useMemo } from "react";
import {
  Search, Shield, Users as UsersIcon, UserCheck, Eye, X,
  CheckCircle, Info, AlertTriangle, Clock, Save, Filter,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { getStoredUsers, updateUser, UserRecord } from "../utils/store";

const PERFIS = ["Administrador", "Editor", "Consultivo"];
const STATUS_LIST = ["Ativo", "Inativo", "Suspenso"];

const PERFIL_STYLE: Record<string, { bg: string; text: string }> = {
  admin:      { bg: "bg-blue-100",   text: "text-blue-800" },
  editor:     { bg: "bg-green-100",  text: "text-green-800" },
  consultivo: { bg: "bg-purple-100", text: "text-purple-800" },
};

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  online:    { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  offline:   { bg: "bg-gray-100",   text: "text-gray-500",    dot: "bg-gray-400" },
  Ativo:     { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  Inativo:   { bg: "bg-gray-100",   text: "text-gray-500",    dot: "bg-gray-400" },
  Suspenso:  { bg: "bg-red-100",    text: "text-red-700",     dot: "bg-red-500" },
};

function Avatar({ initials, roleType }: { initials: string; roleType: string }) {
  const color = roleType === "admin" ? "#003F7D" : roleType === "editor" ? "#2E7D32" : "#6A1B9A";
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 shadow-sm"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.offline;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status === "online" ? "Online" : status === "offline" ? "Offline" : status}
    </span>
  );
}

// ── Modal: Visualizar ─────────────────────────────────────────────────────────

function ModalView({ user, onClose, onEditPerms }: { user: UserRecord; onClose: () => void; onEditPerms: () => void }) {
  const ps = PERFIL_STYLE[user.roleType] ?? { bg: "bg-gray-100", text: "text-gray-700" };
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
            <Avatar initials={user.avatar} roleType={user.roleType} />
            <div>
              <p className="font-bold text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ps.bg} ${ps.text}`}>{user.role}</span>
                <StatusDot status={user.status} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Unidade</p>
              <p className="text-gray-800 font-medium">{user.unidade}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Área</p>
              <p className="text-gray-800 font-medium">{user.area}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Último acesso</p>
              <p className="text-gray-800 flex items-center gap-1"><Clock size={12} className="text-gray-400" /> {user.lastAccess}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Desde</p>
              <p className="text-gray-800">{user.dataIngresso}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button className="bg-[#003F7D] hover:bg-[#002D5A] h-10 px-5 gap-2 text-sm" onClick={onEditPerms}>
              <Shield size={14} /> Editar Permissões
            </Button>
            <Button variant="outline" className="h-10 px-5 text-sm" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Editar Permissões ──────────────────────────────────────────────────

function ModalPerms({ user, onClose, onSave }: { user: UserRecord; onClose: () => void; onSave: (id: string, data: Partial<UserRecord>) => void }) {
  const roleTypeFromLabel: Record<string, string> = {
    "Administrador": "admin", "Editor": "editor", "Consultivo": "consultivo",
  };
  const [perfil, setPerfil] = useState(user.role);
  const [status, setStatus] = useState(
    user.status === "online" ? "Ativo" : user.status === "offline" ? "Inativo" : user.status
  );

  const handleSave = () => {
    const roleType = roleTypeFromLabel[perfil] ?? "consultivo";
    onSave(user.id, {
      role: perfil,
      roleType,
      status: status === "Ativo" ? "online" : status === "Inativo" ? "offline" : status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="h-1 w-full bg-[#F57C00]" />
        <div className="px-7 py-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-[#003F7D]" />
              <h2 className="text-lg font-bold text-[#003F7D]">Editar Permissões</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <p className="text-xs text-gray-500 mb-5">{user.name} — {user.email}</p>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Perfil de Acesso</Label>
              <select
                value={perfil}
                onChange={e => setPerfil(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
              >
                {PERFIS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {perfil === "Administrador" && "Acesso total ao sistema, incluindo gestão de usuários."}
                {perfil === "Editor" && "Pode criar e editar registros, sem acesso à gestão de usuários."}
                {perfil === "Consultivo" && "Somente leitura. Não pode alterar dados."}
              </p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Status de Acesso</Label>
              <div className="flex gap-2">
                {STATUS_LIST.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      status === s
                        ? s === "Ativo" ? "bg-emerald-600 text-white border-emerald-600"
                        : s === "Suspenso" ? "bg-red-600 text-white border-red-600"
                        : "bg-gray-700 text-white border-gray-700"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Info size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Alterações de permissão têm efeito imediato. Em uma integração com API institucional, este fluxo poderá ser substituído.
            </p>
          </div>

          <div className="flex gap-3 mt-5">
            <Button className="bg-[#F57C00] hover:bg-[#E06900] h-10 px-5 gap-2 text-sm" onClick={handleSave}>
              <Save size={14} /> Salvar
            </Button>
            <Button variant="outline" className="h-10 px-5 text-sm" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Confirmação Novo Usuário ───────────────────────────────────────────

function ModalConfirmNovo({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="h-1 w-full bg-amber-400" />
        <div className="px-7 py-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Cadastro manual de usuário</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            O gerenciamento de usuários poderá ser integrado à <strong>API institucional do SENAC, SEI ou SIG</strong> futuramente. Cadastros manuais podem precisar de revisão após essa integração.
          </p>
          <p className="text-sm text-gray-500">Deseja continuar com o cadastro manual?</p>
          <div className="flex gap-3 mt-5">
            <Button className="bg-[#003F7D] hover:bg-[#002D5A] h-10 px-5 text-sm" onClick={onConfirm}>
              Sim, continuar
            </Button>
            <Button variant="outline" className="h-10 px-5 text-sm" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

type ModalState =
  | { type: "none" }
  | { type: "view"; user: UserRecord }
  | { type: "perms"; user: UserRecord }
  | { type: "confirm_novo" };

export function Users() {
  const [users, setUsers] = useState<UserRecord[]>(getStoredUsers);
  const [search, setSearch] = useState("");
  const [filterPerfil, setFilterPerfil] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [successMsg, setSuccessMsg] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const refresh = () => setUsers(getStoredUsers());
  const toast = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 4000); };

  const filtered = useMemo(() => users.filter(u => {
    if (filterPerfil !== "Todos" && u.role !== filterPerfil) return false;
    if (filterStatus !== "Todos") {
      const statusLabel = u.status === "online" ? "Ativo" : u.status === "offline" ? "Inativo" : u.status;
      if (statusLabel !== filterStatus) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !u.unidade.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [users, search, filterPerfil, filterStatus]);

  const total = users.length;
  const ativos = users.filter(u => u.status === "online").length;
  const admins = users.filter(u => u.roleType === "admin").length;
  const editores = users.filter(u => u.roleType === "editor").length;

  const handleSavePerms = (id: string, data: Partial<UserRecord>) => {
    updateUser(id, data);
    refresh();
    setModal({ type: "none" });
    toast("Permissões atualizadas com sucesso.");
  };

  const hasFilters = search || filterPerfil !== "Todos" || filterStatus !== "Todos";
  const clearFilters = () => { setSearch(""); setFilterPerfil("Todos"); setFilterStatus("Todos"); };

  return (
    <div className="min-h-screen w-full bg-white">
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 pt-20 px-4 pb-6 lg:pt-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#003F7D]">Usuários</h1>
            <p className="text-sm text-gray-500 mt-1">Controle de acesso e perfis do SGP — SENAC DF</p>
          </div>
          <button
            onClick={() => setModal({ type: "confirm_novo" })}
            className="text-sm text-gray-400 border border-gray-200 rounded-lg px-4 py-2 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center gap-2"
          >
            <UsersIcon size={14} />
            Novo usuário
          </button>
        </div>

        {/* Aviso API */}
        <div className="mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-blue-100 bg-blue-50">
          <Info size={14} className="text-blue-500 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            A gestão de usuários poderá ser integrada à API institucional do SENAC, SEI ou SIG, conforme definição técnica.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="px-4 lg:px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <p className={`text-xs mt-1 ${filterStatus === "Ativo" ? "opacity-70" : "text-gray-500"}`}>online agora</p>
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
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-200 rounded-xl px-4 py-3 mx-4 lg:mx-8 mb-6 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou unidade..."
            className="w-full pl-9 pr-3 h-9 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
          />
        </div>
        <Filter size={14} className="text-gray-400" />
        <select value={filterPerfil} onChange={e => setFilterPerfil(e.target.value)}
          className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
          <option value="Todos">Todos os perfis</option>
          {PERFIS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
          <option value="Todos">Todos os status</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="h-9 px-3 flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
            <X size={13} /> Limpar
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="px-4 lg:px-8 pb-10">
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-700">
              {filtered.length} usuário{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="text-left font-semibold px-5 py-3 text-xs uppercase tracking-wide">Usuário</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wide">Perfil</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wide">Unidade</th>
                  <th className="text-center font-semibold px-4 py-3 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wide">Último acesso</th>
                  <th className="text-center font-semibold px-4 py-3 text-xs uppercase tracking-wide w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <UsersIcon size={32} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-400 text-sm">Nenhum usuário encontrado.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, idx) => {
                    const ps = PERFIL_STYLE[u.roleType] ?? { bg: "bg-gray-100", text: "text-gray-600" };
                    return (
                      <tr key={u.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/40 transition-colors`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar initials={u.avatar} roleType={u.roleType} />
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ps.bg} ${ps.text}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 text-sm">{u.unidade}</td>
                        <td className="px-4 py-3.5 text-center">
                          <StatusDot status={u.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={11} className="text-gray-300" /> {u.lastAccess}
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
                            <button
                              onClick={() => setModal({ type: "perms", user: u })}
                              className="p-1.5 rounded hover:bg-amber-100 text-amber-600 transition-colors"
                              title="Editar permissões"
                            >
                              <Shield size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-400 text-right">
            {total} usuário{total !== 1 ? "s" : ""} no total · {ativos} ativo{ativos !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Modais */}
      {modal.type === "view" && (
        <ModalView
          user={modal.user}
          onClose={() => setModal({ type: "none" })}
          onEditPerms={() => setModal({ type: "perms", user: modal.user })}
        />
      )}
      {modal.type === "perms" && (
        <ModalPerms
          user={modal.user}
          onClose={() => setModal({ type: "none" })}
          onSave={handleSavePerms}
        />
      )}
      {modal.type === "confirm_novo" && (
        <ModalConfirmNovo
          onConfirm={() => { setModal({ type: "none" }); window.location.href = "/app/usuarios/novo"; }}
          onClose={() => setModal({ type: "none" })}
        />
      )}
    </div>
  );
}
