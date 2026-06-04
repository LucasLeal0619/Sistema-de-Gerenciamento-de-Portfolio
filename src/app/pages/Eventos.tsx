import {
  Search, Plus, Eye, Edit2, Trash2, X, Save, CheckCircle,
  CalendarDays, Users, MapPin, Zap, AlertCircle, Clock, Star,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useState, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  getStoredEventos, saveEvento, updateEvento, deleteEvento, EventoRecord,
} from "../utils/store";

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

const STATUS_LIST = ["Planejado", "Em análise", "Realizado", "Cancelado", "Suspenso"];

const EMPTY: Omit<EventoRecord, "id"> = {
  ano: "2026", nome: "", data: "", unidade: "", eixo: "",
  qtdPessoas: "", equipe: "", possuiAcaoExtensiva: false,
  acaoExtensivaVinculada: "", status: "Planejado", observacao: "",
};

function fmtDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

type ModalMode = "view" | "edit" | "new";

export function Eventos() {
  const [eventos, setEventos] = useState<EventoRecord[]>(getStoredEventos);
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("Todos");
  const [filterUnidade, setFilterUnidade] = useState("Todos");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [successMsg, setSuccessMsg] = useState("");
  const [modal, setModal] = useState<{ open: boolean; mode: ModalMode; item: Omit<EventoRecord, "id">; editId: string | null }>({
    open: false, mode: "new", item: EMPTY, editId: null,
  });

  const refresh = () => setEventos(getStoredEventos());
  const toast = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 4000); };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return eventos.filter(e => {
      const matchSearch = !q || e.nome.toLowerCase().includes(q) || e.eixo.toLowerCase().includes(q)
        || e.unidade.toLowerCase().includes(q) || e.equipe.toLowerCase().includes(q);
      const matchAno = filterAno === "Todos" || e.ano === filterAno;
      const matchUnidade = filterUnidade === "Todos" || e.unidade === filterUnidade;
      const matchEixo = filterEixo === "Todos" || e.eixo === filterEixo;
      const matchStatus = filterStatus === "Todos" || e.status === filterStatus;
      return matchSearch && matchAno && matchUnidade && matchEixo && matchStatus;
    });
  }, [eventos, search, filterAno, filterUnidade, filterEixo, filterStatus]);

  const stats = useMemo(() => ({
    total: eventos.length,
    realizados: eventos.filter(e => e.status === "Realizado").length,
    planejados: eventos.filter(e => e.status === "Planejado" || e.status === "Em análise").length,
    comAcao: eventos.filter(e => e.possuiAcaoExtensiva).length,
    totalPessoas: eventos.reduce((sum, e) => sum + (parseInt(e.qtdPessoas) || 0), 0),
  }), [eventos]);

  const anos = [...new Set(eventos.map(e => e.ano))].sort((a, b) => +b - +a);

  const openNew = () => setModal({ open: true, mode: "new", item: EMPTY, editId: null });
  const openView = (e: EventoRecord) => setModal({ open: true, mode: "view", item: { ...e }, editId: e.id });
  const openEdit = (e: EventoRecord) => setModal({ open: true, mode: "edit", item: { ...e }, editId: e.id });
  const closeModal = () => setModal(m => ({ ...m, open: false }));

  const setField = <K extends keyof Omit<EventoRecord, "id">>(k: K, v: Omit<EventoRecord, "id">[K]) =>
    setModal(m => ({ ...m, item: { ...m.item, [k]: v } }));

  const handleSave = () => {
    if (!modal.item.nome.trim()) return;
    if (modal.mode === "edit" && modal.editId) {
      updateEvento(modal.editId, modal.item);
      toast("Evento atualizado!");
    } else {
      saveEvento(modal.item);
      toast("Evento cadastrado!");
    }
    refresh();
    closeModal();
  };

  const handleDelete = (e: EventoRecord) => {
    if (!window.confirm(`Excluir "${e.nome}"?`)) return;
    deleteEvento(e.id);
    refresh();
    toast("Evento excluído.");
  };

  const hasFilters = search || filterAno !== "Todos" || filterUnidade !== "Todos" || filterEixo !== "Todos" || filterStatus !== "Todos";

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
            <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
            <p className="text-gray-600 mt-1">Gestão de eventos vinculados aos eixos e ações extensivas — SENAC DF</p>
          </div>
          <Button className="bg-[#F57C00] hover:bg-[#E86D00] h-12 px-6 font-semibold" onClick={openNew}>
            <Plus size={20} className="mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-8 mt-6 mb-2">
        <button
          onClick={() => setFilterStatus("Todos")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${filterStatus === "Todos" ? "border-[#003F7D] bg-[#E8EFF7] ring-2 ring-[#003F7D]/20" : "border-gray-100 bg-white hover:border-[#003F7D]/40"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Total de Eventos</p>
              <p className="text-3xl font-bold text-[#003F7D]">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">Ver todos</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "Todos" ? "bg-[#003F7D]" : "bg-[#E8EFF7]"}`}>
              <CalendarDays className={`w-5 h-5 ${filterStatus === "Todos" ? "text-white" : "text-[#003F7D]"}`} />
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === "Realizado" ? "Todos" : "Realizado")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${filterStatus === "Realizado" ? "border-green-500 bg-green-50 ring-2 ring-green-200" : "border-gray-100 bg-white hover:border-green-300"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Realizados</p>
              <p className="text-3xl font-bold text-green-600">{stats.realizados}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.total ? Math.round(stats.realizados / stats.total * 100) : 0}% do total</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "Realizado" ? "bg-green-500" : "bg-green-50"}`}>
              <CheckCircle className={`w-5 h-5 ${filterStatus === "Realizado" ? "text-white" : "text-green-600"}`} />
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === "Planejado" ? "Todos" : "Planejado")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${filterStatus === "Planejado" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200" : "border-gray-100 bg-white hover:border-blue-300"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Planejados / Em análise</p>
              <p className="text-3xl font-bold text-blue-600">{stats.planejados}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.total ? Math.round(stats.planejados / stats.total * 100) : 0}% do total</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "Planejado" ? "bg-blue-500" : "bg-blue-50"}`}>
              <Clock className={`w-5 h-5 ${filterStatus === "Planejado" ? "text-white" : "text-blue-600"}`} />
            </div>
          </div>
        </button>

        <div className="text-left rounded-xl p-5 border border-orange-100 bg-orange-50 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs mb-1">Pessoas Envolvidas</p>
              <p className="text-3xl font-bold text-[#F57C00]">{stats.totalPessoas.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.comAcao} c/ ação extensiva</p>
            </div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#F57C00]">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end bg-white border border-gray-200 rounded-xl px-4 py-4 mx-8 mt-4 mb-6 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, eixo, unidade ou responsável..."
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
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Nome do Evento</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Data</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Unidade / Local</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Eixo</th>
                  <th className="text-center text-xs font-bold px-4 py-3 uppercase tracking-wider">Pessoas</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Equipe / Responsáveis</th>
                  <th className="text-center text-xs font-bold px-4 py-3 uppercase tracking-wider">Ação Ext.</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Ação Vinculada</th>
                  <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Status</th>
                  <th className="text-center text-xs font-bold px-4 py-3 uppercase tracking-wider w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center text-gray-400">
                      <CalendarDays size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Nenhum evento encontrado.</p>
                    </td>
                  </tr>
                ) : filtered.map(e => (
                  <tr key={e.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 text-sm max-w-[200px]">{e.nome}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{e.ano}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-700 text-sm whitespace-nowrap">
                        <CalendarDays size={13} className="text-gray-400" />
                        {fmtDate(e.data)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                        <p className="text-gray-700 text-sm max-w-[130px] truncate" title={e.unidade}>{e.unidade || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-[#003F7D] text-white hover:bg-[#003F7D] text-xs font-semibold whitespace-nowrap">
                        {e.eixo || "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-700 text-sm font-semibold">
                        <Users size={13} className="text-gray-400" />
                        {e.qtdPessoas || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 text-xs max-w-[140px] truncate" title={e.equipe}>{e.equipe || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {e.possuiAcaoExtensiva ? (
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 text-xs font-semibold px-2 py-0.5 rounded-full">
                          <Zap size={10} /> Sim
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Não</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {e.acaoExtensivaVinculada ? (
                        <p className="text-[#003F7D] text-xs max-w-[160px] truncate" title={e.acaoExtensivaVinculada}>
                          {e.acaoExtensivaVinculada}
                        </p>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openView(e)} title="Visualizar"
                          className="p-1.5 rounded-lg text-[#003F7D] hover:bg-blue-100 transition-colors">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => openEdit(e)} title="Editar"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(e)} title="Excluir"
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
              <span className="font-semibold">{eventos.length}</span> eventos
            </p>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-semibold text-xs">{stats.realizados} Realizados</Badge>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-semibold text-xs">{stats.planejados} Planejados</Badge>
              <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 font-semibold text-xs">{stats.comAcao} c/ Ação Ext.</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Modal — Visualizar */}
      {modal.open && modal.mode === "view" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="h-1 w-full bg-[#003F7D]" />
            <div className="px-8 py-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#003F7D]">{modal.item.nome}</h2>
                  <p className="text-sm text-gray-500 mt-1">{modal.item.ano}</p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 mt-1"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Data</p>
                  <p className="text-gray-800">{fmtDate(modal.item.data)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Unidade / Local</p>
                  <p className="text-gray-800">{modal.item.unidade || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Eixo Tecnológico</p>
                  <p className="text-gray-800">{modal.item.eixo || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Status</p>
                  <StatusBadge status={modal.item.status} />
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Qtd. de Pessoas</p>
                  <p className="text-gray-800">{modal.item.qtdPessoas || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Equipe / Responsáveis</p>
                  <p className="text-gray-800">{modal.item.equipe || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Possui Ação Extensiva?</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${modal.item.possuiAcaoExtensiva ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {modal.item.possuiAcaoExtensiva ? <><Zap size={10} /> Sim</> : "Não"}
                  </span>
                </div>
                {modal.item.possuiAcaoExtensiva && modal.item.acaoExtensivaVinculada && (
                  <div>
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Ação Extensiva Vinculada</p>
                    <p className="text-[#003F7D] text-sm">{modal.item.acaoExtensivaVinculada}</p>
                  </div>
                )}
                {modal.item.observacao && (
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Observação</p>
                    <p className="text-gray-700 italic">{modal.item.observacao}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button className="bg-[#003F7D] hover:bg-[#002D5A] h-11 px-6" onClick={() => {
                  const found = eventos.find(ev => ev.id === modal.editId);
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
            <div className="h-1 w-full bg-[#F57C00]" />
            <div className="px-8 py-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#003F7D]">
                  {modal.mode === "new" ? "Novo Evento" : "Editar Evento"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Nome */}
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Nome do Evento <span className="text-red-500">*</span>
                  </Label>
                  <Input value={modal.item.nome}
                    onChange={e => setField("nome", e.target.value)}
                    placeholder="Nome do evento..." className="h-11" />
                </div>

                {/* Ano */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Ano</Label>
                  <select value={modal.item.ano} onChange={e => setField("ano", e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    {["2023","2024","2025","2026","2027"].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                {/* Data */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Data do Evento</Label>
                  <Input value={modal.item.data} type="date"
                    onChange={e => setField("data", e.target.value)} className="h-11" />
                </div>

                {/* Eixo */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Eixo Tecnológico</Label>
                  <select value={modal.item.eixo} onChange={e => setField("eixo", e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    <option value="">Selecione...</option>
                    {EIXOS.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>

                {/* Unidade */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Unidade / Local</Label>
                  <select value={modal.item.unidade} onChange={e => setField("unidade", e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    <option value="">Selecione...</option>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>

                {/* Qtd Pessoas */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Qtd. de Pessoas Envolvidas</Label>
                  <Input value={modal.item.qtdPessoas} type="number" min="0"
                    onChange={e => setField("qtdPessoas", e.target.value)}
                    placeholder="Ex: 80" className="h-11" />
                </div>

                {/* Status */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Status</Label>
                  <select value={modal.item.status} onChange={e => setField("status", e.target.value)}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Equipe */}
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Equipe / Responsáveis</Label>
                  <Input value={modal.item.equipe}
                    onChange={e => setField("equipe", e.target.value)}
                    placeholder="Ex: Ana Lima, Carlos Souza" className="h-11" />
                </div>

                {/* Possui Ação Extensiva */}
                <div className="col-span-2">
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
                    <input
                      type="checkbox"
                      id="possuiAcao"
                      checked={modal.item.possuiAcaoExtensiva}
                      onChange={e => {
                        setField("possuiAcaoExtensiva", e.target.checked);
                        if (!e.target.checked) setField("acaoExtensivaVinculada", "");
                      }}
                      className="w-4 h-4 accent-[#003F7D]"
                    />
                    <label htmlFor="possuiAcao" className="text-sm font-semibold text-gray-700 cursor-pointer flex items-center gap-2">
                      <Zap size={15} className="text-[#F57C00]" />
                      Este evento possui uma Ação Extensiva vinculada
                    </label>
                  </div>
                </div>

                {/* Ação Extensiva Vinculada */}
                {modal.item.possuiAcaoExtensiva && (
                  <div className="col-span-2">
                    <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Ação Extensiva Vinculada</Label>
                    <Input value={modal.item.acaoExtensivaVinculada}
                      onChange={e => setField("acaoExtensivaVinculada", e.target.value)}
                      placeholder="Nome da ação extensiva relacionada..." className="h-11" />
                  </div>
                )}

                {/* Observação */}
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Observação</Label>
                  <textarea value={modal.item.observacao}
                    onChange={e => setField("observacao", e.target.value)}
                    placeholder="Observações adicionais sobre o evento..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D] resize-none"
                    rows={3} />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button className="bg-[#F57C00] hover:bg-[#E86D00] h-11 px-6 gap-2"
                  onClick={handleSave} disabled={!modal.item.nome.trim()}>
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
