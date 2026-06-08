import { DEFAULT_CEPED_EQUIPE } from "../data/cepedEquipeDefault";

const STORAGE_KEYS = {
  usuarios: "sgp_usuarios",
  planoMetas: "sgp_plano_metas",
  visitas: "sgp_visitas_tecnicas",
  horas: "sgp_horas_pedagogicas",
  valoresPCA: "sgp_valores_pca",
  cursosEixo: "sgp_cursos_eixo",
  acoesExtensivas: "sgp_acoes_extensivas",
  eventos: "sgp_eventos",
  cepedEquipe: "sgp_ceped_equipe",
} as const;

const generateId = () => crypto.randomUUID();

const readStorage = <T>(key: string, fallback: T[]): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
};

const writeStorage = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

/* ─────────────────────────────
   USUÁRIOS
───────────────────────────── */

export interface UsuarioRecord {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  perfil: string;
  status: string;
  senha?: string;
  senhaHash?: string;
  ultimoAcesso?: string;
  unidade?: string;
  area?: string;
  telefone?: string;
}

export function hashSenhaLocal(senha: string) {
  const raw = String(senha ?? "").trim();
  let hash = 2166136261;

  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function normalizarUsuarioAuth(user: UsuarioRecord): UsuarioRecord {
  if (!user.senha && user.senhaHash) return user;

  if (user.senha) {
    const { senha, ...rest } = user;
    return {
      ...rest,
      senhaHash: user.senhaHash || hashSenhaLocal(senha),
    };
  }

  return user;
}

function normalizarUsuariosAuth(users: UsuarioRecord[]): UsuarioRecord[] {
  let changed = false;
  const normalized = users.map((user) => {
    const next = normalizarUsuarioAuth(user);
    if (next !== user) changed = true;
    return next;
  });

  if (changed) writeStorage(STORAGE_KEYS.usuarios, normalized);
  return normalized;
}

const defaultUsuarios: UsuarioRecord[] = [
  {
    id: generateId(),
    nome: "Administrador SGP",
    email: "administrador@df.senac.br",
    cpf: "000.000.000-00",
    perfil: "Administrador",
    status: "Ativo",
    senhaHash: hashSenhaLocal("senac2025"),
    ultimoAcesso: "Hoje",
    unidade: "SENAC DF",
    area: "TI",
    telefone: "",
  },
];

function patchUsuariosAuth(users: UsuarioRecord[]): UsuarioRecord[] {
  let changed = false;
  const patched = users.map((u) => {
    const email = u.email.trim().toLowerCase();
    if (
      (email === "administrador@df.senac.br" || email === "admin@df.senac.br") &&
      !u.senha &&
      !u.senhaHash
    ) {
      changed = true;
      return {
        ...u,
        email: "administrador@df.senac.br",
        senhaHash: hashSenhaLocal("senac2025"),
      };
    }
    return u;
  });
  if (changed) writeStorage(STORAGE_KEYS.usuarios, patched);
  return patched;
}

function ensureDefaultAdmin(users: UsuarioRecord[]): UsuarioRecord[] {
  if (users.length > 0) return users;

  const hasAdmin = users.some(
    (u) =>
      u.email.trim().toLowerCase() === "administrador@df.senac.br" &&
      u.status.trim().toLowerCase() === "ativo",
  );
  if (hasAdmin) return users;

  const admin = defaultUsuarios[0];
  const merged = [admin, ...users];
  writeStorage(STORAGE_KEYS.usuarios, merged);
  return merged;
}

export function getUsuarios() {
  const data = readStorage<UsuarioRecord>(STORAGE_KEYS.usuarios, defaultUsuarios);
  return normalizarUsuariosAuth(patchUsuariosAuth(ensureDefaultAdmin(data)));
}

export function saveUsuario(record: Omit<UsuarioRecord, "id">) {
  const data = getUsuarios();
  const novo = normalizarUsuarioAuth({
    ...record,
    id: generateId(),
  });

  writeStorage(STORAGE_KEYS.usuarios, [...data, novo]);
  return novo;
}

export function updateUsuario(id: string, updates: Partial<UsuarioRecord>) {
  const data = getUsuarios();
  const { senha, ...restUpdates } = updates;
  const finalUpdates: Partial<UsuarioRecord> = senha
    ? { ...restUpdates, senhaHash: hashSenhaLocal(senha) }
    : restUpdates;
  const updated = data.map((item) => (item.id === id ? normalizarUsuarioAuth({ ...item, ...finalUpdates }) : item));
  writeStorage(STORAGE_KEYS.usuarios, updated);
}

export function deleteUsuario(id: string) {
  const data = getUsuarios();
  writeStorage(
    STORAGE_KEYS.usuarios,
    data.filter((item) => item.id !== id),
  );
}

export function emailJaCadastrado(email: string, excludeId?: string): boolean {
  const normalized = email.trim().toLowerCase();
  return getUsuarios().some(
    (u) => u.email.trim().toLowerCase() === normalized && u.id !== excludeId,
  );
}

/* ─────────────────────────────
   PLANO DE METAS
───────────────────────────── */

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
  responsavel?: string;
  statusFinal?: string;
}

const defaultPlanoMetas: PlanoMetaRecord[] = [];

export function getPlanoMetas() {
  return readStorage<PlanoMetaRecord>(STORAGE_KEYS.planoMetas, defaultPlanoMetas);
}

export function savePlanoMeta(record: Omit<PlanoMetaRecord, "id">) {
  const data = getPlanoMetas();
  const novo: PlanoMetaRecord = {
    ...record,
    id: generateId(),
  };

  writeStorage(STORAGE_KEYS.planoMetas, [...data, novo]);
  return novo;
}

export function updatePlanoMeta(id: string, updates: Partial<PlanoMetaRecord>) {
  const data = getPlanoMetas();
  const updated = data.map((item) => (item.id === id ? { ...item, ...updates } : item));
  writeStorage(STORAGE_KEYS.planoMetas, updated);
}

export function deletePlanoMeta(id: string) {
  const data = getPlanoMetas();
  writeStorage(
    STORAGE_KEYS.planoMetas,
    data.filter((item) => item.id !== id),
  );
}

export function replacePlanoMetas(records: Omit<PlanoMetaRecord, "id">[]) {
  const data: PlanoMetaRecord[] = records.map((record) => ({
    ...record,
    id: generateId(),
  }));

  writeStorage(STORAGE_KEYS.planoMetas, data);
  return data;
}

export function clearPlanoMetas() {
  writeStorage(STORAGE_KEYS.planoMetas, []);
}

/* ─────────────────────────────
   VISITAS TÉCNICAS
───────────────────────────── */

export interface VisitaRecord {
  id: string;
  ano: string;
  unidade: string;
  eixo: string;
  processoSEI: string;
  dataSolicitacao: string;
  dataVisitaPrevista: string;
  prazoLimite: string;
  status: string;
  responsavel: string;
  relatorio: string;
  observacao: string;
}

const defaultVisitas: VisitaRecord[] = [];

export function getVisitas() {
  return readStorage<VisitaRecord>(STORAGE_KEYS.visitas, defaultVisitas);
}

export function saveVisita(record: Omit<VisitaRecord, "id">) {
  const data = getVisitas();
  const novo: VisitaRecord = {
    ...record,
    id: generateId(),
  };

  writeStorage(STORAGE_KEYS.visitas, [...data, novo]);
  return novo;
}

export function updateVisita(id: string, updates: Partial<VisitaRecord>) {
  const data = getVisitas();
  const updated = data.map((item) => (item.id === id ? { ...item, ...updates } : item));
  writeStorage(STORAGE_KEYS.visitas, updated);
}

export function deleteVisita(id: string) {
  const data = getVisitas();
  writeStorage(
    STORAGE_KEYS.visitas,
    data.filter((item) => item.id !== id),
  );
}

export function replaceVisitas(records: Omit<VisitaRecord, "id">[]) {
  const data: VisitaRecord[] = records.map((record) => ({
    ...record,
    id: generateId(),
  }));

  writeStorage(STORAGE_KEYS.visitas, data);
  return data;
}

export function clearVisitas() {
  writeStorage(STORAGE_KEYS.visitas, []);
}

/* ─────────────────────────────
   HORAS PEDAGÓGICAS
───────────────────────────── */

export interface HoraRecord {
  id: string;
  ano: string;
  processoSEI: string;
  eixo: string;
  segmento: string;
  nomePessoa: string;
  matricula: string;
  motivo: string;
  observacao: string;
  status: string;
  ativo?: boolean;
}

const defaultHoras: HoraRecord[] = [];

export function getHoras() {
  return readStorage<HoraRecord>(STORAGE_KEYS.horas, defaultHoras);
}

export function saveHora(record: Omit<HoraRecord, "id">) {
  const data = getHoras();
  const novo: HoraRecord = {
    ...record,
    id: generateId(),
  };

  writeStorage(STORAGE_KEYS.horas, [...data, novo]);
  return novo;
}

export function updateHora(id: string, updates: Partial<HoraRecord>) {
  const data = getHoras();
  const updated = data.map((item) => (item.id === id ? { ...item, ...updates } : item));
  writeStorage(STORAGE_KEYS.horas, updated);
}

export function deleteHora(id: string) {
  const data = getHoras();
  writeStorage(
    STORAGE_KEYS.horas,
    data.filter((item) => item.id !== id),
  );
}

export function replaceHoras(records: Omit<HoraRecord, "id">[]) {
  const data: HoraRecord[] = records.map((record) => ({
    ...record,
    ativo: record.ativo ?? true,
    id: generateId(),
  }));

  writeStorage(STORAGE_KEYS.horas, data);
  return data;
}
export function clearHoras() {
  writeStorage(STORAGE_KEYS.horas, []);
}

/* ─────────────────────────────
   VALORES PCA
───────────────────────────── */

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
  precificacao?: string;
  valorPrimeiroModulo?: string;
  parcelasBoleto?: string;
  valorParcelaBoleto?: string;
  parcelasCartao?: string;
  valorCartao?: string;
  parcelaDesc20?: string;
  parcelaDesc15?: string;
}

const defaultValoresPCA: ValorPCARecord[] = [];

function migrarStorageLegado<T>(chaveLegada: string, chaveAtual: string): T[] {
  try {
    const raw = localStorage.getItem(chaveLegada);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as T[];
    if (!Array.isArray(parsed) || !parsed.length) return [];

    writeStorage(chaveAtual, parsed);
    localStorage.removeItem(chaveLegada);
    return parsed;
  } catch {
    return [];
  }
}

export function getValoresPCA() {
  if (localStorage.getItem(STORAGE_KEYS.valoresPCA) !== null) {
    return readStorage<ValorPCARecord>(STORAGE_KEYS.valoresPCA, []);
  }

  return migrarStorageLegado<ValorPCARecord>(
    "sgp_valores_pca_2025",
    STORAGE_KEYS.valoresPCA,
  );
}

export function saveValorPCA(record: Omit<ValorPCARecord, "id">) {
  const data = getValoresPCA();
  const novo: ValorPCARecord = {
    ...record,
    id: generateId(),
  };

  writeStorage(STORAGE_KEYS.valoresPCA, [...data, novo]);
  return novo;
}

export function updateValorPCA(id: string, updates: Partial<ValorPCARecord>) {
  const data = getValoresPCA();
  const updated = data.map((item) => (item.id === id ? { ...item, ...updates } : item));
  writeStorage(STORAGE_KEYS.valoresPCA, updated);
}

export function deleteValorPCA(id: string) {
  const data = getValoresPCA();
  writeStorage(
    STORAGE_KEYS.valoresPCA,
    data.filter((item) => item.id !== id),
  );
}

export function replaceValoresPCA(records: Omit<ValorPCARecord, "id">[]) {
  const data: ValorPCARecord[] = records.map((record) => ({
    ...record,
    id: generateId(),
  }));

  writeStorage(STORAGE_KEYS.valoresPCA, data);
  return data;
}

export function clearValoresPCA() {
  writeStorage(STORAGE_KEYS.valoresPCA, []);
}

/* ─────────────────────────────
   CURSOS POR EIXO
───────────────────────────── */

export interface CursoEixoRecord {
  id: string;
  ano: string;
  eixo: string;
  unidade: string;
  curso: string;
  ch: string;
  status: string;
  observacao: string;
  quantidadeCursosSegmento?: string;
  turmas?: string;
  codigo?: string;
  alunos?: string;
  instrutores?: string;
  isNovo?: boolean;
}

const defaultCursosEixo: CursoEixoRecord[] = [];

export function getCursosEixo() {
  if (localStorage.getItem(STORAGE_KEYS.cursosEixo) !== null) {
    return readStorage<CursoEixoRecord>(STORAGE_KEYS.cursosEixo, []);
  }

  return migrarStorageLegado<CursoEixoRecord>(
    "sgp_quantidade_cursos_por_eixo",
    STORAGE_KEYS.cursosEixo,
  );
}

export function saveCursoEixo(record: Omit<CursoEixoRecord, "id">) {
  const data = getCursosEixo();
  const novo: CursoEixoRecord = {
    ...record,
    id: generateId(),
  };

  writeStorage(STORAGE_KEYS.cursosEixo, [...data, novo]);
  return novo;
}

export function updateCursoEixo(id: string, updates: Partial<CursoEixoRecord>) {
  const data = getCursosEixo();
  const updated = data.map((item) => (item.id === id ? { ...item, ...updates } : item));
  writeStorage(STORAGE_KEYS.cursosEixo, updated);
}

export function deleteCursoEixo(id: string) {
  const data = getCursosEixo();
  writeStorage(
    STORAGE_KEYS.cursosEixo,
    data.filter((item) => item.id !== id),
  );
}

export function replaceCursosEixo(records: Omit<CursoEixoRecord, "id">[]) {
  const data: CursoEixoRecord[] = records.map((record) => ({
    ...record,
    id: generateId(),
  }));

  writeStorage(STORAGE_KEYS.cursosEixo, data);
  return data;
}

export function clearCursosEixo() {
  writeStorage(STORAGE_KEYS.cursosEixo, []);
}

/* ─────────────────────────────
   AÇÕES EXTENSIVAS
───────────────────────────── */

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

const defaultAcoesExtensivas: AcaoExtensivaRecord[] = [
  {
    id: "demo-acao-1",
    ano: "2025",
    titulo: "Oficina de Boas Práticas em Manipulação de Alimentos",
    eixo: "Gastronomia",
    unidade: "Jessé Freire",
    cargaHoraria: "16",
    data: "18/03/2025",
    processoSEI: "2025.000000830-67",
    status: "Ativa",
    observacao: "Registro de exemplo — substitua por importação ou cadastro manual.",
  },
  {
    id: "demo-acao-2",
    ano: "2025",
    titulo: "Palestra: Inteligência Artificial Aplicada a Negócios",
    eixo: "Gestão e Moda",
    unidade: "Joaquim Loiola",
    cargaHoraria: "8",
    data: "22/05/2025",
    processoSEI: "2025.000000817-90",
    status: "Ativa",
    observacao: "Registro de exemplo para demonstração do módulo.",
  },
  {
    id: "demo-acao-3",
    ano: "2025",
    titulo: "Workshop de Coloração Pessoal e Imagem",
    eixo: "Beleza e Cuidado Pessoal",
    unidade: "Talal Abu-Allan",
    cargaHoraria: "12",
    data: "10/06/2025",
    processoSEI: "2025.000000959-10",
    status: "Planejada",
    observacao: "Registro de exemplo — aguardando planilha oficial da área.",
  },
];

export function restoreAcoesExtensivasDefaults() {
  const data = defaultAcoesExtensivas.map((item) => ({
    ...item,
    id: generateId(),
  }));
  writeStorage(STORAGE_KEYS.acoesExtensivas, data);
  return data;
}

export function getAcoesExtensivas() {
  const raw = localStorage.getItem(STORAGE_KEYS.acoesExtensivas);
  if (!raw) return restoreAcoesExtensivasDefaults();

  try {
    const parsed = JSON.parse(raw) as AcaoExtensivaRecord[];
    if (!Array.isArray(parsed)) {
      return restoreAcoesExtensivasDefaults();
    }
    return parsed;
  } catch {
    return restoreAcoesExtensivasDefaults();
  }
}

export function saveAcaoExtensiva(record: Omit<AcaoExtensivaRecord, "id">) {
  const data = getAcoesExtensivas();
  const novo: AcaoExtensivaRecord = {
    ...record,
    id: generateId(),
  };

  writeStorage(STORAGE_KEYS.acoesExtensivas, [...data, novo]);
  return novo;
}

export function updateAcaoExtensiva(id: string, updates: Partial<AcaoExtensivaRecord>) {
  const data = getAcoesExtensivas();
  const updated = data.map((item) => (item.id === id ? { ...item, ...updates } : item));
  writeStorage(STORAGE_KEYS.acoesExtensivas, updated);
}

export function deleteAcaoExtensiva(id: string) {
  const data = getAcoesExtensivas();
  writeStorage(
    STORAGE_KEYS.acoesExtensivas,
    data.filter((item) => item.id !== id),
  );
}

export function clearAcoesExtensivas() {
  writeStorage(STORAGE_KEYS.acoesExtensivas, []);
}

export function resetAcoesExtensivasParaExemplos() {
  return restoreAcoesExtensivasDefaults();
}

export function replaceAcoesExtensivas(records: Omit<AcaoExtensivaRecord, "id">[]) {
  const data: AcaoExtensivaRecord[] = records.map((record) => ({
    ...record,
    id: generateId(),
  }));
  writeStorage(STORAGE_KEYS.acoesExtensivas, data);
  return data;
}

/* ─────────────────────────────
   EVENTOS
───────────────────────────── */

export interface EventoRecord {
  id: string;
  ano: string;
  nome: string;
  data: string;
  unidade: string;
  eixo: string;
  quantidadePessoas: string;
  equipe: string;
  possuiAcaoExtensiva: string;
  acaoVinculada: string;
  status: string;
  observacao: string;
}

const defaultEventos: EventoRecord[] = [
  {
    id: "demo-evento-1",
    ano: "2025",
    nome: "Semana Pedagógica CEPED 2025",
    data: "12/08/2025",
    unidade: "Sobradinho",
    eixo: "Tecnologia e Economia Criativa",
    quantidadePessoas: "85",
    equipe: "CPED, responsáveis de eixo e instrutores convidados",
    possuiAcaoExtensiva: "Sim",
    acaoVinculada: "Palestra: Inteligência Artificial Aplicada a Negócios",
    status: "Realizado",
    observacao: "Registro de exemplo para demonstração do módulo.",
  },
  {
    id: "demo-evento-2",
    ano: "2025",
    nome: "Feira de Profissões SENAC DF",
    data: "25/09/2025",
    unidade: "Taguatinga",
    eixo: "Ambiente e Saúde",
    quantidadePessoas: "320",
    equipe: "Equipe comercial, CEPED e unidades participantes",
    possuiAcaoExtensiva: "Não",
    acaoVinculada: "",
    status: "Planejado",
    observacao: "Registro de exemplo sem vínculo com ação extensiva.",
  },
  {
    id: "demo-evento-3",
    ano: "2025",
    nome: "Mostra Gastronômica de Fim de Ano",
    data: "05/12/2025",
    unidade: "Jessé Freire",
    eixo: "Gastronomia",
    quantidadePessoas: "120",
    equipe: "Chef instrutores e alunos dos cursos de Gastronomia",
    possuiAcaoExtensiva: "Sim",
    acaoVinculada: "Oficina de Boas Práticas em Manipulação de Alimentos",
    status: "Planejado",
    observacao: "Registro de exemplo — substitua por importação ou cadastro manual.",
  },
];

export function restoreEventosDefaults() {
  const data = defaultEventos.map((item) => ({
    ...item,
    id: generateId(),
  }));
  writeStorage(STORAGE_KEYS.eventos, data);
  return data;
}

export function getEventos() {
  const raw = localStorage.getItem(STORAGE_KEYS.eventos);
  if (!raw) return restoreEventosDefaults();

  try {
    const parsed = JSON.parse(raw) as EventoRecord[];
    if (!Array.isArray(parsed)) {
      return restoreEventosDefaults();
    }
    return parsed;
  } catch {
    return restoreEventosDefaults();
  }
}

export function saveEvento(record: Omit<EventoRecord, "id">) {
  const data = getEventos();
  const novo: EventoRecord = {
    ...record,
    id: generateId(),
  };

  writeStorage(STORAGE_KEYS.eventos, [...data, novo]);
  return novo;
}

export function updateEvento(id: string, updates: Partial<EventoRecord>) {
  const data = getEventos();
  const updated = data.map((item) => (item.id === id ? { ...item, ...updates } : item));
  writeStorage(STORAGE_KEYS.eventos, updated);
}

export function deleteEvento(id: string) {
  const data = getEventos();
  writeStorage(
    STORAGE_KEYS.eventos,
    data.filter((item) => item.id !== id),
  );
}

export function clearEventos() {
  writeStorage(STORAGE_KEYS.eventos, []);
}

export function resetEventosParaExemplos() {
  return restoreEventosDefaults();
}

export function replaceEventos(records: Omit<EventoRecord, "id">[]) {
  const data: EventoRecord[] = records.map((record) => ({
    ...record,
    id: generateId(),
  }));
  writeStorage(STORAGE_KEYS.eventos, data);
  return data;
}

/* ─────────────────────────────
   CEPED — EQUIPE INSTITUCIONAL
───────────────────────────── */

export type CepedTipo =
  | "ordenador"
  | "assistente"
  | "responsavel"
  | "instrutor"
  | "administrativo";

export interface CepedPessoaRecord {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  contato: string;
  tipo: CepedTipo;
  eixoVinculo?: string;
  iniciais?: string;
  cor?: string;
  foto?: string;
}

export type CepedPessoaInput = Omit<CepedPessoaRecord, "id">;

const defaultCepedEquipe: CepedPessoaRecord[] = DEFAULT_CEPED_EQUIPE.map((pessoa) => ({
  ...pessoa,
}));

export function getCepedEquipe() {
  return readStorage<CepedPessoaRecord>(STORAGE_KEYS.cepedEquipe, defaultCepedEquipe);
}

export function saveCepedPessoa(record: CepedPessoaInput) {
  const data = getCepedEquipe();
  const novo: CepedPessoaRecord = { ...record, id: generateId() };
  writeStorage(STORAGE_KEYS.cepedEquipe, [...data, novo]);
  return novo;
}

export function updateCepedPessoa(id: string, updates: Partial<CepedPessoaInput>) {
  const data = getCepedEquipe();
  const updated = data.map((item) => (item.id === id ? { ...item, ...updates } : item));
  writeStorage(STORAGE_KEYS.cepedEquipe, updated);
}

export function deleteCepedPessoa(id: string) {
  const data = getCepedEquipe();
  writeStorage(
    STORAGE_KEYS.cepedEquipe,
    data.filter((item) => item.id !== id),
  );
}

export function resetCepedEquipeDemo() {
  writeStorage(STORAGE_KEYS.cepedEquipe, defaultCepedEquipe.map((pessoa) => ({ ...pessoa })));
}

/* ─────────────────────────────
   LIMPAR DADOS DO PROTÓTIPO
───────────────────────────── */

export function clearSgpStorage() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

/* ─────────────────────────────
   CURSOS CADASTRADOS / COMPATIBILIDADE COM CourseArea
───────────────────────────── */

export interface StoredCourseRecord {
  id: string;
  titulo: string;
  segmento: string;
  modalidade?: string;
  ch?: string;
  codDN?: string;
  codSIG?: string;
  processoSEI?: string;
  status?: string;
  tipo?: string;
  unidade?: string;
  observacao?: string;
  observacoes?: string;
  ano?: string;
  valor?: string;
  valores?: string;
  resolucao?: string;
  turmas?: string;
  codigo?: string;
  alunos?: string;
  instrutor?: string;
  ident?: string;
  revisao?: string;
  bolsa?: string;
  comercial?: string;
  pcn?: string;
  pcr?: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  unidades?: string[];
  [key: string]: unknown;
}

export type CourseRecord = StoredCourseRecord;
export type Course = StoredCourseRecord;

export type CursoImportadoInput = {
  titulo: string;
  eixo?: string;
  segmento?: string;
  modalidade?: string;
  ch?: string;
  codDN?: string;
  codSIG?: string;
  processoSEI?: string;
  status?: string;
  tipo?: string;
  unidade?: string;
  observacao?: string;
  observacoes?: string;
  ano?: string;
  ultimaRevisao?: string;
  valor?: string;
  valores?: string;
  resolucao?: string;
  ident?: string;
  compativelBolsa?: string;
  comercial?: string;
  pcn?: string;
  pcr?: string;
  segmentoPlanilha?: string;
  origemSheet?: string;
};

/** Normaliza registro importado da planilha para o formato usado em CourseArea e exportações. */
export function adaptarCursoImportado(
  record: CursoImportadoInput,
): Omit<StoredCourseRecord, "id"> {
  const revisao = record.ultimaRevisao || record.ano || "";
  const observacao = record.observacao || record.observacoes || "";
  const valor = record.valor || record.valores || "";

  return {
    titulo: record.titulo,
    segmento: record.eixo || record.segmento || "",
    modalidade: record.modalidade,
    ch: record.ch,
    codDN: record.codDN,
    codigoDN: record.codDN,
    codSIG: record.codSIG,
    codigoSIG: record.codSIG,
    processoSEI: record.processoSEI,
    status: record.status,
    tipo: record.tipo,
    unidade: record.unidade,
    observacao,
    observacoes: observacao,
    ano: revisao,
    revisao,
    ident: record.ident,
    valor,
    valores: valor,
    bolsa: record.compativelBolsa,
    compativelBolsa: record.compativelBolsa,
    comercial: record.comercial,
    pcn: record.pcn,
    pcr: record.pcr,
    resolucao: record.resolucao,
    segmentoPlanilha: record.segmentoPlanilha,
    origemSheet: record.origemSheet,
  };
}

const STORED_COURSES_KEY = "sgp_stored_courses";
const DELETED_STATIC_CODSIGS_KEY = "sgp_deleted_static_cod_sigs";

/** Preenche aliases de campos para registros importados antes do mapeamento completo. */
function normalizarCursoArmazenado(course: StoredCourseRecord): StoredCourseRecord {
  const observacao = course.observacao || course.observacoes || "";
  const valor = course.valor || course.valores || "";
  const revisao = course.revisao || course.ano || "";

  return {
    ...course,
    codDN: course.codDN || course.codigoDN || course.codigoDn,
    codigoDN: course.codigoDN || course.codigoDn || course.codDN,
    codSIG: course.codSIG || course.codigoSIG,
    codigoSIG: course.codigoSIG || course.codSIG,
    revisao,
    ano: course.ano || revisao,
    valor,
    valores: valor,
    observacao,
    observacoes: observacao,
    bolsa: course.bolsa || course.compativelBolsa,
    compativelBolsa: course.compativelBolsa || course.bolsa,
  };
}

export function getStoredCourses() {
  return readStorage<StoredCourseRecord>(STORED_COURSES_KEY, []).map(
    normalizarCursoArmazenado,
  );
}

export function saveCourse(record: Omit<StoredCourseRecord, "id">) {
  const data = getStoredCourses();

  const novo: StoredCourseRecord = {
    ...record,
    id: generateId(),
  };

  writeStorage(STORED_COURSES_KEY, [...data, novo]);
  return novo;
}

export function updateCourse(id: string, updates: Partial<StoredCourseRecord>) {
  const data = getStoredCourses();
  const updated = data.map((item) => (item.id === id ? { ...item, ...updates } : item));
  writeStorage(STORED_COURSES_KEY, updated);
}

export function deleteCourse(id: string) {
  const data = getStoredCourses();

  writeStorage(
    STORED_COURSES_KEY,
    data.filter((item) => item.id !== id),
  );
}

export function replaceCourses(records: Omit<StoredCourseRecord, "id">[]) {
  const data: StoredCourseRecord[] = records.map((record) => ({
    ...record,
    id: generateId(),
  }));

  writeStorage(STORED_COURSES_KEY, data);
  return data;
}

export function clearImportedCourses() {
  writeStorage(STORED_COURSES_KEY, []);
}

export function hasStoredCoursesInStorage() {
  return localStorage.getItem(STORED_COURSES_KEY) !== null;
}

/** Remove os mesmos módulos alimentados pela importação completa da planilha principal. */
export function limparDadosPortfolio() {
  clearImportedCourses();
  localStorage.removeItem(DELETED_STATIC_CODSIGS_KEY);
  clearPlanoMetas();
  clearValoresPCA();
  localStorage.removeItem("sgp_valores_pca_2025");
  clearCursosEixo();
  localStorage.removeItem("sgp_quantidade_cursos_por_eixo");
  clearVisitas();
  clearHoras();
  clearAcoesExtensivas();
  clearEventos();
}

export function segmentoToSlug(segmento: string) {
  return String(segmento ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "e")
    .replace(/\+/g, "mais")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getDeletedStaticCodSIGs() {
  return readStorage<string>(DELETED_STATIC_CODSIGS_KEY, []);
}

export function markStaticCourseDeleted(codSIG?: string) {
  if (!codSIG) return;

  const data = getDeletedStaticCodSIGs();

  if (data.includes(codSIG)) return;

  writeStorage(DELETED_STATIC_CODSIGS_KEY, [...data, codSIG]);
}

export function restoreStaticCourse(codSIG?: string) {
  if (!codSIG) return;

  const data = getDeletedStaticCodSIGs();

  writeStorage(
    DELETED_STATIC_CODSIGS_KEY,
    data.filter((item) => item !== codSIG),
  );
}

/* ─────────────────────────────
   COMPATIBILIDADE COM Users.tsx
───────────────────────────── */

export type UserRecord = UsuarioRecord;

export function getStoredUsers() {
  return getUsuarios();
}

export function updateUser(id: string, updates: Partial<UserRecord>) {
  updateUsuario(id, updates);
}

export function deleteUser(id: string) {
  deleteUsuario(id);
}

export function saveUser(record: Omit<UserRecord, "id">) {
  return saveUsuario(record);
}

/* ─────────────────────────────
   COMPATIBILIDADE COM AcoesExtensivas.tsx
───────────────────────────── */

export function getStoredAcoes() {
  return getAcoesExtensivas();
}

export function saveAcao(record: Omit<AcaoExtensivaRecord, "id">) {
  return saveAcaoExtensiva(record);
}

export function updateAcao(id: string, updates: Partial<AcaoExtensivaRecord>) {
  updateAcaoExtensiva(id, updates);
}

export function deleteAcao(id: string) {
  deleteAcaoExtensiva(id);
}

/* ─────────────────────────────
   COMPATIBILIDADE COM Eventos.tsx
───────────────────────────── */

export function getStoredEventos() {
  return getEventos();
}
