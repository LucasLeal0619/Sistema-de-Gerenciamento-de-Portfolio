import { useState } from "react";
import { useNavigate } from "react-router";
import { emailJaCadastrado, saveUser } from "../utils/store";
import { logActivity } from "../utils/activityLog";
import { UNIDADES, perfilToLabel } from "../utils/userHelpers";

export function NewUser() {
  const navigate = useNavigate();
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

  const update = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErroFormulario("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroFormulario("");

    if (!form.nome.trim() || !form.email.trim() || !form.perfil || !form.unidade) {
      setErroFormulario("Preencha os campos obrigatórios.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setErroFormulario("Informe um e-mail válido.");
      return;
    }
    if (emailJaCadastrado(form.email.trim())) {
      setErroFormulario("Este e-mail já está cadastrado.");
      return;
    }
    if (!form.senha || form.senha.length < 6) {
      setErroFormulario("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (form.senha !== form.confirmarSenha) {
      setErroFormulario("As senhas não coincidem.");
      return;
    }

    setSalvando(true);
    try {
      const novo = saveUser({
        nome: form.nome.trim(),
        email: form.email.trim(),
        cpf: form.cpf.trim(),
        perfil: perfilToLabel(form.perfil),
        status: form.status ? "Ativo" : "Inativo",
        senha: form.senha,
        ultimoAcesso: "—",
        unidade: form.unidade,
        area: form.area.trim(),
        telefone: form.telefone.trim() || "—",
      });
      logActivity("Usuário cadastrado", `${novo.nome} (${novo.email})`);
      navigate("/app/usuarios", {
        state: { success: `Usuário "${form.nome.trim()}" cadastrado com sucesso!` },
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="usuarios-page">
      <div className="form-page">
        <div className="form-top-bar" />
        <header className="form-header">
          <button type="button" className="btn-voltar" onClick={() => navigate("/app/usuarios")}>
            ←
          </button>
          <div>
            <h1>Cadastrar Novo Usuário</h1>
            <p>Preencha as informações para criar um novo acesso ao SGP</p>
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
                <label htmlFor="senha">
                  Senha <span>*</span>
                </label>
                <input
                  id="senha"
                  value={form.senha}
                  onChange={(e) => update("senha", e.target.value)}
                  type="password"
                  required
                  minLength={6}
                  maxLength={100}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmarSenha">
                  Confirmar senha <span>*</span>
                </label>
                <input
                  id="confirmarSenha"
                  value={form.confirmarSenha}
                  onChange={(e) => update("confirmarSenha", e.target.value)}
                  type="password"
                  required
                  minLength={6}
                  maxLength={100}
                  placeholder="Repita a senha"
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
              {salvando ? "Salvando..." : "Cadastrar Usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
