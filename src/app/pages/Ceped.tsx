import { useState } from "react";
import { X, Mail, Users, ChevronRight, Building2, GraduationCap, Briefcase, Star, Layers } from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Tipo = "ordenador" | "assistente" | "responsavel" | "instrutor" | "administrativo";

interface Pessoa {
  id: string;
  nome: string;
  cargo: string;
  setor: string;   // eixo ou setor
  contato: string;
  tipo: Tipo;
  eixoVinculo?: string; // para instrutores e administrativos
  iniciais?: string;
  cor?: string;
}

// ── Dados ──────────────────────────────────────────────────────────────────────

const EQUIPE: Pessoa[] = [
  // Ordenador
  {
    id: "p1", tipo: "ordenador",
    nome: "João Carlos Mendes Silva", cargo: "Coordenador Geral / Ordenador",
    setor: "CEPED", contato: "ceped@senac.df.br",
    iniciais: "JC", cor: "#003F7D",
  },

  // Assistentes administrativos
  {
    id: "p2", tipo: "assistente",
    nome: "Maria Paula Rodrigues", cargo: "Assistente Administrativa",
    setor: "Secretaria Geral", contato: "mpaula@senac.df.br",
    iniciais: "MP", cor: "#5C6BC0",
  },
  {
    id: "p3", tipo: "assistente",
    nome: "Carlos Eduardo Lima", cargo: "Assistente Administrativo",
    setor: "Secretaria Geral", contato: "clima@senac.df.br",
    iniciais: "CE", cor: "#5C6BC0",
  },

  // Responsáveis de eixo
  {
    id: "p4", tipo: "responsavel",
    nome: "Ana Beatriz Fonseca", cargo: "Responsável de Eixo",
    setor: "Gastronomia", contato: "abfonseca@senac.df.br",
    eixoVinculo: "Gastronomia",
    iniciais: "AB", cor: "#E65100",
  },
  {
    id: "p5", tipo: "responsavel",
    nome: "Fernanda Cristina Borges", cargo: "Responsável de Eixo",
    setor: "Beleza e Cuidado Pessoal", contato: "fcborges@senac.df.br",
    eixoVinculo: "Beleza e Cuidado Pessoal",
    iniciais: "FC", cor: "#AD1457",
  },
  {
    id: "p6", tipo: "responsavel",
    nome: "Roberto Augusto Pinto", cargo: "Responsável de Eixo",
    setor: "Gestão e Negócios", contato: "rapinto@senac.df.br",
    eixoVinculo: "Gestão e Negócios",
    iniciais: "RA", cor: "#1565C0",
  },
  {
    id: "p7", tipo: "responsavel",
    nome: "Juliana Moraes Cardoso", cargo: "Responsável de Eixo",
    setor: "Tecnologia e Economia Criativa", contato: "jcardoso@senac.df.br",
    eixoVinculo: "Tecnologia e Economia Criativa",
    iniciais: "JM", cor: "#6A1B9A",
  },
  {
    id: "p8", tipo: "responsavel",
    nome: "Marcos Vinícius Alves", cargo: "Responsável de Eixo",
    setor: "Ambiente e Saúde", contato: "mvalves@senac.df.br",
    eixoVinculo: "Ambiente e Saúde",
    iniciais: "MV", cor: "#2E7D32",
  },
  {
    id: "p9", tipo: "responsavel",
    nome: "Priscila Torres Melo", cargo: "Responsável de Eixo",
    setor: "Gestão e Moda", contato: "ptmelo@senac.df.br",
    eixoVinculo: "Gestão e Moda",
    iniciais: "PT", cor: "#B71C1C",
  },

  // Instrutores vinculados
  {
    id: "p10", tipo: "instrutor",
    nome: "Chef André Luiz Santos", cargo: "Instrutor",
    setor: "Gastronomia", contato: "alsantos@senac.df.br",
    eixoVinculo: "Gastronomia", iniciais: "AL", cor: "#F57C00",
  },
  {
    id: "p11", tipo: "instrutor",
    nome: "Patrícia Cavalcante", cargo: "Instrutora",
    setor: "Gastronomia", contato: "pcavalcante@senac.df.br",
    eixoVinculo: "Gastronomia", iniciais: "PC", cor: "#F57C00",
  },
  {
    id: "p12", tipo: "instrutor",
    nome: "Renata Souza Costa", cargo: "Instrutora",
    setor: "Beleza e Cuidado Pessoal", contato: "rscosta@senac.df.br",
    eixoVinculo: "Beleza e Cuidado Pessoal", iniciais: "RS", cor: "#E91E63",
  },
  {
    id: "p13", tipo: "instrutor",
    nome: "Diego Ferreira Ramos", cargo: "Instrutor",
    setor: "Beleza e Cuidado Pessoal", contato: "dframos@senac.df.br",
    eixoVinculo: "Beleza e Cuidado Pessoal", iniciais: "DF", cor: "#E91E63",
  },
  {
    id: "p14", tipo: "instrutor",
    nome: "Luciana Peixoto Tavares", cargo: "Instrutora",
    setor: "Gestão e Negócios", contato: "lptavares@senac.df.br",
    eixoVinculo: "Gestão e Negócios", iniciais: "LP", cor: "#1976D2",
  },
  {
    id: "p15", tipo: "instrutor",
    nome: "Alexandre Cunha Freitas", cargo: "Instrutor",
    setor: "Gestão e Negócios", contato: "acfreitas@senac.df.br",
    eixoVinculo: "Gestão e Negócios", iniciais: "AC", cor: "#1976D2",
  },
  {
    id: "p16", tipo: "instrutor",
    nome: "Thiago Mendonça Pereira", cargo: "Instrutor",
    setor: "Tecnologia e Economia Criativa", contato: "tmpereira@senac.df.br",
    eixoVinculo: "Tecnologia e Economia Criativa", iniciais: "TM", cor: "#7B1FA2",
  },
  {
    id: "p17", tipo: "instrutor",
    nome: "Camila Rocha Andrade", cargo: "Instrutora",
    setor: "Tecnologia e Economia Criativa", contato: "crandrade@senac.df.br",
    eixoVinculo: "Tecnologia e Economia Criativa", iniciais: "CR", cor: "#7B1FA2",
  },
  {
    id: "p18", tipo: "instrutor",
    nome: "Enf.ª Cristiane Barbosa", cargo: "Instrutora",
    setor: "Ambiente e Saúde", contato: "cbarbosa@senac.df.br",
    eixoVinculo: "Ambiente e Saúde", iniciais: "CB", cor: "#388E3C",
  },
  {
    id: "p19", tipo: "instrutor",
    nome: "Dr. Paulo Henrique Neves", cargo: "Instrutor",
    setor: "Ambiente e Saúde", contato: "phneves@senac.df.br",
    eixoVinculo: "Ambiente e Saúde", iniciais: "PH", cor: "#388E3C",
  },
  {
    id: "p20", tipo: "instrutor",
    nome: "Isabela Guimarães Costa", cargo: "Instrutora",
    setor: "Gestão e Moda", contato: "igcosta@senac.df.br",
    eixoVinculo: "Gestão e Moda", iniciais: "IG", cor: "#C62828",
  },

  // Administrativos vinculados
  {
    id: "p21", tipo: "administrativo",
    nome: "Sônia Aparecida Cruz", cargo: "Técnica Administrativa",
    setor: "Secretaria", contato: "sacruz@senac.df.br",
    iniciais: "SA", cor: "#00796B",
  },
  {
    id: "p22", tipo: "administrativo",
    nome: "Gabriel Oliveira Santos", cargo: "Analista de TI",
    setor: "TI / Sistemas", contato: "gosantos@senac.df.br",
    iniciais: "GO", cor: "#00796B",
  },
  {
    id: "p23", tipo: "administrativo",
    nome: "Vanessa Lima Martins", cargo: "Técnica Administrativa",
    setor: "Financeiro", contato: "vlmartins@senac.df.br",
    iniciais: "VL", cor: "#00796B",
  },
  {
    id: "p24", tipo: "administrativo",
    nome: "Henrique Castro Dias", cargo: "Técnico Administrativo",
    setor: "Patrimônio", contato: "hcdias@senac.df.br",
    iniciais: "HC", cor: "#00796B",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const EIXO_COLOR: Record<string, { bg: string; text: string; ring: string }> = {
  "Gastronomia":                    { bg: "bg-orange-50",  text: "text-orange-800",  ring: "ring-orange-200" },
  "Beleza e Cuidado Pessoal":       { bg: "bg-pink-50",    text: "text-pink-800",    ring: "ring-pink-200" },
  "Gestão e Negócios":              { bg: "bg-blue-50",    text: "text-blue-800",    ring: "ring-blue-200" },
  "Tecnologia e Economia Criativa": { bg: "bg-purple-50",  text: "text-purple-800",  ring: "ring-purple-200" },
  "Ambiente e Saúde":               { bg: "bg-green-50",   text: "text-green-800",   ring: "ring-green-200" },
  "Gestão e Moda":                  { bg: "bg-rose-50",    text: "text-rose-800",    ring: "ring-rose-200" },
};

const TIPO_LABEL: Record<Tipo, string> = {
  ordenador: "Ordenador",
  assistente: "Assistente Administrativo",
  responsavel: "Responsável de Eixo",
  instrutor: "Instrutor",
  administrativo: "Administrativo",
};

const TIPO_ICON: Record<Tipo, React.ReactNode> = {
  ordenador:      <Star size={13} />,
  assistente:     <Briefcase size={13} />,
  responsavel:    <Layers size={13} />,
  instrutor:      <GraduationCap size={13} />,
  administrativo: <Building2 size={13} />,
};

function Avatar({ pessoa, size = "md" }: { pessoa: Pessoa; size?: "sm" | "md" | "lg" | "xl" }) {
  const sz = { sm: "w-9 h-9 text-xs", md: "w-12 h-12 text-sm", lg: "w-16 h-16 text-base", xl: "w-20 h-20 text-xl" }[size];
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ring-2 ring-white shadow`}
      style={{ backgroundColor: pessoa.cor ?? "#003F7D" }}
    >
      {pessoa.iniciais ?? pessoa.nome.slice(0, 2).toUpperCase()}
    </div>
  );
}

function PessoaCard({ pessoa, onClick, compact }: { pessoa: Pessoa; onClick?: () => void; compact?: boolean }) {
  const eixoStyle = pessoa.setor && EIXO_COLOR[pessoa.setor]
    ? EIXO_COLOR[pessoa.setor]
    : { bg: "bg-gray-50", text: "text-gray-600", ring: "ring-gray-200" };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm transition-all ${onClick ? "cursor-pointer hover:shadow-md hover:border-[#003F7D]/30 hover:-translate-y-0.5" : ""} ${compact ? "p-3" : "p-5"}`}
    >
      <div className={`flex ${compact ? "items-center gap-3" : "flex-col items-center text-center gap-3"}`}>
        <Avatar pessoa={pessoa} size={compact ? "sm" : "lg"} />
        <div className={compact ? "flex-1 min-w-0" : ""}>
          <p className={`font-semibold text-gray-900 ${compact ? "text-sm truncate" : "text-base"}`}>{pessoa.nome}</p>
          <p className={`text-gray-500 ${compact ? "text-xs truncate" : "text-sm mt-0.5"}`}>{pessoa.cargo}</p>
          {!compact && (
            <>
              <div className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${eixoStyle.bg} ${eixoStyle.text}`}>
                {pessoa.setor}
              </div>
              <a
                href={`mailto:${pessoa.contato}`}
                onClick={e => e.stopPropagation()}
                className="flex items-center justify-center gap-1.5 mt-3 text-xs text-[#003F7D] hover:text-[#F57C00] transition-colors"
              >
                <Mail size={12} /> {pessoa.contato}
              </a>
            </>
          )}
        </div>
        {onClick && (
          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

// ── Organograma ───────────────────────────────────────────────────────────────

function Organograma({ onEixoClick }: { onEixoClick: (eixo: string) => void }) {
  const ordenador = EQUIPE.find(p => p.tipo === "ordenador")!;
  const assistentes = EQUIPE.filter(p => p.tipo === "assistente");
  const responsaveis = EQUIPE.filter(p => p.tipo === "responsavel");

  return (
    <div className="flex flex-col items-center gap-0">
      {/* Ordenador */}
      <div className="flex flex-col items-center">
        <div className="bg-[#003F7D] text-white rounded-xl px-6 py-3 flex items-center gap-3 shadow-lg">
          <Avatar pessoa={ordenador} size="md" />
          <div>
            <p className="font-bold text-sm">{ordenador.nome}</p>
            <p className="text-xs text-white/70">{ordenador.cargo}</p>
          </div>
        </div>
        {/* linha vertical */}
        <div className="w-px h-6 bg-gray-300" />
      </div>

      {/* Assistentes */}
      <div className="flex flex-col items-center">
        <div className="flex gap-4">
          {assistentes.map(p => (
            <div key={p.id} className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
              <Avatar pessoa={p} size="sm" />
              <div>
                <p className="font-semibold text-xs text-gray-900">{p.nome}</p>
                <p className="text-[10px] text-gray-500">{p.cargo}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="w-px h-6 bg-gray-300" />
      </div>

      {/* Linha horizontal e responsáveis */}
      <div className="flex flex-col items-center w-full">
        <div className="w-full flex items-start justify-center">
          {/* linha horizontal */}
          <div className="relative flex items-start justify-center w-full max-w-4xl">
            <div className="absolute top-0 left-[calc(1/12*100%)] right-[calc(1/12*100%)] h-px bg-gray-300" />
            <div className="flex gap-3 w-full justify-center">
              {responsaveis.map(p => {
                const ec = EIXO_COLOR[p.setor] ?? { bg: "bg-gray-50", text: "text-gray-700", ring: "ring-gray-200" };
                return (
                  <div key={p.id} className="flex flex-col items-center">
                    <div className="w-px h-4 bg-gray-300" />
                    <button
                      onClick={() => onEixoClick(p.eixoVinculo!)}
                      className={`${ec.bg} border ring-1 ${ec.ring} rounded-xl px-3 py-2.5 flex flex-col items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all w-28 group`}
                    >
                      <Avatar pessoa={p} size="sm" />
                      <p className="text-[10px] font-bold text-gray-800 text-center leading-tight">{p.setor}</p>
                      <p className="text-[9px] text-gray-500 truncate w-full text-center">{p.nome.split(" ").slice(0, 2).join(" ")}</p>
                      <span className={`text-[9px] font-semibold ${ec.text} flex items-center gap-0.5 group-hover:underline`}>
                        <Users size={9} /> ver equipe
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Carômetro ─────────────────────────────────────────────────────────────────

const FILTROS_TIPO: { label: string; value: string }[] = [
  { label: "Todos", value: "todos" },
  { label: "Ordenador", value: "ordenador" },
  { label: "Assistentes", value: "assistente" },
  { label: "Resp. de Eixo", value: "responsavel" },
  { label: "Instrutores", value: "instrutor" },
  { label: "Administrativos", value: "administrativo" },
];

function Carometro() {
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterEixo, setFilterEixo] = useState("todos");
  const [pessoaModal, setPessoaModal] = useState<Pessoa | null>(null);

  const eixos = [...new Set(EQUIPE.map(p => p.setor).filter(s => EIXO_COLOR[s]))];

  const filtrados = EQUIPE.filter(p => {
    if (filterTipo !== "todos" && p.tipo !== filterTipo) return false;
    if (filterEixo !== "todos" && p.setor !== filterEixo) return false;
    return true;
  });

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTROS_TIPO.map(f => (
          <button
            key={f.value}
            onClick={() => setFilterTipo(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filterTipo === f.value
                ? "bg-[#003F7D] text-white border-[#003F7D]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#003F7D]"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="w-px bg-gray-200 mx-1 self-stretch" />
        <button
          onClick={() => setFilterEixo("todos")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            filterEixo === "todos"
              ? "bg-gray-700 text-white border-gray-700"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          Todos os eixos
        </button>
        {eixos.map(e => {
          const ec = EIXO_COLOR[e];
          return (
            <button
              key={e}
              onClick={() => setFilterEixo(e)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filterEixo === e
                  ? `${ec.bg} ${ec.text} ring-1 ${ec.ring} border-transparent`
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {e}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtrados.map(p => {
          const ec = EIXO_COLOR[p.setor] ?? { bg: "bg-gray-50", text: "text-gray-600", ring: "ring-gray-100" };
          return (
            <button
              key={p.id}
              onClick={() => setPessoaModal(p)}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all text-left group"
            >
              <div className="relative">
                <Avatar pessoa={p} size="xl" />
                <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow">
                  <span className={`flex items-center justify-center w-5 h-5 rounded-full ${ec.bg} ${ec.text}`}>
                    {TIPO_ICON[p.tipo]}
                  </span>
                </span>
              </div>
              <div className="text-center w-full">
                <p className="font-semibold text-gray-900 text-sm leading-tight">{p.nome}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.cargo}</p>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${ec.bg} ${ec.text}`}>
                  {p.setor}
                </span>
              </div>
              <span className="text-[10px] text-[#003F7D] opacity-0 group-hover:opacity-100 transition-opacity">
                Ver detalhes →
              </span>
            </button>
          );
        })}
      </div>

      {filtrados.length === 0 && (
        <div className="py-16 text-center">
          <Users size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">Nenhuma pessoa encontrada para os filtros selecionados.</p>
        </div>
      )}

      {/* Modal de pessoa */}
      {pessoaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPessoaModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-24 w-full" style={{ backgroundColor: pessoaModal.cor ?? "#003F7D" }} />
            <div className="px-6 pb-6 -mt-10 flex flex-col items-center text-center">
              <div className="ring-4 ring-white rounded-full mb-3">
                <Avatar pessoa={pessoaModal} size="xl" />
              </div>
              <p className="font-bold text-gray-900 text-lg leading-tight">{pessoaModal.nome}</p>
              <p className="text-sm text-gray-500 mt-0.5">{pessoaModal.cargo}</p>
              <div className="mt-3 flex items-center gap-1.5">
                {(() => {
                  const ec = EIXO_COLOR[pessoaModal.setor] ?? { bg: "bg-gray-100", text: "text-gray-600" };
                  return (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ec.bg} ${ec.text}`}>
                      {pessoaModal.setor}
                    </span>
                  );
                })()}
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  {TIPO_LABEL[pessoaModal.tipo]}
                </span>
              </div>
              <a
                href={`mailto:${pessoaModal.contato}`}
                className="mt-4 flex items-center gap-2 text-sm text-[#003F7D] hover:text-[#F57C00] transition-colors"
              >
                <Mail size={14} /> {pessoaModal.contato}
              </a>
            </div>
            <div className="border-t border-gray-100 px-6 py-3 flex justify-end">
              <button onClick={() => setPessoaModal(null)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <X size={14} /> Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modal de Eixo ─────────────────────────────────────────────────────────────

function ModalEixo({ eixo, onClose }: { eixo: string; onClose: () => void }) {
  const responsavel = EQUIPE.find(p => p.tipo === "responsavel" && p.eixoVinculo === eixo);
  const instrutores = EQUIPE.filter(p => p.tipo === "instrutor" && p.eixoVinculo === eixo);
  const admins = EQUIPE.filter(p => p.tipo === "administrativo" && p.eixoVinculo === eixo);
  const ec = EIXO_COLOR[eixo] ?? { bg: "bg-gray-50", text: "text-gray-700", ring: "ring-gray-200" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="h-1.5 w-full" style={{ background: responsavel?.cor ?? "#003F7D" }} />

        {/* Header */}
        <div className={`px-6 py-5 flex items-center justify-between ${ec.bg} border-b border-gray-100`}>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Eixo Tecnológico</p>
            <h2 className={`text-xl font-bold ${ec.text}`}>{eixo}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white/60 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* Responsável */}
          {responsavel && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Layers size={12} /> Responsável de Eixo
              </p>
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <Avatar pessoa={responsavel} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{responsavel.nome}</p>
                  <p className="text-sm text-gray-500">{responsavel.cargo}</p>
                  <a href={`mailto:${responsavel.contato}`} className="flex items-center gap-1 text-xs text-[#003F7D] hover:text-[#F57C00] mt-1 transition-colors">
                    <Mail size={11} /> {responsavel.contato}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Instrutores */}
          {instrutores.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <GraduationCap size={12} /> Instrutores ({instrutores.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {instrutores.map(p => (
                  <div key={p.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                    <Avatar pessoa={p} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{p.nome}</p>
                      <a href={`mailto:${p.contato}`} className="flex items-center gap-1 text-xs text-[#003F7D] hover:text-[#F57C00] mt-0.5 transition-colors">
                        <Mail size={10} /> {p.contato}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Administrativos */}
          {admins.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Building2 size={12} /> Administrativos ({admins.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {admins.map(p => (
                  <div key={p.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                    <Avatar pessoa={p} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{p.nome}</p>
                      <a href={`mailto:${p.contato}`} className="flex items-center gap-1 text-xs text-[#003F7D] hover:text-[#F57C00] mt-0.5 transition-colors">
                        <Mail size={10} /> {p.contato}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {instrutores.length === 0 && admins.length === 0 && (
            <p className="text-sm text-gray-400 italic text-center py-4">Nenhum membro vinculado a este eixo ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export function Ceped() {
  const [eixoModal, setEixoModal] = useState<string | null>(null);

  const totais = {
    total: EQUIPE.length,
    instrutores: EQUIPE.filter(p => p.tipo === "instrutor").length,
    responsaveis: EQUIPE.filter(p => p.tipo === "responsavel").length,
    administrativos: EQUIPE.filter(p => p.tipo === "administrativo").length,
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header institucional */}
      <div className="bg-gradient-to-r from-[#003F7D] to-[#00569F] pt-20 pb-10 px-6 lg:pt-10 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0 shadow-inner">
              <GraduationCap size={32} className="text-white" />
            </div>
            <div className="text-white">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-1">SENAC DF</p>
              <h1 className="text-3xl font-extrabold">CEPED</h1>
              <p className="text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                Coordenação de Educação Profissional e Desenvolvimento. Responsável pelo planejamento, supervisão e execução das atividades de ensino profissional no SENAC DF, coordenando os eixos tecnológicos, os processos pedagógicos e o desenvolvimento das equipes de instrutores e administrativos.
              </p>
              <div className="flex flex-wrap gap-4 mt-5">
                <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold">{totais.total}</p>
                  <p className="text-xs text-white/70">Colaboradores</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold">6</p>
                  <p className="text-xs text-white/70">Eixos</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold">{totais.instrutores}</p>
                  <p className="text-xs text-white/70">Instrutores</p>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                  <p className="text-2xl font-bold">{totais.administrativos}</p>
                  <p className="text-xs text-white/70">Administrativos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10 space-y-12">
        {/* Organograma */}
        <section>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-1 h-5 rounded-full bg-[#F57C00]" />
            <h2 className="text-lg font-bold text-[#003F7D]">Organograma da Equipe</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm overflow-x-auto">
            <Organograma onEixoClick={eixo => setEixoModal(eixo)} />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Clique em um eixo para ver os membros vinculados
          </p>
        </section>

        {/* Cards por tipo */}
        <section>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-1 h-5 rounded-full bg-[#F57C00]" />
            <h2 className="text-lg font-bold text-[#003F7D]">Equipe por Função</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ordenador */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-[#003F7D] uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <Star size={12} /> Ordenador
              </p>
              {EQUIPE.filter(p => p.tipo === "ordenador").map(p => (
                <PessoaCard key={p.id} pessoa={p} />
              ))}
            </div>

            {/* Assistentes */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <Briefcase size={12} /> Assistentes Administrativos
              </p>
              <div className="space-y-3">
                {EQUIPE.filter(p => p.tipo === "assistente").map(p => (
                  <PessoaCard key={p.id} pessoa={p} compact />
                ))}
              </div>
            </div>

            {/* Responsáveis de eixo */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm lg:col-span-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <Layers size={12} /> Responsáveis de Eixo
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {EQUIPE.filter(p => p.tipo === "responsavel").map(p => (
                  <PessoaCard key={p.id} pessoa={p} compact onClick={() => setEixoModal(p.eixoVinculo!)} />
                ))}
              </div>
            </div>

            {/* Instrutores */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <GraduationCap size={12} /> Instrutores Vinculados ({totais.instrutores})
              </p>
              <div className="space-y-2">
                {EQUIPE.filter(p => p.tipo === "instrutor").map(p => (
                  <PessoaCard key={p.id} pessoa={p} compact />
                ))}
              </div>
            </div>

            {/* Administrativos */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <Building2 size={12} /> Administrativos Vinculados ({totais.administrativos})
              </p>
              <div className="space-y-2">
                {EQUIPE.filter(p => p.tipo === "administrativo").map(p => (
                  <PessoaCard key={p.id} pessoa={p} compact />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Carômetro */}
        <section>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-1 h-5 rounded-full bg-[#F57C00]" />
            <h2 className="text-lg font-bold text-[#003F7D]">Carômetro da Equipe</h2>
            <span className="text-xs text-gray-400 ml-1">— clique para ver detalhes</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <Carometro />
          </div>
        </section>
      </div>

      {/* Modal de eixo */}
      {eixoModal && <ModalEixo eixo={eixoModal} onClose={() => setEixoModal(null)} />}
    </div>
  );
}
