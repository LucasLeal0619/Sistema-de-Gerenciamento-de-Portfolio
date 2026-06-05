import { Download, BookOpen, Search, CheckCircle, Edit2, Trash2, MoreVertical } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { exportToExcel } from "../utils/exportExcel";
import { getStoredCourses, deleteCourse, segmentoToSlug, getDeletedStaticCodSIGs, markStaticCourseDeleted } from "../utils/store";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { gastronomiaCourses } from "../data/gastronomiaData";
import { saudeSegurancaCourses } from "../data/saudeSegurancaData";
import { gestaoModaCourses } from "../data/gestaoModaData";
import { tecnologiaEconomiaCourses } from "../data/tecnologiaEconomiaData";
import { belezaCuidadoCourses } from "../data/belezaCuidadoData";
import { sessentaMaisCourses } from "../data/sessentaMaisData";
import { ensinoMedioCourses } from "../data/ensinoMedioData";

const areaMap: Record<string, string> = {
  "gastronomia": "Gastronomia",
  "ambiente-saude": "Ambiente e Saúde",
  "gestao-moda": "Gestão e Moda",
  "tecnologia-economia-criativa": "Tecnologia e Economia Criativa",
  "beleza-cuidado-pessoal": "Beleza e Cuidado Pessoal",
  "60-mais": "60+",
  "ensino-medio": "Ensino Médio"
};

// Função para normalizar os dados de diferentes estruturas
const normalizeCourse = (course: any) => {
  return {
    id: course.id || null,
    status: course.status || "ATIVO",
    modalidade: course.modalidade || "FIC",
    titulo: course.titulo || "",
    ch: course.ch || "",
    codDN: course.codDN || "-",
    codSIG: course.codSIG || "-",
    ident: course.ident || "-",
    tipo: course.tipo || "",
    ultimaRevisao: course.ultimaRevisao || "-",
    processoSEI: course.processoSEI || "-",
    valores: course.valores || "-",
    observacoes: course.observacoes || "-",
    unidade: course.unidade || "-",
    compativelBolsa: course.compativelBolsa || "-",
    comercial: course.comercial || "-",
    pcn: course.pcn || "-",
    pcr: course.pcr || "-"
  };
};

export function CourseArea() {
  const { area } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setSearchTerm("");
  }, [area]);

  useEffect(() => {
    if (location.state?.success) {
      setSuccessMsg(location.state.success);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  }, [location.state]);

  const areaName = area ? areaMap[area] : "";

  // Determinar qual fonte de dados usar e normalizar
  const handleDelete = (course: any) => {
    if (!window.confirm(`Excluir o curso "${course.titulo}"?`)) return;
    if (course.id) {
      deleteCourse(course.id);
    } else {
      markStaticCourseDeleted(String(course.codSIG));
    }
    setTick(t => t + 1);
    setSuccessMsg(`Curso "${course.titulo}" excluído.`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const coursesData = useMemo(() => {
    let rawData: any[] = [];

    if (area === "gastronomia") rawData = gastronomiaCourses;
    else if (area === "ambiente-saude") rawData = saudeSegurancaCourses;
    else if (area === "gestao-moda") rawData = gestaoModaCourses;
    else if (area === "tecnologia-economia-criativa") rawData = tecnologiaEconomiaCourses;
    else if (area === "beleza-cuidado-pessoal") rawData = belezaCuidadoCourses;
    else if (area === "60-mais") rawData = sessentaMaisCourses;
    else if (area === "ensino-medio") rawData = ensinoMedioCourses;

    const stored = getStoredCourses().filter(c => segmentoToSlug(c.segmento) === area);
    const storedCodSIGs = new Set(stored.map(c => c.codSIG).filter(Boolean));
    const deletedCodSIGs = getDeletedStaticCodSIGs();

    const staticFiltered = rawData.filter((c: any) => {
      const sig = String(c.codSIG);
      return !storedCodSIGs.has(sig) && !deletedCodSIGs.has(sig);
    });

    return [...staticFiltered.map(normalizeCourse), ...stored.map(normalizeCourse)];
  }, [area, tick]);

  // Filtrar cursos
  const filteredCourses = useMemo(() => {
    return coursesData.filter((course: any) => {
      return course.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.codSIG && course.codSIG.toString().includes(searchTerm)) ||
        (course.modalidade && course.modalidade.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  }, [coursesData, searchTerm]);

  // Extrair preço do campo valores
  const extractPrice = (valores: string) => {
    if (!valores || valores.includes("Não precificado") || valores.includes("ANTIGA") || valores.includes("Sem precificação") || valores.includes("Em processo")) {
      return "-";
    }
    const match = valores.match(/R\$\s*[\d.,]+/);
    return match ? match[0] : "-";
  };

  // Contar cursos por modalidade
  const modalidadeStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    coursesData.forEach((course: any) => {
      const modalidade = course.modalidade || "FIC";
      stats[modalidade] = (stats[modalidade] || 0) + 1;
    });
    return stats;
  }, [coursesData]);

  return (
    <div key={area} className="min-h-screen w-full bg-white">
      {/* Toast de sucesso */}
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
            <h1 className="text-2xl lg:text-3xl font-bold text-[#003F7D]">{areaName}</h1>
            <p className="text-sm lg:text-base text-gray-600 mt-1">
              Portfólio de cursos - SENAC DF 2025
            </p>
          </div>
          <Button
            className="bg-[#F57C00] hover:bg-[#E67300] text-white text-sm lg:text-base w-full lg:w-auto"
            onClick={() => exportToExcel(filteredCourses.map(c => ({ "Título": c.titulo, "Modalidade": c.modalidade, "C.H.": c.ch, "Tipo": c.tipo, "Cód. DN": c.codDN, "Cód. SIG": c.codSIG, "Processo SEI": c.processoSEI, "Status": c.status, "Última Revisão": c.ultimaRevisao, "Valores": c.valores })), `Cursos_${areaName.replace(/ /g, "_")}`)}
          >
            <Download size={18} className="mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Cards Resumo */}
      <div className="p-4 lg:p-8 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-[#003F7D] to-[#00355C] rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <BookOpen size={32} />
              <Badge className="bg-white/20 text-white hover:bg-white/20 font-bold">TOTAL</Badge>
            </div>
            <p className="text-sm opacity-90 mb-1">Total de Cursos</p>
            <p className="text-4xl font-bold">{coursesData.length}</p>
          </div>

          {Object.entries(modalidadeStats).slice(0, 3).map(([modalidade, count], index) => (
            <div key={`${area}-${modalidade}-${index}`} className={`bg-gradient-to-br ${
              index === 0 ? "from-[#F57C00] to-[#E67300]" :
              index === 1 ? "from-green-600 to-green-700" :
              "from-purple-600 to-purple-700"
            } rounded-xl p-6 text-white`}>
              <div className="flex items-center justify-between mb-4">
                <BookOpen size={32} />
                <Badge className="bg-white/20 text-white hover:bg-white/20 font-bold">{modalidade}</Badge>
              </div>
              <p className="text-sm opacity-90 mb-1">{modalidade}</p>
              <p className="text-4xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="px-4 lg:px-8 py-6 border-b border-gray-200">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Pesquisar por nome, código ou modalidade..."
            className="pl-12 h-12 text-base bg-white border-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <p className="text-sm text-gray-600 mt-3">
          {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} encontrado{filteredCourses.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tabela de Cursos */}
      <div className="p-4 lg:p-8">
        {filteredCourses.length > 0 ? (
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Header da Tabela */}
            <div className="bg-[#003F7D] px-6 py-4">
              <h2 className="text-xl font-bold text-white">Catálogo de Cursos</h2>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#003F7D] text-white">
                  <tr>
                    <th className="text-left font-bold px-3 py-3 text-xs uppercase w-20">Status</th>
                    <th className="text-left font-bold px-3 py-3 text-xs uppercase w-28">Modalidade</th>
                    <th className="text-left font-bold px-3 py-3 text-xs uppercase min-w-72">Título</th>
                    <th className="text-center font-bold px-3 py-3 text-xs uppercase w-16">CH</th>
                    <th className="text-center font-bold px-3 py-3 text-xs uppercase w-24">Cód. DN</th>
                    <th className="text-center font-bold px-3 py-3 text-xs uppercase w-24">Cód. SIG</th>
                    <th className="text-center font-bold px-3 py-3 text-xs uppercase w-16">Ident.</th>
                    <th className="text-left font-bold px-3 py-3 text-xs uppercase w-56">Tipo</th>
                    <th className="text-center font-bold px-3 py-3 text-xs uppercase w-20">Revisão</th>
                    <th className="text-center font-bold px-3 py-3 text-xs uppercase w-32">Processo SEI</th>
                    <th className="text-center font-bold px-3 py-3 text-xs uppercase w-36">Valores</th>
                    <th className="text-left font-bold px-3 py-3 text-xs uppercase min-w-64">Observações</th>
                    <th className="text-left font-bold px-3 py-3 text-xs uppercase w-48">Unidade</th>
                    <th className="text-center font-bold px-3 py-3 text-xs uppercase w-20">Bolsa</th>
                    <th className="text-center font-bold px-3 py-3 text-xs uppercase w-24">Comercial</th>
                    <th className="text-center font-bold px-3 py-3 text-xs uppercase w-16">PCN</th>
                    <th className="text-center font-bold px-3 py-3 text-xs uppercase w-16">PCR</th>
                    <th className="text-center font-bold px-3 py-3 text-xs uppercase w-16">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course: any, index: number) => (
                    <tr
                      key={`${area}-${index}-${course.codSIG}`}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50 transition-colors`}
                    >
                      <td className="px-3 py-3 text-center">
                        <Badge
                          className={`${
                            course.status === "ATIVO" || !course.status
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                          } font-bold text-xs`}
                        >
                          {course.status || "ATIVO"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          className={`${
                            course.modalidade === "FIC"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                              : course.modalidade === "HABILITAÇÃO"
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                              : course.modalidade === "AÇÃO EXTENSIVA"
                              ? "bg-pink-100 text-pink-800 hover:bg-pink-100"
                              : "bg-green-100 text-green-800 hover:bg-green-100"
                          } font-bold text-xs`}
                        >
                          {course.modalidade || "FIC"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-gray-900 font-medium">{course.titulo}</td>
                      <td className="px-3 py-3 text-center">
                        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 font-bold text-xs">
                          {course.ch}h
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-center text-gray-700 font-mono text-xs">
                        {course.codDN || "-"}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-700 font-mono text-xs">
                        {course.codSIG || "-"}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600 text-xs">
                        {course.ident || "-"}
                      </td>
                      <td className="px-3 py-3 text-gray-700 text-xs">{course.tipo}</td>
                      <td className="px-3 py-3 text-center text-gray-700 text-xs">
                        {course.ultimaRevisao || "-"}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600 font-mono text-xs">
                        {course.processoSEI || "-"}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-900 font-semibold text-xs">
                        {course.valores || "-"}
                      </td>
                      <td className="px-3 py-3 text-gray-600 text-xs">
                        {course.observacoes || "-"}
                      </td>
                      <td className="px-3 py-3 text-gray-600 text-xs">
                        {course.unidade || "-"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {course.compativelBolsa && (
                          <Badge
                            className={`${
                              course.compativelBolsa === "SIM"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            } font-bold text-xs`}
                          >
                            {course.compativelBolsa}
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {course.comercial && (
                          <Badge
                            className={`${
                              course.comercial === "SIM"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            } font-bold text-xs`}
                          >
                            {course.comercial}
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600 text-xs">
                        {course.pcn || "-"}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600 text-xs">
                        {course.pcr || "-"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() =>
                              course.id
                                ? navigate(`/app/cursos/editar/${course.id}`)
                                : navigate("/app/cursos/editar/novo", { state: { prefill: course } })
                            }
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar curso"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(course)}
                            className="p-1.5 rounded-lg transition-colors text-red-500 hover:bg-red-50"
                            title="Excluir curso"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            onClick={() => alert(`Mais opções: ${course.titulo}`)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Mais opções"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer da Tabela */}
            <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-300">
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span className="font-semibold">
                  Total: <span className="text-[#003F7D]">{filteredCourses.length} cursos</span>
                </span>
                <span className="text-gray-500 text-xs">Última atualização: 2025</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum curso encontrado</h3>
              <p className="text-gray-600">Tente ajustar os termos de busca</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}