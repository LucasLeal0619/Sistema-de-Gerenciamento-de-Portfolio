import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { emailJaCadastrado, getStoredUsers, updateUser } from "../utils/store";
import { getSession, setSession } from "../utils/auth";
import { logActivity } from "../utils/activityLog";
import {
  UNIDADES,
  normalizeStatusLabel,
  perfilToLabel,
} from "../utils/userHelpers";

export function EditUser() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState("");
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    area: "",
    perfil: "",
    unidade: "",
    senha: "",
    confirmarSenha: "",
    status: true,
  });

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }
    const user = getStoredUsers().find((u) => u.id === id);
    if (!user) {
      setNotFound(true);
      return;
    }
    setForm({
      nome: user.nome,
      email: user.email,
      telefone: user.telefone === "—" || !user.telefone ? "" : user.telefone,
      cpf: user.cpf || "",
      area: user.area || "",
      perfil: perfilToLabel(user.perfil),
      unidade: user.unidade || "",
      senha: "",
      confirmarSenha: "",
      status: normalizeStatusLabel(user.status) === "Ativo",
    });
  }, [id]);

  const update = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErroFormulario("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setErroFormulario("");

    if (!form.nome.trim() || !form.email.trim() || !form.perfil || !form.unidade) {
      setErroFormulario("Preencha os campos obrigatórios.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setErroFormulario("Informe um e-mail válido.");
      return;
    }
    if (emailJaCadastrado(form.email.trim(), id)) {
      setErroFormulario("Este e-mail já está cadastrado.");
      return;
    }
    if (form.senha || form.confirmarSenha) {
      if (form.senha.length < 6) {
        setErroFormulario("A senha deve ter no mínimo 6 caracteres.");
        return;
      }
      if (form.senha !== form.confirmarSenha) {
        setErroFormulario("As senhas não coincidem.");
        return;
      }
    }

    setSalvando(true);
    try {
      const updates: Parameters<typeof updateUser>[1] = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim() || "—",
        cpf: form.cpf.trim(),
        area: form.area.trim(),
        unidade: form.unidade,
        perfil: perfilToLabel(form.perfil),
        status: form.status ? "Ativo" : "Inativo",
      };
      if (form.senha) updates.senha = form.senha;

      updateUser(id, updates);

      const session = getSession();
      if (session?.userId === id) {
        const user = getStoredUsers().find((u) => u.id === id);
        if (user) setSession(user);
      }

      logActivity("Usuário atualizado", form.nome.trim());
      navigate("/app/usuarios", {
        state: { success: `Usuário "${form.nome.trim()}" atualizado com sucesso!` },
      });
    } finally {
      setSalvando(false);
    }
  };

  if (notFound) {
    return (
      <div className="usuarios-page">
        <div className="alert alert-error" style={{ margin: "2rem" }}>
          Usuário não encontrado.
        </div>
        <div style={{ padding: "0 2rem" }}>
          <button type="button" className="btn-voltar" onClick={() => navigate("/app/usuarios")}>
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="usuarios-page">
      <div className="form-page">
        <div className="form-top-bar" />
        <header className="form-header">
          <button type="button" className="btn-voltar" onClick={() => navigate("/app/usuarios")}>
            ←
          </button>
          <div>
            <h1>Editar Usuário</h1>
            <p>Atualize os dados do colaborador. Deixe a senha em branco para manter a atual.</p>
          </div>
        </header>

        <form className="form-body" onSubmit={handleSubmit}>
          {erroFormulario ? <div className="alert alert-error">{erroFormulario}</div> : null}

          <section className="form-section">
            <h2>Dados Pessoais</h2>
            <div className="form-grid">
              <div className="form-group full">
                <label htmlFor="nome">
                  Nome Completo <span>*</span>
                </label>
                <input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => update("nome", e.target.value)}
                  type="text"
                  placeholder="Ex: Ana Paula Souza"
                  required
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">
                  E-mail (login) <span>*</span>
                </label>
                <input
                  id="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  type="email"
                  placeholder="nome@df.senac.br"
                  required
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label htmlFor="telefone">Telefone</label>
                <input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => update("telefone", e.target.value)}
                  type="text"
                  placeholder="(61) 99999-9999"
                  maxLength={20}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cpf">CPF</label>
                <input
                  id="cpf"
                  value={form.cpf}
                  onChange={(e) => update("cpf", e.target.value)}
                  type="text"
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              <div className="form-group">
                <label htmlFor="area">Área de atuação</label>
                <input
                  id="area"
                  value={form.area}
                  onChange={(e) => update("area", e.target.value)}
                  type="text"
                  placeholder="Ex: Coordenação Pedagógica"
                  maxLength={100}
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Nível de Acesso</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="perfil">
                  Perfil <span>*</span>
                </label>
                <select
                  id="perfil"
                  value={form.perfil}
                  onChange={(e) => update("perfil", e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Selecione o nível de acesso
                  </option>
                  <option value="Administrador">Administrador — acesso total e gestão de usuários</option>
                  <option value="Editor">Editor — cria e altera dados do portfólio</option>
                  <option value="Consultor">Consultor — somente leitura</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="unidade">
                  Unidade <span>*</span>
                </label>
                <select
                  id="unidade"
                  value={form.unidade}
                  onChange={(e) => update("unidade", e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Selecione a unidade
                  </option>
                  {UNIDADES.map((unidade) => (
                    <option key={unidade} value={unidade}>
                      {unidade}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="senha">Senha</label>
                <input
                  id="senha"
                  value={form.senha}
                  onChange={(e) => update("senha", e.target.value)}
                  type="password"
                  minLength={6}
                  maxLength={100}
                  placeholder="Manter senha atual"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmarSenha">Confirmar senha</label>
                <input
                  id="confirmarSenha"
                  value={form.confirmarSenha}
                  onChange={(e) => update("confirmarSenha", e.target.value)}
                  type="password"
                  minLength={6}
                  maxLength={100}
                  placeholder="Repita a senha"
                  required={!!form.senha}
                />
              </div>
            </div>

            <label className="form-check">
              <input
                type="checkbox"
                checked={form.status}
                onChange={(e) => update("status", e.target.checked)}
              />
              Usuário ativo
            </label>
          </section>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate("/app/usuarios")}>
              Cancelar
            </button>
            <button type="submit" className="btn-salvar" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
