import { useState, useMemo } from "react";
import {
  Search, Plus, Upload, Eye, Edit2, Trash2, X, Save,
  CheckCircle, Info, ExternalLink, AlertCircle,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  getStoredValoresPCA, saveValorPCA, updateValorPCA, deleteValorPCA, ValorPCARecord,
} from "../utils/store";

const SEI_BASE = "https://sei.df.gov.br/sei/controlador.php?acao=procedimento_trabalhar&id_procedimento=";
const seiLink = (sei: string) => `${SEI_BASE}${encodeURIComponent(sei)}`;

const EIXOS = [
  "Ambiente e Saúde",
  "Beleza e Cuidado Pessoal",
  "Gastronomia",
  "Gestão e Moda",
  "Gestão e Negócios",
  "Tecnologia e Economia Criativa",
];

const UNIDADES = [
  "Ceilândia",
  "Gama",
  "Jessé Freire",
  "Jo Rufino e Carlos Aguiar",
  "Joaquim Loiola",
  "Miguel Setembrino — Gastronomia",
  "Miguel Setembrino — Saúde",
  "Santa Maria",
  "Sobradinho",
  "Taguatinga",
  "Talal Abu-Allan",
];

const STATUS_LIST = ["Vigente", "Em análise", "Suspenso", "Revogado"];


const EMPTY: Omit<ValorPCARecord, "id"> = {
  ano: "2025", sei: "", sig: "", titulo: "", eixo: "",
  unidade: "", ch: "", valor: "", status: "Vigente", observacao: "",
};

type ModalMode = "view" | "edit" | "new";

export function ValoresPCA2025() {
  const [registros, setRegistros] = useState<ValorPCARecord[]>(getStoredValoresPCA);
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todos");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [successMsg, setSuccessMsg] = useState("");
  const [modal, setModal] = useState<{ open: boolean; mode: ModalMode; item: Omit<ValorPCARecord, "id">; editId: string | null }>({
    open: false, mode: "new", item: EMPTY, editId: null,
  });

  const refresh = () => setRegistros(getStoredValoresPCA());
  const toast = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 4000); };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return registros.filter(r => {
      const matchSearch = !q || r.titulo.toLowerCase().includes(q)
        || r.sei.toLowerCase().includes(q) || r.sig.toLowerCase().includes(q);
      const matchAno = filterAno === "Todos" || r.ano === filterAno;
      const matchUnidade = filterUnidade === "Todos" || r.unidade === filterUnidade;
      const matchEixo = filterEixo === "Todos" || r.eixo === filterEixo;
      const matchStatus = filterStatus === "Todos" || r.status === filterStatus;
      return matchSearch && matchAno && matchUnidade && matchEixo && matchStatus;
    });
  }, [registros, search, filterAno, filterUnidade, filterEixo, filterStatus]);

  const stats = useMemo(() => ({
    total: registros.length,
    vigentes: registros.filter(r => r.status === "Vigente").length,
    analise: registros.filter(r => r.status === "Em análise").length,
    outros: registros.filter(r => r.status === "Suspenso" || r.status === "Revogado").length,
  }), [registros]);

  const anos = [...new Set(registros.map(r => r.ano))].sort((a, b) => +b - +a);
  const hasFilters = search || filterAno !== "Todos" || filterUnidade !== "Todos" || filterEixo !== "Todos" || filterStatus !== "Todos";

  const openNew = () => setModal({ open: true, mode: "new", item: EMPTY, editId: null });
  const openView = (r: ValorPCARecord) => setModal({ open: true, mode: "view", item: { ...r }, editId: r.id });
  const openEdit = (r: ValorPCARecord) => setModal({ open: true, mode: "edit", item: { ...r }, editId: r.id });
  const closeModal = () => setModal(m => ({ ...m, open: false }));
  const setField = <K extends keyof Omit<ValorPCARecord, "id">>(k: K, v: Omit<ValorPCARecord, "id">[K]) =>
    setModal(m => ({ ...m, item: { ...m.item, [k]: v } }));

  const handleSave = () => {
    if (!modal.item.titulo.trim()) return;
    if (modal.mode === "edit" && modal.editId) {
      updateValorPCA(modal.editId, modal.item);
      toast("Registro atualizado!");
    } else {
      saveValorPCA(modal.item);
      toast("Registro cadastrado!");
    }
    refresh();
    closeModal();
  };

  const handleDelete = (r: ValorPCARecord) => {
    if (!window.confirm(`Excluir "${r.titulo}"?`)) return;
    deleteValorPCA(r.id);
    refresh();
    toast("Registro excluído.");
  };

  const handleImport = () => {
    alert("Funcionalidade de importação de planilha será disponibilizada após validação com a área responsável pelo PCA.");
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Valores PCA</h1>
            <p className="text-gray-600 mt-1">Precificação e controle de valores dos cursos — SENAC DF</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 px-5 gap-2 text-gray-600" onClick={handleImport}>
              <Upload size={18} />
              Importar Planilha
            </Button>
            <Button className="bg-[#F57C00] hover:bg-[#E86D00] h-12 px-6 font-semibold" onClick={openNew}>
              <Plus size={20} className="mr-2" />
              Novo Registro
            </Button>
          </div>
        </div>
      </div>

      {/* Aviso institucional */}
      <div className="mx-8 mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-amber-200 bg-amber-50">
        <Info size={14} className="text-amber-600 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          <span className="font-semibold">Atenção:</span> Fluxo do PCA sujeito a validação com a área responsável. Planilhas de referência serão enviadas em reunião futura.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-8 mt-5 mb-4">
        <button onClick={() => setFilterStatus("Todos")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${filterStatus === "Todos" ? "border-[#003F7D] bg-[#E8EFF7] ring-2 ring-[#003F7D]/20" : "border-gray-100 bg-white hover:border-[#003F7D]/40"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Total de Registros</p>
              <p className="text-3xl font-bold text-[#003F7D]">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">Ver todos</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "Todos" ? "bg-[#003F7D]" : "bg-[#E8EFF7]"}`}>
              <CheckCircle className={`w-5 h-5 ${filterStatus === "Todos" ? "text-white" : "text-[#003F7D]"}`} />
            </div>
          </div>
        </button>

        <button onClick={() => setFilterStatus(filterStatus === "Vigente" ? "Todos" : "Vigente")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${filterStatus === "Vigente" ? "border-green-500 bg-green-50 ring-2 ring-green-200" : "border-gray-100 bg-white hover:border-green-300"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Vigentes</p>
              <p className="text-3xl font-bold text-green-600">{stats.vigentes}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.total ? Math.round(stats.vigentes / stats.total * 100) : 0}% do total</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "Vigente" ? "bg-green-500" : "bg-green-50"}`}>
              <CheckCircle className={`w-5 h-5 ${filterStatus === "Vigente" ? "text-white" : "text-green-600"}`} />
            </div>
          </div>
        </button>

        <button onClick={() => setFilterStatus(filterStatus === "Em análise" ? "Todos" : "Em análise")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${filterStatus === "Em análise" ? "border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200" : "border-gray-100 bg-white hover:border-yellow-300"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Em Análise</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.analise}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.total ? Math.round(stats.analise / stats.total * 100) : 0}% do total</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "Em análise" ? "bg-yellow-500" : "bg-yellow-50"}`}>
              <AlertCircle className={`w-5 h-5 ${filterStatus === "Em análise" ? "text-white" : "text-yellow-600"}`} />
            </div>
          </div>
        </button>

        <button onClick={() => setFilterStatus(filterStatus === "Suspenso" ? "Todos" : "Suspenso")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${filterStatus === "Suspenso" ? "border-gray-400 bg-gray-100 ring-2 ring-gray-200" : "border-gray-100 bg-white hover:border-gray-300"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Suspensos / Revogados</p>
              <p className="text-3xl font-bold text-gray-600">{stats.outros}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.total ? Math.round(stats.outros / stats.total * 100) : 0}% do total</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "Suspenso" ? "bg-gray-500" : "bg-gray-100"}`}>
              <AlertCircle className={`w-5 h-5 ${filterStatus === "Suspenso" ? "text-white" : "text-gray-500"}`} />
            </div>
          </div>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end bg-white border border-gray-200 rounded-xl px-4 py-4 mx-8 mb-6 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, número SEI ou código SIG..."
            className="w-full pl-9 pr-3 h-9 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003F7D]" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Ano</label>
          <select value={filterAno} onChange={e => setFilterAno(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todos">Todos</option>
            {anos.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Unidade</label>
          <select value={filterUnidade} onChange={e => setFilterUnidade(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todos">Todas</option>
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Eixo Tecnológico</label>
          <select value={filterEixo} onChange={e => setFilterEixo(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todos">Todos</option>
            {EIXOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todos">Todos</option>
            {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex gap-2 self-end">
          <button className="h-9 px-4 bg-[#003F7D] text-white rounded-lg text-sm font-medium hover:bg-[#002D5A] transition-colors">
            Filtrar
          </button>
          {hasFilters && (
            <button onClick={() => { setSearch(""); setFilterAno("Todos"); setFilterUnidade("Todos"); setFilterEixo("Todos"); setFilterStatus("Todos"); }}
              className="h-9 px-3 flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <X size={13} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col px-8 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#003F7D] text-white sticky top-0 z-10">
                <tr>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Título</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">SEI</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">SIG</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Eixo</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Unidade</th>
                  <th className="text-center text-xs font-bold px-4 py-3 uppercase tracking-wider">CH</th>
                  <th className="text-right text-xs font-bold px-4 py-3 uppercase tracking-wider">Valor</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Status</th>
                  <th className="text-center text-xs font-bold px-4 py-3 uppercase tracking-wider w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-gray-400">
                      <Search size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Nenhum registro encontrado.</p>
                    </td>
                  </tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 text-sm max-w-[220px]" title={r.titulo}>{r.titulo || "—"}</p>
                      {r.observacao && (
                        <p className="text-xs text-gray-400 italic mt-0.5 truncate max-w-[220px]" title={r.observacao}>{r.observacao}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.sei && r.sei !== "SEM N° SEI" ? (
                        <a href={seiLink(r.sei)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#003F7D] hover:text-[#F57C00] font-mono text-xs underline underline-offset-2 transition-colors whitespace-nowrap">
                          {r.sei} <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">{r.sei || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-600">{r.sig || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-[#003F7D] text-white hover:bg-[#003F7D] text-xs font-semibold whitespace-nowrap">
                        {r.eixo || "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 text-sm max-w-[130px] truncate" title={r.unidade}>{r.unidade || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-sm text-gray-700">{r.ch ? `${r.ch}h` : "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">{r.valor || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openView(r)} title="Visualizar"
                          className="p-1.5 rounded-lg text-[#003F7D] hover:bg-blue-100 transition-colors">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => openEdit(r)} title="Editar"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(r)} title="Excluir"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between bg-gray-50">
            <p className="text-gray-600 text-sm">
              Mostrando <span className="font-semibold">{filtered.length}</span> de{" "}
              <span className="font-semibold">{registros.length}</span> registros PCA
            </p>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-semibold text-xs">{stats.vigentes} Vigentes</Badge>
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 font-semibold text-xs">{stats.analise} Em Análise</Badge>
              {stats.outros > 0 && (
                <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 font-semibold text-xs">{stats.outros} Suspensos</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal — Visualizar */}
      {modal.open && modal.mode === "view" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="h-1 w-full bg-[#003F7D]" />
            <div className="px-8 py-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-[#003F7D] max-w-sm">{modal.item.titulo || "Sem título"}</h2>
                  <p className="text-sm text-gray-500 mt-1">Ano: {modal.item.ano}</p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 mt-0.5"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Processo SEI</p>
                  {modal.item.sei && modal.item.sei !== "SEM N° SEI" ? (
                    <a href={seiLink(modal.item.sei)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#003F7D] underline text-sm transition-colors hover:text-[#F57C00]">
                      {modal.item.sei} <ExternalLink size={12} />
                    </a>
                  ) : <p className="text-gray-500">{modal.item.sei || "—"}</p>}
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Código SIG</p>
                  <p className="text-gray-800 font-mono">{modal.item.sig || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Eixo Tecnológico</p>
                  <p className="text-gray-800">{modal.item.eixo || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Unidade</p>
                  <p className="text-gray-800">{modal.item.unidade || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Carga Horária</p>
                  <p className="text-gray-800">{modal.item.ch ? `${modal.item.ch}h` : "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Valor</p>
                  <p className="text-gray-900 font-semibold">{modal.item.valor || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Status</p>
                  <StatusBadge status={modal.item.status} />
                </div>
                {modal.item.observacao && (
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Observação</p>
                    <p className="text-gray-700 italic">{modal.item.observacao}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <Button className="bg-[#003F7D] hover:bg-[#002D5A] h-11 px-6" onClick={() => {
                  const found = registros.find(r => r.id === modal.editId);
                  if (found) openEdit(found);
                }}>
                  <Edit2 size={15} className="mr-2" /> Editar
                </Button>
                <Button variant="outline" className="h-11 px-6" onClick={closeModal}>Fechar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Novo / Editar */}
      {modal.open && (modal.mode === "new" || modal.mode === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="h-1 w-full bg-[#F57C00]" />
            <div className="px-8 py-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#003F7D]">
                  {modal.mode === "new" ? "Novo Registro PCA" : "Editar Registro PCA"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Título <span className="text-red-500">*</span></Label>
                  <Input value={modal.item.titulo} onChange={e => setField("titulo", e.target.value)}
                    placeholder="Nome do curso ou programa..." className="h-11" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Ano</Label>
                  <select value={modal.item.ano} onChange={e => setField("ano", e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    {["2023","2024","2025","2026","2027"].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Status</Label>
                  <select value={modal.item.status} onChange={e => setField("status", e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Processo SEI</Label>
                  <div className="flex gap-2">
                    <Input value={modal.item.sei} onChange={e => setField("sei", e.target.value)}
                      placeholder="Ex: 2025.000000000-00" className="h-11 flex-1" />
                    {modal.item.sei && modal.item.sei !== "SEM N° SEI" && (
                      <a href={seiLink(modal.item.sei)} target="_blank" rel="noopener noreferrer"
                        className="h-11 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 text-[#003F7D] hover:bg-blue-50 text-xs font-medium transition-colors">
                        <ExternalLink size={13} /> SEI
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Código SIG</Label>
                  <Input value={modal.item.sig} onChange={e => setField("sig", e.target.value)}
                    placeholder="Ex: 121853" className="h-11" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Eixo Tecnológico</Label>
                  <select value={modal.item.eixo} onChange={e => setField("eixo", e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    <option value="">Selecione...</option>
                    {EIXOS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Unidade</Label>
                  <select value={modal.item.unidade} onChange={e => setField("unidade", e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    <option value="">Selecione...</option>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Carga Horária (h)</Label>
                  <Input value={modal.item.ch} type="number" min="0"
                    onChange={e => setField("ch", e.target.value)} placeholder="Ex: 160" className="h-11" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Valor</Label>
                  <Input value={modal.item.valor} onChange={e => setField("valor", e.target.value)}
                    placeholder="Ex: R$ 1.200,00" className="h-11" />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Observação</Label>
                  <Input value={modal.item.observacao} onChange={e => setField("observacao", e.target.value)}
                    placeholder="Observações adicionais..." className="h-11" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button className="bg-[#F57C00] hover:bg-[#E86D00] h-11 px-6 gap-2"
                  onClick={handleSave} disabled={!modal.item.titulo.trim()}>
                  <Save size={16} /> {modal.mode === "edit" ? "Salvar Alterações" : "Cadastrar"}
                </Button>
                <Button variant="outline" className="h-11 px-6" onClick={closeModal}>Cancelar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
