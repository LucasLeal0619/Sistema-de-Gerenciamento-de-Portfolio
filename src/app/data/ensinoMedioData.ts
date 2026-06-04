export interface EnsinoMedioCourse {
  segmento: string;
  modalidade: string;
  titulo: string;
  ch: string;
  codSIG: string;
  ident: string;
  tipo: string;
  ultimaRevisao: string;
  processoSEI: string;
  compativelBolsa: string;
  comercial: string;
  pcn: string;
  pcr: string;
  resolucao: string;
  observacoes: string;
  status?: string;
}

export const ensinoMedioCourses: EnsinoMedioCourse[] = [
  // TECNOLOGIA E GAMES
  { segmento: "Tecnologia e Games", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Computação Gráfica", ch: "1000", codSIG: "40393", ident: "2019", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2023.000001323-70", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1540/2024 - CEP Joaquim Loiola, Sobradinho e Talal Abu Allan", observacoes: "PUBLICADO", status: "ATIVO" },
  { segmento: "Tecnologia e Games", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Desenvolvimento de Sistemas", ch: "1200", codSIG: "102655", ident: "2021", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2023.000002099-33", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1689/2026 - Todos os CEPs e Polos", observacoes: "PUBLICADO", status: "ATIVO" },
  { segmento: "Tecnologia e Games", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Informática", ch: "1200", codSIG: "68214", ident: "2025", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2023.000001328-84", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1688/2026 - Todos os CEPs e Polos", observacoes: "PUBLICADO", status: "ATIVO" },
  { segmento: "Tecnologia e Games", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Informática para Internet", ch: "1000", codSIG: "136918", ident: "2020", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2024.000005164-36", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1620/2025 - CEP Jessé Freire, Sobradinho e Jó Rufino - Polo Brazlândia", observacoes: "PUBLICADO", status: "ATIVO" },
  { segmento: "Tecnologia e Games", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Programação de Jogos Digitais", ch: "1000", codSIG: "92043", ident: "2020", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2023.000001329-65", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1687/2026 - Todos os CEPs e Polos", observacoes: "PUBLICADO", status: "ATIVO" },
  { segmento: "Tecnologia e Games", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Segurança Cibernética", ch: "1000", codSIG: "122193", ident: "", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2025.000000005-44", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "", observacoes: "ARQUIVADO", status: "INATIVO" },

  // GESTÃO E NEGÓCIO
  { segmento: "Gestão e Negócio", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Administração SEEDF", ch: "800", codSIG: "122328", ident: "2024", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2023.000001940-57", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1691/2026 - Todos os CEPs e Polos", observacoes: "PUBLICADO", status: "ATIVO" },
  { segmento: "Gestão e Negócio", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Contabilidade SEEDF", ch: "800", codSIG: "121891", ident: "2024", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2024.000004724-71", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1610/2024 - CEP Brazlândia, São Sebastião, Jessé Freire e Santa Maria", observacoes: "PUBLICADO", status: "ATIVO" },
  { segmento: "Gestão e Negócio", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Finanças SEEDF", ch: "800", codSIG: "122336", ident: "2017", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2024.000005195-32", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1607/2024 - CEP BRAZLÂNDIA, SÃO SEBASTIÃO, JESSÉ FREIRE", observacoes: "PUBLICADO", status: "ATIVO" },
  { segmento: "Gestão e Negócio", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Logística SEEDF", ch: "800", codSIG: "121951", ident: "2024", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2024.000005206-20", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1597/2024 - CEP Jessé Freire e Santa Maria - Polo Brazlândia", observacoes: "PUBLICADO", status: "ATIVO" },
  { segmento: "Gestão e Negócio", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Marketing SEEDF", ch: "800", codSIG: "122340", ident: "2018", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2024.000005148-16", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1623/2025 - CEP Talal Abu Allan, Joaquim Loiola, Jessé Freire, Sobradinho e Jó Rufino - Polos Brazlândia, Santa Maria e São Sebastião", observacoes: "PUBLICADO", status: "ATIVO" },
  { segmento: "Gestão e Negócio", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Recursos Humanos SEEDF", ch: "800", codSIG: "121907", ident: "2024", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2023.000001167-65", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1690/2026 - Todos CEPs e Polos", observacoes: "PUBLICADO", status: "ATIVO" },
  { segmento: "Gestão e Negócio", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Secretariado SEEDF", ch: "800", codSIG: "122362", ident: "2018", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2024.000004730-10", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1605/2024 - CEP Jessé Freire e Santa Maria - Polo Brazlândia e São Sebastião", observacoes: "PUBLICADO", status: "ATIVO" },

  // SEGURANÇA
  { segmento: "Segurança", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Segurança do Trabalho SEEDF", ch: "1200", codSIG: "136969", ident: "2019", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2024.000004881-22", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1592/2024 - CEP Antonio Matias, Jó Rufino e Sobradinho", observacoes: "FALTA ASSINATURA DA DIRETORIA NO PLANO DE CURSO (Processo na CPED)", status: "ATIVO" },

  // MEIO AMBIENTE
  { segmento: "Meio Ambiente", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Meio Ambiente SEEDF", ch: "1200", codSIG: "121910", ident: "2024", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2024.000004827-87", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1614/2025 - CEP Antonio Matias", observacoes: "PUBLICADO", status: "ATIVO" },

  // AMBIENTE E SAÚDE
  { segmento: "Ambiente e Saúde", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Nutrição e Dietética (Novo Ensino Médio)", ch: "1200", codSIG: "124115", ident: "2023", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2023.000.001.660-11", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "", observacoes: "PUBLICADO", status: "ATIVO" },
  { segmento: "Ambiente e Saúde", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Podologia (TEM)", ch: "1200", codSIG: "a cadastrar", ident: "2018", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2025.000002665-79", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1657/2025 - Todos os CEPs e Polos", observacoes: "PUBLICADO", status: "ATIVO" },
  { segmento: "Ambiente e Saúde", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Análises Clínicas", ch: "1200", codSIG: "125936", ident: "2018", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2025.000000164-67", compativelBolsa: "SIM", comercial: "SIM", pcn: "SIM", pcr: "Necessita de laboratório de análises clínicas", resolucao: "Resolução 1615/2025 - CEP Antonio Matias", observacoes: "PUBLICADO", status: "ATIVO" },

  // SAÚDE
  { segmento: "Saúde", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Hemoterapia", ch: "1200", codSIG: "124415", ident: "2019", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2025.000000162-03", compativelBolsa: "SIM", comercial: "", pcn: "", pcr: "", resolucao: "Resolução 1617/2025 - CEP Antonio Matias", observacoes: "PUBLICADO", status: "ATIVO" },

  // TURISMO, HOSPITALIDADE E LAZER
  { segmento: "Turismo, Hopitalidade e Lazer", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Eventos (NOVO ENSINO MÉDIO)", ch: "800", codSIG: "96015", ident: "2016", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2023.000000305-34", compativelBolsa: "", comercial: "", pcn: "", pcr: "", resolucao: "Resolução 1630/2025 - CEP Talal Abu Allan, Joaquim Loiola, Jessé Freire, Sobradinho e Jó Rufino - Polos Brazlândia, Santa Maria e São Sebastião", observacoes: "PUBLICADO", status: "ATIVO" },

  // DESIGN
  { segmento: "Design", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Design de Interiores (NOVO ENSINO MÉDIO)", ch: "1200", codSIG: "122143", ident: "2023", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2024.000004708-51", compativelBolsa: "SIM", comercial: "SIM", pcn: "SIM", pcr: "Não", resolucao: "", observacoes: "PUBLICADO", status: "ATIVO" },

  // GASTRONOMIA
  { segmento: "Gastronomia", modalidade: "Técnico de Nível Médio", titulo: "Técnico em Gastronomia SEEDF", ch: "800", codSIG: "121769", ident: "2020", tipo: "Habilitação Técnica", ultimaRevisao: "2025", processoSEI: "2023.000001912-01", compativelBolsa: "SIM", comercial: "SIM", pcn: "", pcr: "", resolucao: "Resolução 1646/2025 - Todos os CEPs e Polos", observacoes: "PUBLICADO", status: "ATIVO" }
];

export const getEnsinoMedioStatistics = () => {
  const segmentos: { [key: string]: number } = {};
  
  ensinoMedioCourses.forEach(course => {
    segmentos[course.segmento] = (segmentos[course.segmento] || 0) + 1;
  });

  return {
    total: ensinoMedioCourses.length,
    segmentos,
    compativeisBolsa: ensinoMedioCourses.filter(c => c.compativelBolsa === "SIM").length,
    comercial: ensinoMedioCourses.filter(c => c.comercial === "SIM").length
  };
};
