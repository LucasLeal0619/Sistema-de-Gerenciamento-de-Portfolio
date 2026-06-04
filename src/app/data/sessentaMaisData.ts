export interface SessentaMaisCourse {
  modalidade: string;
  titulo: string;
  ch: string;
  tipo: string;
  observacoes: string;
  quantidades: string;
  status?: string;
}

export const sessentaMaisCourses: SessentaMaisCourse[] = [
  // PROGRAMA 60+
  { modalidade: "FIC", titulo: "Auxiliar de Recursos Humanos (Escrita)", ch: "160", tipo: "QUALIFICAÇÃO PROFISSIONAL", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Auxiliar de Cozinha", ch: "240", tipo: "QUALIFICAÇÃO PROFISSIONAL", observacoes: "TÉCNICO", quantidades: "25", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Barista", ch: "100", tipo: "QUALIFICAÇÃO PROFISSIONAL", observacoes: "TÉCNICO", quantidades: "TOTAL 25", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Bartender", ch: "200", tipo: "QUALIFICAÇÃO PROFISSIONAL", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Confeiteiro", ch: "300", tipo: "QUALIFICAÇÃO PROFISSIONAL", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Cozinheiro", ch: "500", tipo: "QUALIFICAÇÃO PROFISSIONAL", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Garçom", ch: "240", tipo: "QUALIFICAÇÃO PROFISSIONAL", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Padeiro", ch: "240", tipo: "QUALIFICAÇÃO PROFISSIONAL", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Pizzaiolo", ch: "160", tipo: "QUALIFICAÇÃO PROFISSIONAL", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Salgadeiro", ch: "160", tipo: "QUALIFICAÇÃO PROFISSIONAL", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Jardineiro de Canteiros", ch: "160", tipo: "PROGRAMAS SOCIOPROFISSIONAL", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Jardineiro de Vasos", ch: "144", tipo: "APERFEIÇOAMENTO/ATUALIZAÇÃO", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Instalador", ch: "160", tipo: "QUALIFICAÇÃO PROFISSIONAL", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Manutenção Preventiva Eletrodomésticos", ch: "96", tipo: "APERFEIÇOAMENTO/ATUALIZAÇÃO", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Técnicas de Costureiro", ch: "80", tipo: "APERFEIÇOAMENTO/ATUALIZAÇÃO", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Técnico em Gastronomia", ch: "800", tipo: "HABILITAÇÃO PROFISSIONAL TÉCNICA DE NÍVEL MÉDIO", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Auxiliar de Garçom (Escrita)", ch: "160", tipo: "QUALIFICAÇÃO PROFISSIONAL", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Compras e Estoque na Gastronomia", ch: "80", tipo: "APERFEIÇOAMENTO/ATUALIZAÇÃO", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Cozinha Brasileira: Frutos e Carnes Nobres", ch: "160", tipo: "APERFEIÇOAMENTO/ATUALIZAÇÃO", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Cozinha Latino-Americana", ch: "60", tipo: "APERFEIÇOAMENTO/ATUALIZAÇÃO", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Cozinha Tailesa: Da Panela ao Prato (artificial)", ch: "60", tipo: "QUALIFICAÇÃO PROFISSIONAL", observacoes: "SOMENTE NO CARRETA", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Práticas Gastronômicas em Cafeteria", ch: "240", tipo: "APERFEIÇOAMENTO/ATUALIZAÇÃO", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Práticas Gastronômicas em Cerveja", ch: "240", tipo: "APERFEIÇOAMENTO/ATUALIZAÇÃO", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Práticas Gastronômicas em Sorvete", ch: "240", tipo: "APERFEIÇOAMENTO/ATUALIZAÇÃO", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Recepcionista de Empresas", ch: "160", tipo: "APERFEIÇOAMENTO/ATUALIZAÇÃO", observacoes: "", quantidades: "", status: "ATIVO" },
  { modalidade: "FIC", titulo: "Jardineiro: Canteiros", ch: "108", tipo: "APERFEIÇOAMENTO/ATUALIZAÇÃO", observacoes: "", quantidades: "", status: "ATIVO" }
];

export const getSessentaMaisStatistics = () => {
  const tipos: { [key: string]: number } = {};
  
  sessentaMaisCourses.forEach(course => {
    tipos[course.tipo] = (tipos[course.tipo] || 0) + 1;
  });

  return {
    total: sessentaMaisCourses.length,
    tipos
  };
};
