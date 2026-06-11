import { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router";
import { ChevronLeft, Save } from "lucide-react";
import { getStoredCourses, updateCourse, saveCourse, segmentoToSlug, CourseRecord } from "../utils/store";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  COURSE_MODALITIES,
  COURSE_SEGMENTS,
  COURSE_STATUSES,
  COURSE_TYPES,
  COURSE_UNITS,
} from "../utils/courseOptions";

export function EditCourse() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"basico" | "tecnico" | "comercial">("basico");
  const [notFound, setNotFound] = useState(false);
  // true = editing a stored course; false = saving a copy of a static course
  const [isExisting, setIsExisting] = useState(false);

  const [formData, setFormData] = useState({
    segmento: "", titulo: "", ch: "", turmas: "", codigo: "", alunos: "", instrutor: "",
    status: "ATIVO", modalidade: "", codDN: "", codSIG: "", ident: "", tipo: "",
    revisao: "", processoSEI: "", valores: "", observacoes: "", bolsa: "", comercial: "",
    pcn: "", pcr: "", descricao: "", dataInicio: "", dataFim: "",
  });

  const [selectedUnidades, setSelectedUnidades] = useState<string[]>([]);
  const [originalCourse, setOriginalCourse] = useState<CourseRecord | null>(null);

  const normalizeStatusOption = (status?: string) => {
    const normalized = String(status || "ATIVO").trim().toUpperCase();
    return COURSE_STATUSES.includes(normalized as (typeof COURSE_STATUSES)[number])
      ? normalized
      : String(status || "ATIVO");
  };

  useEffect(() => {
    // Primeiro tenta carregar do localStorage pelo id
    if (id && id !== "novo") {
      const courses = getStoredCourses();
      const course = courses.find(c => c.id === id);
      if (course) {
        setIsExisting(true);
        setOriginalCourse(course);
        setFormData({
          segmento: course.segmento, titulo: course.titulo, ch: course.ch,
          turmas: course.turmas, codigo: course.codigo, alunos: course.alunos,
          instrutor: course.instrutor, status: normalizeStatusOption(course.status), modalidade: course.modalidade,
          codDN: course.codDN, codSIG: course.codSIG, ident: course.ident, tipo: course.tipo,
          revisao: course.revisao, processoSEI: course.processoSEI, valores: course.valores,
          observacoes: course.observacoes, bolsa: course.bolsa, comercial: course.comercial,
          pcn: course.pcn, pcr: course.pcr, descricao: course.descricao,
          dataInicio: course.dataInicio, dataFim: course.dataFim,
        });
        setSelectedUnidades(course.unidades || []);
        return;
      }
    }
    // Fallback: curso estático passado via navigation state
    const prefill = location.state?.prefill;
    if (prefill) {
      setIsExisting(false);
      setFormData({
        segmento: prefill.segmento || "", titulo: prefill.titulo || "",
        ch: String(prefill.ch || ""), turmas: String(prefill.turmas || ""),
        codigo: prefill.codigo || "", alunos: String(prefill.alunos || ""),
        instrutor: prefill.instrutor || "", status: normalizeStatusOption(prefill.status),
        modalidade: prefill.modalidade || "", codDN: prefill.codDN || "",
        codSIG: prefill.codSIG || "", ident: prefill.ident || "",
        tipo: prefill.tipo || "", revisao: prefill.ultimaRevisao || prefill.revisao || "",
        processoSEI: prefill.processoSEI || "", valores: prefill.valores || "",
        observacoes: prefill.observacoes || "", bolsa: prefill.compativelBolsa || prefill.bolsa || "",
        comercial: prefill.comercial || "", pcn: prefill.pcn || "", pcr: prefill.pcr || "",
        descricao: prefill.descricao || "", dataInicio: "", dataFim: "",
      });
      setSelectedUnidades([]);
      return;
    }
    setNotFound(true);
  }, [id]);

  const toggleUnidade = (unidade: string) => {
    setSelectedUnidades(prev =>
      prev.includes(unidade) ? prev.filter(u => u !== unidade) : [...prev, unidade]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      segmento: formData.segmento, titulo: formData.titulo, ch: formData.ch,
      turmas: formData.turmas, codigo: formData.codigo, alunos: formData.alunos,
      instrutor: formData.instrutor, status: formData.status, modalidade: formData.modalidade,
      codDN: formData.codDN, codSIG: formData.codSIG, ident: formData.ident, tipo: formData.tipo,
      revisao: formData.revisao, processoSEI: formData.processoSEI, valores: formData.valores,
      observacoes: formData.observacoes, bolsa: formData.bolsa, comercial: formData.comercial,
      pcn: formData.pcn, pcr: formData.pcr, descricao: formData.descricao,
      dataInicio: formData.dataInicio, dataFim: formData.dataFim, unidades: selectedUnidades,
    };
    if (isExisting && id) {
      updateCourse(id, payload);
    } else {
      saveCourse(payload);
    }
    const slug = segmentoToSlug(formData.segmento);
    const destino = slug ? `/app/cursos/${slug}` : "/app";
    const msg = isExisting
      ? `Curso "${formData.titulo}" atualizado com sucesso!`
      : `Cópia editada de "${formData.titulo}" salva com sucesso!`;
    navigate(destino, { state: { success: msg } });
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-600">
        <p className="text-lg font-semibold">Curso não encontrado.</p>
        <Link to="/app"><Button variant="outline">Voltar ao Dashboard</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="h-1 w-full bg-[#F57C00]" />
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => navigate(-1)}>
              <ChevronLeft size={20} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Editar Curso</h1>
              <p className="text-gray-600 mt-1">{originalCourse?.titulo || "Carregando..."}</p>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-sm px-4 py-2">
            {formData.status}
          </Badge>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {(["basico", "tecnico", "comercial"] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                activeTab === tab ? "bg-[#003F7D] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab === "basico" ? "Dados Básicos" : tab === "tecnico" ? "Informações Técnicas" : "Dados Comerciais"}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-8">
        {/* Tab: Dados Básicos */}
        {activeTab === "basico" && (
          <div className="max-w-6xl space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-200">Informações Principais</h2>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <Label className="text-sm font-semibold mb-2 block">Segmento / Área *</Label>
                  <select value={formData.segmento} onChange={e => setFormData({ ...formData, segmento: e.target.value })}
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm" required>
                    <option value="">Selecione o segmento...</option>
                    {COURSE_SEGMENTS.map(seg => <option key={seg} value={seg}>{seg}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold mb-2 block">Título do Curso *</Label>
                  <Input value={formData.titulo} onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                    className="h-11 text-sm" required />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Carga Horária (CH)</Label>
                  <Input value={formData.ch} onChange={e => setFormData({ ...formData, ch: e.target.value })}
                    className="h-11 text-sm" type="number" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Quantidade de Turmas</Label>
                  <Input value={formData.turmas} onChange={e => setFormData({ ...formData, turmas: e.target.value })}
                    className="h-11 text-sm" type="number" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Código do Processo</Label>
                  <Input value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                    className="h-11 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Alunos (Matrículas)</Label>
                  <Input value={formData.alunos} onChange={e => setFormData({ ...formData, alunos: e.target.value })}
                    className="h-11 text-sm" type="number" />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold mb-2 block">Instrutor(es)</Label>
                  <Input value={formData.instrutor} onChange={e => setFormData({ ...formData, instrutor: e.target.value })}
                    className="h-11 text-sm" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-3 border-b border-gray-200">Unidades de Oferta</h2>
              <p className="text-sm text-gray-600 mb-5">Selecione as unidades onde o curso será oferecido</p>
              <div className="grid grid-cols-4 gap-3">
                {COURSE_UNITS.map(unidade => (
                  <button key={unidade} type="button" onClick={() => toggleUnidade(unidade)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                      selectedUnidades.includes(unidade)
                        ? "bg-[#003F7D] border-[#003F7D] text-white shadow-md"
                        : "bg-white border-gray-300 text-gray-700 hover:border-[#003F7D] hover:bg-blue-50"
                    }`}>
                    {unidade}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-200">Descrição do Curso</h2>
              <Textarea value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva os objetivos, conteúdo programático e público-alvo do curso..."
                className="min-h-[120px] text-sm resize-none" />
            </div>
          </div>
        )}

        {/* Tab: Informações Técnicas */}
        {activeTab === "tecnico" && (
          <div className="max-w-6xl space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-200">Dados Técnicos e Cadastrais</h2>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Status *</Label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm" required>
                    {COURSE_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Modalidade</Label>
                  <select value={formData.modalidade} onChange={e => setFormData({ ...formData, modalidade: e.target.value })}
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm">
                    <option value="">Selecione...</option>
                    {COURSE_MODALITIES.map(modalidade => (
                      <option key={modalidade} value={modalidade}>{modalidade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">CÓD. DN</Label>
                  <Input value={formData.codDN} onChange={e => setFormData({ ...formData, codDN: e.target.value })} className="h-11 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">CÓD. SIG</Label>
                  <Input value={formData.codSIG} onChange={e => setFormData({ ...formData, codSIG: e.target.value })} className="h-11 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">IDENT.</Label>
                  <Input value={formData.ident} onChange={e => setFormData({ ...formData, ident: e.target.value })} className="h-11 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Tipo de Curso</Label>
                  <select value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm">
                    <option value="">Selecione...</option>
                    {COURSE_TYPES.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Última Revisão</Label>
                  <Input value={formData.revisao} onChange={e => setFormData({ ...formData, revisao: e.target.value })} className="h-11 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Processo SEI</Label>
                  <Input value={formData.processoSEI} onChange={e => setFormData({ ...formData, processoSEI: e.target.value })} className="h-11 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Data de Início</Label>
                  <Input type="date" value={formData.dataInicio} onChange={e => setFormData({ ...formData, dataInicio: e.target.value })} className="h-11 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Data de Término</Label>
                  <Input type="date" value={formData.dataFim} onChange={e => setFormData({ ...formData, dataFim: e.target.value })} className="h-11 text-sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Dados Comerciais */}
        {activeTab === "comercial" && (
          <div className="max-w-6xl space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-200">Informações Comerciais e Financeiras</h2>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <Label className="text-sm font-semibold mb-2 block">Valores</Label>
                  <Input value={formData.valores} onChange={e => setFormData({ ...formData, valores: e.target.value })} className="h-11 text-sm" placeholder="Ex: 2025 | R$ 2.405,00" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Compatível com Bolsa</Label>
                  <select value={formData.bolsa} onChange={e => setFormData({ ...formData, bolsa: e.target.value })}
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm">
                    <option value="">Selecione...</option>
                    <option value="SIM">SIM</option>
                    <option value="NÃO">NÃO</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Comercial</Label>
                  <select value={formData.comercial} onChange={e => setFormData({ ...formData, comercial: e.target.value })}
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm">
                    <option value="">Selecione...</option>
                    <option value="SIM">SIM</option>
                    <option value="NÃO">NÃO</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">PCN</Label>
                  <Input value={formData.pcn} onChange={e => setFormData({ ...formData, pcn: e.target.value })} className="h-11 text-sm" />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">PCR</Label>
                  <Input value={formData.pcr} onChange={e => setFormData({ ...formData, pcr: e.target.value })} className="h-11 text-sm" />
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold mb-2 block">Observações</Label>
                  <Textarea value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                    className="min-h-[100px] text-sm resize-none" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mt-8 pt-6 border-t border-gray-200 flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="px-8 h-12 text-sm font-semibold border-2">
            Cancelar
          </Button>
          <Button type="submit" className="px-8 bg-[#F57C00] hover:bg-[#E86D00] h-12 text-sm font-semibold">
            <Save size={18} className="mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
