const STORAGE_KEYS = {
  usuarios: "sgp_usuarios",
  planoMetas: "sgp_plano_metas",
  visitas: "sgp_visitas_tecnicas",
  horas: "sgp_horas_pedagogicas",
  valoresPCA: "sgp_valores_pca",
  cursosEixo: "sgp_cursos_eixo",
  acoesExtensivas: "sgp_acoes_extensivas",
  eventos: "sgp_eventos",
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
  ultimoAcesso?: string;
  unidade?: string;
  area?: string;
  telefone?: string;
}

const defaultUsuarios: UsuarioRecord[] = [
  {
    id: generateId(),
    nome: "Administrador SGP",
    email: "admin@df.senac.br",
    cpf: "000.000.000-00",
    perfil: "Administrador",
    status: "Ativo",
    ultimoAcesso: "Hoje",
    unidade: "SENAC DF",
    area: "TI",
    telefone: "",
  },
];

export function getUsuarios() {
  return readStorage<UsuarioRecord>(STORAGE_KEYS.usuarios, defaultUsuarios);
}

export function saveUsuario(record: Omit<UsuarioRecord, "id">) {
  const data = getUsuarios();
  const novo: UsuarioRecord = {
    ...record,
    id: generateId(),
  };

  writeStorage(STORAGE_KEYS.usuarios, [...data, novo]);
  return novo;
}

export function updateUsuario(id: string, updates: Partial<UsuarioRecord>) {
  const data = getUsuarios();
  const updated = data.map((item) => (item.id === id ? { ...item, ...updates } : item));
  writeStorage(STORAGE_KEYS.usuarios, updated);
}

export function deleteUsuario(id: string) {
  const data = getUsuarios();
  writeStorage(
    STORAGE_KEYS.usuarios,
    data.filter((item) => item.id !== id),
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

export function getValoresPCA() {
  return readStorage<ValorPCARecord>(STORAGE_KEYS.valoresPCA, defaultValoresPCA);
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
  return readStorage<CursoEixoRecord>(STORAGE_KEYS.cursosEixo, defaultCursosEixo);
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

const defaultAcoesExtensivas: AcaoExtensivaRecord[] = [];

export function getAcoesExtensivas() {
  return readStorage<AcaoExtensivaRecord>(
    STORAGE_KEYS.acoesExtensivas,
    defaultAcoesExtensivas,
  );
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

const defaultEventos: EventoRecord[] = [];

export function getEventos() {
  return readStorage<EventoRecord>(STORAGE_KEYS.eventos, defaultEventos);
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
  ano?: string;
  valor?: string;
  resolucao?: string;
  [key: string]: unknown;
}

const STORED_COURSES_KEY = "sgp_stored_courses";
const DELETED_STATIC_CODSIGS_KEY = "sgp_deleted_static_cod_sigs";

export function getStoredCourses() {
  return readStorage<StoredCourseRecord>(STORED_COURSES_KEY, []);
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