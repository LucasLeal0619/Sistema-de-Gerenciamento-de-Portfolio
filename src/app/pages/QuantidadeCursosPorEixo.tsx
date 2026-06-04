import { useState, useMemo } from "react";
import {
  Search, Plus, Eye, Edit2, Trash2, X, Save,
  CheckCircle, BookOpen, Sparkles, TrendingDown, ArrowLeftRight,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  getStoredCursosEixo, saveCursoEixo, updateCursoEixo, deleteCursoEixo, CursoEixoRecord,
} from "../utils/store";

const EIXOS = [
  "Gastronomia",
  "Bebidas",
  "Panificação",
  "Confeitaria",
  "Turismo",
  "Hospitalidade",
  "Comunicação e Audiovisual",
  "Tecnologia da Informação - Suporte",
  "Tecnologia da Informação - Games",
  "Tecnologia da Informação - Inovação",
  "Tecnologia da Informação - Desenvolvimento",
  "Gestão e Comércio",
  "Educação",
  "Vendas e Marketing",
  "Moda e Costura",
  "Beleza e Cuidado Pessoal",
  "Estética e Massoterapia",
  "Enfermagem",
  "Saúde Bucal",
  "Nutrição",
  "Análises Clínicas",
  "Farmácia",
  "Segurança e NRs",
  "Administrativo / Serviços em Saúde",
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

const STATUS_LIST = ["Ativo", "Suspenso", "Inativo"];


const ANOS = ["2023", "2024", "2025", "2026"];

const EMPTY: Omit<CursoEixoRecord, "id"> = {
  ano: "2025", eixo: "", unidade: "", curso: "", ch: "", status: "Ativo", observacao: "",
};

type ModalMode = "view" | "edit" | "new";

export function QuantidadeCursosPorEixo() {
  const [registros, setRegistros] = useState<CursoEixoRecord[]>(getStoredCursosEixo);
  const [search, setSearch] = useState("");
  const [filterAno, setFilterAno] = useState("2025");
  const [filterAnoComp, setFilterAnoComp] = useState("2024");
  const [filterUnidade, setFilterUnidade] = useState("Todas");
  const [filterEixo, setFilterEixo] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [successMsg, setSuccessMsg] = useState("");
  const [modal, setModal] = useState<{
    open: boolean; mode: ModalMode; item: Omit<CursoEixoRecord, "id">; editId: string | null;
  }>({ open: false, mode: "new", item: EMPTY, editId: null });

  const refresh = () => setRegistros(getStoredCursosEixo());
  const toast = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 4000); };

  const setField = <K extends keyof Omit<CursoEixoRecord, "id">>(k: K, v: Omit<CursoEixoRecord, "id">[K]) =>
    setModal(m => ({ ...m, item: { ...m.item, [k]: v } }));

  // Cursos do ano atual e do ano de comparação
  const cursosAno = useMemo(() => registros.filter(r => r.ano === filterAno), [registros, filterAno]);
  const cursosComp = useMemo(() => registros.filter(r => r.ano === filterAnoComp), [registros, filterAnoComp]);

  // Chave de identidade de curso para comparação
  const compKey = (r: CursoEixoRecord) => `${r.curso.trim().toLowerCase()}||${r.eixo}`;
  const compKeys = useMemo(() => new Set(cursosComp.map(compKey)), [cursosComp]);
  const anoKeys = useMemo(() => new Set(cursosAno.map(compKey)), [cursosAno]);

  const isNovo = (r: CursoEixoRecord) => !compKeys.has(compKey(r));

  // Indicadores
  const totalNovos = useMemo(() => cursosAno.filter(isNovo).length, [cursosAno, compKeys]);
  const totalRemovidos = useMemo(() => cursosComp.filter(r => !anoKeys.has(compKey(r))).length, [cursosComp, anoKeys]);

  // Tabela filtrada (mostra cursos do ano atual)
  const filtered = useMemo(() => {
    return cursosAno.filter(r => {
      if (filterUnidade !== "Todas" && r.unidade !== filterUnidade) return false;
      if (filterEixo !== "Todos" && r.eixo !== filterEixo) return false;
      if (filterStatus !== "Todos" && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.curso.toLowerCase().includes(q) && !r.eixo.toLowerCase().includes(q) && !r.unidade.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [cursosAno, filterUnidade, filterEixo, filterStatus, search]);

  // Cursos por eixo (do ano atual, para o card)
  const porEixo = useMemo(() => {
    const map: Record<string, number> = {};
    cursosAno.forEach(r => { map[r.eixo] = (map[r.eixo] || 0) + 1; });
    return map;
  }, [cursosAno]);

  const hasFilters = search || filterUnidade !== "Todas" || filterEixo !== "Todos" || filterStatus !== "Todos";

  const clearFilters = () => {
    setSearch(""); setFilterUnidade("Todas"); setFilterEixo("Todos"); setFilterStatus("Todos");
  };

  const openNew = () => setModal({ open: true, mode: "new", item: { ...EMPTY, ano: filterAno }, editId: null });
  const openView = (r: CursoEixoRecord) => setModal({ open: true, mode: "view", item: { ano: r.ano, eixo: r.eixo, unidade: r.unidade, curso: r.curso, ch: r.ch, status: r.status, observacao: r.observacao }, editId: r.id });
  const openEdit = (r: CursoEixoRecord) => setModal({ open: true, mode: "edit", item: { ano: r.ano, eixo: r.eixo, unidade: r.unidade, curso: r.curso, ch: r.ch, status: r.status, observacao: r.observacao }, editId: r.id });
  const closeModal = () => setModal({ open: false, mode: "new", item: EMPTY, editId: null });

  const handleSave = () => {
    if (!modal.item.curso.trim()) return;
    if (modal.editId) {
      updateCursoEixo(modal.editId, modal.item);
      toast("Registro atualizado!");
    } else {
      saveCursoEixo(modal.item);
      toast("Curso cadastrado!");
    }
    refresh();
    closeModal();
  };

  const handleDelete = (r: CursoEixoRecord) => {
    if (!window.confirm(`Excluir "${r.curso}" (${r.ano})?`)) return;
    deleteCursoEixo(r.id);
    refresh();
    toast("Registro excluído.");
  };

  const EIXO_COLORS: Record<string, string> = {
    "Gastronomia":                    "bg-orange-100 text-orange-800",
    "Beleza e Cuidado Pessoal":       "bg-pink-100 text-pink-800",
    "Gestão e Negócios":              "bg-blue-100 text-blue-800",
    "Tecnologia e Economia Criativa": "bg-purple-100 text-purple-800",
    "Ambiente e Saúde":               "bg-green-100 text-green-800",
    "Gestão e Moda":                  "bg-rose-100 text-rose-800",
  };

  return (
    <div className="min-h-screen w-full bg-white">
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 pt-20 px-4 pb-6 lg:pt-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#003F7D]">
              Quantidade de Cursos por Eixo
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Comparativo entre anos e distribuição por eixo tecnológico
            </p>
          </div>
          <Button onClick={openNew} className="bg-[#F57C00] hover:bg-[#E67300] text-white gap-2">
            <Plus size={16} /> Novo Curso
          </Button>
        </div>
      </div>

      {/* Cards de indicadores */}
      <div className="px-4 lg:px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total cursos no ano */}
        <div className="bg-gradient-to-br from-[#003F7D] to-[#00355C] rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={18} className="opacity-80" />
            <span className="text-xs font-semibold opacity-80 uppercase tracking-wide">Total</span>
          </div>
          <p className="text-3xl font-bold">{cursosAno.length}</p>
          <p className="text-xs opacity-70 mt-1">cursos em {filterAno}</p>
        </div>

        {/* Cursos novos */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="opacity-80" />
            <span className="text-xs font-semibold opacity-80 uppercase tracking-wide">Novos</span>
          </div>
          <p className="text-3xl font-bold">{totalNovos}</p>
          <p className="text-xs opacity-70 mt-1">não ofertados em {filterAnoComp}</p>
        </div>

        {/* Cursos removidos */}
        <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={18} className="opacity-80" />
            <span className="text-xs font-semibold opacity-80 uppercase tracking-wide">Removidos</span>
          </div>
          <p className="text-3xl font-bold">{totalRemovidos}</p>
          <p className="text-xs opacity-70 mt-1">saíram de {filterAnoComp} para {filterAno}</p>
        </div>

        {/* Comparação */}
        <div className="bg-gradient-to-br from-[#F57C00] to-[#E06900] rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeftRight size={18} className="opacity-80" />
            <span className="text-xs font-semibold opacity-80 uppercase tracking-wide">Comparação</span>
          </div>
          <p className="text-xl font-bold">{filterAnoComp} → {filterAno}</p>
          <p className="text-xs opacity-80 mt-1">
            {cursosComp.length} → {cursosAno.length} cursos
            {cursosAno.length >= cursosComp.length
              ? ` (+${cursosAno.length - cursosComp.length})`
              : ` (${cursosAno.length - cursosComp.length})`}
          </p>
        </div>
      </div>

      {/* Por eixo — mini badges */}
      <div className="px-4 lg:px-8 pb-4">
        <div className="flex flex-wrap gap-2">
          {EIXOS.map(e => (
            <button
              key={e}
              onClick={() => setFilterEixo(filterEixo === e ? "Todos" : e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filterEixo === e
                  ? "bg-[#003F7D] text-white border-[#003F7D]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#003F7D] hover:text-[#003F7D]"
              }`}
            >
              <span>{e}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                filterEixo === e ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {porEixo[e] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap gap-3 items-end bg-white border border-gray-200 rounded-xl px-4 py-4 mx-4 lg:mx-8 mb-6 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, eixo ou unidade..."
            className="w-full pl-9 pr-3 h-9 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Ano</label>
          <select value={filterAno} onChange={e => setFilterAno(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Comparar com</label>
          <select value={filterAnoComp} onChange={e => setFilterAnoComp(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Unidade</label>
          <select value={filterUnidade} onChange={e => setFilterUnidade(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
            <option value="Todas">Todas</option>
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
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
            <button onClick={clearFilters} className="h-9 px-3 flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <X size={13} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="px-4 lg:px-8 pb-10">
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-700">
              {filtered.length} curso{filtered.length !== 1 ? "s" : ""} — {filterAno}
            </span>
            {filterEixo !== "Todos" && (
              <span className="text-xs text-gray-500">Eixo: <strong>{filterEixo}</strong></span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#003F7D] text-white">
                <tr>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wide">Nome do Curso</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wide">Eixo Tecnológico</th>
                  <th className="text-left font-semibold px-4 py-3 text-xs uppercase tracking-wide">Unidade</th>
                  <th className="text-center font-semibold px-4 py-3 text-xs uppercase tracking-wide">Ano</th>
                  <th className="text-center font-semibold px-4 py-3 text-xs uppercase tracking-wide">CH</th>
                  <th className="text-center font-semibold px-4 py-3 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-center font-semibold px-4 py-3 text-xs uppercase tracking-wide">Novo</th>
                  <th className="text-center font-semibold px-4 py-3 text-xs uppercase tracking-wide w-20">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <BookOpen size={32} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-400 text-sm">Nenhum curso encontrado para os filtros selecionados.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, idx) => {
                    const novo = isNovo(r);
                    const eixoColor = EIXO_COLORS[r.eixo] ?? "bg-gray-100 text-gray-700";
                    return (
                      <tr key={r.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/50 transition-colors`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{r.curso}</p>
                          {r.observacao && (
                            <p className="text-xs text-gray-400 italic mt-0.5 truncate max-w-xs" title={r.observacao}>{r.observacao}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${eixoColor}`}>
                            {r.eixo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{r.unidade || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{r.ano}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 text-xs font-mono">{r.ch ? `${r.ch}h` : "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {novo ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                              <Sparkles size={10} /> Novo
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => openView(r)} className="p-1.5 rounded hover:bg-blue-100 text-blue-600 transition-colors" title="Visualizar">
                              <Eye size={14} />
                            </button>
                            <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-amber-100 text-amber-600 transition-colors" title="Editar">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(r)} className="p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors" title="Excluir">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-3">
              {EIXOS.filter(e => filtered.some(r => r.eixo === e)).map(e => (
                <span key={e} className="text-xs text-gray-500">
                  <strong className="text-gray-700">{e}:</strong> {filtered.filter(r => r.eixo === e).length}
                </span>
              ))}
              <span className="text-xs text-emerald-600 font-semibold ml-auto">
                {filtered.filter(isNovo).length} novo{filtered.filter(isNovo).length !== 1 ? "s" : ""} na seleção
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="h-1 w-full bg-[#F57C00]" />
            <div className="px-7 py-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-[#003F7D]">
                  {modal.mode === "new" ? "Novo Curso" : modal.mode === "edit" ? "Editar Curso" : "Detalhes do Curso"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              {modal.mode === "view" ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Nome do Curso</p>
                    <p className="font-semibold text-gray-900">{modal.item.curso}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Ano</p>
                      <p className="text-gray-700">{modal.item.ano}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">C.H.</p>
                      <p className="text-gray-700 font-mono">{modal.item.ch ? `${modal.item.ch}h` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Eixo</p>
                      <p className="text-gray-700">{modal.item.eixo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Status</p>
                      <StatusBadge status={modal.item.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Unidade</p>
                    <p className="text-gray-700">{modal.item.unidade || "—"}</p>
                  </div>
                  {modal.item.observacao && (
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Observação</p>
                      <p className="text-gray-600 italic text-sm">{modal.item.observacao}</p>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <Button className="bg-[#F57C00] hover:bg-[#E86D00] h-10 px-5 gap-2" onClick={() => setModal(m => ({ ...m, mode: "edit" }))}>
                      <Edit2 size={14} /> Editar
                    </Button>
                    <Button variant="outline" className="h-10 px-5" onClick={closeModal}>Fechar</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Ano</Label>
                      <select value={modal.item.ano} onChange={e => setField("ano", e.target.value)}
                        className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                        {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">C.H.</Label>
                      <Input value={modal.item.ch} onChange={e => setField("ch", e.target.value)} placeholder="Ex: 200" className="h-10" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Nome do Curso <span className="text-red-500">*</span></Label>
                    <Input value={modal.item.curso} onChange={e => setField("curso", e.target.value)} placeholder="Ex: Técnico em Gastronomia" className="h-10" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Eixo Tecnológico</Label>
                    <select value={modal.item.eixo} onChange={e => setField("eixo", e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                      <option value="">Selecione...</option>
                      {EIXOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Unidade</Label>
                    <select value={modal.item.unidade} onChange={e => setField("unidade", e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                      <option value="">Selecione...</option>
                      {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Status</Label>
                    <select value={modal.item.status} onChange={e => setField("status", e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D]">
                      {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Observação</Label>
                    <textarea
                      value={modal.item.observacao}
                      onChange={e => setField("observacao", e.target.value)}
                      placeholder="Informações adicionais..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#003F7D] resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button className="bg-[#F57C00] hover:bg-[#E86D00] h-10 px-6 gap-2" onClick={handleSave} disabled={!modal.item.curso.trim()}>
                      <Save size={15} /> {modal.mode === "edit" ? "Salvar Alterações" : "Cadastrar"}
                    </Button>
                    <Button variant="outline" className="h-10 px-5" onClick={closeModal}>Cancelar</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
