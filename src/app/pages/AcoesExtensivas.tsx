import {
  Search, Plus, Eye, Edit2, Trash2, X, Save, CheckCircle,
  ExternalLink, FileText, Zap, Clock, CalendarDays, AlertCircle,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useState, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  getStoredAcoes, saveAcao, updateAcao, deleteAcao, AcaoExtensivaRecord,
} from "../utils/store";

const SEI_BASE = "https://sei.df.gov.br/sei/controlador.php?acao=procedimento_trabalhar&id_procedimento=";
const seiLink = (sei: string) => `${SEI_BASE}${encodeURIComponent(sei)}`;

const EIXOS = [
  "Ambiente e Saúde",
  "Beleza e Cuidado Pessoal",
  "Gastronomia",
  "Gestão e Negócios",
  "Gestão e Moda",
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

const STATUS_LIST = ["Planejada", "Em análise", "Realizada", "Cancelada", "Suspensa"];

const EMPTY: Omit<AcaoExtensivaRecord, "id"> = {
  ano: "2026", titulo: "", eixo: "", unidade: "", cargaHoraria: "",
  data: "", processoSEI: "", status: "Planejada", observacao: "",
};

function fmtDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

type ModalMode = "view" | "edit" | "new";

export function AcoesExtensivas() {
  const [acoes, setAcoes] = useState<AcaoExtensivaRecord[]>(getStoredAcoes);
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todos");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [successMsg, setSuccessMsg] = useState("");
  const [modal, setModal] = useState<{ open: boolean; mode: ModalMode; item: Omit<AcaoExtensivaRecord, "id">; editId: string | null }>({
    open: false, mode: "new", item: EMPTY, editId: null,
  });

  const refresh = () => setAcoes(getStoredAcoes());
  const toast = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 4000); };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return acoes.filter(a => {
      const matchSearch = !q || a.titulo.toLowerCase().includes(q) || a.eixo.toLowerCase().includes(q)
        || a.unidade.toLowerCase().includes(q) || a.processoSEI.toLowerCase().includes(q);
      const matchAno = filterAno === "Todos" || a.ano === filterAno;
      const matchUnidade = filterUnidade === "Todos" || a.unidade === filterUnidade;
      const matchEixo = filterEixo === "Todos" || a.eixo === filterEixo;
      const matchStatus = filterStatus === "Todos" || a.status === filterStatus;
      return matchSearch && matchAno && matchUnidade && matchEixo && matchStatus;
    });
  }, [acoes, search, filterAno, filterUnidade, filterEixo, filterStatus]);

  const stats = useMemo(() => ({
    total: acoes.length,
    realizadas: acoes.filter(a => a.status === "Realizada").length,
    planejadas: acoes.filter(a => a.status === "Planejada" || a.status === "Em análise").length,
    canceladas: acoes.filter(a => a.status === "Cancelada" || a.status === "Suspensa").length,
  }), [acoes]);

  const openNew = () => setModal({ open: true, mode: "new", item: EMPTY, editId: null });

  const openView = (a: AcaoExtensivaRecord) =>
    setModal({ open: true, mode: "view", item: { ...a }, editId: a.id });

  const openEdit = (a: AcaoExtensivaRecord) =>
    setModal({ open: true, mode: "edit", item: { ...a }, editId: a.id });

  const closeModal = () => setModal(m => ({ ...m, open: false }));

  const handleSave = () => {
    if (!modal.item.titulo.trim()) return;
    if (modal.mode === "edit" && modal.editId) {
      updateAcao(modal.editId, modal.item);
      toast("Ação extensiva atualizada!");
    } else {
      saveAcao(modal.item);
      toast("Ação extensiva cadastrada!");
    }
    refresh();
    closeModal();
  };

  const handleDelete = (a: AcaoExtensivaRecord) => {
    if (!window.confirm(`Excluir "${a.titulo}"?`)) return;
    deleteAcao(a.id);
    refresh();
    toast("Registro excluído.");
  };

  const anos = [...new Set(acoes.map(a => a.ano))].sort((x, y) => +y - +x);

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
            <h1 className="text-3xl font-bold text-gray-900">Ações Extensivas</h1>
            <p className="text-gray-600 mt-1">Gestão de ações de curta duração — SENAC DF</p>
          </div>
          <Button className="bg-[#F57C00] hover:bg-[#E86D00] h-12 px-6 font-semibold" onClick={openNew}>
            <Plus size={20} className="mr-2" />
            Nova Ação Extensiva
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-8 mt-6 mb-4">
        <button
          onClick={() => setFilterStatus("Todos")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${filterStatus === "Todos" ? "border-[#003F7D] bg-[#E8EFF7] ring-2 ring-[#003F7D]/20" : "border-gray-100 bg-white hover:border-[#003F7D]/40"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Total de Ações</p>
              <p className="text-3xl font-bold text-[#003F7D]">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">Ver todas</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "Todos" ? "bg-[#003F7D]" : "bg-[#E8EFF7]"}`}>
              <Zap className={`w-5 h-5 ${filterStatus === "Todos" ? "text-white" : "text-[#003F7D]"}`} />
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === "Realizada" ? "Todos" : "Realizada")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${filterStatus === "Realizada" ? "border-green-500 bg-green-50 ring-2 ring-green-200" : "border-gray-100 bg-white hover:border-green-300"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Realizadas</p>
              <p className="text-3xl font-bold text-green-600">{stats.realizadas}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.total ? Math.round(stats.realizadas / stats.total * 100) : 0}% do total</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "Realizada" ? "bg-green-500" : "bg-green-50"}`}>
              <CheckCircle className={`w-5 h-5 ${filterStatus === "Realizada" ? "text-white" : "text-green-600"}`} />
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === "Planejada" ? "Todos" : "Planejada")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${filterStatus === "Planejada" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : "border-gray-100 bg-white hover:border-blue-300"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Em andamento / Planejadas</p>
              <p className="text-3xl font-bold text-blue-600">{stats.planejadas}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.total ? Math.round(stats.planejadas / stats.total * 100) : 0}% do total</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "Planejada" ? "bg-blue-500" : "bg-blue-50"}`}>
              <Clock className={`w-5 h-5 ${filterStatus === "Planejada" ? "text-white" : "text-blue-600"}`} />
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === "Cancelada" ? "Todos" : "Cancelada")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${filterStatus === "Cancelada" ? "border-red-500 bg-red-50 ring-2 ring-red-200" : "border-gray-100 bg-white hover:border-red-300"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Canceladas / Suspensas</p>
              <p className="text-3xl font-bold text-red-600">{stats.canceladas}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.total ? Math.round(stats.canceladas / stats.total * 100) : 0}% do total</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "Cancelada" ? "bg-red-500" : "bg-red-50"}`}>
              <AlertCircle className={`w-5 h-5 ${filterStatus === "Cancelada" ? "text-white" : "text-red-600"}`} />
            </div>
          </div>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end bg-white border border-gray-200 rounded-xl px-4 py-4 mx-8 mb-6 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título, eixo, unidade ou processo SEI..."
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
          {(search || filterAno !== "Todos" || filterUnidade !== "Todos" || filterEixo !== "Todos" || filterStatus !== "Todos") && (
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
          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead className="bg-[#003F7D] text-white sticky top-0 z-10">
                <tr>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Título da Ação</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Eixo</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Unidade</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">CH</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Data</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Processo SEI</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Status</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Observação</th>
                  <th className="text-center text-xs font-bold px-4 py-3 uppercase tracking-wider w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-gray-400">
                      <Zap size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Nenhuma ação extensiva encontrada.</p>
                    </td>
                  </tr>
                ) : filtered.map(a => (
                  <tr key={a.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 text-sm max-w-xs">{a.titulo}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.ano}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-[#003F7D] text-white hover:bg-[#003F7D] text-xs font-semibold whitespace-nowrap">
                        {a.eixo || "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 text-sm">{a.unidade || "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700 text-sm font-mono">{a.cargaHoraria ? `${a.cargaHoraria}h` : "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-700 text-sm">
                        <CalendarDays size={13} className="text-gray-400" />
                        {fmtDate(a.data)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {a.processoSEI ? (
                        <a href={seiLink(a.processoSEI)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#003F7D] hover:text-[#F57C00] font-mono text-xs underline underline-offset-2 transition-colors">
                          {a.processoSEI}
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3">
                      {a.observacao ? (
                        <p className="text-xs text-gray-600 italic max-w-[180px] truncate" title={a.observacao}>
                          {a.observacao}
                        </p>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openView(a)} title="Visualizar"
                          className="p-1.5 rounded-lg text-[#003F7D] hover:bg-blue-100 transition-colors">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => openEdit(a)} title="Editar"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(a)} title="Excluir"
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
              <span className="font-semibold">{acoes.length}</span> ações extensivas
            </p>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-semibold text-xs">{stats.realizadas} Realizadas</Badge>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-semibold text-xs">{stats.planejadas} Planejadas</Badge>
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100 font-semibold text-xs">{stats.canceladas} Canceladas</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Modal View */}
      {modal.open && modal.mode === "view" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="h-1 w-full bg-[#003F7D]" />
            <div className="px-8 py-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#003F7D]">{modal.item.titulo}</h2>
                  <p className="text-sm text-gray-500 mt-1">{modal.item.ano}</p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Eixo Tecnológico</p>
                  <p className="text-gray-800">{modal.item.eixo || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Unidade</p>
                  <p className="text-gray-800">{modal.item.unidade || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Carga Horária</p>
                  <p className="text-gray-800">{modal.item.cargaHoraria ? `${modal.item.cargaHoraria}h` : "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Data</p>
                  <p className="text-gray-800">{fmtDate(modal.item.data)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Status</p>
                  <StatusBadge status={modal.item.status} />
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Processo SEI</p>
                  {modal.item.processoSEI ? (
                    <a href={seiLink(modal.item.processoSEI)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#003F7D] hover:text-[#F57C00] underline text-sm transition-colors">
                      {modal.item.processoSEI} <ExternalLink size={12} />
                    </a>
                  ) : <p className="text-gray-400">—</p>}
                </div>
                {modal.item.observacao && (
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs font-semibold uppercase mb-1">Observação</p>
                    <p className="text-gray-700 italic">{modal.item.observacao}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <Button className="bg-[#003F7D] hover:bg-[#002D5A] h-11 px-6" onClick={() => {
                  const found = acoes.find(a => a.id === modal.editId);
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

      {/* Modal New / Edit */}
      {modal.open && (modal.mode === "new" || modal.mode === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="h-1 w-full bg-[#F57C00]" />
            <div className="px-8 py-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#003F7D]">
                  {modal.mode === "new" ? "Nova Ação Extensiva" : "Editar Ação Extensiva"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Título da Ação <span className="text-red-500">*</span>
                  </Label>
                  <Input value={modal.item.titulo}
                    onChange={e => setModal(m => ({ ...m, item: { ...m.item, titulo: e.target.value } }))}
                    placeholder="Nome da ação extensiva..." className="h-11" />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Ano</Label>
                  <select value={modal.item.ano}
                    onChange={e => setModal(m => ({ ...m, item: { ...m.item, ano: e.target.value } }))}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    {["2023","2024","2025","2026","2027"].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Status</Label>
                  <select value={modal.item.status}
                    onChange={e => setModal(m => ({ ...m, item: { ...m.item, status: e.target.value } }))}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Eixo Tecnológico</Label>
                  <select value={modal.item.eixo}
                    onChange={e => setModal(m => ({ ...m, item: { ...m.item, eixo: e.target.value } }))}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    <option value="">Selecione...</option>
                    {EIXOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Unidade</Label>
                  <select value={modal.item.unidade}
                    onChange={e => setModal(m => ({ ...m, item: { ...m.item, unidade: e.target.value } }))}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    <option value="">Selecione...</option>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Carga Horária (h)</Label>
                  <Input value={modal.item.cargaHoraria} type="number" min="1"
                    onChange={e => setModal(m => ({ ...m, item: { ...m.item, cargaHoraria: e.target.value } }))}
                    placeholder="Ex: 8" className="h-11" />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Data</Label>
                  <Input value={modal.item.data} type="date"
                    onChange={e => setModal(m => ({ ...m, item: { ...m.item, data: e.target.value } }))}
                    className="h-11" />
                </div>

                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Processo SEI</Label>
                  <div className="flex gap-2">
                    <Input value={modal.item.processoSEI}
                      onChange={e => setModal(m => ({ ...m, item: { ...m.item, processoSEI: e.target.value } }))}
                      placeholder="Ex: 2026.000000000-00" className="h-11 flex-1" />
                    {modal.item.processoSEI && (
                      <a href={seiLink(modal.item.processoSEI)} target="_blank" rel="noopener noreferrer"
                        className="h-11 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 text-[#003F7D] hover:bg-blue-50 text-xs font-medium transition-colors">
                        <ExternalLink size={13} /> Consultar no SEI
                      </a>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Observação</Label>
                  <textarea value={modal.item.observacao}
                    onChange={e => setModal(m => ({ ...m, item: { ...m.item, observacao: e.target.value } }))}
                    placeholder="Observações adicionais sobre a ação extensiva..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D] resize-none"
                    rows={3} />
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
