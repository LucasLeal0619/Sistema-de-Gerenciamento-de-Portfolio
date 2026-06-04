import { Search, FileText, TrendingUp, AlertCircle, Calendar, Download, BarChart3, Plus, Edit2, Trash2, X, Save, CheckCircle, Info, ExternalLink } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { planoMetas2025Courses, getPlanoMetas2025Statistics } from "../data/planoMetas2025";
import { exportToExcel } from "../utils/exportExcel";
import { gerarRelatorioPlanoMetas } from "../utils/gerarRelatorio";
import {
  getStoredPlanoMetas,
  savePlanoMeta,
  updatePlanoMeta,
  deletePlanoMeta,
  PlanoMetaRecord,
  planoMetasDeleted,
} from "../utils/store";
import { PlanoMetas2025Course } from "../data/planoMetas2025";

const EMPTY_META: Omit<PlanoMetaRecord, "id"> = {
  segmento: "", categoria: "QUALIFICAÇÃO", tipo: "", numeroSEI: "", codigoSIG: "",
  mesEntrega: "", status: "EM ANÁLISE", origem: "CPED", observacao: "",
};

export function PlanoMetas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSegmento, setFilterSegmento] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterMes, setFilterMes] = useState("Todos");
  const [filterCategoria, setFilterCategoria] = useState("Todos");
  const [storedMetas, setStoredMetas] = useState<PlanoMetaRecord[]>(getStoredPlanoMetas);
  const [deletedStaticIds, setDeletedStaticIds] = useState<Set<string>>(() => planoMetasDeleted.get());
  const [modal, setModal] = useState<{ open: boolean; item: Omit<PlanoMetaRecord, "id">; editId: string | null; replaceStaticId?: string }>({
    open: false, item: EMPTY_META, editId: null,
  });
  const [successMsg, setSuccessMsg] = useState("");

  const stats = getPlanoMetas2025Statistics();

  const refreshStored = () => {
    setStoredMetas(getStoredPlanoMetas());
    setDeletedStaticIds(planoMetasDeleted.get());
  };
  const toast = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 4000); };

  const openNew = () => setModal({ open: true, item: EMPTY_META, editId: null });

  const openEdit = (item: any, isStored: boolean) => {
    if (isStored) {
      setModal({ open: true, item: { segmento: item.segmento, categoria: item.categoria, tipo: item.tipo, numeroSEI: item.numeroSEI, codigoSIG: item.codigoSIG, mesEntrega: item.mesEntrega, status: item.status, origem: item.origem, observacao: item.observacao || "" }, editId: item.id });
    } else {
      setModal({ open: true, item: { segmento: item.segmento, categoria: item.categoria, tipo: item.tipo, numeroSEI: item.numeroSEI, codigoSIG: item.codigoSIG, mesEntrega: item.mesEntrega, status: item.status, origem: item.origem, observacao: item.observacao || "" }, editId: null, replaceStaticId: String(item.id) });
    }
  };

  const closeModal = () => setModal({ open: false, item: EMPTY_META, editId: null });

  const handleSave = () => {
    if (!modal.item.tipo.trim()) return;
    if (modal.editId) {
      updatePlanoMeta(modal.editId, modal.item);
      toast("Registro atualizado!");
    } else {
      savePlanoMeta(modal.item);
      if (modal.replaceStaticId) planoMetasDeleted.mark(modal.replaceStaticId);
      toast(modal.replaceStaticId ? "Registro editado e salvo!" : "Registro cadastrado!");
    }
    refreshStored();
    closeModal();
  };

  const handleDelete = (item: any, isStored: boolean) => {
    if (!window.confirm(`Excluir "${item.tipo}"?`)) return;
    if (isStored) {
      deletePlanoMeta(item.id);
    } else {
      planoMetasDeleted.mark(String(item.id));
    }
    refreshStored();
    toast("Registro excluído.");
  };

  const handleDeleteStatic = (course: PlanoMetas2025Course) => {
    if (!window.confirm(`Excluir "${course.tipo}"?`)) return;
    planoMetasDeleted.mark(String(course.id));
    setDeletedStaticIds(planoMetasDeleted.get());
    toast("Registro excluído.");
  };

  const staticFiltered = planoMetas2025Courses
    .filter(c => !deletedStaticIds.has(String(c.id)))
    .filter((course) => {
      const matchesSearch =
        course.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.numeroSEI.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.codigoSIG.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSegmento = filterSegmento === "Todos" || course.segmento === filterSegmento;
      const matchesStatus = filterStatus === "Todos" || course.status === filterStatus;
      const matchesMes = filterMes === "Todos" || course.mesEntrega === filterMes;
      const matchesCategoria = filterCategoria === "Todos" || course.categoria === filterCategoria;
      return matchesSearch && matchesSegmento && matchesStatus && matchesMes && matchesCategoria;
    });

  const storedFiltered = storedMetas.filter((course) => {
    const matchesSearch =
      course.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.numeroSEI.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.codigoSIG.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegmento = filterSegmento === "Todos" || course.segmento === filterSegmento;
    const matchesStatus = filterStatus === "Todos" || course.status === filterStatus;
    const matchesMes = filterMes === "Todos" || course.mesEntrega === filterMes;
    const matchesCategoria = filterCategoria === "Todos" || course.categoria === filterCategoria;
    return matchesSearch && matchesSegmento && matchesStatus && matchesMes && matchesCategoria;
  });

  const filteredCourses = [
    ...staticFiltered.map(c => ({ ...c, _stored: false })),
    ...storedFiltered.map(c => ({ ...c, _stored: true })),
  ];

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
            <h1 className="text-3xl font-bold text-gray-900">Plano de Metas 2025</h1>
            <p className="text-gray-600 mt-1">Mapeamento de Produção, Produtividade e Estratégias - SENAC DF</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 px-6" onClick={() => exportToExcel(filteredCourses.map(c => ({ "Segmento": c.segmento, "Categoria": c.categoria, "Tipo": c.tipo, "N° SEI": c.numeroSEI, "Cód. SIG": c.codigoSIG, "Status": c.status, "Mês Entrega": c.mesEntrega })), "Plano_Metas_2025")}>
              <Download size={20} className="mr-2" />
              Exportar Excel
            </Button>
            <Button variant="outline" className="h-12 px-6" onClick={() => gerarRelatorioPlanoMetas(filteredCourses, stats)}>
              <BarChart3 size={20} className="mr-2" />
              Relatório Gerencial
            </Button>
            <Button className="bg-[#F57C00] hover:bg-[#E86D00] h-12 px-6 font-semibold" onClick={openNew}>
              <Plus size={20} className="mr-2" />
              Novo Registro
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards — clicáveis como atalhos de filtro */}
      <div className="grid grid-cols-4 gap-4 mb-6 px-8">
        {/* Total */}
        <button
          onClick={() => setFilterStatus("Todos")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${
            filterStatus === "Todos"
              ? "border-[#003F7D] bg-[#E8EFF7] ring-2 ring-[#003F7D]/20"
              : "border-gray-100 bg-white hover:border-[#003F7D]/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs mb-1">Total de Cursos</p>
              <p className="text-3xl font-bold text-[#003F7D]">{stats.totalCursos}</p>
              <p className="text-xs text-gray-400 mt-1">Ver todos</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "Todos" ? "bg-[#003F7D]" : "bg-[#E8EFF7]"}`}>
              <FileText className={`w-5 h-5 ${filterStatus === "Todos" ? "text-white" : "text-[#003F7D]"}`} />
            </div>
          </div>
        </button>

        {/* Publicados */}
        <button
          onClick={() => setFilterStatus(filterStatus === "PUBLICADO" ? "Todos" : "PUBLICADO")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${
            filterStatus === "PUBLICADO"
              ? "border-green-500 bg-green-50 ring-2 ring-green-200"
              : "border-gray-100 bg-white hover:border-green-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs mb-1">Publicados</p>
              <p className="text-3xl font-bold text-green-600">{stats.statusCount.publicado}</p>
              <p className="text-xs text-gray-500 mt-1">{Math.round((stats.statusCount.publicado / stats.totalCursos) * 100)}% do total</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "PUBLICADO" ? "bg-green-500" : "bg-green-50"}`}>
              <TrendingUp className={`w-5 h-5 ${filterStatus === "PUBLICADO" ? "text-white" : "text-green-600"}`} />
            </div>
          </div>
        </button>

        {/* Em Análise */}
        <button
          onClick={() => setFilterStatus(filterStatus === "EM ANÁLISE" ? "Todos" : "EM ANÁLISE")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${
            filterStatus === "EM ANÁLISE"
              ? "border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200"
              : "border-gray-100 bg-white hover:border-yellow-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs mb-1">Em Análise</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.statusCount.emAnalise}</p>
              <p className="text-xs text-gray-500 mt-1">{Math.round((stats.statusCount.emAnalise / stats.totalCursos) * 100)}% do total</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "EM ANÁLISE" ? "bg-yellow-500" : "bg-yellow-50"}`}>
              <Calendar className={`w-5 h-5 ${filterStatus === "EM ANÁLISE" ? "text-white" : "text-yellow-600"}`} />
            </div>
          </div>
        </button>

        {/* CPFD */}
        <button
          onClick={() => setFilterStatus(filterStatus === "CPFD" ? "Todos" : "CPFD")}
          className={`text-left rounded-xl p-5 border transition-all shadow-sm hover:shadow-md ${
            filterStatus === "CPFD"
              ? "border-red-500 bg-red-50 ring-2 ring-red-200"
              : "border-gray-100 bg-white hover:border-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-gray-600 text-xs">CPFD / Pendentes</p>
                <span
                  title="CPFD: sigla a confirmar com a área responsável. Indica registros pendentes de validação ou devolução."
                  className="text-gray-400 hover:text-[#003F7D] cursor-help transition-colors"
                >
                  <Info size={11} />
                </span>
              </div>
              <p className="text-3xl font-bold text-red-600">{stats.statusCount.cpfd}</p>
              <p className="text-xs text-gray-500 mt-1">{Math.round((stats.statusCount.cpfd / stats.totalCursos) * 100)}% do total</p>
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${filterStatus === "CPFD" ? "bg-red-500" : "bg-red-50"}`}>
              <AlertCircle className={`w-5 h-5 ${filterStatus === "CPFD" ? "text-white" : "text-red-600"}`} />
            </div>
          </div>
        </button>
      </div>

      {/* Legenda CPFD */}
      <div className="px-8 mb-4 flex items-center gap-2">
        <Info size={12} className="text-gray-400 flex-shrink-0" />
        <p className="text-xs text-gray-400">
          <strong>CPFD</strong> — sigla a confirmar com a área responsável. Representa registros pendentes ou devolvidos para revisão.
          {filterStatus !== "Todos" && (
            <button
              onClick={() => setFilterStatus("Todos")}
              className="ml-3 text-[#003F7D] underline font-medium hover:text-[#F57C00] transition-colors"
            >
              Limpar filtro de status
            </button>
          )}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end bg-white border border-gray-200 rounded-xl px-4 py-4 mx-8 mb-6 shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por curso, número SEI ou código SIG..."
            className="w-full pl-9 pr-3 h-9 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Eixo / Segmento</label>
          <select value={filterSegmento} onChange={(e) => setFilterSegmento(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todos">Todos</option>
            {stats.segmentos.map(seg => <option key={seg} value={seg}>{seg}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Categoria</label>
          <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todos">Todas</option>
            <option value="APERFEIÇOAMENTO">Aperfeiçoamento</option>
            <option value="QUALIFICAÇÃO">Qualificação</option>
            <option value="HABILITAÇÃO TÉCNICA">Técnico</option>
            <option value="ESPECIALIZAÇÃO TÉCNICA">Especialização</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Mês de Entrega</label>
          <select value={filterMes} onChange={(e) => setFilterMes(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todos">Todos</option>
            {stats.mesesEntrega.map(mes => <option key={mes} value={mes}>{mes}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todos">Todos</option>
            <option value="PUBLICADO">Publicado</option>
            <option value="EM ANÁLISE">Em Análise</option>
            <option value="CPFD">CPFD</option>
          </select>
        </div>
        <div className="flex gap-2 self-end">
          <button className="h-9 px-4 bg-[#003F7D] text-white rounded-lg text-sm font-medium hover:bg-[#002D5A] transition-colors">
            Filtrar
          </button>
          {(searchTerm || filterSegmento !== "Todos" || filterCategoria !== "Todos" || filterMes !== "Todos" || filterStatus !== "Todos") && (
            <button
              onClick={() => { setSearchTerm(""); setFilterSegmento("Todos"); setFilterCategoria("Todos"); setFilterMes("Todos"); setFilterStatus("Todos"); }}
              className="h-9 px-3 flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X size={13} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden px-8">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-[#003F7D] text-white sticky top-0 z-10">
              <tr>
                <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">ID</th>
                <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Segmento</th>
                <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Tipo/Nome do Curso</th>
                <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Categoria</th>
                <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Número SEI</th>
                <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Código SIG</th>
                <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Mês Entrega</th>
                <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Status</th>
                <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Origem</th>
                <th className="text-left text-xs font-bold px-4 py-3 uppercase tracking-wider">Observação</th>
                <th className="text-center text-xs font-bold px-4 py-3 uppercase tracking-wider w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCourses.map((course) => {
                const isStored = course._stored;
                return (
                <tr key={String(course.id) + (course._stored ? "-s" : "-t")} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-gray-700 font-semibold text-sm">#{course.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="bg-[#003F7D] text-white hover:bg-[#003F7D] font-bold text-xs">
                      {course.segmento}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-sm max-w-md">{course.tipo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={`${
                        course.categoria === "HABILITAÇÃO TÉCNICA"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                          : course.categoria === "QUALIFICAÇÃO"
                          ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                          : course.categoria === "APERFEIÇOAMENTO"
                          ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-100"
                          : "bg-pink-100 text-pink-800 hover:bg-pink-100"
                      } font-semibold text-xs whitespace-nowrap`}
                    >
                      {course.categoria}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {course.numeroSEI ? (
                      <a
                        href={`https://sei.df.gov.br/sei/controlador.php?acao=procedimento_trabalhar&id_procedimento=${encodeURIComponent(course.numeroSEI)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#003F7D] hover:text-[#F57C00] font-mono text-xs underline underline-offset-2 transition-colors"
                      >
                        {course.numeroSEI}
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-600 font-mono text-xs">{course.codigoSIG || "-"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 font-semibold text-xs">
                      {course.mesEntrega || "-"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={course.status} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-600 text-xs">{course.origem}</p>
                  </td>
                  <td className="px-4 py-3">
                    {course.observacao ? (
                      <p className="text-xs text-gray-600 italic max-w-xs truncate" title={course.observacao}>{course.observacao}</p>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <button
                        onClick={() => openEdit(course, isStored)}
                        style={{ display: "inline-flex", alignItems: "center", padding: "6px", borderRadius: "6px", background: "transparent", color: "#2563eb", border: "none", cursor: "pointer" }}
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(course, isStored)}
                        style={{ display: "inline-flex", alignItems: "center", padding: "6px", borderRadius: "6px", background: "transparent", color: "#ef4444", border: "none", cursor: "pointer" }}
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 flex items-center justify-between bg-gray-50">
          <p className="text-gray-600 text-sm">
            Mostrando <span className="font-semibold">{filteredCourses.length}</span> de{" "}
            <span className="font-semibold">{stats.totalCursos}</span> cursos do Plano de Metas 2025
          </p>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-semibold">
              {stats.statusCount.publicado} Publicados
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 font-semibold">
              {stats.statusCount.emAnalise} Em Análise
            </Badge>
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 font-semibold">
              {stats.statusCount.cpfd} CPFD
            </Badge>
          </div>
        </div>
      </div>

      {/* Modal Novo/Editar */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="h-1 w-full bg-[#F57C00]" />
            <div className="px-8 py-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#003F7D]">{modal.editId ? "Editar Registro" : "Novo Registro"}</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Tipo / Nome do Curso <span className="text-red-500">*</span></Label>
                  <Input value={modal.item.tipo} onChange={e => setModal(m => ({ ...m, item: { ...m.item, tipo: e.target.value } }))} placeholder="Nome do curso..." className="h-11" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Segmento</Label>
                  <Input value={modal.item.segmento} onChange={e => setModal(m => ({ ...m, item: { ...m.item, segmento: e.target.value } }))} placeholder="Ex: Gastronomia" className="h-11" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Categoria</Label>
                  <select value={modal.item.categoria} onChange={e => setModal(m => ({ ...m, item: { ...m.item, categoria: e.target.value } }))}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    <option value="QUALIFICAÇÃO">Qualificação</option>
                    <option value="APERFEIÇOAMENTO">Aperfeiçoamento</option>
                    <option value="HABILITAÇÃO TÉCNICA">Habilitação Técnica</option>
                    <option value="ESPECIALIZAÇÃO TÉCNICA">Especialização Técnica</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Número SEI</Label>
                  <Input value={modal.item.numeroSEI} onChange={e => setModal(m => ({ ...m, item: { ...m.item, numeroSEI: e.target.value } }))} placeholder="Ex: 2025.000000000-00" className="h-11" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Código SIG</Label>
                  <Input value={modal.item.codigoSIG} onChange={e => setModal(m => ({ ...m, item: { ...m.item, codigoSIG: e.target.value } }))} placeholder="Ex: 129820" className="h-11" />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Mês de Entrega</Label>
                  <select value={modal.item.mesEntrega} onChange={e => setModal(m => ({ ...m, item: { ...m.item, mesEntrega: e.target.value } }))}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    <option value="">Selecione...</option>
                    {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Status</Label>
                  <select value={modal.item.status} onChange={e => setModal(m => ({ ...m, item: { ...m.item, status: e.target.value } }))}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                    <option value="PUBLICADO">Publicado</option>
                    <option value="EM ANÁLISE">Em Análise</option>
                    <option value="CPFD">CPFD</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Origem</Label>
                  <Input value={modal.item.origem} onChange={e => setModal(m => ({ ...m, item: { ...m.item, origem: e.target.value } }))} placeholder="Ex: CPED" className="h-11" />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Observação</Label>
                  <Input value={modal.item.observacao} onChange={e => setModal(m => ({ ...m, item: { ...m.item, observacao: e.target.value } }))} placeholder="Observações adicionais..." className="h-11" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button className="bg-[#F57C00] hover:bg-[#E86D00] h-11 px-6 gap-2" onClick={handleSave} disabled={!modal.item.tipo.trim()}>
                  <Save size={16} /> {modal.editId ? "Salvar Alterações" : "Cadastrar"}
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