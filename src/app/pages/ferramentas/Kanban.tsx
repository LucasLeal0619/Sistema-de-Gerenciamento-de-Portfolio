import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useConfirm } from "../../components/ConfirmProvider";
import { usePermissions } from "../../hooks/usePermissions";
import { toastSuccess } from "../../utils/toast";
import {
  getKanbanQuadroBySlug,
  newCartaoId,
  updateKanbanQuadro,
  type KanbanCartao,
  type KanbanColuna,
  type KanbanQuadro,
} from "./kanbanStorage";

type ModalState =
  | { open: false }
  | {
      open: true;
      modo: "novo" | "editar";
      cartao?: KanbanCartao;
      colunaId: string;
    };

export function Kanban() {
  const { slug } = useParams<{ slug: string }>();
  const confirm = useConfirm();
  const { podeEditar } = usePermissions();
  const [quadro, setQuadro] = useState<KanbanQuadro | null>(() =>
    slug ? getKanbanQuadroBySlug(slug) : null,
  );
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erroForm, setErroForm] = useState("");

  useEffect(() => {
    if (!slug) return;
    setQuadro(getKanbanQuadroBySlug(slug));
  }, [slug]);

  const colunas = quadro?.colunas ?? [];

  const persist = (next: KanbanQuadro) => {
    const saved = updateKanbanQuadro(next);
    setQuadro(saved);
  };

  const abrirNovo = (coluna: KanbanColuna) => {
    if (!podeEditar) return;
    setTitulo("");
    setDescricao("");
    setErroForm("");
    setModal({ open: true, modo: "novo", colunaId: coluna.id });
  };

  const abrirEdicao = (cartao: KanbanCartao, colunaId: string) => {
    if (!podeEditar) return;
    setTitulo(cartao.titulo);
    setDescricao(cartao.descricao ?? "");
    setErroForm("");
    setModal({ open: true, modo: "editar", cartao, colunaId });
  };

  const fecharModal = () => {
    setModal({ open: false });
    setTitulo("");
    setDescricao("");
    setErroForm("");
  };

  const salvarCartao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEditar || !quadro || !modal.open) return;
    const t = titulo.trim();
    if (!t) {
      setErroForm("Informe o título do cartão.");
      return;
    }

    const nextColunas = quadro.colunas.map((col) => {
      if (col.id !== modal.colunaId) return col;
      if (modal.modo === "novo") {
        return {
          ...col,
          cartoes: [
            ...col.cartoes,
            { id: newCartaoId(), titulo: t, descricao: descricao.trim() || undefined },
          ],
        };
      }
      return {
        ...col,
        cartoes: col.cartoes.map((c) =>
          c.id === modal.cartao?.id
            ? { ...c, titulo: t, descricao: descricao.trim() || undefined }
            : c,
        ),
      };
    });

    persist({ ...quadro, colunas: nextColunas });
    toastSuccess(modal.modo === "novo" ? "Cartão criado." : "Cartão atualizado.");
    fecharModal();
  };

  const excluirCartao = async (cartao: KanbanCartao, colunaId: string) => {
    if (!podeEditar || !quadro) return;
    const ok = await confirm({
      title: "Excluir cartão",
      message: `Excluir o cartão "${cartao.titulo}"?`,
      confirmLabel: "Excluir",
      destructive: true,
    });
    if (!ok) return;

    persist({
      ...quadro,
      colunas: quadro.colunas.map((col) =>
        col.id === colunaId
          ? { ...col, cartoes: col.cartoes.filter((c) => c.id !== cartao.id) }
          : col,
      ),
    });
    toastSuccess("Cartão excluído.");
  };

  const moverCartao = (cartaoId: string, fromColunaId: string, toColunaId: string) => {
    if (!podeEditar || !quadro || fromColunaId === toColunaId) return;

    let movido: KanbanCartao | null = null;
    const semOrigem = quadro.colunas.map((col) => {
      if (col.id !== fromColunaId) return col;
      const cartao = col.cartoes.find((c) => c.id === cartaoId);
      if (!cartao) return col;
      movido = cartao;
      return { ...col, cartoes: col.cartoes.filter((c) => c.id !== cartaoId) };
    });

    if (!movido) return;

    const next = semOrigem.map((col) =>
      col.id === toColunaId ? { ...col, cartoes: [...col.cartoes, movido!] } : col,
    );

    persist({ ...quadro, colunas: next });
  };

  const modalTitulo = useMemo(
    () => (modal.open && modal.modo === "editar" ? "Editar cartão" : "Novo cartão"),
    [modal],
  );

  if (!slug) {
    return <Navigate to="/app/ferramentas/kanban" replace />;
  }

  if (!quadro) {
    return (
      <div className="min-h-full bg-[#F5F7FA] px-6 py-8 lg:px-8">
        <Link
          to="/app/ferramentas/kanban"
          className="mb-3 inline-block text-[0.8rem] font-semibold text-[#1d4ed8] hover:underline"
        >
          ← Voltar aos quadros
        </Link>
        <p className="text-sm text-red-700">Quadro não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="kanban-page">
      <header className="kanban-top">
        <div className="kanban-top-row">
          <div>
            <Link
              to="/app/ferramentas/kanban"
              className="kanban-back"
            >
              ← Voltar aos quadros
            </Link>
            <h1>{quadro.nome}</h1>
            <p className="kanban-subtitle">Colunas e cartões deste quadro</p>
          </div>
        </div>

        {!podeEditar ? (
          <div className="kanban-info">
            Modo consulta — você pode visualizar o quadro, mas não criar nem mover cartões.
          </div>
        ) : null}
      </header>

      <section className="kanban-board" aria-label="Quadro Kanban">
        <div className="flex min-w-max items-start gap-4">
          {colunas.map((coluna) => (
            <article
              key={coluna.id}
              className="flex w-72 flex-shrink-0 flex-col rounded-xl border border-gray-200 bg-white shadow-sm"
              aria-label={coluna.titulo}
            >
              <header
                className="flex items-center justify-between gap-2 border-t-4 px-3 py-3"
                style={{ borderTopColor: coluna.cor }}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ background: coluna.cor }}
                  />
                  <h2 className="truncate text-sm font-bold text-gray-800">{coluna.titulo}</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {coluna.cartoes.length}
                </span>
              </header>

              <div className="flex flex-1 flex-col gap-2 px-3 pb-3">
                {coluna.cartoes.map((cartao) => (
                  <article
                    key={cartao.id}
                    className="rounded-lg border border-gray-200 bg-slate-50 p-3"
                  >
                    <h3 className="text-sm font-semibold text-gray-900">{cartao.titulo}</h3>
                    {cartao.descricao ? (
                      <p className="mt-1 line-clamp-3 text-xs text-gray-500">{cartao.descricao}</p>
                    ) : null}

                    {podeEditar ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <label className="flex min-w-0 flex-1 items-center gap-1 text-[0.7rem] text-gray-500">
                          Mover
                          <select
                            className="h-7 w-full rounded border border-gray-300 bg-white px-1 text-xs text-gray-700"
                            value={coluna.id}
                            onChange={(ev) =>
                              moverCartao(cartao.id, coluna.id, ev.target.value)
                            }
                          >
                            {colunas.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.titulo}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          title="Editar"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-[#003F7D]"
                          onClick={() => abrirEdicao(cartao, coluna.id)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          title="Excluir"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-700"
                          onClick={() => void excluirCartao(cartao, coluna.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}

                {!coluna.cartoes.length ? (
                  <p className="py-4 text-center text-xs text-gray-400">
                    Nenhum cartão nesta coluna
                  </p>
                ) : null}

                {podeEditar ? (
                  <button
                    type="button"
                    onClick={() => abrirNovo(coluna)}
                    className="mt-1 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-bold text-slate-500 hover:border-[#F57C00] hover:bg-orange-50 hover:text-[#F57C00]"
                  >
                    + Adicionar cartão
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      {modal.open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={fecharModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={modalTitulo}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{modalTitulo}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {modal.modo === "editar"
                    ? "Atualize as informações do cartão."
                    : "Preencha os dados do novo cartão."}
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

            <form className="space-y-4 px-6 py-5" onSubmit={salvarCartao}>
              {erroForm ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {erroForm}
                </div>
              ) : null}

              <label className="block text-sm font-medium text-gray-700">
                Título *
                <input
                  value={titulo}
                  onChange={(ev) => setTitulo(ev.target.value)}
                  required
                  maxLength={150}
                  autoFocus
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#003F7D] focus:ring-2 focus:ring-[#003F7D]/15"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Descrição
                <textarea
                  value={descricao}
                  onChange={(ev) => setDescricao(ev.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Detalhes opcionais da atividade..."
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
