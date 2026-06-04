// Store simples com localStorage para persistir dados na sessão

// ── USUÁRIOS ─────────────────────────────────────────────────────────────────

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  roleType: string;
  avatar: string;
  lastAccess: string;
  status: string;
  unidade: string;
  area: string;
  dataIngresso: string;
  telefone: string;
}

const USERS_KEY = "sgp_users";
const USERS_VERSION = "sgp_users_v2";

// Migração: se ainda não rodou v2, limpa dados antigos
if (!localStorage.getItem(USERS_VERSION)) {
  localStorage.removeItem(USERS_KEY);
  localStorage.setItem(USERS_VERSION, "1");
}

const SEED_USERS: UserRecord[] = [
  { id: "seed-1", name: "Ana Paula Souza", email: "ana.souza@senacdf.com.br", role: "Administrador", roleType: "admin", avatar: "AP", lastAccess: "Agora", status: "online", unidade: "Jessé Freire", area: "Gestão e Negócios", dataIngresso: "15/01/2022", telefone: "(61) 3313-4500" },
  { id: "seed-2", name: "Carlos Eduardo Lima", email: "carlos.lima@senacdf.com.br", role: "Consultivo", roleType: "consultivo", avatar: "CE", lastAccess: "Há 2 horas", status: "online", unidade: "Taguatinga", area: "Tecnologia da Informação", dataIngresso: "03/03/2021", telefone: "(61) 3451-2300" },
  { id: "seed-3", name: "Mariana Ferreira", email: "mariana.ferreira@senacdf.com.br", role: "Consultivo", roleType: "consultivo", avatar: "MF", lastAccess: "Ontem", status: "offline", unidade: "Ceilândia", area: "Gastronomia", dataIngresso: "22/06/2020", telefone: "(61) 3376-2800" },
  { id: "seed-4", name: "Roberto Alves", email: "roberto.alves@senacdf.com.br", role: "Editor", roleType: "editor", avatar: "RA", lastAccess: "Há 2 dias", status: "offline", unidade: "Taguatinga", area: "Ambiente e Saúde", dataIngresso: "10/09/2019", telefone: "(61) 3313-8877" },
  { id: "seed-5", name: "Juliana Costa", email: "juliana.costa@senacdf.com.br", role: "Administrador", roleType: "admin", avatar: "JC", lastAccess: "Há 5 horas", status: "online", unidade: "Jessé Freire", area: "Administração", dataIngresso: "05/04/2023", telefone: "(61) 3313-4500" },
  { id: "seed-6", name: "Fernando Santos", email: "fernando.santos@senacdf.com.br", role: "Editor", roleType: "editor", avatar: "FS", lastAccess: "Há 1 dia", status: "offline", unidade: "Gama", area: "Moda e Beleza", dataIngresso: "18/11/2021", telefone: "(61) 3556-1800" },
  { id: "seed-7", name: "Patrícia Oliveira", email: "patricia.oliveira@senacdf.com.br", role: "Consultivo", roleType: "consultivo", avatar: "PO", lastAccess: "Há 3 horas", status: "online", unidade: "Santa Maria", area: "Tecnologia da Informação", dataIngresso: "12/02/2022", telefone: "(61) 3392-3300" },
  { id: "seed-8", name: "Ricardo Mendes", email: "ricardo.mendes@senacdf.com.br", role: "Editor", roleType: "editor", avatar: "RM", lastAccess: "Há 6 horas", status: "online", unidade: "Sobradinho", area: "Gastronomia", dataIngresso: "25/08/2020", telefone: "(61) 3387-8900" },
];

export function getStoredUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    const parsed: UserRecord[] = JSON.parse(raw);
    // Se os registros existentes não têm id (dados antigos), re-seed
    if (parsed.length > 0 && !parsed[0].id) {
      localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    return parsed;
  } catch {
    return SEED_USERS;
  }
}

export function updateUser(id: string, data: Partial<UserRecord>) {
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...data };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

export function deleteUser(id: string) {
  const users = getStoredUsers();
  localStorage.setItem(USERS_KEY, JSON.stringify(users.filter(u => u.id !== id)));
}

export function saveUser(data: { nome: string; email: string; unidade: string; perfil: string; telefone: string }) {
  const users = getStoredUsers();
  const initials = data.nome.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const roleLabel: Record<string, string> = { admin: "Administrador", editor: "Editor", consultivo: "Consultivo" };
  const newUser: UserRecord = {
    id: crypto.randomUUID(),
    name: data.nome,
    email: data.email,
    role: roleLabel[data.perfil] ?? data.perfil,
    roleType: data.perfil,
    avatar: initials,
    lastAccess: "Agora",
    status: "online",
    unidade: data.unidade,
    area: "—",
    dataIngresso: new Date().toLocaleDateString("pt-BR"),
    telefone: data.telefone || "—",
  };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ── CURSOS ───────────────────────────────────────────────────────────────────

export interface CourseRecord {
  id: string;
  segmento: string;
  titulo: string;
  ch: string;
  turmas: string;
  codigo: string;
  alunos: string;
  instrutor: string;
  status: string;
  modalidade: string;
  codDN: string;
  codSIG: string;
  ident: string;
  tipo: string;
  revisao: string;
  processoSEI: string;
  valores: string;
  observacoes: string;
  bolsa: string;
  comercial: string;
  pcn: string;
  pcr: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  unidades: string[];
  criadoEm: string;
}

const COURSES_KEY = "sgp_courses";

export function getStoredCourses(): CourseRecord[] {
  try {
    return JSON.parse(localStorage.getItem(COURSES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function updateCourse(id: string, data: Partial<CourseRecord>) {
  const courses = getStoredCourses();
  const idx = courses.findIndex(c => c.id === id);
  if (idx !== -1) {
    courses[idx] = { ...courses[idx], ...data };
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
  }
}

export function deleteCourse(id: string) {
  const courses = getStoredCourses();
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses.filter(c => c.id !== id)));
}

export function saveCourse(data: Omit<CourseRecord, "id" | "criadoEm">) {
  const courses = getStoredCourses();
  const newCourse: CourseRecord = {
    ...data,
    id: crypto.randomUUID(),
    criadoEm: new Date().toLocaleDateString("pt-BR"),
  };
  courses.push(newCourse);
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

// ── CURSOS ESTÁTICOS EXCLUÍDOS ────────────────────────────────────────────────

const DELETED_STATIC_KEY = "sgp_deleted_static_courses";

export function getDeletedStaticCodSIGs(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_STATIC_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function markStaticCourseDeleted(codSIG: string) {
  const set = getDeletedStaticCodSIGs();
  set.add(codSIG);
  localStorage.setItem(DELETED_STATIC_KEY, JSON.stringify([...set]));
}

// ── VISITAS TÉCNICAS ─────────────────────────────────────────────────────────

export interface VisitaTecnicaRecord {
  id: string;
  ano: string;
  unidade: string;
  eixo: string;
  processoSEI: string;
  dataSolicitacao: string;   // ISO date YYYY-MM-DD
  dataVisitaPrevista: string; // ISO date YYYY-MM-DD
  prazoLimite: string;        // ISO date YYYY-MM-DD (30 dias úteis da solicitação)
  status: string;             // Solicitada | Em análise | Aprovada | Realizada | Devolvida | Recusada
  responsavel: string;
  relatorio: string;
  observacao: string;
  // legacy compat
  cep?: string;
}

const VISITAS_KEY = "sgp_visitas_tecnicas";
const VISITAS_VERSION = "sgp_visitas_v2";

const SEED_VISITAS: VisitaTecnicaRecord[] = [
  { id: "vt-2025-1", ano: "2025", unidade: "Jessé Freire",                          eixo: "Gastronomia",                    processoSEI: "2025.000000995-75", dataSolicitacao: "2025-01-15", dataVisitaPrevista: "2025-02-20", prazoLimite: "2025-03-05", status: "Realizada",   responsavel: "Ana Paula Souza",    relatorio: "Relação visitas técnicas - CEPS.xlsx", observacao: "" },
  { id: "vt-2025-2", ano: "2025", unidade: "Jo Rufino e Carlos Aguiar",              eixo: "Ambiente e Saúde",               processoSEI: "2025.000000658-32", dataSolicitacao: "2025-01-22", dataVisitaPrevista: "2025-03-01", prazoLimite: "2025-03-14", status: "Realizada",   responsavel: "Carlos Eduardo Lima", relatorio: "",                                     observacao: "" },
  { id: "vt-2025-3", ano: "2025", unidade: "Joaquim Loiola",                         eixo: "Gestão e Moda",                  processoSEI: "2025.000000672-91", dataSolicitacao: "2025-02-03", dataVisitaPrevista: "2025-03-10", prazoLimite: "2025-03-21", status: "Realizada",   responsavel: "Mariana Ferreira",   relatorio: "",                                     observacao: "" },
  { id: "vt-2025-4", ano: "2025", unidade: "Miguel Setembrino — Gastronomia",        eixo: "Gastronomia",                    processoSEI: "2025.000002086-17", dataSolicitacao: "2025-02-10", dataVisitaPrevista: "2025-03-18", prazoLimite: "2025-03-28", status: "Aprovada",    responsavel: "Roberto Alves",      relatorio: "",                                     observacao: "" },
  { id: "vt-2025-5", ano: "2025", unidade: "Miguel Setembrino — Gastronomia",        eixo: "Gastronomia",                    processoSEI: "2025.000000738-51", dataSolicitacao: "2025-02-14", dataVisitaPrevista: "2025-04-02", prazoLimite: "2025-04-02", status: "Em análise",  responsavel: "Juliana Costa",      relatorio: "",                                     observacao: "" },
  { id: "vt-2025-6", ano: "2025", unidade: "Miguel Setembrino — Saúde",              eixo: "Ambiente e Saúde",               processoSEI: "2025.000001169-25", dataSolicitacao: "2025-03-01", dataVisitaPrevista: "2025-04-10", prazoLimite: "2025-04-14", status: "Solicitada",  responsavel: "Fernando Santos",    relatorio: "",                                     observacao: "Aguardando confirmação da unidade" },
  { id: "vt-2025-7", ano: "2025", unidade: "Sobradinho",                             eixo: "Tecnologia e Economia Criativa", processoSEI: "2025.000000361-40", dataSolicitacao: "2025-01-08", dataVisitaPrevista: "2025-02-05", prazoLimite: "2025-02-20", status: "Realizada",   responsavel: "Patrícia Oliveira",  relatorio: "",                                     observacao: "" },
  { id: "vt-2025-8", ano: "2025", unidade: "Talal Abu-Allan",                        eixo: "Beleza e Cuidado Pessoal",       processoSEI: "2025.000000656-71", dataSolicitacao: "2025-01-20", dataVisitaPrevista: "2025-02-28", prazoLimite: "2025-03-07", status: "Devolvida",   responsavel: "Ricardo Mendes",     relatorio: "",                                     observacao: "Documentação incompleta" },
  { id: "vt-2026-1", ano: "2026", unidade: "Jessé Freire",                           eixo: "Gastronomia",                    processoSEI: "",                  dataSolicitacao: "2026-01-10", dataVisitaPrevista: "2026-02-15", prazoLimite: "2026-02-21", status: "Solicitada",  responsavel: "Ana Paula Souza",    relatorio: "Relação visitas técnicas - CEPS.xlsx", observacao: "" },
  { id: "vt-2026-2", ano: "2026", unidade: "Jo Rufino e Carlos Aguiar",              eixo: "Ambiente e Saúde",               processoSEI: "2026.000000649-41", dataSolicitacao: "2026-01-15", dataVisitaPrevista: "2026-02-20", prazoLimite: "2026-02-28", status: "Em análise",  responsavel: "Carlos Eduardo Lima", relatorio: "",                                     observacao: "" },
  { id: "vt-2026-3", ano: "2026", unidade: "Joaquim Loiola",                         eixo: "Gestão e Moda",                  processoSEI: "2026.000000444-19", dataSolicitacao: "2026-01-20", dataVisitaPrevista: "2026-03-05", prazoLimite: "2026-03-07", status: "Aprovada",    responsavel: "Mariana Ferreira",   relatorio: "",                                     observacao: "" },
  { id: "vt-2026-4", ano: "2026", unidade: "Miguel Setembrino — Gastronomia",        eixo: "Gastronomia",                    processoSEI: "2026.000000319-37", dataSolicitacao: "2026-02-01", dataVisitaPrevista: "2026-03-15", prazoLimite: "2026-03-21", status: "Solicitada",  responsavel: "Roberto Alves",      relatorio: "",                                     observacao: "" },
  { id: "vt-2026-5", ano: "2026", unidade: "Miguel Setembrino — Saúde",              eixo: "Ambiente e Saúde",               processoSEI: "2026.000000726-17", dataSolicitacao: "2026-02-10", dataVisitaPrevista: "2026-03-25", prazoLimite: "2026-03-28", status: "Em análise",  responsavel: "Juliana Costa",      relatorio: "",                                     observacao: "" },
  { id: "vt-2026-6", ano: "2026", unidade: "Sobradinho",                             eixo: "Tecnologia e Economia Criativa", processoSEI: "2026.000000618-44", dataSolicitacao: "2026-01-25", dataVisitaPrevista: "2026-03-10", prazoLimite: "2026-03-07", status: "Solicitada",  responsavel: "Patrícia Oliveira",  relatorio: "",                                     observacao: "Prazo em risco" },
  { id: "vt-2026-7", ano: "2026", unidade: "Talal Abu-Allan",                        eixo: "Beleza e Cuidado Pessoal",       processoSEI: "2026.000001224-95", dataSolicitacao: "2026-02-05", dataVisitaPrevista: "2026-03-20", prazoLimite: "2026-03-14", status: "Recusada",    responsavel: "Ricardo Mendes",     relatorio: "",                                     observacao: "Curso não disponível na unidade" },
];

export function getStoredVisitas(): VisitaTecnicaRecord[] {
  try {
    if (!localStorage.getItem(VISITAS_VERSION)) {
      localStorage.removeItem(VISITAS_KEY);
      localStorage.setItem(VISITAS_KEY, JSON.stringify(SEED_VISITAS));
      localStorage.setItem(VISITAS_VERSION, "1");
    }
    return JSON.parse(localStorage.getItem(VISITAS_KEY) || "[]");
  } catch { return SEED_VISITAS; }
}

export function saveVisita(data: Omit<VisitaTecnicaRecord, "id">) {
  const all = getStoredVisitas();
  all.push({ ...data, id: crypto.randomUUID() });
  localStorage.setItem(VISITAS_KEY, JSON.stringify(all));
}

export function updateVisita(id: string, data: Partial<VisitaTecnicaRecord>) {
  const all = getStoredVisitas();
  const idx = all.findIndex(v => v.id === id);
  if (idx !== -1) { all[idx] = { ...all[idx], ...data }; localStorage.setItem(VISITAS_KEY, JSON.stringify(all)); }
}

export function deleteVisita(id: string) {
  localStorage.setItem(VISITAS_KEY, JSON.stringify(getStoredVisitas().filter(v => v.id !== id)));
}

// ── HORAS PEDAGÓGICAS ─────────────────────────────────────────────────────────

export interface HoraPedagogicaRecord {
  id: string;
  ano: string;
  processoSEI: string;
  eixo: string;
  segmento: string;
  nomePessoa: string;
  matricula: string;
  motivo: string;
  observacao: string;
  status: string; // Solicitada | Em análise | Aprovada | Concluída | Recusada | Inativa
}

const HORAS_KEY = "sgp_horas_pedagogicas";
const HORAS_VERSION = "sgp_horas_v2";

const SEED_HORAS: HoraPedagogicaRecord[] = [
  { id: "hp-2025-1", ano: "2025", processoSEI: "2025.000000817-90", eixo: "Gestão e Moda",                    segmento: "Gestão e Negócios",               nomePessoa: "Ana Paula Souza",      matricula: "1234567", motivo: "Substituição temporária de instrutor afastado",    observacao: "",                            status: "Concluída"  },
  { id: "hp-2025-2", ano: "2025", processoSEI: "2025.000000830-67", eixo: "Gastronomia",                       segmento: "Gastronomia",                     nomePessoa: "Carlos Eduardo Lima",  matricula: "2345678", motivo: "Ampliação de turmas no 1º semestre",                observacao: "Turmas noturnas incluídas",   status: "Concluída"  },
  { id: "hp-2025-3", ano: "2025", processoSEI: "2025.000001002-55", eixo: "Ambiente e Saúde",                  segmento: "Saúde",                           nomePessoa: "Mariana Ferreira",     matricula: "3456789", motivo: "Demanda por novos cursos de saúde preventiva",      observacao: "",                            status: "Aprovada"   },
  { id: "hp-2025-4", ano: "2025", processoSEI: "2025.000001127-76", eixo: "Tecnologia e Economia Criativa",    segmento: "Tecnologia da Informação",        nomePessoa: "Roberto Alves",        matricula: "4567890", motivo: "Expansão de cursos de programação",                 observacao: "Inclui cursos EAD",           status: "Em análise" },
  { id: "hp-2025-5", ano: "2025", processoSEI: "2025.000000959-10", eixo: "Gestão e Moda",                    segmento: "Moda e Beleza",                   nomePessoa: "Juliana Costa",        matricula: "5678901", motivo: "Reposição de instrutor licenciado",                  observacao: "",                            status: "Concluída"  },
  { id: "hp-2025-6", ano: "2025", processoSEI: "2025.000002081-11", eixo: "Tecnologia e Economia Criativa",    segmento: "Comércio, Turismo e Econ. Criativa", nomePessoa: "Fernando Santos",   matricula: "6789012", motivo: "Novos cursos de turismo cultural",                   observacao: "Parceria com unidade Gama",   status: "Solicitada" },
  { id: "hp-2025-7", ano: "2025", processoSEI: "2025.000002210-44", eixo: "Beleza e Cuidado Pessoal",          segmento: "Estética e Beleza",               nomePessoa: "Patrícia Oliveira",    matricula: "7890123", motivo: "Contratação para novo curso de micropigmentação",    observacao: "",                            status: "Aprovada"   },
  { id: "hp-2025-8", ano: "2025", processoSEI: "2025.000002350-88", eixo: "Ambiente e Saúde",                  segmento: "Segurança no Trabalho",           nomePessoa: "Ricardo Mendes",       matricula: "8901234", motivo: "Atendimento à demanda corporativa B2B",             observacao: "Empresa Embrapa parceira",    status: "Recusada"   },
  { id: "hp-2026-1", ano: "2026", processoSEI: "",                  eixo: "Gestão e Moda",                    segmento: "Gestão e Negócios",               nomePessoa: "Ana Paula Souza",      matricula: "1234567", motivo: "Renovação de contratos para 2026",                   observacao: "",                            status: "Solicitada" },
  { id: "hp-2026-2", ano: "2026", processoSEI: "2026.000000696-67", eixo: "Gastronomia",                       segmento: "Gastronomia",                     nomePessoa: "Carlos Eduardo Lima",  matricula: "2345678", motivo: "Continuidade das turmas de gastronomia avançada",   observacao: "",                            status: "Em análise" },
  { id: "hp-2026-3", ano: "2026", processoSEI: "",                  eixo: "Ambiente e Saúde",                  segmento: "Saúde",                           nomePessoa: "",                     matricula: "",        motivo: "Abertura de novas turmas de enfermagem",             observacao: "Aguardando indicação",        status: "Solicitada" },
  { id: "hp-2026-4", ano: "2026", processoSEI: "",                  eixo: "Tecnologia e Economia Criativa",    segmento: "Tecnologia da Informação",        nomePessoa: "",                     matricula: "",        motivo: "Cursos de cibersegurança e cloud",                   observacao: "",                            status: "Solicitada" },
  { id: "hp-2026-5", ano: "2026", processoSEI: "",                  eixo: "Gestão e Moda",                    segmento: "Moda e Beleza",                   nomePessoa: "",                     matricula: "",        motivo: "Expansão linha de design de moda",                  observacao: "",                            status: "Solicitada" },
  { id: "hp-2026-6", ano: "2026", processoSEI: "",                  eixo: "Tecnologia e Economia Criativa",    segmento: "Comércio, Turismo e Econ. Criativa", nomePessoa: "",              matricula: "",        motivo: "Criação de rota turística DF",                       observacao: "",                            status: "Solicitada" },
];

export function getStoredHoras(): HoraPedagogicaRecord[] {
  try {
    if (!localStorage.getItem(HORAS_VERSION)) {
      localStorage.removeItem(HORAS_KEY);
      localStorage.setItem(HORAS_KEY, JSON.stringify(SEED_HORAS));
      localStorage.setItem(HORAS_VERSION, "1");
    }
    return JSON.parse(localStorage.getItem(HORAS_KEY) || "[]");
  } catch { return SEED_HORAS; }
}

export function saveHora(data: Omit<HoraPedagogicaRecord, "id">) {
  const all = getStoredHoras();
  all.push({ ...data, id: crypto.randomUUID() });
  localStorage.setItem(HORAS_KEY, JSON.stringify(all));
}

export function updateHora(id: string, data: Partial<HoraPedagogicaRecord>) {
  const all = getStoredHoras();
  const idx = all.findIndex(h => h.id === id);
  if (idx !== -1) { all[idx] = { ...all[idx], ...data }; localStorage.setItem(HORAS_KEY, JSON.stringify(all)); }
}

export function deleteHora(id: string) {
  localStorage.setItem(HORAS_KEY, JSON.stringify(getStoredHoras().filter(h => h.id !== id)));
}

// ── PLANO DE METAS (registros adicionais) ────────────────────────────────────

export interface PlanoMetaRecord {
  id: string;
  segmento: string;
  categoria: string;
  tipo: string;
  numeroSEI: string;
  codigoSIG: string;
  mesEntrega: string;
  status: string;
  origem: string;
  observacao: string;
}

const PLANO_METAS_KEY = "sgp_plano_metas_extra";

export function getStoredPlanoMetas(): PlanoMetaRecord[] {
  try { return JSON.parse(localStorage.getItem(PLANO_METAS_KEY) || "[]"); } catch { return []; }
}

export function savePlanoMeta(data: Omit<PlanoMetaRecord, "id">) {
  const all = getStoredPlanoMetas();
  all.push({ ...data, id: crypto.randomUUID() });
  localStorage.setItem(PLANO_METAS_KEY, JSON.stringify(all));
}

export function updatePlanoMeta(id: string, data: Partial<PlanoMetaRecord>) {
  const all = getStoredPlanoMetas();
  const idx = all.findIndex(p => p.id === id);
  if (idx !== -1) { all[idx] = { ...all[idx], ...data }; localStorage.setItem(PLANO_METAS_KEY, JSON.stringify(all)); }
}

export function deletePlanoMeta(id: string) {
  localStorage.setItem(PLANO_METAS_KEY, JSON.stringify(getStoredPlanoMetas().filter(p => p.id !== id)));
}

// ── VALORES PCA ───────────────────────────────────────────────────────────────

export interface ValorPCARecord {
  id: string;
  ano: string;
  sei: string;
  sig: string;
  titulo: string;
  eixo: string;
  unidade: string;
  ch: string;
  valor: string;
  status: string;
  observacao: string;
}

const VALORES_PCA_KEY = "sgp_valores_pca_v3";
const VALORES_PCA_VERSION = "sgp_valores_pca_v3_seed";

const SEED_VALORES_PCA: ValorPCARecord[] = [
  { id: "pca-1",   ano: "2025", sei: "2023.000001252-41", sig: "70139",  titulo: "Administração de Contas a Pagar, Contas a Receber e Tesouraria",                   eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "24",   valor: "R$ 200,00",    status: "Vigente",    observacao: "" },
  { id: "pca-2",   ano: "2025", sei: "2023.000001316-41", sig: "86169",  titulo: "Administrador de Banco de Dados",                                                   eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "200",  valor: "R$ 1.200,00",  status: "Vigente",    observacao: "" },
  { id: "pca-3",   ano: "2025", sei: "2024.000004233-49", sig: "66097",  titulo: "Administrador de Redes",                                                            eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "200",  valor: "R$ 1.185,00",  status: "Vigente",    observacao: "" },
  { id: "pca-4",   ano: "2025", sei: "2023.000001254-11", sig: "66587",  titulo: "Ajustes e Reformas do Vestuário",                                                   eixo: "Gestão e Moda",                  unidade: "Joaquim Loiola",  ch: "40",   valor: "R$ 549,99",    status: "Vigente",    observacao: "" },
  { id: "pca-5",   ano: "2025", sei: "2023.000001351-23", sig: "65989",  titulo: "Alongamento de Unhas",                                                              eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "60",   valor: "R$ 899,00",    status: "Vigente",    observacao: "" },
  { id: "pca-6",   ano: "2025", sei: "2023.000001313-06", sig: "66600",  titulo: "Aperfeiçoamento de Corte de Cabelo e Escova",                                       eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "60",   valor: "R$ 780,00",    status: "Vigente",    observacao: "" },
  { id: "pca-7",   ano: "2025", sei: "2023.000001224-98", sig: "66247",  titulo: "Aperfeiçoamento em Corte e Costura",                                                eixo: "Gestão e Moda",                  unidade: "Joaquim Loiola",  ch: "60",   valor: "R$ 1.204,99",  status: "Vigente",    observacao: "" },
  { id: "pca-8",   ano: "2025", sei: "2023.000001160-99", sig: "121853", titulo: "Assistente Administrativo",                                                         eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "160",  valor: "R$ 1.169,99",  status: "Vigente",    observacao: "" },
  { id: "pca-9",   ano: "2025", sei: "2024.000004494-96", sig: "122251", titulo: "Assistente de Marketing e Vendas",                                                  eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "160",  valor: "R$ 709,00",    status: "Vigente",    observacao: "" },
  { id: "pca-10",  ano: "2025", sei: "2023.000001161-70", sig: "121855", titulo: "Assistente de Recursos Humanos",                                                    eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "160",  valor: "R$ 990,00",    status: "Vigente",    observacao: "" },
  { id: "pca-11",  ano: "2025", sei: "2023.000001277-08", sig: "70228",  titulo: "Assistente de Secretaria Escolar",                                                  eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "180",  valor: "R$ 920,00",    status: "Vigente",    observacao: "" },
  { id: "pca-12",  ano: "2025", sei: "2023.000000029-13", sig: "86168",  titulo: "Assistente de Tecnologias da Informação",                                           eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "200",  valor: "R$ 1.044,99",  status: "Vigente",    observacao: "" },
  { id: "pca-13",  ano: "2025", sei: "2023.000001650-31", sig: "81675",  titulo: "Açougueiro",                                                                        eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "160",  valor: "R$ 2.288,00",  status: "Vigente",    observacao: "" },
  { id: "pca-14",  ano: "2025", sei: "2023.000001583-36", sig: "81609",  titulo: "Atendente de Farmácia",                                                             eixo: "Ambiente e Saúde",               unidade: "Miguel Setembrino", ch: "240", valor: "R$ 999,99",    status: "Vigente",    observacao: "" },
  { id: "pca-15",  ano: "2025", sei: "2024.000004797-27", sig: "84277",  titulo: "Atendimento e Vendas",                                                              eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "80",   valor: "R$ 439,00",    status: "Vigente",    observacao: "" },
  { id: "pca-16",  ano: "2025", sei: "2023.000001877-86", sig: "2459",   titulo: "Auxiliar de Cozinha",                                                               eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "240",  valor: "R$ 2.704,99",  status: "Vigente",    observacao: "" },
  { id: "pca-17",  ano: "2025", sei: "2023.000001170-61", sig: "81246",  titulo: "Barbeiro",                                                                          eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "172",  valor: "R$ 1.509,99",  status: "Vigente",    observacao: "" },
  { id: "pca-18",  ano: "2025", sei: "2023.000001192-76", sig: "36653",  titulo: "Barista",                                                                           eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "160",  valor: "R$ 1.502,99",  status: "Vigente",    observacao: "" },
  { id: "pca-19",  ano: "2025", sei: "2023.000001182-02", sig: "68288",  titulo: "Bartender",                                                                         eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "200",  valor: "R$ 2.817,99",  status: "Vigente",    observacao: "" },
  { id: "pca-20",  ano: "2025", sei: "2023.000000528-56", sig: "114838", titulo: "Preparo de Bolos Tradicionais",                                                     eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "30",   valor: "R$ 459,00",    status: "Vigente",    observacao: "" },
  { id: "pca-21",  ano: "2025", sei: "2023.000000245-69", sig: "1551",   titulo: "Cabeleireiro",                                                                      eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "400",  valor: "R$ 2.666,99",  status: "Vigente",    observacao: "" },
  { id: "pca-22",  ano: "2025", sei: "2023.000001917-16", sig: "110876", titulo: "Cake Design - Aperfeiçoamento",                                                     eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "40",   valor: "R$ 519,00",    status: "Vigente",    observacao: "" },
  { id: "pca-23",  ano: "2025", sei: "2025.000001177-35", sig: "",       titulo: "ChatGPT na Prática",                                                                eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "36",   valor: "R$ 209,00",    status: "Em análise", observacao: "" },
  { id: "pca-24",  ano: "2025", sei: "2023.000001359-81", sig: "93151",  titulo: "Colorimetria",                                                                      eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "100",  valor: "R$ 999,99",    status: "Vigente",    observacao: "" },
  { id: "pca-25",  ano: "2025", sei: "2025.000000012-73", sig: "124460", titulo: "Colorimetria Capilar: Noções Básicas",                                              eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "40",   valor: "R$ 675,00",    status: "Vigente",    observacao: "" },
  { id: "pca-26",  ano: "2025", sei: "2023.000002102-73", sig: "2449",   titulo: "Confeiteiro",                                                                       eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "300",  valor: "R$ 4.659,99",  status: "Vigente",    observacao: "" },
  { id: "pca-27",  ano: "2025", sei: "",                  sig: "109529", titulo: "Construção de Websites com PHP e MySQL",                                            eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "60",   valor: "R$ 508,00",    status: "Em análise", observacao: "" },
  { id: "pca-28",  ano: "2025", sei: "2023.000001643-10", sig: "83401",  titulo: "Costura Criativa",                                                                  eixo: "Gestão e Moda",                  unidade: "Joaquim Loiola",  ch: "80",   valor: "R$ 1.390,00",  status: "Vigente",    observacao: "" },
  { id: "pca-29",  ano: "2025", sei: "2023.000000244-88", sig: "2457",   titulo: "Costureiro",                                                                        eixo: "Gestão e Moda",                  unidade: "Joaquim Loiola",  ch: "212",  valor: "R$ 2.689,99",  status: "Vigente",    observacao: "" },
  { id: "pca-30",  ano: "2025", sei: "",                  sig: "31038",  titulo: "Cozinheiro",                                                                        eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "500",  valor: "R$ 5.452,99",  status: "Em análise", observacao: "" },
  { id: "pca-31",  ano: "2025", sei: "",                  sig: "68007",  titulo: "Cuidador de Idoso",                                                                 eixo: "Ambiente e Saúde",               unidade: "Miguel Setembrino", ch: "160", valor: "R$ 814,99",    status: "Em análise", observacao: "" },
  { id: "pca-32",  ano: "2025", sei: "",                  sig: "110116", titulo: "Depilador",                                                                         eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "160",  valor: "R$ 1.689,99",  status: "Em análise", observacao: "" },
  { id: "pca-33",  ano: "2025", sei: "2025.000001433-11", sig: "86156",  titulo: "Desenvolvedor de Aplicativos Móveis",                                               eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "100",  valor: "R$ 450,00",    status: "Vigente",    observacao: "" },
  { id: "pca-34",  ano: "2025", sei: "2023.000001165-01", sig: "102680", titulo: "Desenvolvedor Front End",                                                           eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "264",  valor: "R$ 1.146,00",  status: "Vigente",    observacao: "" },
  { id: "pca-35",  ano: "2025", sei: "",                  sig: "86213",  titulo: "Design de Sobrancelhas",                                                            eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "60",   valor: "R$ 649,99",    status: "Em análise", observacao: "" },
  { id: "pca-36",  ano: "2025", sei: "2024.000003001-82", sig: "116143", titulo: "Educação Financeira",                                                               eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "20",   valor: "R$ 118,00",    status: "Vigente",    observacao: "" },
  { id: "pca-37",  ano: "2025", sei: "2023.000001423-32", sig: "81594",  titulo: "Especialização Técnica em Enfermagem do Trabalho",                                  eixo: "Ambiente e Saúde",               unidade: "Miguel Setembrino", ch: "340", valor: "R$ 1.299,00",  status: "Vigente",    observacao: "" },
  { id: "pca-38",  ano: "2025", sei: "2023.000001352-12", sig: "2461",   titulo: "Especialização Técnica em Instrumentação Cirúrgica",                                eixo: "Ambiente e Saúde",               unidade: "Miguel Setembrino", ch: "360", valor: "R$ 1.889,00",  status: "Vigente",    observacao: "" },
  { id: "pca-39",  ano: "2025", sei: "2025.000000843-81", sig: "127865", titulo: "Estratégias de Captação de Recursos para Projetos Culturais",                      eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "28",   valor: "R$ 220,00",    status: "Vigente",    observacao: "" },
  { id: "pca-40",  ano: "2025", sei: "SEM N° SEI",        sig: "66400",  titulo: "Excel com VBA e Dashboard",                                                        eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "60",   valor: "R$ 667,00",    status: "Em análise", observacao: "" },
  { id: "pca-41",  ano: "2025", sei: "2023.000001885-96", sig: "68188",  titulo: "Faturamento de Serviços de Saúde",                                                  eixo: "Ambiente e Saúde",               unidade: "Miguel Setembrino", ch: "96",  valor: "R$ 536,00",    status: "Vigente",    observacao: "" },
  { id: "pca-42",  ano: "2025", sei: "2024.000003094-81", sig: "122258", titulo: "Ferramentas de Inovação e Modelos de Negócio",                                      eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "60",   valor: "R$ 259,00",    status: "Vigente",    observacao: "" },
  { id: "pca-43",  ano: "2025", sei: "2023.000001455-10", sig: "2453",   titulo: "Garçom",                                                                            eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "240",  valor: "R$ 2.365,99",  status: "Vigente",    observacao: "" },
  { id: "pca-44",  ano: "2025", sei: "2024.000005109-18", sig: "124799", titulo: "Frentista",                                                                         eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "160",  valor: "R$ 1.030,00",  status: "Vigente",    observacao: "" },
  { id: "pca-45",  ano: "2025", sei: "2024.000003896-55", sig: "119591", titulo: "Gestão de Pequenos Negócios em Comércio e Serviços",                                eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "100",  valor: "R$ 452,00",    status: "Vigente",    observacao: "" },
  { id: "pca-46",  ano: "2025", sei: "2023.000001951-18", sig: "85459",  titulo: "Gestão de Redes Sociais e Criação de Conteúdo Digital",                            eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "80",   valor: "R$ 574,99",    status: "Vigente",    observacao: "" },
  { id: "pca-47",  ano: "2025", sei: "2023.000002188-43", sig: "108909", titulo: "Informática Windows e Office Fundamental",                                         eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "100",  valor: "R$ 501,99",    status: "Vigente",    observacao: "" },
  { id: "pca-48",  ano: "2025", sei: "2025.000001173-10", sig: "128520", titulo: "Inteligência Artificial - Como Fazer a Pergunta Correta",                          eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "20",   valor: "R$ 150,00",    status: "Vigente",    observacao: "" },
  { id: "pca-49",  ano: "2025", sei: "2023.000001761-56", sig: "61788",  titulo: "Lógica de Programação",                                                             eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "60",   valor: "R$ 450,00",    status: "Vigente",    observacao: "" },
  { id: "pca-50",  ano: "2025", sei: "2023.000001233-89", sig: "67555",  titulo: "Manicure e Pedicure",                                                               eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "160",  valor: "R$ 1.759,99",  status: "Vigente",    observacao: "" },
  { id: "pca-51",  ano: "2025", sei: "2023.000000202-29", sig: "67549",  titulo: "Maquiador",                                                                         eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "160",  valor: "R$ 1.769,99",  status: "Vigente",    observacao: "" },
  { id: "pca-52",  ano: "2025", sei: "2023.000001366-18", sig: "110516", titulo: "Maquiagem Profissional Avançada",                                                   eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "60",   valor: "R$ 785,99",    status: "Vigente",    observacao: "" },
  { id: "pca-53",  ano: "2025", sei: "2023.000001475-63", sig: "111000", titulo: "Microblading Fio a Fio",                                                            eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "60",   valor: "R$ 899,00",    status: "Vigente",    observacao: "" },
  { id: "pca-54",  ano: "2025", sei: "2023.000001556-63", sig: "111001", titulo: "Micropigmentação",                                                                  eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "80",   valor: "R$ 1.195,00",  status: "Vigente",    observacao: "" },
  { id: "pca-55",  ano: "2025", sei: "2023.000001320-27", sig: "66344",  titulo: "Microsoft Power BI - Avançado",                                                     eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "20",   valor: "R$ 378,00",    status: "Vigente",    observacao: "" },
  { id: "pca-56",  ano: "2025", sei: "2023.000001319-93", sig: "68064",  titulo: "Microsoft Power BI - Básico",                                                       eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "20",   valor: "R$ 370,00",    status: "Vigente",    observacao: "" },
  { id: "pca-57",  ano: "2025", sei: "2023.000001646-54", sig: "111002", titulo: "Moda Pet",                                                                          eixo: "Gestão e Moda",                  unidade: "Joaquim Loiola",  ch: "40",   valor: "R$ 890,00",    status: "Vigente",    observacao: "" },
  { id: "pca-58",  ano: "2025", sei: "2024.000001347-46", sig: "111658", titulo: "Modelagem de Alfaiataria Feminina",                                                 eixo: "Gestão e Moda",                  unidade: "Joaquim Loiola",  ch: "100",  valor: "R$ 1.209,00",  status: "Vigente",    observacao: "" },
  { id: "pca-59",  ano: "2025", sei: "2024.000001537-08", sig: "113796", titulo: "Modelagem para Corset",                                                             eixo: "Gestão e Moda",                  unidade: "Joaquim Loiola",  ch: "80",   valor: "R$ 1.036,99",  status: "Vigente",    observacao: "" },
  { id: "pca-60",  ano: "2025", sei: "2023.000000193-01", sig: "70599",  titulo: "Modelista",                                                                         eixo: "Gestão e Moda",                  unidade: "Joaquim Loiola",  ch: "210",  valor: "R$ 1.711,99",  status: "Vigente",    observacao: "" },
  { id: "pca-61",  ano: "2025", sei: "",                  sig: "",       titulo: "Oratória Experience - Comunique-Se com Alta Performance",                          eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "42",   valor: "R$ 250,00",    status: "Em análise", observacao: "" },
  { id: "pca-62",  ano: "2025", sei: "2023.000000201-48", sig: "121890", titulo: "Organizador de Eventos",                                                            eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "180",  valor: "R$ 1.209,99",  status: "Vigente",    observacao: "" },
  { id: "pca-63",  ano: "2025", sei: "2023.000001920-11", sig: "69994",  titulo: "Padeiro",                                                                           eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "240",  valor: "R$ 2.969,99",  status: "Vigente",    observacao: "" },
  { id: "pca-64",  ano: "2025", sei: "2023.000001916-27", sig: "69851",  titulo: "Pizzaiolo",                                                                         eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "160",  valor: "R$ 1.632,99",  status: "Vigente",    observacao: "" },
  { id: "pca-65",  ano: "2025", sei: "2024.000004271-74", sig: "91524",  titulo: "Planejar e Implementar a Segurança Física e Lógica em Redes de Computadores",       eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "72",   valor: "R$ 350,00",    status: "Vigente",    observacao: "" },
  { id: "pca-66",  ano: "2025", sei: "2024.000005492-88", sig: "31026",  titulo: "Porteiro e Vigia",                                                                  eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "160",  valor: "R$ 708,00",    status: "Vigente",    observacao: "" },
  { id: "pca-67",  ano: "2025", sei: "2024.000003718-70", sig: "120219", titulo: "Práticas de Trabalho do Cabeleireiro",                                              eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "100",  valor: "R$ 960,00",    status: "Vigente",    observacao: "" },
  { id: "pca-68",  ano: "2025", sei: "2023.000001331-80", sig: "105169", titulo: "Programador de Sistemas",                                                           eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "200",  valor: "R$ 1.159,99",  status: "Vigente",    observacao: "" },
  { id: "pca-69",  ano: "2025", sei: "2023.000001166-84", sig: "86172",  titulo: "Programador Web",                                                                   eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "240",  valor: "R$ 1.119,99",  status: "Vigente",    observacao: "" },
  { id: "pca-70",  ano: "2025", sei: "2024.000004678-00", sig: "1559",   titulo: "Recepcionista",                                                                     eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "160",  valor: "R$ 679,99",    status: "Vigente",    observacao: "" },
  { id: "pca-71",  ano: "2025", sei: "2023.000001332-61", sig: "1297",   titulo: "Recepcionista de Eventos",                                                          eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "160",  valor: "R$ 1.406,65",  status: "Vigente",    observacao: "" },
  { id: "pca-72",  ano: "2025", sei: "2023.000000434-31", sig: "121900", titulo: "Recepcionista em Meios de Hospedagem",                                              eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "160",  valor: "R$ 999,00",    status: "Vigente",    observacao: "" },
  { id: "pca-73",  ano: "2025", sei: "2023.000001893-04", sig: "81531",  titulo: "Recepcionista em Serviços de Saúde",                                                eixo: "Ambiente e Saúde",               unidade: "Miguel Setembrino", ch: "240", valor: "R$ 1.349,00",  status: "Vigente",    observacao: "" },
  { id: "pca-74",  ano: "2025", sei: "2023.000002062-41", sig: "65959",  titulo: "Recrutamento e Seleção de Pessoas",                                                 eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "40",   valor: "R$ 196,00",    status: "Vigente",    observacao: "" },
  { id: "pca-75",  ano: "2025", sei: "2023.000002001-20", sig: "69824",  titulo: "Salgadeiro",                                                                        eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "160",  valor: "R$ 1.944,99",  status: "Vigente",    observacao: "" },
  { id: "pca-76",  ano: "2025", sei: "2023.000001447-18", sig: "66575",  titulo: "Sommelier de Cachaça",                                                              eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "100",  valor: "R$ 1.368,00",  status: "Vigente",    observacao: "" },
  { id: "pca-77",  ano: "2025", sei: "2023.000001185-47", sig: "66274",  titulo: "Sommelier de Vinho",                                                                eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "144",  valor: "R$ 2.419,00",  status: "Vigente",    observacao: "" },
  { id: "pca-78",  ano: "2025", sei: "2023.000001914-65", sig: "128625", titulo: "Sushiman",                                                                          eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "160",  valor: "R$ 2.335,00",  status: "Vigente",    observacao: "" },
  { id: "pca-79",  ano: "2025", sei: "2023.000001155-21", sig: "66313",  titulo: "Técnicas Avançadas de Word, Excel e PowerPoint",                                    eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "60",   valor: "R$ 399,00",    status: "Vigente",    observacao: "" },
  { id: "pca-80",  ano: "2025", sei: "2024.000002730-11", sig: "115510", titulo: "Técnicas de Barbeiro",                                                              eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "80",   valor: "R$ 649,00",    status: "Vigente",    observacao: "" },
  { id: "pca-81",  ano: "2025", sei: "2023.000001137-40", sig: "105322", titulo: "Técnicas de Confeitaria",                                                           eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "60",   valor: "R$ 988,99",    status: "Vigente",    observacao: "" },
  { id: "pca-82",  ano: "2025", sei: "2024.000003090-58", sig: "122272", titulo: "Técnicas de Liderança",                                                             eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "40",   valor: "R$ 188,00",    status: "Vigente",    observacao: "" },
  { id: "pca-83",  ano: "2025", sei: "2023.000002000-49", sig: "110530", titulo: "Técnicas de Petiscos e Comida de Boteco",                                           eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "40",   valor: "R$ 487,00",    status: "Vigente",    observacao: "" },
  { id: "pca-84",  ano: "2025", sei: "2023.000001193-57", sig: "110531", titulo: "Técnicas de Produção de Biscoitos Finos e Artesanais",                              eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "40",   valor: "R$ 565,00",    status: "Vigente",    observacao: "" },
  { id: "pca-85",  ano: "2025", sei: "2024.000003099-96", sig: "122283", titulo: "Técnicas de Rapport",                                                               eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "60",   valor: "R$ 369,00",    status: "Vigente",    observacao: "" },
  { id: "pca-86",  ano: "2025", sei: "2023.000001107-24", sig: "122329", titulo: "Técnico em Administração",                                                          eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "800",  valor: "R$ 3.850,00",  status: "Vigente",    observacao: "" },
  { id: "pca-87",  ano: "2025", sei: "2023.000000284-75", sig: "111021", titulo: "Técnicas para Pizzaiolo",                                                           eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "40",   valor: "R$ 549,00",    status: "Vigente",    observacao: "" },
  { id: "pca-88",  ano: "2025", sei: "2025.000000385-17", sig: "128588", titulo: "Técnico em Ciência de Dados",                                                       eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "1000", valor: "R$ 5.228,00",  status: "Vigente",    observacao: "" },
  { id: "pca-89",  ano: "2025", sei: "2023.000001151-06", sig: "121894", titulo: "Técnico em Contabilidade",                                                          eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "800",  valor: "R$ 4.770,00",  status: "Vigente",    observacao: "" },
  { id: "pca-90",  ano: "2025", sei: "2023.000002099-33", sig: "122399", titulo: "Técnico em Desenvolvimento de Sistemas",                                            eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "1200", valor: "R$ 6.235,00",  status: "Vigente",    observacao: "" },
  { id: "pca-91",  ano: "2025", sei: "2023.000001346-66", sig: "117615", titulo: "Técnico em Enfermagem",                                                             eixo: "Ambiente e Saúde",               unidade: "Miguel Setembrino", ch: "1800", valor: "R$ 9.800,00",  status: "Vigente",    observacao: "" },
  { id: "pca-92",  ano: "2025", sei: "2023.000001138-21", sig: "",       titulo: "Técnicas Básicas para Cozinheiro",                                                  eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "80",   valor: "R$ 960,00",    status: "Vigente",    observacao: "" },
  { id: "pca-93",  ano: "2025", sei: "2023.000001967-77", sig: "122335", titulo: "Técnico em Finanças",                                                               eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "900",  valor: "R$ 3.359,99",  status: "Vigente",    observacao: "" },
  { id: "pca-94",  ano: "2025", sei: "2023.000001906-55", sig: "128584", titulo: "Técnico em Gastronomia",                                                            eixo: "Gastronomia",                    unidade: "Jessé Freire",    ch: "800",  valor: "R$ 7.219,00",  status: "Vigente",    observacao: "" },
  { id: "pca-95",  ano: "2025", sei: "2025.000000004-63", sig: "128852", titulo: "Técnico em Imagem Pessoal",                                                         eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "800",  valor: "R$ 9.823,00",  status: "Vigente",    observacao: "" },
  { id: "pca-96",  ano: "2025", sei: "2025.000000892-60", sig: "128411", titulo: "Técnico em Inteligência Artificial",                                                eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "1200", valor: "R$ 6.232,00",  status: "Vigente",    observacao: "" },
  { id: "pca-97",  ano: "2025", sei: "2023.000001173-11", sig: "121939", titulo: "Técnico em Logística",                                                              eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "800",  valor: "R$ 3.745,00",  status: "Vigente",    observacao: "" },
  { id: "pca-98",  ano: "2025", sei: "2023.000001762-37", sig: "122019", titulo: "Técnico em Massoterapia",                                                           eixo: "Ambiente e Saúde",               unidade: "Miguel Setembrino", ch: "1200", valor: "R$ 5.499,99",  status: "Vigente",    observacao: "" },
  { id: "pca-99",  ano: "2025", sei: "2024.000003152-95", sig: "127943", titulo: "Técnico em Multimídia",                                                             eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "800",  valor: "R$ 4.530,00",  status: "Vigente",    observacao: "" },
  { id: "pca-100", ano: "2025", sei: "2023.000001146-31", sig: "121386", titulo: "Técnico em Nutrição e Dietética",                                                   eixo: "Ambiente e Saúde",               unidade: "Miguel Setembrino", ch: "1200", valor: "R$ 5.500,00",  status: "Vigente",    observacao: "" },
  { id: "pca-101", ano: "2025", sei: "2023.000001570-11", sig: "117562", titulo: "Técnico em Podologia",                                                              eixo: "Ambiente e Saúde",               unidade: "Miguel Setembrino", ch: "1200", valor: "R$ 6.499,00",  status: "Vigente",    observacao: "" },
  { id: "pca-102", ano: "2025", sei: "2024.000003149-90", sig: "128565", titulo: "Técnico em Processos Fotográficos",                                                 eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "800",  valor: "R$ 4.349,00",  status: "Vigente",    observacao: "" },
  { id: "pca-103", ano: "2025", sei: "2024.000003421-87", sig: "128358", titulo: "Técnico em Produção Cultural",                                                      eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "800",  valor: "R$ 4.449,00",  status: "Vigente",    observacao: "" },
  { id: "pca-104", ano: "2025", sei: "2024.000003150-23", sig: "128434", titulo: "Técnico em Produção de Áudio e Vídeo",                                              eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "1200", valor: "R$ 6.720,00",  status: "Vigente",    observacao: "" },
  { id: "pca-105", ano: "2025", sei: "2023.000001329-65", sig: "122067", titulo: "Técnico em Programação de Jogos Digitais",                                          eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "1000", valor: "R$ 5.215,00",  status: "Vigente",    observacao: "" },
  { id: "pca-106", ano: "2025", sei: "2024.000003151-12", sig: "128704", titulo: "Técnico em Publicidade",                                                            eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "900",  valor: "R$ 5.875,00",  status: "Vigente",    observacao: "" },
  { id: "pca-107", ano: "2025", sei: "2023.000001167-65", sig: "121896", titulo: "Técnico em Recursos Humanos",                                                       eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "800",  valor: "R$ 4.279,99",  status: "Vigente",    observacao: "" },
  { id: "pca-108", ano: "2025", sei: "2023.000001174-94", sig: "122361", titulo: "Técnico em Secretariado",                                                           eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "800",  valor: "R$ 3.945,99",  status: "Vigente",    observacao: "" },
  { id: "pca-109", ano: "2025", sei: "2024.000005092-27", sig: "123066", titulo: "Técnico em Transações Imobiliárias",                                                eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "800",  valor: "R$ 4.090,00",  status: "Vigente",    observacao: "" },
  { id: "pca-110", ano: "2025", sei: "2024.000005157-15", sig: "122193", titulo: "Técnico em Segurança Cibernética",                                                  eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "1000", valor: "R$ 5.536,00",  status: "Vigente",    observacao: "" },
  { id: "pca-111", ano: "2025", sei: "2023.000001631-78", sig: "121950", titulo: "Técnico em Segurança do Trabalho",                                                  eixo: "Ambiente e Saúde",               unidade: "Miguel Setembrino", ch: "1200", valor: "R$ 5.366,00",  status: "Vigente",    observacao: "" },
  { id: "pca-112", ano: "2025", sei: "2025.000000018-69", sig: "124459", titulo: "Tratamento Capilar",                                                                eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan", ch: "40",   valor: "R$ 998,76",    status: "Vigente",    observacao: "" },
  { id: "pca-113", ano: "2025", sei: "",                  sig: "",       titulo: "Vendedor de Produtos e Serviços Ópticos",                                           eixo: "Gestão e Negócios",              unidade: "Ceilândia",       ch: "240",  valor: "R$ 1.269,00",  status: "Em análise", observacao: "" },
  { id: "pca-114", ano: "2025", sei: "2024.000005164-36", sig: "122097", titulo: "Técnico em Informática para Internet",                                              eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",      ch: "1000", valor: "R$ 5.226,00",  status: "Vigente",    observacao: "" },
];

export function getStoredValoresPCA(): ValorPCARecord[] {
  try {
    if (!localStorage.getItem(VALORES_PCA_VERSION)) {
      localStorage.setItem(VALORES_PCA_KEY, JSON.stringify(SEED_VALORES_PCA));
      localStorage.setItem(VALORES_PCA_VERSION, "1");
    }
    return JSON.parse(localStorage.getItem(VALORES_PCA_KEY) || "[]");
  } catch { return SEED_VALORES_PCA; }
}

export function saveValorPCA(data: Omit<ValorPCARecord, "id">) {
  const all = getStoredValoresPCA();
  all.push({ ...data, id: crypto.randomUUID() });
  localStorage.setItem(VALORES_PCA_KEY, JSON.stringify(all));
}

export function updateValorPCA(id: string, data: Partial<ValorPCARecord>) {
  const all = getStoredValoresPCA();
  const idx = all.findIndex(v => v.id === id);
  if (idx !== -1) { all[idx] = { ...all[idx], ...data }; localStorage.setItem(VALORES_PCA_KEY, JSON.stringify(all)); }
}

export function deleteValorPCA(id: string) {
  localStorage.setItem(VALORES_PCA_KEY, JSON.stringify(getStoredValoresPCA().filter(v => v.id !== id)));
}

// ── CURSOS POR EIXO ───────────────────────────────────────────────────────────

export interface CursoEixoRecord {
  id: string;
  ano: string;
  eixo: string;
  unidade: string;
  curso: string;
  ch: string;
  status: string;
  observacao: string;
}

const CURSOS_EIXO_KEY = "sgp_cursos_eixo_v3";
const CURSOS_EIXO_VERSION = "sgp_cursos_eixo_v3_seed";

const SEED_CURSOS_EIXO: CursoEixoRecord[] = [
  // ── Gastronomia ──
  { id: "ce-1",   ano: "2025", eixo: "Gastronomia",                              unidade: "Jessé Freire",    curso: "Açougueiro",                                                              ch: "160",  status: "Ativo",   observacao: "" },
  { id: "ce-2",   ano: "2025", eixo: "Gastronomia",                              unidade: "Jessé Freire",    curso: "Auxiliar de Cozinha",                                                     ch: "240",  status: "Ativo",   observacao: "" },
  { id: "ce-3",   ano: "2025", eixo: "Gastronomia",                              unidade: "Jessé Freire",    curso: "Boas Práticas na Manipulação de Alimentos",                               ch: "20",   status: "Ativo",   observacao: "" },
  { id: "ce-4",   ano: "2025", eixo: "Gastronomia",                              unidade: "Jessé Freire",    curso: "Compras e Estoque na Gastronomia",                                        ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-5",   ano: "2025", eixo: "Gastronomia",                              unidade: "Jessé Freire",    curso: "Cozinheiro",                                                              ch: "500",  status: "Ativo",   observacao: "" },
  { id: "ce-6",   ano: "2025", eixo: "Gastronomia",                              unidade: "Jessé Freire",    curso: "Garçom",                                                                  ch: "240",  status: "Ativo",   observacao: "" },
  { id: "ce-7",   ano: "2025", eixo: "Gastronomia",                              unidade: "Jessé Freire",    curso: "Práticas Operacionais em Cozinha",                                        ch: "360",  status: "Ativo",   observacao: "" },
  { id: "ce-8",   ano: "2025", eixo: "Gastronomia",                              unidade: "Jessé Freire",    curso: "Sushiman",                                                                ch: "160",  status: "Ativo",   observacao: "" },
  { id: "ce-9",   ano: "2025", eixo: "Gastronomia",                              unidade: "Jessé Freire",    curso: "Técnicas Básicas para Cozinheiro",                                        ch: "80",   status: "Ativo",   observacao: "" },
  { id: "ce-10",  ano: "2025", eixo: "Gastronomia",                              unidade: "Jessé Freire",    curso: "Técnicas de Petiscos e Comida de Boteco",                                 ch: "40",   status: "Ativo",   observacao: "" },
  { id: "ce-11",  ano: "2025", eixo: "Gastronomia",                              unidade: "Jessé Freire",    curso: "Técnico em Gastronomia",                                                  ch: "800",  status: "Ativo",   observacao: "" },
  { id: "ce-12",  ano: "2025", eixo: "Gastronomia",                              unidade: "Jessé Freire",    curso: "Sustentabilidade aplicada à cozinha",                                     ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-13",  ano: "2025", eixo: "Gastronomia",                              unidade: "Jessé Freire",    curso: "Cozinha Brasileira: Biomas e Cortes Nobres",                              ch: "",     status: "Inativo", observacao: "" },
  // ── Bebidas ──
  { id: "ce-14",  ano: "2025", eixo: "Bebidas",                                  unidade: "Jessé Freire",    curso: "Barista",                                                                 ch: "160",  status: "Ativo",   observacao: "" },
  { id: "ce-15",  ano: "2025", eixo: "Bebidas",                                  unidade: "Jessé Freire",    curso: "Bartender",                                                               ch: "200",  status: "Ativo",   observacao: "" },
  { id: "ce-16",  ano: "2025", eixo: "Bebidas",                                  unidade: "Jessé Freire",    curso: "Sommelier de Cachaça",                                                    ch: "100",  status: "Ativo",   observacao: "" },
  { id: "ce-17",  ano: "2025", eixo: "Bebidas",                                  unidade: "Jessé Freire",    curso: "Sommelier de Vinho",                                                      ch: "144",  status: "Ativo",   observacao: "" },
  { id: "ce-18",  ano: "2025", eixo: "Bebidas",                                  unidade: "Jessé Freire",    curso: "Práticas Operacionais em Cafeteria",                                      ch: "240",  status: "Ativo",   observacao: "" },
  { id: "ce-19",  ano: "2025", eixo: "Bebidas",                                  unidade: "Jessé Freire",    curso: "Chás, Infusões e Macerações",                                             ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-20",  ano: "2025", eixo: "Bebidas",                                  unidade: "Jessé Freire",    curso: "Latte Art",                                                               ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-21",  ano: "2025", eixo: "Bebidas",                                  unidade: "Jessé Freire",    curso: "Mixologia: Criatividade e Tendência",                                     ch: "",     status: "Inativo", observacao: "" },
  // ── Panificação ──
  { id: "ce-22",  ano: "2025", eixo: "Panificação",                              unidade: "Jessé Freire",    curso: "Padaria Artesanal",                                                       ch: "",     status: "Ativo",   observacao: "" },
  { id: "ce-23",  ano: "2025", eixo: "Panificação",                              unidade: "Jessé Freire",    curso: "Padeiro",                                                                 ch: "260",  status: "Ativo",   observacao: "" },
  { id: "ce-24",  ano: "2025", eixo: "Panificação",                              unidade: "Jessé Freire",    curso: "Pizzaiolo",                                                               ch: "160",  status: "Ativo",   observacao: "" },
  { id: "ce-25",  ano: "2025", eixo: "Panificação",                              unidade: "Jessé Freire",    curso: "Técnicas de Produção de Pães Caseiros e Artesanais",                      ch: "40",   status: "Ativo",   observacao: "" },
  { id: "ce-26",  ano: "2025", eixo: "Panificação",                              unidade: "Jessé Freire",    curso: "Auxiliar de Padeiro",                                                     ch: "",     status: "Inativo", observacao: "" },
  // ── Confeitaria ──
  { id: "ce-27",  ano: "2025", eixo: "Confeitaria",                              unidade: "Jessé Freire",    curso: "Cake Design - Aperfeiçoamento",                                           ch: "40",   status: "Ativo",   observacao: "" },
  { id: "ce-28",  ano: "2025", eixo: "Confeitaria",                              unidade: "Jessé Freire",    curso: "Confeiteiro",                                                             ch: "300",  status: "Ativo",   observacao: "" },
  { id: "ce-29",  ano: "2025", eixo: "Confeitaria",                              unidade: "Jessé Freire",    curso: "Preparo de Bolos Tradicionais",                                           ch: "30",   status: "Ativo",   observacao: "" },
  { id: "ce-30",  ano: "2025", eixo: "Confeitaria",                              unidade: "Jessé Freire",    curso: "Técnicas de Confeitaria",                                                 ch: "60",   status: "Ativo",   observacao: "" },
  { id: "ce-31",  ano: "2025", eixo: "Confeitaria",                              unidade: "Jessé Freire",    curso: "Técnicas de Produção de Biscoitos Finos e Artesanais",                    ch: "40",   status: "Ativo",   observacao: "" },
  { id: "ce-32",  ano: "2025", eixo: "Confeitaria",                              unidade: "Jessé Freire",    curso: "Comida Natalina",                                                         ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-33",  ano: "2025", eixo: "Confeitaria",                              unidade: "Jessé Freire",    curso: "Decoração de Bolos",                                                      ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-34",  ano: "2025", eixo: "Confeitaria",                              unidade: "Jessé Freire",    curso: "Doces Brasileiros",                                                       ch: "",     status: "Inativo", observacao: "" },
  // ── Turismo ──
  { id: "ce-35",  ano: "2025", eixo: "Turismo",                                  unidade: "Jessé Freire",    curso: "Agente de Viagens",                                                       ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-36",  ano: "2025", eixo: "Turismo",                                  unidade: "Jessé Freire",    curso: "Técnico em Guia de Turismo",                                              ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-37",  ano: "2025", eixo: "Turismo",                                  unidade: "Jessé Freire",    curso: "Técnico em Eventos (Novo Ensino Médio)",                                  ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-38",  ano: "2025", eixo: "Turismo",                                  unidade: "Jessé Freire",    curso: "Cultura Brasileira: Tradições Diversidade e Sociedade",                   ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-39",  ano: "2025", eixo: "Turismo",                                  unidade: "Jessé Freire",    curso: "Fotografia de Gastronomia",                                               ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-40",  ano: "2025", eixo: "Turismo",                                  unidade: "Jessé Freire",    curso: "Storytelling para Marcas e Produtos",                                     ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-41",  ano: "2025", eixo: "Turismo",                                  unidade: "Jessé Freire",    curso: "Ferramentas de Marketing Digital para o Turismo",                         ch: "",     status: "Inativo", observacao: "" },
  // ── Hospitalidade ──
  { id: "ce-42",  ano: "2025", eixo: "Hospitalidade",                            unidade: "Jessé Freire",    curso: "Recepcionista em Meios de Hospedagem",                                    ch: "160",  status: "Ativo",   observacao: "" },
  { id: "ce-43",  ano: "2025", eixo: "Hospitalidade",                            unidade: "Jessé Freire",    curso: "Excelência no Atendimento em Serviços de Hospitalidade",                  ch: "20",   status: "Ativo",   observacao: "" },
  { id: "ce-44",  ano: "2025", eixo: "Hospitalidade",                            unidade: "Jessé Freire",    curso: "Organizador de Eventos",                                                  ch: "180",  status: "Ativo",   observacao: "" },
  { id: "ce-45",  ano: "2025", eixo: "Hospitalidade",                            unidade: "Jessé Freire",    curso: "Camareiro(a) em Meios de Hospedagem",                                     ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-46",  ano: "2025", eixo: "Hospitalidade",                            unidade: "Jessé Freire",    curso: "Recepcionista de Eventos",                                                ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-47",  ano: "2025", eixo: "Hospitalidade",                            unidade: "Jessé Freire",    curso: "Inglês e Espanhol para Camareiras",                                       ch: "",     status: "Inativo", observacao: "" },
  // ── Comunicação e Audiovisual ──
  { id: "ce-48",  ano: "2025", eixo: "Comunicação e Audiovisual",                unidade: "Taguatinga",      curso: "Estratégias de Captação de Recursos para Projetos Culturais",             ch: "28",   status: "Ativo",   observacao: "" },
  { id: "ce-49",  ano: "2025", eixo: "Comunicação e Audiovisual",                unidade: "Taguatinga",      curso: "Técnico em Publicidade",                                                  ch: "900",  status: "Ativo",   observacao: "" },
  { id: "ce-50",  ano: "2025", eixo: "Comunicação e Audiovisual",                unidade: "Taguatinga",      curso: "Técnico em Produção Cultural",                                            ch: "800",  status: "Ativo",   observacao: "" },
  { id: "ce-51",  ano: "2025", eixo: "Comunicação e Audiovisual",                unidade: "Taguatinga",      curso: "Técnico em Processos Fotográficos",                                       ch: "800",  status: "Ativo",   observacao: "" },
  { id: "ce-52",  ano: "2025", eixo: "Comunicação e Audiovisual",                unidade: "Taguatinga",      curso: "Técnico em Produção de Áudio e Vídeo",                                    ch: "1200", status: "Ativo",   observacao: "" },
  { id: "ce-53",  ano: "2025", eixo: "Comunicação e Audiovisual",                unidade: "Taguatinga",      curso: "Administrador de Banco de Dados",                                         ch: "200",  status: "Ativo",   observacao: "" },
  { id: "ce-54",  ano: "2025", eixo: "Comunicação e Audiovisual",                unidade: "Taguatinga",      curso: "Copywriting: Redação Web para Marketing e Vendas",                        ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-55",  ano: "2025", eixo: "Comunicação e Audiovisual",                unidade: "Taguatinga",      curso: "Produção de Vídeo para Internet",                                         ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-56",  ano: "2025", eixo: "Comunicação e Audiovisual",                unidade: "Taguatinga",      curso: "Fotógrafo",                                                               ch: "",     status: "Inativo", observacao: "" },
  // ── Tecnologia da Informação - Suporte ──
  { id: "ce-57",  ano: "2025", eixo: "Tecnologia da Informação - Suporte",       unidade: "Taguatinga",      curso: "Administrador de Redes",                                                  ch: "200",  status: "Ativo",   observacao: "" },
  { id: "ce-58",  ano: "2025", eixo: "Tecnologia da Informação - Suporte",       unidade: "Taguatinga",      curso: "Assistente de Tecnologias da Informação",                                 ch: "200",  status: "Ativo",   observacao: "" },
  { id: "ce-59",  ano: "2025", eixo: "Tecnologia da Informação - Suporte",       unidade: "Taguatinga",      curso: "Informática Básica",                                                      ch: "20",   status: "Ativo",   observacao: "" },
  { id: "ce-60",  ano: "2025", eixo: "Tecnologia da Informação - Suporte",       unidade: "Taguatinga",      curso: "Informática Windows e Office Fundamental",                                ch: "100",  status: "Ativo",   observacao: "" },
  { id: "ce-61",  ano: "2025", eixo: "Tecnologia da Informação - Suporte",       unidade: "Taguatinga",      curso: "Planejar e Implementar a Segurança Física e Lógica em Redes de Computadores", ch: "72", status: "Ativo",   observacao: "" },
  { id: "ce-62",  ano: "2025", eixo: "Tecnologia da Informação - Suporte",       unidade: "Taguatinga",      curso: "Técnicas Avançadas de Word, Excel e PowerPoint",                          ch: "60",   status: "Ativo",   observacao: "" },
  { id: "ce-63",  ano: "2025", eixo: "Tecnologia da Informação - Suporte",       unidade: "Taguatinga",      curso: "Técnico em Segurança Cibernética",                                        ch: "1000", status: "Ativo",   observacao: "" },
  { id: "ce-64",  ano: "2025", eixo: "Tecnologia da Informação - Suporte",       unidade: "Taguatinga",      curso: "Microsoft Power BI - Básico",                                             ch: "20",   status: "Ativo",   observacao: "" },
  { id: "ce-65",  ano: "2025", eixo: "Tecnologia da Informação - Suporte",       unidade: "Taguatinga",      curso: "Microsoft Power BI - Avançado",                                           ch: "20",   status: "Ativo",   observacao: "" },
  { id: "ce-66",  ano: "2025", eixo: "Tecnologia da Informação - Suporte",       unidade: "Taguatinga",      curso: "Excel com VBA e Dashboard",                                               ch: "60",   status: "Ativo",   observacao: "" },
  { id: "ce-67",  ano: "2025", eixo: "Tecnologia da Informação - Suporte",       unidade: "Taguatinga",      curso: "Informática para Melhor Idade – Comercial",                               ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-68",  ano: "2025", eixo: "Tecnologia da Informação - Suporte",       unidade: "Taguatinga",      curso: "Proteção de Dados em Segurança de Redes",                                 ch: "",     status: "Inativo", observacao: "" },
  // ── Tecnologia da Informação - Games ──
  { id: "ce-69",  ano: "2025", eixo: "Tecnologia da Informação - Games",         unidade: "Taguatinga",      curso: "Técnico em Programação de Jogos Digitais",                                ch: "1000", status: "Inativo", observacao: "Turma cancelada." },
  // ── Tecnologia da Informação - Inovação ──
  { id: "ce-70",  ano: "2025", eixo: "Tecnologia da Informação - Inovação",      unidade: "Taguatinga",      curso: "ChatGPT na Prática",                                                      ch: "36",   status: "Ativo",   observacao: "" },
  { id: "ce-71",  ano: "2025", eixo: "Tecnologia da Informação - Inovação",      unidade: "Taguatinga",      curso: "Inteligência Artificial - Como Fazer a Pergunta Correta",                 ch: "20",   status: "Ativo",   observacao: "" },
  { id: "ce-72",  ano: "2025", eixo: "Tecnologia da Informação - Inovação",      unidade: "Taguatinga",      curso: "Técnico em Inteligência Artificial",                                      ch: "1200", status: "Ativo",   observacao: "" },
  { id: "ce-73",  ano: "2025", eixo: "Tecnologia da Informação - Inovação",      unidade: "Taguatinga",      curso: "Técnico em Ciências de Dados",                                            ch: "1000", status: "Ativo",   observacao: "" },
  { id: "ce-74",  ano: "2025", eixo: "Tecnologia da Informação - Inovação",      unidade: "Taguatinga",      curso: "Cloud Computing",                                                         ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-75",  ano: "2025", eixo: "Tecnologia da Informação - Inovação",      unidade: "Taguatinga",      curso: "Python",                                                                  ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-76",  ano: "2025", eixo: "Tecnologia da Informação - Inovação",      unidade: "Taguatinga",      curso: "Web Designer",                                                            ch: "",     status: "Inativo", observacao: "" },
  // ── Tecnologia da Informação - Desenvolvimento ──
  { id: "ce-77",  ano: "2025", eixo: "Tecnologia da Informação - Desenvolvimento", unidade: "Taguatinga",    curso: "Construção de Websites com PHP e MySQL",                                  ch: "60",   status: "Ativo",   observacao: "" },
  { id: "ce-78",  ano: "2025", eixo: "Tecnologia da Informação - Desenvolvimento", unidade: "Taguatinga",    curso: "Desenvolvedor Front-End",                                                 ch: "264",  status: "Ativo",   observacao: "" },
  { id: "ce-79",  ano: "2025", eixo: "Tecnologia da Informação - Desenvolvimento", unidade: "Taguatinga",    curso: "Lógica de Programação",                                                   ch: "40",   status: "Ativo",   observacao: "" },
  { id: "ce-80",  ano: "2025", eixo: "Tecnologia da Informação - Desenvolvimento", unidade: "Taguatinga",    curso: "Programador de Sistemas",                                                 ch: "200",  status: "Ativo",   observacao: "" },
  { id: "ce-81",  ano: "2025", eixo: "Tecnologia da Informação - Desenvolvimento", unidade: "Taguatinga",    curso: "Técnico em Desenvolvimento de Sistemas",                                  ch: "1200", status: "Ativo",   observacao: "" },
  { id: "ce-82",  ano: "2025", eixo: "Tecnologia da Informação - Desenvolvimento", unidade: "Taguatinga",    curso: "Desenvolvedor Back-End",                                                  ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-83",  ano: "2025", eixo: "Tecnologia da Informação - Desenvolvimento", unidade: "Taguatinga",    curso: "Programador Web",                                                         ch: "",     status: "Inativo", observacao: "" },
  // ── Gestão e Comércio ──
  { id: "ce-84",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Assistente Administrativo",                                               ch: "160",  status: "Ativo",   observacao: "" },
  { id: "ce-85",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Assistente de Recursos Humanos",                                          ch: "160",  status: "Ativo",   observacao: "" },
  { id: "ce-86",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Porteiro e Vigia",                                                        ch: "160",  status: "Ativo",   observacao: "" },
  { id: "ce-87",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Qualidade no Atendimento",                                                ch: "16",   status: "Ativo",   observacao: "" },
  { id: "ce-88",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Recepcionista",                                                           ch: "160",  status: "Ativo",   observacao: "" },
  { id: "ce-89",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Técnicas de Liderança",                                                   ch: "40",   status: "Ativo",   observacao: "" },
  { id: "ce-90",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Técnico em Administração",                                                ch: "800",  status: "Ativo",   observacao: "" },
  { id: "ce-91",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Técnico em Contabilidade",                                                ch: "800",  status: "Ativo",   observacao: "" },
  { id: "ce-92",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Técnico em Finanças",                                                     ch: "800",  status: "Ativo",   observacao: "" },
  { id: "ce-93",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Técnico em Logística",                                                    ch: "800",  status: "Ativo",   observacao: "" },
  { id: "ce-94",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Técnico em Recursos Humanos",                                             ch: "800",  status: "Ativo",   observacao: "" },
  { id: "ce-95",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Técnico em Secretariado",                                                 ch: "800",  status: "Ativo",   observacao: "" },
  { id: "ce-96",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Administração de Contas a Pagar, Contas a Receber e Tesouraria",          ch: "24",   status: "Ativo",   observacao: "" },
  { id: "ce-97",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Recrutamento e Seleção",                                                  ch: "40",   status: "Ativo",   observacao: "" },
  { id: "ce-98",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Assistente de Faturamento",                                               ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-99",  ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Compras e Estoque",                                                       ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-100", ano: "2025", eixo: "Gestão e Comércio",                        unidade: "Ceilândia",       curso: "Técnico em Transações Imobiliárias",                                      ch: "800",  status: "Inativo", observacao: "" },
  // ── Educação ──
  { id: "ce-101", ano: "2025", eixo: "Educação",                                 unidade: "Ceilândia",       curso: "Educação Financeira",                                                     ch: "20",   status: "Ativo",   observacao: "" },
  { id: "ce-102", ano: "2025", eixo: "Educação",                                 unidade: "Ceilândia",       curso: "Libras",                                                                  ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-103", ano: "2025", eixo: "Educação",                                 unidade: "Ceilândia",       curso: "Atualização em Língua Portuguesa",                                        ch: "",     status: "Inativo", observacao: "" },
  // ── Vendas e Marketing ──
  { id: "ce-104", ano: "2025", eixo: "Vendas e Marketing",                       unidade: "Ceilândia",       curso: "Assistente de Marketing e Vendas",                                        ch: "160",  status: "Ativo",   observacao: "" },
  { id: "ce-105", ano: "2025", eixo: "Vendas e Marketing",                       unidade: "Ceilândia",       curso: "Excelência em Atendimento e Vendas",                                      ch: "40",   status: "Ativo",   observacao: "" },
  { id: "ce-106", ano: "2025", eixo: "Vendas e Marketing",                       unidade: "Ceilândia",       curso: "Gestão de Redes Sociais e Criação de Conteúdo Digital",                   ch: "80",   status: "Ativo",   observacao: "" },
  { id: "ce-107", ano: "2025", eixo: "Vendas e Marketing",                       unidade: "Ceilândia",       curso: "Ferramentas de Marketing Digital",                                        ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-108", ano: "2025", eixo: "Vendas e Marketing",                       unidade: "Ceilândia",       curso: "Técnico em Marketing",                                                    ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-109", ano: "2025", eixo: "Vendas e Marketing",                       unidade: "Ceilândia",       curso: "Tráfego Pago",                                                            ch: "",     status: "Inativo", observacao: "" },
  // ── Moda e Costura ──
  { id: "ce-110", ano: "2025", eixo: "Moda e Costura",                           unidade: "Joaquim Loiola",  curso: "Ajustes e Reformas do Vestuário",                                         ch: "40",   status: "Ativo",   observacao: "" },
  { id: "ce-111", ano: "2025", eixo: "Moda e Costura",                           unidade: "Joaquim Loiola",  curso: "Aperfeiçoamento em Corte e Costura",                                      ch: "60",   status: "Ativo",   observacao: "" },
  { id: "ce-112", ano: "2025", eixo: "Moda e Costura",                           unidade: "Joaquim Loiola",  curso: "Costura Criativa",                                                        ch: "80",   status: "Ativo",   observacao: "" },
  { id: "ce-113", ano: "2025", eixo: "Moda e Costura",                           unidade: "Joaquim Loiola",  curso: "Costureiro",                                                              ch: "212",  status: "Ativo",   observacao: "" },
  { id: "ce-114", ano: "2025", eixo: "Moda e Costura",                           unidade: "Joaquim Loiola",  curso: "Moda Pet",                                                                ch: "40",   status: "Ativo",   observacao: "" },
  { id: "ce-115", ano: "2025", eixo: "Moda e Costura",                           unidade: "Joaquim Loiola",  curso: "Modelagem de Alfaiataria Feminina",                                       ch: "100",  status: "Ativo",   observacao: "" },
  { id: "ce-116", ano: "2025", eixo: "Moda e Costura",                           unidade: "Joaquim Loiola",  curso: "Modelagem para Corset",                                                   ch: "100",  status: "Ativo",   observacao: "" },
  { id: "ce-117", ano: "2025", eixo: "Moda e Costura",                           unidade: "Joaquim Loiola",  curso: "Modelista",                                                               ch: "210",  status: "Ativo",   observacao: "" },
  { id: "ce-118", ano: "2025", eixo: "Moda e Costura",                           unidade: "Joaquim Loiola",  curso: "Análise de Coloração Pessoal",                                            ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-119", ano: "2025", eixo: "Moda e Costura",                           unidade: "Joaquim Loiola",  curso: "Desenho de Moda Digital",                                                 ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-120", ano: "2025", eixo: "Moda e Costura",                           unidade: "Joaquim Loiola",  curso: "Estilista de Moda",                                                       ch: "",     status: "Inativo", observacao: "" },
  // ── Beleza e Cuidado Pessoal ──
  { id: "ce-121", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Alongamento de Unhas",                                                    ch: "60",   status: "Ativo",   observacao: "" },
  { id: "ce-122", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Barbeiro",                                                                ch: "172",  status: "Ativo",   observacao: "" },
  { id: "ce-123", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Cabeleireiro",                                                            ch: "400",  status: "Ativo",   observacao: "" },
  { id: "ce-124", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Colorimetria Avançada Aplicada a Cabeleireiros e Barbeiros",              ch: "100",  status: "Ativo",   observacao: "" },
  { id: "ce-125", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Colorimetria Capilar: Noções Básicas",                                    ch: "40",   status: "Ativo",   observacao: "" },
  { id: "ce-126", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Depilador",                                                               ch: "160",  status: "Ativo",   observacao: "" },
  { id: "ce-127", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Design de Sobrancelhas",                                                  ch: "60",   status: "Ativo",   observacao: "" },
  { id: "ce-128", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Manicure e Pedicure",                                                     ch: "160",  status: "Ativo",   observacao: "" },
  { id: "ce-129", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Maquiador",                                                               ch: "160",  status: "Ativo",   observacao: "" },
  { id: "ce-130", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Maquiagem Profissional Avançada",                                         ch: "60",   status: "Ativo",   observacao: "" },
  { id: "ce-131", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Microblading Fio a Fio",                                                  ch: "60",   status: "Ativo",   observacao: "" },
  { id: "ce-132", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Micropigmentação",                                                        ch: "80",   status: "Ativo",   observacao: "" },
  { id: "ce-133", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Práticas de Trabalho do Cabeleireiro",                                    ch: "100",  status: "Ativo",   observacao: "" },
  { id: "ce-134", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Técnicas de Barbeiro",                                                    ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-135", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Tratamento Capilar",                                                      ch: "40",   status: "Ativo",   observacao: "" },
  { id: "ce-136", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Vivências Práticas em Salão de Beleza",                                   ch: "200",  status: "Ativo",   observacao: "" },
  { id: "ce-137", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "A arte de fazer mechas",                                                  ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-138", ano: "2025", eixo: "Beleza e Cuidado Pessoal",                 unidade: "Talal Abu-Allan", curso: "Beleza de Milhões",                                                       ch: "",     status: "Inativo", observacao: "" },
  // ── Estética e Massoterapia ──
  { id: "ce-139", ano: "2025", eixo: "Estética e Massoterapia",                  unidade: "Talal Abu-Allan", curso: "Técnico em Podologia",                                                    ch: "1200", status: "Ativo",   observacao: "" },
  { id: "ce-140", ano: "2025", eixo: "Estética e Massoterapia",                  unidade: "Talal Abu-Allan", curso: "Técnico em Massoterapia",                                                 ch: "1200", status: "Ativo",   observacao: "" },
  { id: "ce-141", ano: "2025", eixo: "Estética e Massoterapia",                  unidade: "Talal Abu-Allan", curso: "Massagem Modeladora",                                                     ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-142", ano: "2025", eixo: "Estética e Massoterapia",                  unidade: "Talal Abu-Allan", curso: "Massagem Relaxante",                                                      ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-143", ano: "2025", eixo: "Estética e Massoterapia",                  unidade: "Talal Abu-Allan", curso: "Drenagem Linfática Manual",                                               ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-144", ano: "2025", eixo: "Estética e Massoterapia",                  unidade: "Talal Abu-Allan", curso: "Atendimento ao pé diabético",                                             ch: "",     status: "Inativo", observacao: "" },
  // ── Enfermagem ──
  { id: "ce-145", ano: "2025", eixo: "Enfermagem",                               unidade: "Miguel Setembrino", curso: "Atualização em Procedimentos Técnicos aos Profissionais de Enfermagem", ch: "200",  status: "Ativo",   observacao: "" },
  { id: "ce-146", ano: "2025", eixo: "Enfermagem",                               unidade: "Miguel Setembrino", curso: "Cuidador de Idoso",                                                     ch: "160",  status: "Ativo",   observacao: "" },
  { id: "ce-147", ano: "2025", eixo: "Enfermagem",                               unidade: "Miguel Setembrino", curso: "Especialização em Enfermagem em Saúde Mental",                          ch: "300",  status: "Ativo",   observacao: "" },
  { id: "ce-148", ano: "2025", eixo: "Enfermagem",                               unidade: "Miguel Setembrino", curso: "Especialização Técnica em Enfermagem do Trabalho",                      ch: "340",  status: "Ativo",   observacao: "" },
  { id: "ce-149", ano: "2025", eixo: "Enfermagem",                               unidade: "Miguel Setembrino", curso: "Especialização Técnica em Instrumentação Cirúrgica",                    ch: "360",  status: "Ativo",   observacao: "" },
  { id: "ce-150", ano: "2025", eixo: "Enfermagem",                               unidade: "Miguel Setembrino", curso: "Procedimentos Básicos de Enfermagem e Protocolos de Aplicabilidade na Prática Clínica", ch: "200", status: "Ativo", observacao: "" },
  { id: "ce-151", ano: "2025", eixo: "Enfermagem",                               unidade: "Miguel Setembrino", curso: "Técnico em Enfermagem",                                                 ch: "1800", status: "Ativo",   observacao: "" },
  { id: "ce-152", ano: "2025", eixo: "Enfermagem",                               unidade: "Miguel Setembrino", curso: "Doula",                                                                 ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-153", ano: "2025", eixo: "Enfermagem",                               unidade: "Miguel Setembrino", curso: "Cuidador Infantil",                                                     ch: "",     status: "Inativo", observacao: "" },
  // ── Saúde Bucal ──
  { id: "ce-154", ano: "2025", eixo: "Saúde Bucal",                              unidade: "Miguel Setembrino", curso: "Técnico em Saúde Bucal",                                                ch: "",     status: "Inativo", observacao: "" },
  // ── Nutrição ──
  { id: "ce-155", ano: "2025", eixo: "Nutrição",                                 unidade: "Santa Maria",     curso: "Técnico em Nutrição e Dietética",                                         ch: "1200", status: "Ativo",   observacao: "" },
  { id: "ce-156", ano: "2025", eixo: "Nutrição",                                 unidade: "Santa Maria",     curso: "Alimentação Seletiva",                                                    ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-157", ano: "2025", eixo: "Nutrição",                                 unidade: "Santa Maria",     curso: "Copeiro Hospitalar",                                                      ch: "",     status: "Inativo", observacao: "" },
  // ── Análises Clínicas ──
  { id: "ce-158", ano: "2025", eixo: "Análises Clínicas",                        unidade: "Santa Maria",     curso: "Noções de Interpretação Clínica de Exames Laboratoriais",                 ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-159", ano: "2025", eixo: "Análises Clínicas",                        unidade: "Santa Maria",     curso: "Técnico em Análises Clínicas",                                            ch: "",     status: "Inativo", observacao: "" },
  // ── Farmácia ──
  { id: "ce-160", ano: "2025", eixo: "Farmácia",                                 unidade: "Santa Maria",     curso: "Atendente de Farmácia",                                                   ch: "240",  status: "Ativo",   observacao: "" },
  { id: "ce-161", ano: "2025", eixo: "Farmácia",                                 unidade: "Santa Maria",     curso: "Aprendizagem Profissional de Qualificação em Serviços de Farmácias e Drogarias", ch: "", status: "Inativo", observacao: "" },
  { id: "ce-162", ano: "2025", eixo: "Farmácia",                                 unidade: "Santa Maria",     curso: "Cálculos Utilizados na Dispensação",                                      ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-163", ano: "2025", eixo: "Farmácia",                                 unidade: "Santa Maria",     curso: "Técnico em Farmácia",                                                     ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-164", ano: "2025", eixo: "Farmácia",                                 unidade: "Santa Maria",     curso: "Noções de Farmacologia",                                                  ch: "",     status: "Inativo", observacao: "" },
  // ── Segurança e NRs ──
  { id: "ce-165", ano: "2025", eixo: "Segurança e NRs",                          unidade: "Gama",            curso: "Técnico em Segurança do Trabalho",                                        ch: "1200", status: "Ativo",   observacao: "" },
  { id: "ce-166", ano: "2025", eixo: "Segurança e NRs",                          unidade: "Gama",            curso: "NR 10",                                                                   ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-167", ano: "2025", eixo: "Segurança e NRs",                          unidade: "Gama",            curso: "NR 20",                                                                   ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-168", ano: "2025", eixo: "Segurança e NRs",                          unidade: "Gama",            curso: "NR 23",                                                                   ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-169", ano: "2025", eixo: "Segurança e NRs",                          unidade: "Gama",            curso: "NR 35",                                                                   ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-170", ano: "2025", eixo: "Segurança e NRs",                          unidade: "Gama",            curso: "NR 5",                                                                    ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-171", ano: "2025", eixo: "Segurança e NRs",                          unidade: "Gama",            curso: "NR 9",                                                                    ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-172", ano: "2025", eixo: "Segurança e NRs",                          unidade: "Gama",            curso: "Técnico em Prevenção e Combate a Incêndio",                               ch: "",     status: "Inativo", observacao: "" },
  // ── Administrativo / Serviços em Saúde ──
  { id: "ce-173", ano: "2025", eixo: "Administrativo / Serviços em Saúde",       unidade: "CPED",            curso: "Agente Comunitário",                                                      ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-174", ano: "2025", eixo: "Administrativo / Serviços em Saúde",       unidade: "CPED",            curso: "Análise em Faturamento Hospitalar",                                       ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-175", ano: "2025", eixo: "Administrativo / Serviços em Saúde",       unidade: "CPED",            curso: "Aprendizagem Profissional de Qualificação em Serviços em Saúde",          ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-176", ano: "2025", eixo: "Administrativo / Serviços em Saúde",       unidade: "CPED",            curso: "Atendimento em Pet Shop",                                                  ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-177", ano: "2025", eixo: "Administrativo / Serviços em Saúde",       unidade: "CPED",            curso: "Recursos de Glosas em Saúde",                                             ch: "",     status: "Inativo", observacao: "" },
  { id: "ce-178", ano: "2025", eixo: "Administrativo / Serviços em Saúde",       unidade: "CPED",            curso: "Vendedor de Serviços e Produtos Ópticos",                                 ch: "",     status: "Inativo", observacao: "" },
];

export function getStoredCursosEixo(): CursoEixoRecord[] {
  try {
    if (!localStorage.getItem(CURSOS_EIXO_VERSION)) {
      localStorage.setItem(CURSOS_EIXO_KEY, JSON.stringify(SEED_CURSOS_EIXO));
      localStorage.setItem(CURSOS_EIXO_VERSION, "1");
    }
    return JSON.parse(localStorage.getItem(CURSOS_EIXO_KEY) || "[]");
  } catch { return SEED_CURSOS_EIXO; }
}

export function saveCursoEixo(data: Omit<CursoEixoRecord, "id">) {
  const all = getStoredCursosEixo();
  all.push({ ...data, id: crypto.randomUUID() });
  localStorage.setItem(CURSOS_EIXO_KEY, JSON.stringify(all));
}

export function updateCursoEixo(id: string, data: Partial<CursoEixoRecord>) {
  const all = getStoredCursosEixo();
  const idx = all.findIndex(c => c.id === id);
  if (idx !== -1) { all[idx] = { ...all[idx], ...data }; localStorage.setItem(CURSOS_EIXO_KEY, JSON.stringify(all)); }
}

export function deleteCursoEixo(id: string) {
  localStorage.setItem(CURSOS_EIXO_KEY, JSON.stringify(getStoredCursosEixo().filter(c => c.id !== id)));
}

// ── REGISTROS ESTÁTICOS REMOVIDOS (plano metas, valores pca, cursos eixo) ─────

function makeStaticDeletedStore(key: string) {
  const get = (): Set<string> => {
    try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); } catch { return new Set(); }
  };
  const mark = (id: string) => {
    const s = get(); s.add(id); localStorage.setItem(key, JSON.stringify([...s]));
  };
  return { get, mark };
}

// ── AÇÕES EXTENSIVAS ──────────────────────────────────────────────────────────

export interface AcaoExtensivaRecord {
  id: string;
  ano: string;
  titulo: string;
  eixo: string;
  unidade: string;
  cargaHoraria: string;
  data: string;
  processoSEI: string;
  status: string;
  observacao: string;
}

const ACOES_KEY = "sgp_acoes_extensivas";
const ACOES_VERSION = "sgp_acoes_v1";

const SEED_ACOES: AcaoExtensivaRecord[] = [
  { id: "ae-2025-1",  ano: "2025", titulo: "Oficina de Culinária Sustentável",              eixo: "Gastronomia",                    unidade: "Jessé Freire",                   cargaHoraria: "8",  data: "2025-03-15", processoSEI: "2025.000000512-44", status: "Realizada",   observacao: "Realizada com 32 participantes externos." },
  { id: "ae-2025-2",  ano: "2025", titulo: "Semana da Tecnologia — Palestras e Demos",      eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",                     cargaHoraria: "16", data: "2025-04-08", processoSEI: "2025.000000731-18", status: "Realizada",   observacao: "Parceria com escola pública local." },
  { id: "ae-2025-3",  ano: "2025", titulo: "Café com Empreendedores",                       eixo: "Gestão e Negócios",              unidade: "Ceilândia",                      cargaHoraria: "4",  data: "2025-04-22", processoSEI: "2025.000000819-37", status: "Realizada",   observacao: "30 participantes. Feedback positivo." },
  { id: "ae-2025-4",  ano: "2025", titulo: "Jornada de Beleza e Estética",                  eixo: "Beleza e Cuidado Pessoal",       unidade: "Talal Abu-Allan",                cargaHoraria: "12", data: "2025-05-10", processoSEI: "2025.000001044-62", status: "Realizada",   observacao: "Evento aberto à comunidade." },
  { id: "ae-2025-5",  ano: "2025", titulo: "Oficina de Primeiros Socorros",                 eixo: "Ambiente e Saúde",               unidade: "Miguel Setembrino — Saúde",      cargaHoraria: "8",  data: "2025-05-20", processoSEI: "2025.000001187-55", status: "Realizada",   observacao: "Gratuita para comunidade." },
  { id: "ae-2025-6",  ano: "2025", titulo: "Desfile de Moda Sustentável",                   eixo: "Gestão e Moda",                  unidade: "Sobradinho",                     cargaHoraria: "6",  data: "2025-06-05", processoSEI: "2025.000001315-29", status: "Planejada",   observacao: "Aguardando confirmação de data." },
  { id: "ae-2025-7",  ano: "2025", titulo: "Hackathon: Soluções para o Varejo",             eixo: "Tecnologia e Economia Criativa", unidade: "Jessé Freire",                   cargaHoraria: "24", data: "2025-06-20", processoSEI: "2025.000001402-77", status: "Planejada",   observacao: "Parceria com Câmara do Comércio-DF." },
  { id: "ae-2025-8",  ano: "2025", titulo: "Tarde de Gastronomia Regional",                 eixo: "Gastronomia",                    unidade: "Miguel Setembrino — Gastronomia",cargaHoraria: "6",  data: "2025-07-12", processoSEI: "",                  status: "Em análise",  observacao: "Processo SEI em abertura." },
  { id: "ae-2025-9",  ano: "2025", titulo: "Palestra: Tendências em TI 2025",               eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",                     cargaHoraria: "4",  data: "2025-08-05", processoSEI: "",                  status: "Em análise",  observacao: "Aguardando aprovação da coordenação." },
  { id: "ae-2025-10", ano: "2025", titulo: "Oficina de Fotografia para Redes Sociais",      eixo: "Gestão e Negócios",              unidade: "Gama",                           cargaHoraria: "8",  data: "2025-09-18", processoSEI: "",                  status: "Cancelada",   observacao: "Cancelada por falta de quórum mínimo." },
  { id: "ae-2026-1",  ano: "2026", titulo: "Maratona de Programação — SENAC DF",            eixo: "Tecnologia e Economia Criativa", unidade: "Taguatinga",                     cargaHoraria: "20", data: "2026-02-14", processoSEI: "2026.000000411-30", status: "Realizada",   observacao: "60 participantes. Premiação para top 3." },
  { id: "ae-2026-2",  ano: "2026", titulo: "Semana da Saúde e Bem-Estar",                   eixo: "Ambiente e Saúde",               unidade: "Jo Rufino e Carlos Aguiar",      cargaHoraria: "16", data: "2026-03-08", processoSEI: "2026.000000523-91", status: "Realizada",   observacao: "Evento comemorativo ao Dia da Mulher." },
  { id: "ae-2026-3",  ano: "2026", titulo: "Festival Gastronômico SENAC",                   eixo: "Gastronomia",                    unidade: "Jessé Freire",                   cargaHoraria: "10", data: "2026-04-05", processoSEI: "2026.000000688-14", status: "Planejada",   observacao: "Público estimado: 200 pessoas." },
  { id: "ae-2026-4",  ano: "2026", titulo: "Palestra: IA no Mundo do Trabalho",             eixo: "Gestão e Negócios",              unidade: "Ceilândia",                      cargaHoraria: "4",  data: "2026-04-22", processoSEI: "2026.000000741-55", status: "Planejada",   observacao: "Parceria com empresa de tecnologia." },
  { id: "ae-2026-5",  ano: "2026", titulo: "Oficina de Empreendedorismo Feminino",          eixo: "Gestão e Negócios",              unidade: "Santa Maria",                    cargaHoraria: "8",  data: "2026-05-10", processoSEI: "",                  status: "Em análise",  observacao: "Processo em elaboração." },
  { id: "ae-2026-6",  ano: "2026", titulo: "Mostra de Moda — Criações dos Alunos",          eixo: "Gestão e Moda",                  unidade: "Joaquim Loiola",                 cargaHoraria: "6",  data: "2026-05-25", processoSEI: "",                  status: "Em análise",  observacao: "Aguardando local confirmado." },
  { id: "ae-2026-7",  ano: "2026", titulo: "Workshop de Marketing Digital",                 eixo: "Gestão e Negócios",              unidade: "Taguatinga",                     cargaHoraria: "12", data: "2026-06-15", processoSEI: "",                  status: "Em análise",  observacao: "" },
];

export function getStoredAcoes(): AcaoExtensivaRecord[] {
  try {
    if (!localStorage.getItem(ACOES_VERSION)) {
      localStorage.removeItem(ACOES_KEY);
      localStorage.setItem(ACOES_KEY, JSON.stringify(SEED_ACOES));
      localStorage.setItem(ACOES_VERSION, "1");
    }
    return JSON.parse(localStorage.getItem(ACOES_KEY) || "[]");
  } catch { return SEED_ACOES; }
}

export function saveAcao(data: Omit<AcaoExtensivaRecord, "id">) {
  const all = getStoredAcoes();
  all.push({ ...data, id: crypto.randomUUID() });
  localStorage.setItem(ACOES_KEY, JSON.stringify(all));
}

export function updateAcao(id: string, data: Partial<AcaoExtensivaRecord>) {
  const all = getStoredAcoes();
  const idx = all.findIndex(a => a.id === id);
  if (idx !== -1) { all[idx] = { ...all[idx], ...data }; localStorage.setItem(ACOES_KEY, JSON.stringify(all)); }
}

export function deleteAcao(id: string) {
  localStorage.setItem(ACOES_KEY, JSON.stringify(getStoredAcoes().filter(a => a.id !== id)));
}

// ── EVENTOS ───────────────────────────────────────────────────────────────────

export interface EventoRecord {
  id: string;
  ano: string;
  nome: string;
  data: string;
  unidade: string;
  eixo: string;
  qtdPessoas: string;
  equipe: string;
  possuiAcaoExtensiva: boolean;
  acaoExtensivaVinculada: string;
  status: string;
  observacao: string;
}

const EVENTOS_KEY = "sgp_eventos";
const EVENTOS_VERSION = "sgp_eventos_v1";

const SEED_EVENTOS: EventoRecord[] = [
  { id: "ev-2025-1",  ano: "2025", nome: "Semana de Gastronomia SENAC DF",               data: "2025-03-22", unidade: "Jessé Freire",                    eixo: "Gastronomia",                    qtdPessoas: "120", equipe: "Ana Lima, Carlos Souza",             possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Tarde de Gastronomia Regional",         status: "Realizado",   observacao: "Evento anual com grande público externo." },
  { id: "ev-2025-2",  ano: "2025", nome: "Feira de Tecnologia e Inovação",                data: "2025-04-10", unidade: "Taguatinga",                      eixo: "Tecnologia e Economia Criativa", qtdPessoas: "200", equipe: "Patrícia Fonseca, João Melo",       possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Semana da Tecnologia — Palestras e Demos", status: "Realizado",   observacao: "Parceria com escola estadual e empresas de TI." },
  { id: "ev-2025-3",  ano: "2025", nome: "Dia do Empreendedor SENAC",                     data: "2025-04-25", unidade: "Ceilândia",                       eixo: "Gestão e Negócios",              qtdPessoas: "80",  equipe: "Fernanda Rocha",                     possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Café com Empreendedores",               status: "Realizado",   observacao: "Mesa-redonda com empreendedores locais." },
  { id: "ev-2025-4",  ano: "2025", nome: "Mostra de Beleza e Estética",                   data: "2025-05-12", unidade: "Talal Abu-Allan",                 eixo: "Beleza e Cuidado Pessoal",       qtdPessoas: "60",  equipe: "Renata Torres, Bianca Alves",        possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Jornada de Beleza e Estética",          status: "Realizado",   observacao: "Demonstrações ao vivo de técnicas de beleza." },
  { id: "ev-2025-5",  ano: "2025", nome: "1º Seminário de Saúde e Bem-Estar",             data: "2025-05-22", unidade: "Miguel Setembrino — Saúde",       eixo: "Ambiente e Saúde",               qtdPessoas: "90",  equipe: "Dr. Marcos Vieira, Luciana Neves",   possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Oficina de Primeiros Socorros",         status: "Realizado",   observacao: "Palestrantes convidados da área hospitalar." },
  { id: "ev-2025-6",  ano: "2025", nome: "Desfile de Moda Sustentável 2025",              data: "2025-06-07", unidade: "Sobradinho",                      eixo: "Gestão e Moda",                  qtdPessoas: "150", equipe: "Silvia Campos, Theo Assis",          possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Desfile de Moda Sustentável",           status: "Planejado",   observacao: "Local: auditório do campus. Divulgação em andamento." },
  { id: "ev-2025-7",  ano: "2025", nome: "Hackathon de Varejo SENAC",                     data: "2025-06-22", unidade: "Jessé Freire",                    eixo: "Tecnologia e Economia Criativa", qtdPessoas: "70",  equipe: "Bruno Tech, Aline Dev",              possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Hackathon: Soluções para o Varejo",     status: "Planejado",   observacao: "3 equipes finalistas terão mentoria pós-evento." },
  { id: "ev-2025-8",  ano: "2025", nome: "Colação de Grau — Turmas Técnicas",             data: "2025-07-05", unidade: "Jessé Freire",                    eixo: "Gestão e Negócios",              qtdPessoas: "300", equipe: "Direção, Coordenação Pedagógica",    possuiAcaoExtensiva: false, acaoExtensivaVinculada: "",                                      status: "Planejado",   observacao: "Turmas de 2024/2025." },
  { id: "ev-2025-9",  ano: "2025", nome: "Palestras de Tendências — 2° Semestre",         data: "2025-08-08", unidade: "Taguatinga",                      eixo: "Tecnologia e Economia Criativa", qtdPessoas: "50",  equipe: "Patrícia Fonseca",                   possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Palestra: Tendências em TI 2025",       status: "Em análise",  observacao: "Aguardando confirmação de palestrante externo." },
  { id: "ev-2025-10", ano: "2025", nome: "Workshop de Redes Sociais para PMEs",           data: "2025-09-20", unidade: "Gama",                            eixo: "Gestão e Negócios",              qtdPessoas: "40",  equipe: "Carla Mendes",                       possuiAcaoExtensiva: false, acaoExtensivaVinculada: "",                                      status: "Cancelado",   observacao: "Cancelado por falta de quórum mínimo." },
  { id: "ev-2026-1",  ano: "2026", nome: "Maratona de Código — Edição 2026",              data: "2026-02-15", unidade: "Taguatinga",                      eixo: "Tecnologia e Economia Criativa", qtdPessoas: "80",  equipe: "Bruno Tech, Aline Dev, Tiago Lima",  possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Maratona de Programação — SENAC DF",    status: "Realizado",   observacao: "Premiação para os 3 primeiros colocados." },
  { id: "ev-2026-2",  ano: "2026", nome: "Semana da Mulher — Saúde e Carreira",           data: "2026-03-08", unidade: "Jo Rufino e Carlos Aguiar",       eixo: "Ambiente e Saúde",               qtdPessoas: "110", equipe: "Luciana Neves, Dr.ª Regina Bastos", possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Semana da Saúde e Bem-Estar",           status: "Realizado",   observacao: "Marcado para o Dia Internacional da Mulher." },
  { id: "ev-2026-3",  ano: "2026", nome: "Festival Gastronômico do Cerrado",              data: "2026-04-07", unidade: "Jessé Freire",                    eixo: "Gastronomia",                    qtdPessoas: "250", equipe: "Ana Lima, Chef Paulo Saraiva",       possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Festival Gastronômico SENAC",           status: "Planejado",   observacao: "Haverá praça de alimentação aberta ao público." },
  { id: "ev-2026-4",  ano: "2026", nome: "Conversa sobre IA e o Futuro do Trabalho",     data: "2026-04-24", unidade: "Ceilândia",                       eixo: "Gestão e Negócios",              qtdPessoas: "60",  equipe: "Fernanda Rocha, Tiago Lima",         possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Palestra: IA no Mundo do Trabalho",     status: "Planejado",   observacao: "Painel com convidados do setor privado." },
  { id: "ev-2026-5",  ano: "2026", nome: "Semana do Empreendedorismo Feminino",           data: "2026-05-12", unidade: "Santa Maria",                     eixo: "Gestão e Negócios",              qtdPessoas: "70",  equipe: "Carla Mendes, Beatriz Dutra",        possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Oficina de Empreendedorismo Feminino",  status: "Em análise",  observacao: "Processo SEI em abertura." },
  { id: "ev-2026-6",  ano: "2026", nome: "Mostra de Moda — Coleção Inverno 2026",        data: "2026-05-27", unidade: "Joaquim Loiola",                  eixo: "Gestão e Moda",                  qtdPessoas: "130", equipe: "Silvia Campos",                      possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Mostra de Moda — Criações dos Alunos",  status: "Em análise",  observacao: "Aguardando confirmação do espaço." },
  { id: "ev-2026-7",  ano: "2026", nome: "Workshop Digital — Tarde de Marketing",         data: "2026-06-17", unidade: "Taguatinga",                      eixo: "Gestão e Negócios",              qtdPessoas: "45",  equipe: "Fernanda Rocha",                     possuiAcaoExtensiva: true,  acaoExtensivaVinculada: "Workshop de Marketing Digital",         status: "Em análise",  observacao: "" },
  { id: "ev-2026-8",  ano: "2026", nome: "Colação de Grau — Técnicos 2025/2026",          data: "2026-07-10", unidade: "Jessé Freire",                    eixo: "Gestão e Negócios",              qtdPessoas: "320", equipe: "Direção, Coordenação Pedagógica",    possuiAcaoExtensiva: false, acaoExtensivaVinculada: "",                                      status: "Planejado",   observacao: "Cerimônia formal com familiares." },
];

export function getStoredEventos(): EventoRecord[] {
  try {
    if (!localStorage.getItem(EVENTOS_VERSION)) {
      localStorage.setItem(EVENTOS_KEY, JSON.stringify(SEED_EVENTOS));
      localStorage.setItem(EVENTOS_VERSION, "1");
    }
    return JSON.parse(localStorage.getItem(EVENTOS_KEY) || "[]");
  } catch { return SEED_EVENTOS; }
}

export function saveEvento(data: Omit<EventoRecord, "id">) {
  const all = getStoredEventos();
  all.push({ ...data, id: crypto.randomUUID() });
  localStorage.setItem(EVENTOS_KEY, JSON.stringify(all));
}

export function updateEvento(id: string, data: Partial<EventoRecord>) {
  const all = getStoredEventos();
  const idx = all.findIndex(e => e.id === id);
  if (idx !== -1) { all[idx] = { ...all[idx], ...data }; localStorage.setItem(EVENTOS_KEY, JSON.stringify(all)); }
}

export function deleteEvento(id: string) {
  localStorage.setItem(EVENTOS_KEY, JSON.stringify(getStoredEventos().filter(e => e.id !== id)));
}

export const planoMetasDeleted = makeStaticDeletedStore("sgp_plano_metas_static_deleted");
export const valoresPCADeleted = makeStaticDeletedStore("sgp_valores_pca_static_deleted");
export const cursosEixoDeleted = makeStaticDeletedStore("sgp_cursos_eixo_static_deleted");

// Mapeamento segmento → slug de área
export const segmentoToSlug: Record<string, string> = {
  "Gastronomia": "gastronomia",
  "Bebidas": "gastronomia",
  "Panificação": "gastronomia",
  "Confeitaria": "gastronomia",
  "Turismo": "gastronomia",
  "Hospitalidade": "gastronomia",
  "Design, Paisagismo e Ambientação": "ambiente-saude",
  "Comunicação e Audiovisual": "tecnologia-economia-criativa",
  "Tecnologia da Informação - Suporte": "tecnologia-economia-criativa",
  "Tecnologia da Informação - Games": "tecnologia-economia-criativa",
  "Tecnologia da Informação - Inovação": "tecnologia-economia-criativa",
  "Tecnologia da Informação - Desenvolvimento": "tecnologia-economia-criativa",
  "Gestão e Comércio": "gestao-moda",
  "Educação": "gestao-moda",
  "Vendas e Marketing": "gestao-moda",
  "Moda e Costura": "gestao-moda",
  "Beleza e Cuidado Pessoal": "beleza-cuidado-pessoal",
  "Estética e Massoterapia": "beleza-cuidado-pessoal",
  "Enfermagem": "ambiente-saude",
  "Radiologia": "ambiente-saude",
  "Saúde Bucal": "ambiente-saude",
  "Nutrição": "ambiente-saude",
  "Análises Clínicas": "ambiente-saude",
  "Farmácia": "ambiente-saude",
  "Segurança e NRs": "ambiente-saude",
  "Administrativo / Serviços em Saúde": "ambiente-saude",
  "60+": "60-mais",
  "Ensino Médio": "ensino-medio",
};
