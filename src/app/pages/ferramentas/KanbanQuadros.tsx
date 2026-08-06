import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useConfirm } from "../../components/ConfirmProvider";
import { usePermissions } from "../../hooks/usePermissions";
import { toastSuccess } from "../../utils/toast";
import {
  createKanbanQuadro,
  deleteKanbanQuadro,
  loadKanbanQuadros,
  quadroResumo,
  renameKanbanQuadro,
  type KanbanQuadro,
} from "./kanbanStorage";

export function KanbanQuadros() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { podeEditar } = usePermissions();
  const [quadros, setQuadros] = useState<KanbanQuadro[]>(() => loadKanbanQuadros());
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<KanbanQuadro | null>(null);
  const [nome, setNome] = useState("");
  const [erroForm, setErroForm] = useState("");

  const modalTitulo = editando ? "Renomear quadro" : "Novo quadro";

  const refresh = () => setQuadros(loadKanbanQuadros());

  const abrirNovo = () => {
    if (!podeEditar) return;
    setEditando(null);
    setNome("");
    setErroForm("");
    setModalAberto(true);
  };

  const abrirEdicao = (quadro: KanbanQuadro) => {
    if (!podeEditar) return;
    setEditando(quadro);
    setNome(quadro.nome);
    setErroForm("");
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
    setNome("");
    setErroForm("");
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEditar) return;
    const trimmed = nome.trim();
    if (!trimmed) {
      setErroForm("Informe o nome do quadro.");
      return;
    }

    if (editando) {
      renameKanbanQuadro(editando.id, trimmed);
      toastSuccess("Quadro atualizado com sucesso.");
      refresh();
      fecharModal();
      return;
    }

    const criado = createKanbanQuadro(trimmed);
    toastSuccess("Quadro criado com sucesso.");
    navigate(`/app/ferramentas/kanban/${criado.slug}`);
  };

  const excluir = async (quadro: KanbanQuadro) => {
    if (!podeEditar) return;
    const ok = await confirm({
      title: "Excluir quadro",
      message: `Excluir o quadro "${quadro.nome}" e todo o seu conteúdo?`,
      confirmLabel: "Excluir",
      destructive: true,
    });
    if (!ok) return;
    deleteKanbanQuadro(quadro.id);
    toastSuccess("Quadro excluído com sucesso.");
    refresh();
  };

  const lista = useMemo(() => quadros, [quadros]);

  return (
    <div className="kanban-quadros-page">
      <header className="kanban-quadros-top">
        <Link
          to="/app/ferramentas"
          className="kanban-back"
        >
          ← Voltar para Ferramentas
        </Link>
        <div className="kanban-quadros-top-row">
          <div>
            <h1>Kanban</h1>
            <p className="kanban-subtitle">
              Escolha um quadro ou crie um novo para organizar as atividades
            </p>
          </div>
        </div>
      </header>

      <section className="kanban-quadros-content" aria-label="Lista de quadros">
        {!lista.length ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center text-sm text-gray-400">
            <p>Nenhum quadro ainda.</p>
            {podeEditar ? (
              <button
                type="button"
                onClick={abrirNovo}
                className="h-10 rounded-lg bg-[#F57C00] px-5 font-semibold text-white hover:bg-[#e67300]"
              >
                Criar primeiro quadro
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {lista.map((quadro) => {
              const { totalColunas, totalCartoes } = quadroResumo(quadro);
              return (
                <article
                  key={quadro.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/app/ferramentas/kanban/${quadro.slug}`)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") {
                      navigate(`/app/ferramentas/kanban/${quadro.slug}`);
                    }
                  }}
                  className="group relative flex min-h-[8.5rem] cursor-pointer flex-col overflow-hidden rounded-[0.85rem] border border-gray-200 bg-white shadow-sm transition hover:-translate-y-px hover:border-[#003F7D] hover:shadow-md"
                >
                  <div className="h-1.5 bg-gradient-to-r from-[#F57C00] to-[#ffb74d]" />
                  <div className="flex-1 p-4 pr-14">
                    <h2 className="text-[1.05rem] font-bold text-[#003F7D]">{quadro.nome}</h2>
                    <p className="mt-1.5 text-[0.82rem] text-gray-500">
                      {totalColunas} coluna{totalColunas === 1 ? "" : "s"} · {totalCartoes}{" "}
                      {totalCartoes === 1 ? "cartão" : "cartões"}
                    </p>
                  </div>

                  {podeEditar ? (
                    <div
                      className="absolute right-2.5 top-3 hidden gap-1 group-hover:flex"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      <button
                        type="button"
                        title="Renomear"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-[#003F7D]"
                        onClick={() => abrirEdicao(quadro)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        title="Excluir"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => void excluir(quadro)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}

            {podeEditar ? (
              <button
                type="button"
                onClick={abrirNovo}
                className="min-h-[8.5rem] rounded-[0.85rem] border border-dashed border-slate-300 bg-slate-50 text-sm font-bold text-slate-500 transition hover:border-[#003F7D] hover:bg-blue-50 hover:text-[#003F7D]"
              >
                + Criar novo quadro
              </button>
            ) : null}
          </div>
        )}
      </section>

      {modalAberto ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={fecharModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={modalTitulo}
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{modalTitulo}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {editando
                    ? "Altere o nome do quadro."
                    : "O quadro será criado com as colunas padrão."}
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                className="text-2xl leading-none text-gray-400 hover:text-gray-700"
                onClick={fecharModal}
              >
                ×
              </button>
            </div>

            <form className="space-y-4 px-6 py-5" onSubmit={salvar}>
              {erroForm ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {erroForm}
                </div>
              ) : null}

              <label className="block text-sm font-medium text-gray-700">
                Nome do quadro *
                <input
                  value={nome}
                  onChange={(ev) => setNome(ev.target.value)}
                  required
                  maxLength={100}
                  autoFocus
                  placeholder="Ex.: Eventos 2026"
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#003F7D] focus:ring-2 focus:ring-[#003F7D]/15"
                />
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="h-9 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-lg bg-[#F57C00] px-4 text-sm font-semibold text-white hover:bg-[#e67300]"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
