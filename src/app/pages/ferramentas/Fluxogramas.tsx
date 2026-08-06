import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useConfirm } from "../../components/ConfirmProvider";
import { usePermissions } from "../../hooks/usePermissions";
import { toastSuccess } from "../../utils/toast";
import {
  createFluxograma,
  deleteFluxograma,
  loadFluxogramas,
  updateFluxogramaMeta,
  type FluxogramaItem,
} from "./fluxogramaStorage";

export function Fluxogramas() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { podeEditar } = usePermissions();
  const [lista, setLista] = useState<FluxogramaItem[]>(() => loadFluxogramas());
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<FluxogramaItem | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<"linear" | "funcional">("linear");
  const [erroForm, setErroForm] = useState("");

  const modalTitulo = editando ? "Editar fluxograma" : "Novo fluxograma";
  const refresh = () => setLista(loadFluxogramas());

  const abrirNovo = () => {
    if (!podeEditar) return;
    setEditando(null);
    setTitulo("");
    setDescricao("");
    setTipo("linear");
    setErroForm("");
    setModalAberto(true);
  };

  const abrirEdicao = (item: FluxogramaItem) => {
    if (!podeEditar) return;
    setEditando(item);
    setTitulo(item.titulo);
    setDescricao(item.descricao ?? "");
    setTipo(item.tipo);
    setErroForm("");
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
    setTitulo("");
    setDescricao("");
    setTipo("linear");
    setErroForm("");
  };

  const salvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEditar) return;
    const t = titulo.trim();
    if (!t) {
      setErroForm("Informe o título do fluxograma.");
      return;
    }

    if (editando) {
      updateFluxogramaMeta(editando.id, { titulo: t, descricao, tipo });
      toastSuccess("Fluxograma atualizado com sucesso.");
      refresh();
      fecharModal();
      return;
    }

    const criado = createFluxograma({ titulo: t, descricao, tipo });
    toastSuccess("Fluxograma criado com sucesso.");
    navigate(`/app/ferramentas/fluxograma/${criado.slug}`);
  };

  const excluir = async (item: FluxogramaItem) => {
    if (!podeEditar) return;
    const ok = await confirm({
      title: "Excluir fluxograma",
      message: `Excluir o fluxograma "${item.titulo}"?`,
      confirmLabel: "Excluir",
      destructive: true,
    });
    if (!ok) return;
    deleteFluxograma(item.id);
    toastSuccess("Fluxograma excluído com sucesso.");
    refresh();
  };

  const items = useMemo(() => lista, [lista]);

  return (
    <div className="flux-lista-page">
      <header className="flux-lista-top">
        <Link
          to="/app/ferramentas"
          className="flux-back"
        >
          ← Voltar para Ferramentas
        </Link>
        <div className="flux-lista-top-row">
          <div>
            <h1>Fluxograma</h1>
            <p className="flux-subtitle">
              Escolha um processo ou crie um novo mapeamento visual
            </p>
          </div>
        </div>
      </header>

      <section className="flux-lista-content" aria-label="Lista de fluxogramas">
        {!items.length ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center text-sm text-gray-400">
            <p>Nenhum fluxograma ainda.</p>
            {podeEditar ? (
              <button
                type="button"
                onClick={abrirNovo}
                className="h-10 rounded-lg bg-[#F57C00] px-5 font-semibold text-white hover:bg-[#e67300]"
              >
                Criar primeiro fluxograma
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/app/ferramentas/fluxograma/${item.slug}`)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") {
                    navigate(`/app/ferramentas/fluxograma/${item.slug}`);
                  }
                }}
                className="group relative flex min-h-[9rem] cursor-pointer flex-col overflow-hidden rounded-[0.85rem] border border-gray-200 bg-white shadow-sm transition hover:-translate-y-px hover:border-[#003F7D] hover:shadow-md"
              >
                <div className="h-1.5 bg-gradient-to-r from-[#003F7D] to-[#F57C00]" />
                <div className="flex-1 p-4 pr-14">
                  <h2 className="text-[1.05rem] font-bold text-[#003F7D]">{item.titulo}</h2>
                  <p className="mt-1.5 text-[0.82rem] text-gray-500">
                    {item.tipo === "funcional" ? "Funcional" : "Linear"} · {item.nodes.length}{" "}
                    {item.nodes.length === 1 ? "etapa" : "etapas"}
                  </p>
                  {item.descricao ? (
                    <p className="mt-2 line-clamp-2 text-xs text-gray-400">{item.descricao}</p>
                  ) : null}
                </div>

                {podeEditar ? (
                  <div
                    className="absolute right-2.5 top-3 hidden gap-1 group-hover:flex"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <button
                      type="button"
                      title="Editar dados"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-[#003F7D]"
                      onClick={() => abrirEdicao(item)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      title="Excluir"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => void excluir(item)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : null}
              </article>
            ))}

            {podeEditar ? (
              <button
                type="button"
                onClick={abrirNovo}
                className="min-h-[9rem] rounded-[0.85rem] border border-dashed border-slate-300 bg-slate-50 text-sm font-bold text-slate-500 transition hover:border-[#003F7D] hover:bg-blue-50 hover:text-[#003F7D]"
              >
                + Criar novo fluxograma
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
                    ? "Altere os dados do fluxograma."
                    : "Será criado com o template Início → Processo → Fim."}
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
                Título *
                <input
                  value={titulo}
                  onChange={(ev) => setTitulo(ev.target.value)}
                  required
                  maxLength={100}
                  autoFocus
                  placeholder="Ex.: Admissão de aluno"
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#003F7D] focus:ring-2 focus:ring-[#003F7D]/15"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Tipo
                <select
                  value={tipo}
                  onChange={(ev) => setTipo(ev.target.value as "linear" | "funcional")}
                  className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#003F7D] focus:ring-2 focus:ring-[#003F7D]/15"
                >
                  <option value="linear">Linear</option>
                  <option value="funcional">Funcional (com raias)</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Descrição
                <textarea
                  value={descricao}
                  onChange={(ev) => setDescricao(ev.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Opcional: escopo ou objetivo do processo"
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
