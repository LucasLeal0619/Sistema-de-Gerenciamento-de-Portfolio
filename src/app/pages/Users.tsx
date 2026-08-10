import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useConfirm } from "../components/ConfirmProvider";
import { RecordDetailModal } from "../components/RecordDetailModal";
import { deleteUser, getStoredUsers, UserRecord } from "../utils/store";
import { getSession } from "../utils/auth";
import { logActivity } from "../utils/activityLog";
import {
  PERFIL_LABELS,
  getInitials,
  normalizeStatusLabel,
  perfilToLabel,
  perfilToSlug,
} from "../utils/userHelpers";
import { matchesSearchQuery } from "../utils/textSearch";
import { TabelaContador } from "../components/layout";

function avatarClass(perfil: string) {
  const slug = perfilToSlug(perfil);
  if (slug === "admin") return "avatar avatar-admin";
  if (slug === "editor") return "avatar avatar-editor";
  return "avatar avatar-consultor";
}

function badgePerfilClass(perfil: string) {
  const slug = perfilToSlug(perfil);
  if (slug === "admin") return "badge badge-admin";
  if (slug === "editor") return "badge badge-editor";
  return "badge badge-consultor";
}

function badgeStatusClass(status: string) {
  const label = normalizeStatusLabel(status);
  if (label === "Ativo") return "badge badge-ativo";
  return "badge badge-inativo";
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
  const [filterPerfil, setFilterPerfil] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
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

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        if (filterPerfil && perfilToLabel(u.perfil) !== filterPerfil) return false;
        if (filterStatus && normalizeStatusLabel(u.status) !== filterStatus) return false;
        if (!matchesSearchQuery(search, u.nome, u.email, u.unidade, u.telefone)) return false;
        return true;
      }),
    [users, search, filterPerfil, filterStatus]
  );

  const handleDelete = async (user: UserRecord) => {
    setErrorMsg("");
    const session = getSession();
    if (session?.userId === user.id) {
      setErrorMsg("Você não pode excluir o próprio usuário enquanto está logado.");
      return;
    }

    const admins = users.filter((u) => perfilToSlug(u.perfil) === "admin");
    if (perfilToSlug(user.perfil) === "admin" && admins.length <= 1) {
      setErrorMsg("Não é possível excluir o último administrador do sistema.");
      return;
    }

    const ok = await confirm({
      title: "Excluir usuário",
      message: `Tem certeza que deseja excluir o usuário "${user.nome}"?\n\nEsta ação não pode ser desfeita.`,
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
    <div className="usuarios-page">
      <header className="usuarios-top">
        <div className="usuarios-top-row">
          <div>
            <h1>Usuários</h1>
            <p className="usuarios-subtitle">Controle de acesso e perfis do SGP — SENAC DF</p>
          </div>
          <Link to="/app/usuarios/novo" className="btn-novo">
            <span className="btn-novo-icon">+</span>
            Novo Usuário
          </Link>
        </div>
        <div className="usuarios-info">
          O administrador cadastra o colaborador e define o e-mail e a senha de acesso ao sistema.
        </div>
      </header>

      {successMsg ? <div className="alert alert-success">{successMsg}</div> : null}
      {errorMsg ? <div className="alert alert-error">{errorMsg}</div> : null}

      <section className="filtros-bar">
        <div className="filtro-busca">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou unidade..."
            type="search"
          />
        </div>
        <select value={filterPerfil} onChange={(e) => setFilterPerfil(e.target.value)}>
          <option value="">Todos os perfis</option>
          {PERFIL_LABELS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
        </select>
      </section>

      <section className="tabela-card">
        <div className="tabela-header">
          <TabelaContador count={filtered.length} />
        </div>
        <div className="tabela-wrap">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Telefone</th>
                <th>Perfil</th>
                <th>Unidade</th>
                <th className="text-center">Status</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="tabela-vazia">
                    Nenhum usuário encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const telefone = u.telefone && u.telefone !== "—" ? u.telefone : "—";
                  const statusLabel = normalizeStatusLabel(u.status);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="user-cell">
                          <span className={avatarClass(u.perfil)}>{getInitials(u.nome)}</span>
                          <div>
                            <p className="user-nome">{u.nome}</p>
                            <p className="user-email">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>{telefone}</td>
                      <td>
                        <span className={badgePerfilClass(u.perfil)}>{perfilToLabel(u.perfil)}</span>
                      </td>
                      <td>{u.unidade || "—"}</td>
                      <td className="text-center">
                        <span className={badgeStatusClass(u.status)}>{statusLabel}</span>
                      </td>
                      <td className="text-center acoes">
                        <button
                          type="button"
                          onClick={() => setModal({ type: "view", user: u })}
                          className="btn-icon btn-view"
                          title="Ver detalhes"
                        >
                          <Eye size={16} />
                        </button>
                        <Link
                          to={`/app/usuarios/editar/${u.id}`}
                          className="btn-icon btn-edit"
                          title="Editar usuário"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="btn-icon btn-delete"
                          title="Excluir usuário"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="tabela-footer">
          <TabelaContador count={filtered.length} />
        </div>
      </section>

      {modal.type === "view" ? (
        <RecordDetailModal
          subtitle="Informações resumidas do usuário selecionado."
          fields={[
            { label: "Nome", value: modal.user.nome, full: true },
            { label: "E-mail", value: modal.user.email, full: true },
            { label: "Perfil", value: perfilToLabel(modal.user.perfil) },
            { label: "Status", value: normalizeStatusLabel(modal.user.status) },
            { label: "Telefone", value: modal.user.telefone },
            { label: "CPF", value: modal.user.cpf },
            { label: "Unidade", value: modal.user.unidade },
            { label: "Área", value: modal.user.area },
          ]}
          onClose={() => setModal({ type: "none" })}
          onEdit={() => {
            const id = modal.user.id;
            setModal({ type: "none" });
            navigate(`/app/usuarios/editar/${id}`);
          }}
        />
      ) : null}
    </div>
  );
}
