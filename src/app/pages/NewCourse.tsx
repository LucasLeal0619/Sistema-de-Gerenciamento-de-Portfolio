import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeft, Save, X, FileSpreadsheet, CheckCircle, AlertCircle, Table2 } from "lucide-react";
import * as XLSX from "xlsx";
import { saveCourse, segmentoToSlug } from "../utils/store";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";

const unidadesOferta = [
  "Asa Norte",
  "Taguatinga",
  "Gama",
  "Ceilândia",
  "Sobradinho",
  "Jessé Freire",
  "Santa Maria",
  "São Sebastião",
  "Brazlândia",
];

const segmentos = [
  "Gastronomia",
  "Bebidas",
  "Panificação",
  "Confeitaria",
  "Turismo",
  "Hospitalidade",
  "Design, Paisagismo e Ambientação",
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
  "Radiologia",
  "Saúde Bucal",
  "Nutrição",
  "Análises Clínicas",
  "Farmácia",
  "Segurança e NRs",
  "Administrativo / Serviços em Saúde",
];

export function NewCourse() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"basico" | "tecnico" | "comercial">("basico");

  const [formData, setFormData] = useState({
    // Dados Básicos
    segmento: "",
    titulo: "",
    ch: "",
    turmas: "",
    codigo: "",
    alunos: "",
    instrutor: "",

    // Dados Técnicos
    status: "Ativo",
    modalidade: "",
    codDN: "",
    codSIG: "",
    ident: "",
    tipo: "",
    revisao: "",
    processoSEI: "",

    // Dados Comerciais
    valores: "",
    observacoes: "",
    bolsa: "",
    comercial: "",
    pcn: "",
    pcr: "",

    // Outros
    descricao: "",
    dataInicio: "",
    dataFim: "",
  });

  const [selectedUnidades, setSelectedUnidades] = useState<string[]>([]);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [importPreview, setImportPreview] = useState<Record<string, string>[]>([]);
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const FIELD_MAP: Record<string, keyof typeof formData> = {
    "titulo": "titulo", "nome": "titulo", "curso": "titulo",
    "ch": "ch", "carga horaria": "ch", "carga_horaria": "ch",
    "segmento": "segmento", "area": "segmento", "eixo": "segmento",
    "turmas": "turmas", "qtd turmas": "turmas",
    "codigo": "codigo", "cod": "codigo",
    "alunos": "alunos", "matriculas": "alunos",
    "instrutor": "instrutor", "professor": "instrutor",
    "modalidade": "modalidade",
    "status": "status",
    "coddn": "codDN", "cod dn": "codDN", "cod_dn": "codDN",
    "codsig": "codSIG", "cod sig": "codSIG", "cod_sig": "codSIG",
    "ident": "ident",
    "tipo": "tipo",
    "revisao": "revisao", "ultima revisao": "revisao",
    "processosei": "processoSEI", "processo sei": "processoSEI", "sei": "processoSEI",
    "valores": "valores", "valor": "valores", "preco": "valores",
    "observacoes": "observacoes", "observacao": "observacoes", "obs": "observacoes",
    "bolsa": "bolsa",
    "comercial": "comercial",
    "pcn": "pcn", "pcr": "pcr",
    "descricao": "descricao", "descricao do curso": "descricao",
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportedFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rows.length === 0) {
          setImportStatus("error");
          return;
        }

        const cols = Object.keys(rows[0]);
        setImportColumns(cols);
        setImportPreview(rows.slice(0, 5));
        setShowPreview(true);
        setImportStatus("success");

        // Preenche o formulário com a primeira linha
        const firstRow = rows[0];
        const updates: Partial<typeof formData> = {};
        Object.entries(firstRow).forEach(([col, val]) => {
          const key = col.toLowerCase().trim();
          const field = FIELD_MAP[key];
          if (field) updates[field] = String(val);
        });
        if (Object.keys(updates).length > 0) {
          setFormData(prev => ({ ...prev, ...updates }));
        }
      } catch {
        setImportStatus("error");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const toggleUnidade = (unidade: string) => {
    setSelectedUnidades((prev) =>
      prev.includes(unidade) ? prev.filter((u) => u !== unidade) : [...prev, unidade]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCourse({
      segmento: formData.segmento,
      titulo: formData.titulo,
      ch: formData.ch,
      turmas: formData.turmas,
      codigo: formData.codigo,
      alunos: formData.alunos,
      instrutor: formData.instrutor,
      status: formData.status.toUpperCase(),
      modalidade: formData.modalidade,
      codDN: formData.codDN,
      codSIG: formData.codSIG,
      ident: formData.ident,
      tipo: formData.tipo,
      revisao: formData.revisao,
      processoSEI: formData.processoSEI,
      valores: formData.valores,
      observacoes: formData.observacoes,
      bolsa: formData.bolsa,
      comercial: formData.comercial,
      pcn: formData.pcn,
      pcr: formData.pcr,
      descricao: formData.descricao,
      dataInicio: formData.dataInicio,
      dataFim: formData.dataFim,
      unidades: selectedUnidades,
    });
    const slug = segmentoToSlug[formData.segmento];
    const destino = slug ? `/app/cursos/${slug}` : "/app";
    navigate(destino, { state: { success: `Curso "${formData.titulo}" cadastrado com sucesso!` } });
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="h-1 w-full bg-[#F57C00]" />
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link to="/app">
              <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0">
                <ChevronLeft size={20} />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cadastrar Novo Curso</h1>
              <p className="text-gray-600 mt-1">Preencha as informações para adicionar um novo curso ao portfólio</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleImportClick}
              className="h-10 px-5 border-[#003F7D] text-[#003F7D] hover:bg-[#003F7D] hover:text-white gap-2 transition-colors"
            >
              <FileSpreadsheet size={16} />
              Importar Planilha
            </Button>
            {importStatus === "success" && (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle size={16} />
                <span>{importedFile?.name}</span>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1 text-[#003F7D] underline text-xs ml-1"
                >
                  <Table2 size={13} />
                  {showPreview ? "Ocultar prévia" : "Ver prévia"}
                </button>
              </div>
            )}
            {importStatus === "error" && (
              <div className="flex items-center gap-2 text-red-500 text-sm font-medium">
                <AlertCircle size={16} />
                <span>Erro ao ler o arquivo</span>
              </div>
            )}
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-sm px-4 py-2">
              {formData.status}
            </Badge>
          </div>
        </div>

        {/* Prévia da planilha importada */}
        {showPreview && importPreview.length > 0 && (
          <div className="mt-4 border border-green-200 bg-green-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle size={16} />
                <span className="font-semibold text-sm">
                  Prévia da planilha — {importPreview.length} linha(s) exibidas. Formulário preenchido com a 1ª linha.
                </span>
              </div>
              <button type="button" onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-green-200">
              <table className="text-xs w-full bg-white">
                <thead>
                  <tr className="bg-[#003F7D] text-white">
                    {importColumns.map(col => (
                      <th key={col} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((row, i) => (
                    <tr key={i} className={i === 0 ? "bg-green-100 font-semibold" : "border-t border-gray-100"}>
                      {importColumns.map(col => (
                        <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[200px] truncate">
                          {row[col] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {importPreview.length === 1 && (
              <p className="text-xs text-green-600 mt-2">* Linha destacada em verde foi aplicada ao formulário.</p>
            )}
            {importPreview.length > 1 && (
              <p className="text-xs text-green-600 mt-2">* Linha 1 (destacada) foi aplicada ao formulário. As demais são apenas visualização.</p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={() => setActiveTab("basico")}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "basico"
                ? "bg-[#003F7D] text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Dados Básicos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tecnico")}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "tecnico"
                ? "bg-[#003F7D] text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Informações Técnicas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("comercial")}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "comercial"
                ? "bg-[#003F7D] text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Dados Comerciais
          </button>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="px-8 py-8">
        {/* Tab: Dados Básicos */}
        {activeTab === "basico" && (
          <div className="max-w-6xl space-y-6">
            {/* Informações Principais */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-200">
                Informações Principais
              </h2>

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <Label htmlFor="segmento" className="text-sm font-semibold mb-2 block">
                    Segmento / Área *
                  </Label>
                  <select
                    id="segmento"
                    value={formData.segmento}
                    onChange={(e) => setFormData({ ...formData, segmento: e.target.value })}
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm"
                    required
                  >
                    <option value="">Selecione o segmento...</option>
                    {segmentos.map((seg) => (
                      <option key={seg} value={seg}>{seg}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="titulo" className="text-sm font-semibold mb-2 block">
                    Título do Curso *
                  </Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="h-11 text-sm"
                    placeholder="Ex: Técnico em Gastronomia"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ch" className="text-sm font-semibold mb-2 block">
                    Carga Horária (CH) *
                  </Label>
                  <Input
                    id="ch"
                    value={formData.ch}
                    onChange={(e) => setFormData({ ...formData, ch: e.target.value })}
                    className="h-11 text-sm"
                    placeholder="Ex: 800"
                    type="number"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="turmas" className="text-sm font-semibold mb-2 block">
                    Quantidade de Turmas
                  </Label>
                  <Input
                    id="turmas"
                    value={formData.turmas}
                    onChange={(e) => setFormData({ ...formData, turmas: e.target.value })}
                    className="h-11 text-sm"
                    placeholder="Ex: 2"
                    type="number"
                  />
                </div>

                <div>
                  <Label htmlFor="codigo" className="text-sm font-semibold mb-2 block">
                    Código do Processo
                  </Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="h-11 text-sm"
                    placeholder="Ex: 2025.12.85"
                  />
                </div>

                <div>
                  <Label htmlFor="alunos" className="text-sm font-semibold mb-2 block">
                    Alunos (Matrículas)
                  </Label>
                  <Input
                    id="alunos"
                    value={formData.alunos}
                    onChange={(e) => setFormData({ ...formData, alunos: e.target.value })}
                    className="h-11 text-sm"
                    placeholder="Ex: 22"
                    type="number"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="instrutor" className="text-sm font-semibold mb-2 block">
                    Instrutor(es)
                  </Label>
                  <Input
                    id="instrutor"
                    value={formData.instrutor}
                    onChange={(e) => setFormData({ ...formData, instrutor: e.target.value })}
                    className="h-11 text-sm"
                    placeholder="Nome do(s) instrutor(es)"
                  />
                </div>
              </div>
            </div>

            {/* Unidades de Oferta */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-3 border-b border-gray-200">
                Unidades de Oferta
              </h2>
              <p className="text-sm text-gray-600 mb-5">
                Selecione as unidades onde o curso será oferecido
              </p>

              <div className="grid grid-cols-4 gap-3">
                {unidadesOferta.map((unidade) => (
                  <button
                    key={unidade}
                    type="button"
                    onClick={() => toggleUnidade(unidade)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                      selectedUnidades.includes(unidade)
                        ? "bg-[#003F7D] border-[#003F7D] text-white shadow-md"
                        : "bg-white border-gray-300 text-gray-700 hover:border-[#003F7D] hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{unidade}</span>
                      {selectedUnidades.includes(unidade) && (
                        <X size={14} className="ml-2" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Descrição */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-200">
                Descrição do Curso
              </h2>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva os objetivos, conteúdo programático e público-alvo do curso..."
                className="min-h-[120px] text-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* Tab: Informações Técnicas */}
        {activeTab === "tecnico" && (
          <div className="max-w-6xl space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-200">
                Dados Técnicos e Cadastrais
              </h2>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="status" className="text-sm font-semibold mb-2 block">Status *</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm"
                    required
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="modalidade" className="text-sm font-semibold mb-2 block">Modalidade *</Label>
                  <select
                    id="modalidade"
                    value={formData.modalidade}
                    onChange={(e) => setFormData({ ...formData, modalidade: e.target.value })}
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="FIC">FIC</option>
                    <option value="Técnico de Nível Médio">Técnico de Nível Médio</option>
                    <option value="Especialização">Especialização</option>
                    <option value="Presencial">Presencial</option>
                    <option value="EAD">EAD</option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="codDN" className="text-sm font-semibold mb-2 block">CÓD. DN</Label>
                  <Input
                    id="codDN"
                    value={formData.codDN}
                    onChange={(e) => setFormData({ ...formData, codDN: e.target.value })}
                    className="h-11 text-sm"
                    placeholder="Ex: 2437"
                  />
                </div>

                <div>
                  <Label htmlFor="codSIG" className="text-sm font-semibold mb-2 block">CÓD. SIG *</Label>
                  <Input
                    id="codSIG"
                    value={formData.codSIG}
                    onChange={(e) => setFormData({ ...formData, codSIG: e.target.value })}
                    className="h-11 text-sm"
                    placeholder="Ex: 129820"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ident" className="text-sm font-semibold mb-2 block">IDENT.</Label>
                  <Input
                    id="ident"
                    value={formData.ident}
                    onChange={(e) => setFormData({ ...formData, ident: e.target.value })}
                    className="h-11 text-sm"
                    placeholder="Ex: 2018"
                  />
                </div>

                <div>
                  <Label htmlFor="tipo" className="text-sm font-semibold mb-2 block">Tipo de Curso *</Label>
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm"
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="Habilitação Técnica">Habilitação Técnica</option>
                    <option value="Qualificação Profissional">Qualificação Profissional</option>
                    <option value="Aperfeiçoamento/Atualização">Aperfeiçoamento/Atualização</option>
                    <option value="Iniciação Profissional">Iniciação Profissional</option>
                    <option value="Especialização Técnica">Especialização Técnica</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="revisao" className="text-sm font-semibold mb-2 block">Última Revisão</Label>
                  <Input
                    id="revisao"
                    value={formData.revisao}
                    onChange={(e) => setFormData({ ...formData, revisao: e.target.value })}
                    className="h-11 text-sm"
                    placeholder="Ex: 2025"
                  />
                </div>

                <div>
                  <Label htmlFor="processoSEI" className="text-sm font-semibold mb-2 block">Processo SEI</Label>
                  <Input
                    id="processoSEI"
                    value={formData.processoSEI}
                    onChange={(e) => setFormData({ ...formData, processoSEI: e.target.value })}
                    className="h-11 text-sm"
                    placeholder="Ex: 2023.000001650-31"
                  />
                </div>

                <div>
                  <Label htmlFor="dataInicio" className="text-sm font-semibold mb-2 block">Data de Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    className="h-11 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="dataFim" className="text-sm font-semibold mb-2 block">Data de Término</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                    className="h-11 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Dados Comerciais */}
        {activeTab === "comercial" && (
          <div className="max-w-6xl space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-200">
                Informações Comerciais e Financeiras
              </h2>

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <Label htmlFor="valores" className="text-sm font-semibold mb-2 block">Valores</Label>
                  <Input
                    id="valores"
                    value={formData.valores}
                    onChange={(e) => setFormData({ ...formData, valores: e.target.value })}
                    className="h-11 text-sm"
                    placeholder="Ex: 2025 | R$ 2.405,00"
                  />
                </div>

                <div>
                  <Label htmlFor="bolsa" className="text-sm font-semibold mb-2 block">Compatível com Bolsa</Label>
                  <select
                    id="bolsa"
                    value={formData.bolsa}
                    onChange={(e) => setFormData({ ...formData, bolsa: e.target.value })}
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm"
                  >
                    <option value="">Selecione...</option>
                    <option value="SIM">SIM</option>
                    <option value="NÃO">NÃO</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="comercial" className="text-sm font-semibold mb-2 block">Comercial</Label>
                  <select
                    id="comercial"
                    value={formData.comercial}
                    onChange={(e) => setFormData({ ...formData, comercial: e.target.value })}
                    className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm"
                  >
                    <option value="">Selecione...</option>
                    <option value="SIM">SIM</option>
                    <option value="NÃO">NÃO</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="pcn" className="text-sm font-semibold mb-2 block">PCN</Label>
                  <Input
                    id="pcn"
                    value={formData.pcn}
                    onChange={(e) => setFormData({ ...formData, pcn: e.target.value })}
                    className="h-11 text-sm"
                    placeholder="Plano de Curso Nacional"
                  />
                </div>

                <div>
                  <Label htmlFor="pcr" className="text-sm font-semibold mb-2 block">PCR</Label>
                  <Input
                    id="pcr"
                    value={formData.pcr}
                    onChange={(e) => setFormData({ ...formData, pcr: e.target.value })}
                    className="h-11 text-sm"
                    placeholder="Plano de Curso Regional"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="observacoes" className="text-sm font-semibold mb-2 block">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações adicionais sobre valores, condições comerciais, etc..."
                    className="min-h-[100px] text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botões de Ação - Fixos no rodapé */}
        <div className="max-w-6xl mt-8 pt-6 border-t border-gray-200 flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/app")}
            className="px-8 h-12 text-sm font-semibold border-2"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="px-8 bg-[#F57C00] hover:bg-[#E86D00] h-12 text-sm font-semibold"
          >
            <Save size={18} className="mr-2" />
            Cadastrar Curso
          </Button>
        </div>
      </form>
    </div>
  );
}
