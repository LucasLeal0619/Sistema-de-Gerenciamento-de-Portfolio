// Database EXATO do PLANO DE METAS 2025 - SENAC DF
// Extraído fielmente das planilhas fornecidas

export interface PlanoMetasCourse {
  segmento: string;
  tipo: string;
  categoria: "APERFEIÇOAMENTO" | "QUALIFICAÇÃO" | "TÉCNICO" | "APRENDIZAGEM";
  numero: string;
  moedaEntrada: string;
  status: "PUBLICADO" | "EM ANÁLISE" | "CPFD";
  statusColor: "green" | "yellow" | "red";
  origem: string;
  observacao: string;
}

export const planoMetasCourses: PlanoMetasCourse[] = [
  // Linhas extraídas das imagens do Plano de Metas 2025
  
  // PC/DS - Produção Cultural/Design
  {
    segmento: "PC/DS",
    tipo: "Fotografia e Filmagem com Drones",
    categoria: "APERFEIÇOAMENTO",
    numero: "40",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  // BC - Beleza e Cuidados
  {
    segmento: "BC",
    tipo: "Consultoria em Maquiagem",
    categoria: "APERFEIÇOAMENTO",
    numero: "40",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  // GN - Gestão e Negócios
  {
    segmento: "GN",
    tipo: "Excel - Da Análise ao Dashboard com Power BI",
    categoria: "APERFEIÇOAMENTO",
    numero: "60",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  // TH - Turismo e Hospitalidade
  {
    segmento: "TH",
    tipo: "Agente de Viagens (OBT)",
    categoria: "QUALIFICAÇÃO",
    numero: "200",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  // TI - Tecnologia da Informação
  {
    segmento: "TI",
    tipo: "Programador Especialista em Bancos de Dados",
    categoria: "QUALIFICAÇÃO",
    numero: "360",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "BC",
    tipo: "Design de Sobrancelhas",
    categoria: "QUALIFICAÇÃO",
    numero: "60",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "TI",
    tipo: "Inglês para Inteligência Artificial e Negócios",
    categoria: "APERFEIÇOAMENTO",
    numero: "80",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "BC",
    tipo: "Fundamentos da Maquiagem",
    categoria: "APERFEIÇOAMENTO",
    numero: "40",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "TI",
    tipo: "Técnico em Desenvolvimento de Sistemas",
    categoria: "TÉCNICO",
    numero: "1200",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "TI",
    tipo: "Técnico em Redes de Computadores",
    categoria: "TÉCNICO",
    numero: "1200",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "BC",
    tipo: "Cabeleireiro",
    categoria: "QUALIFICAÇÃO",
    numero: "240",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "BC",
    tipo: "Manicure e Pedicure",
    categoria: "QUALIFICAÇÃO",
    numero: "160",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "GN",
    tipo: "Técnico em Marketing",
    categoria: "TÉCNICO",
    numero: "800",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "DS",
    tipo: "Técnico em Design Gráfico",
    categoria: "TÉCNICO",
    numero: "1200",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "SA",
    tipo: "Técnico em Enfermagem",
    categoria: "TÉCNICO",
    numero: "1800",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "GN",
    tipo: "Técnico em Logística",
    categoria: "TÉCNICO",
    numero: "800",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "SG",
    tipo: "Técnico em Segurança do Trabalho",
    categoria: "TÉCNICO",
    numero: "1200",
    moedaEntrada: "19",
    status: "CPFD",
    statusColor: "red",
    origem: "Plano de Metas",
    observacao: "Aguardando documentação"
  },
  
  {
    segmento: "TH",
    tipo: "Técnico em Gastronomia",
    categoria: "TÉCNICO",
    numero: "1600",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "TH",
    tipo: "Culinária Internacional",
    categoria: "QUALIFICAÇÃO",
    numero: "200",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "TH",
    tipo: "Culinária Japonesa",
    categoria: "APERFEIÇOAMENTO",
    numero: "40",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "TH",
    tipo: "Culinária Portuguesa",
    categoria: "APERFEIÇOAMENTO",
    numero: "40",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "TH",
    tipo: "Confeiteiro",
    categoria: "QUALIFICAÇÃO",
    numero: "240",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "TH",
    tipo: "Garçom",
    categoria: "QUALIFICAÇÃO",
    numero: "160",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "DS",
    tipo: "Técnico em Design de Interiores",
    categoria: "TÉCNICO",
    numero: "1200",
    moedaEntrada: "19",
    status: "EM ANÁLISE",
    statusColor: "yellow",
    origem: "Plano de Metas",
    observacao: "Em processo de aprovação"
  },
  
  {
    segmento: "DS",
    tipo: "Design de Interiores com SketchUp",
    categoria: "QUALIFICAÇÃO",
    numero: "160",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "TI",
    tipo: "Técnico em Programação de Jogos Digitais",
    categoria: "TÉCNICO",
    numero: "1200",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "TI",
    tipo: "Desenvolvimento de Jogos Digitais em Unity 3D",
    categoria: "QUALIFICAÇÃO",
    numero: "360",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "TI",
    tipo: "Programação Web",
    categoria: "QUALIFICAÇÃO",
    numero: "360",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "TI",
    tipo: "Segurança em Tecnologia da Informação",
    categoria: "QUALIFICAÇÃO",
    numero: "200",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "GN",
    tipo: "Gestão de Pessoas",
    categoria: "TÉCNICO",
    numero: "800",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "GN",
    tipo: "Excel Avançado",
    categoria: "QUALIFICAÇÃO",
    numero: "60",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "GN",
    tipo: "Análise de Comportamento do Consumidor",
    categoria: "APERFEIÇOAMENTO",
    numero: "40",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "GN",
    tipo: "Práticas Gerenciais",
    categoria: "APERFEIÇOAMENTO",
    numero: "60",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "SA",
    tipo: "Farmácia Estética",
    categoria: "APERFEIÇOAMENTO",
    numero: "40",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "SA",
    tipo: "Atendimento Farmacêutico",
    categoria: "QUALIFICAÇÃO",
    numero: "160",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "SA",
    tipo: "Massagista",
    categoria: "QUALIFICAÇÃO",
    numero: "200",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "SA",
    tipo: "Massagem em Cadeira",
    categoria: "QUALIFICAÇÃO",
    numero: "80",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "CM",
    tipo: "Mídias Sociais",
    categoria: "QUALIFICAÇÃO",
    numero: "240",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "CM",
    tipo: "Marketing de Influenciadores Digitais",
    categoria: "APERFEIÇOAMENTO",
    numero: "40",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "MC",
    tipo: "Modelagem e Design de Moda",
    categoria: "QUALIFICAÇÃO",
    numero: "360",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "MC",
    tipo: "Corte e Costura",
    categoria: "QUALIFICAÇÃO",
    numero: "200",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "AS",
    tipo: "Instalações Residenciais",
    categoria: "QUALIFICAÇÃO",
    numero: "200",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "ID",
    tipo: "Língua Inglesa - Básico",
    categoria: "APERFEIÇOAMENTO",
    numero: "160",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "GN",
    tipo: "LGPD e Suas Ações",
    categoria: "APERFEIÇOAMENTO",
    numero: "40",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "TI",
    tipo: "Programação de Redes",
    categoria: "APERFEIÇOAMENTO",
    numero: "60",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "GN",
    tipo: "Excel com Business Intelligence",
    categoria: "QUALIFICAÇÃO",
    numero: "120",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "DS",
    tipo: "Interface Gráfica de Aplicação 2D",
    categoria: "QUALIFICAÇÃO",
    numero: "200",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "TI",
    tipo: "Técnico em Banco de Dados",
    categoria: "TÉCNICO",
    numero: "1000",
    moedaEntrada: "19",
    status: "EM ANÁLISE",
    statusColor: "yellow",
    origem: "Plano de Metas",
    observacao: "Aguardando validação técnica"
  },
  
  {
    segmento: "TH",
    tipo: "Desenvolvimento de Carnes",
    categoria: "QUALIFICAÇÃO",
    numero: "160",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "GN",
    tipo: "Práticas Vivenciais",
    categoria: "APERFEIÇOAMENTO",
    numero: "40",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  },
  
  {
    segmento: "DS",
    tipo: "Design e Desenvolvimento Gráfico",
    categoria: "QUALIFICAÇÃO",
    numero: "360",
    moedaEntrada: "19",
    status: "PUBLICADO",
    statusColor: "green",
    origem: "Plano de Metas",
    observacao: ""
  }
];

// Nomes completos dos segmentos
export const segmentosNomes: { [key: string]: string } = {
  "TI": "Tecnologia da Informação",
  "GN": "Gestão e Negócios",
  "DS": "Design",
  "SA": "Saúde",
  "SG": "Segurança",
  "TH": "Turismo e Hospitalidade",
  "BC": "Beleza e Cuidados",
  "CM": "Comunicação",
  "MC": "Moda e Cultura",
  "AS": "Ambiente e Saúde",
  "ID": "Idiomas",
  "PC": "Produção Cultural"
};

// Estatísticas
export const getPlanoMetasStatistics = () => {
  const totalCursos = planoMetasCourses.length;
  const publicados = planoMetasCourses.filter(c => c.status === "PUBLICADO").length;
  const emAnalise = planoMetasCourses.filter(c => c.status === "EM ANÁLISE").length;
  const cpfd = planoMetasCourses.filter(c => c.status === "CPFD").length;
  
  const tecnicos = planoMetasCourses.filter(c => c.categoria === "TÉCNICO").length;
  const qualificacao = planoMetasCourses.filter(c => c.categoria === "QUALIFICAÇÃO").length;
  const aperfeicoamento = planoMetasCourses.filter(c => c.categoria === "APERFEIÇOAMENTO").length;
  
  const segmentos = [...new Set(planoMetasCourses.map(c => c.segmento))];
  
  return {
    totalCursos,
    publicados,
    emAnalise,
    cpfd,
    tecnicos,
    qualificacao,
    aperfeicoamento,
    totalSegmentos: segmentos.length,
    segmentos
  };
};
