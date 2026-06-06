import { useMemo, useRef, useState } from "react";
import {
  Briefcase,
  Building2,
  ChevronRight,
  Edit2,
  GraduationCap,
  Info,
  Layers,
  Mail,
  Plus,
  RotateCcw,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useConfirm } from "../components/ConfirmProvider";
import { Button } from "../components/ui/button";
import {
  deleteCepedPessoa,
  getCepedEquipe,
  resetCepedEquipeDemo,
  saveCepedPessoa,
  updateCepedPessoa,
  type CepedPessoaInput,
  type CepedPessoaRecord,
  type CepedTipo,
} from "../utils/store";
import { toastError, toastSuccess } from "../utils/toast";

const EIXO_COLOR: Record<string, { bg: string; text: string; ring: string }> = {
  Gastronomia: { bg: "bg-orange-50", text: "text-orange-800", ring: "ring-orange-200" },
  "Beleza e Cuidado Pessoal": { bg: "bg-pink-50", text: "text-pink-800", ring: "ring-pink-200" },
  "Gestão e Negócios": { bg: "bg-blue-50", text: "text-blue-800", ring: "ring-blue-200" },
  "Tecnologia e Economia Criativa": {
    bg: "bg-purple-50",
    text: "text-purple-800",
    ring: "ring-purple-200",
  },
  "Ambiente e Saúde": { bg: "bg-green-50", text: "text-green-800", ring: "ring-green-200" },
  "Gestão e Moda": { bg: "bg-rose-50", text: "text-rose-800", ring: "ring-rose-200" },
};

const SETOR_OPCOES = [
  ...Object.keys(EIXO_COLOR),
  "CEPED",
  "Secretaria Geral",
  "Secretaria",
  "TI / Sistemas",
  "Financeiro",
  "Patrimônio",
];

const TIPO_LABEL: Record<CepedTipo, string> = {
  ordenador: "Ordenador",
  assistente: "Assistente Administrativo",
  responsavel: "Responsável de Eixo",
  instrutor: "Instrutor",
  administrativo: "Administrativo",
};

const TIPO_ICON: Record<CepedTipo, React.ReactNode> = {
  ordenador: <Star size={13} />,
  assistente: <Briefcase size={13} />,
  responsavel: <Layers size={13} />,
  instrutor: <GraduationCap size={13} />,
  administrativo: <Building2 size={13} />,
};

const EMPTY_FORM: CepedPessoaInput = {
  nome: "",
  cargo: "",
  setor: "CEPED",
  contato: "",
  tipo: "assistente",
  eixoVinculo: "",
  iniciais: "",
  cor: "#003F7D",
  foto: "",
};

function computeIniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ""}${partes[1][0] ?? ""}`.toUpperCase();
}

function precisaEixo(tipo: CepedTipo) {
  return tipo === "responsavel" || tipo === "instrutor";
}

function Avatar({
  pessoa,
  size = "md",
}: {
  pessoa: CepedPessoaRecord;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sz = {
    sm: "w-9 h-9 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-20 h-20 text-xl",
  }[size];

  if (pessoa.foto) {
    return (
      <img
        src={pessoa.foto}
        alt={pessoa.nome}
        className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow`}
      />
    );
  }

  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ring-2 ring-white shadow`}
      style={{ backgroundColor: pessoa.cor ?? "#003F7D" }}
    >
      {pessoa.iniciais ?? computeIniciais(pessoa.nome)}
    </div>
  );
}

function AcoesMembro({
  onEdit,
  onDelete,
  className = "",
}: {
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
        title="Editar"
      >
        <Edit2 size={14} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
        title="Excluir"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function PessoaCard({
  pessoa,
  onClick,
  onEdit,
  onDelete,
  compact,
}: {
  pessoa: CepedPessoaRecord;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}) {
  const eixoStyle = EIXO_COLOR[pessoa.setor] ?? {
    bg: "bg-gray-50",
    text: "text-gray-600",
    ring: "ring-gray-200",
  };

  return (
    <div
      onClick={onClick}
      className={`relative group bg-white rounded-xl border border-gray-200 shadow-sm transition-all ${
        onClick ? "cursor-pointer hover:shadow-md hover:border-[#003F7D]/30 hover:-translate-y-0.5" : ""
      } ${compact ? "p-3" : "p-5"}`}
    >
      {onEdit && onDelete && (
        <AcoesMembro
          onEdit={onEdit}
          onDelete={onDelete}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
      <div className={`flex ${compact ? "items-center gap-3" : "flex-col items-center text-center gap-3"}`}>
        <Avatar pessoa={pessoa} size={compact ? "sm" : "lg"} />
        <div className={compact ? "flex-1 min-w-0" : ""}>
          <p className={`font-semibold text-gray-900 ${compact ? "text-sm truncate" : "text-base"}`}>
            {pessoa.nome}
          </p>
          <p className={`text-gray-500 ${compact ? "text-xs truncate" : "text-sm mt-0.5"}`}>
            {pessoa.cargo}
          </p>
          {!compact && (
            <>
              <div
                className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${eixoStyle.bg} ${eixoStyle.text}`}
              >
                {pessoa.setor}
              </div>
              <a
                href={`mailto:${pessoa.contato}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1.5 mt-3 text-xs text-[#003F7D] hover:text-[#F57C00] transition-colors"
              >
                <Mail size={12} /> {pessoa.contato}
              </a>
            </>
          )}
        </div>
        {onClick && <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
      </div>
    </div>
  );
}

function Organograma({
  equipe,
  onEixoClick,
}: {
  equipe: CepedPessoaRecord[];
  onEixoClick: (eixo: string) => void;
}) {
  const ordenador = equipe.find((p) => p.tipo === "ordenador");
  const assistentes = equipe.filter((p) => p.tipo === "assistente");
  const responsaveis = equipe.filter((p) => p.tipo === "responsavel");

  if (!ordenador && !assistentes.length && !responsaveis.length) {
    return (
      <p className="text-center text-sm text-gray-500 py-8">
        Nenhum membro cadastrado. Use &quot;Novo Membro&quot; para montar o organograma.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0">
      {ordenador && (
        <div className="flex flex-col items-center">
          <div className="bg-[#003F7D] text-white rounded-xl px-6 py-3 flex items-center gap-3 shadow-lg">
            <Avatar pessoa={ordenador} size="md" />
            <div>
              <p className="font-bold text-sm">{ordenador.nome}</p>
              <p className="text-xs text-white/70">{ordenador.cargo}</p>
            </div>
          </div>
          <div className="w-px h-6 bg-gray-300" />
        </div>
      )}

      {assistentes.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="flex gap-4 flex-wrap justify-center">
            {assistentes.map((p) => (
              <div
                key={p.id}
                className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-sm"
              >
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
      )}

      {responsaveis.length > 0 && (
        <div className="flex flex-col items-center w-full">
          <div className="w-full flex items-start justify-center">
            <div className="relative flex items-start justify-center w-full max-w-4xl">
              <div className="absolute top-0 left-[calc(1/12*100%)] right-[calc(1/12*100%)] h-px bg-gray-300" />
              <div className="flex gap-3 w-full justify-center flex-wrap">
                {responsaveis.map((p) => {
                  const ec = EIXO_COLOR[p.setor] ?? {
                    bg: "bg-gray-50",
                    text: "text-gray-700",
                    ring: "ring-gray-200",
                  };
                  return (
                    <div key={p.id} className="flex flex-col items-center">
                      <div className="w-px h-4 bg-gray-300" />
                      <button
                        type="button"
                        onClick={() => onEixoClick(p.eixoVinculo || p.setor)}
                        className={`${ec.bg} border ring-1 ${ec.ring} rounded-xl px-3 py-2.5 flex flex-col items-center gap-1.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all w-28 group`}
                      >
                        <Avatar pessoa={p} size="sm" />
                        <p className="text-[10px] font-bold text-gray-800 text-center leading-tight">
                          {p.setor}
                        </p>
                        <p className="text-[9px] text-gray-500 truncate w-full text-center">
                          {p.nome.split(" ").slice(0, 2).join(" ")}
                        </p>
                        <span
                          className={`text-[9px] font-semibold ${ec.text} flex items-center gap-0.5 group-hover:underline`}
                        >
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
      )}
    </div>
  );
}

const FILTROS_TIPO: { label: string; value: string }[] = [
  { label: "Todos", value: "todos" },
  { label: "Ordenador", value: "ordenador" },
  { label: "Assistentes", value: "assistente" },
  { label: "Resp. de Eixo", value: "responsavel" },
  { label: "Instrutores", value: "instrutor" },
  { label: "Administrativos", value: "administrativo" },
];

function Carometro({
  equipe,
  onView,
  onEdit,
  onDelete,
}: {
  equipe: CepedPessoaRecord[];
  onView: (pessoa: CepedPessoaRecord) => void;
  onEdit: (pessoa: CepedPessoaRecord) => void;
  onDelete: (pessoa: CepedPessoaRecord) => void;
}) {
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterEixo, setFilterEixo] = useState("todos");

  const eixos = [...new Set(equipe.map((p) => p.setor).filter((s) => EIXO_COLOR[s]))];

  const filtrados = equipe.filter((p) => {
    if (filterTipo !== "todos" && p.tipo !== filterTipo) return false;
    if (filterEixo !== "todos" && p.setor !== filterEixo) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTROS_TIPO.map((f) => (
          <button
            key={f.value}
            type="button"
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
          type="button"
          onClick={() => setFilterEixo("todos")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            filterEixo === "todos"
              ? "bg-gray-700 text-white border-gray-700"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          Todos os eixos
        </button>
        {eixos.map((e) => {
          const ec = EIXO_COLOR[e];
          return (
            <button
              key={e}
              type="button"
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtrados.map((p) => {
          const ec = EIXO_COLOR[p.setor] ?? {
            bg: "bg-gray-50",
            text: "text-gray-600",
            ring: "ring-gray-100",
          };
          return (
            <div
              key={p.id}
              className="group relative bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center gap-3 hover:shadow-lg hover:-translate-y-1 transition-all text-left"
            >
              <AcoesMembro
                onEdit={() => onEdit(p)}
                onDelete={() => onDelete(p)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              />
              <button
                type="button"
                onClick={() => onView(p)}
                className="flex flex-col items-center gap-3 w-full"
              >
                <div className="relative">
                  <Avatar pessoa={p} size="xl" />
                  <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow">
                    <span
                      className={`flex items-center justify-center w-5 h-5 rounded-full ${ec.bg} ${ec.text}`}
                    >
                      {TIPO_ICON[p.tipo]}
                    </span>
                  </span>
                </div>
                <div className="text-center w-full">
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{p.nome}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.cargo}</p>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium ${ec.bg} ${ec.text}`}
                  >
                    {p.setor}
                  </span>
                </div>
                <span className="text-[10px] text-[#003F7D] opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver detalhes →
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {filtrados.length === 0 && (
        <div className="py-16 text-center">
          <Users size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">Nenhuma pessoa encontrada para os filtros selecionados.</p>
        </div>
      )}
    </div>
  );
}

function ModalDetalhePessoa({
  pessoa,
  onClose,
  onEdit,
  onDelete,
}: {
  pessoa: CepedPessoaRecord;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ec = EIXO_COLOR[pessoa.setor] ?? { bg: "bg-gray-100", text: "text-gray-600" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-24 w-full" style={{ backgroundColor: pessoa.cor ?? "#003F7D" }} />
        <div className="px-6 pb-6 -mt-10 flex flex-col items-center text-center">
          <div className="ring-4 ring-white rounded-full mb-3">
            <Avatar pessoa={pessoa} size="xl" />
          </div>
          <p className="font-bold text-gray-900 text-lg leading-tight">{pessoa.nome}</p>
          <p className="text-sm text-gray-500 mt-0.5">{pessoa.cargo}</p>
          <div className="mt-3 flex items-center gap-1.5 flex-wrap justify-center">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ec.bg} ${ec.text}`}>
              {pessoa.setor}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              {TIPO_LABEL[pessoa.tipo]}
            </span>
          </div>
          <a
            href={`mailto:${pessoa.contato}`}
            className="mt-4 flex items-center gap-2 text-sm text-[#003F7D] hover:text-[#F57C00] transition-colors"
          >
            <Mail size={14} /> {pessoa.contato}
          </a>
        </div>
        <div className="border-t border-gray-100 px-6 py-3 flex justify-between items-center gap-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit2 size={14} className="mr-1" /> Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={onDelete}
            >
              <Trash2 size={14} className="mr-1" /> Excluir
            </Button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X size={14} /> Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalEixo({
  equipe,
  eixo,
  onClose,
}: {
  equipe: CepedPessoaRecord[];
  eixo: string;
  onClose: () => void;
}) {
  const responsavel = equipe.find((p) => p.tipo === "responsavel" && p.eixoVinculo === eixo);
  const instrutores = equipe.filter((p) => p.tipo === "instrutor" && p.eixoVinculo === eixo);
  const admins = equipe.filter((p) => p.tipo === "administrativo" && p.eixoVinculo === eixo);
  const ec = EIXO_COLOR[eixo] ?? { bg: "bg-gray-50", text: "text-gray-700", ring: "ring-gray-200" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full" style={{ background: responsavel?.cor ?? "#003F7D" }} />
        <div className={`px-6 py-5 flex items-center justify-between ${ec.bg} border-b border-gray-100`}>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
              Eixo Tecnológico
            </p>
            <h2 className={`text-xl font-bold ${ec.text}`}>{eixo}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 space-y-6">
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
                  <a
                    href={`mailto:${responsavel.contato}`}
                    className="flex items-center gap-1 text-xs text-[#003F7D] hover:text-[#F57C00] mt-1 transition-colors"
                  >
                    <Mail size={11} /> {responsavel.contato}
                  </a>
                </div>
              </div>
            </div>
          )}
          {instrutores.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <GraduationCap size={12} /> Instrutores ({instrutores.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {instrutores.map((p) => (
                  <div
                    key={p.id}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3"
                  >
                    <Avatar pessoa={p} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{p.nome}</p>
                      <a
                        href={`mailto:${p.contato}`}
                        className="flex items-center gap-1 text-xs text-[#003F7D] hover:text-[#F57C00] mt-0.5 transition-colors"
                      >
                        <Mail size={10} /> {p.contato}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {admins.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Building2 size={12} /> Administrativos ({admins.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {admins.map((p) => (
                  <div
                    key={p.id}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3"
                  >
                    <Avatar pessoa={p} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{p.nome}</p>
                      <a
                        href={`mailto:${p.contato}`}
                        className="flex items-center gap-1 text-xs text-[#003F7D] hover:text-[#F57C00] mt-0.5 transition-colors"
                      >
                        <Mail size={10} /> {p.contato}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {instrutores.length === 0 && admins.length === 0 && !responsavel && (
            <p className="text-sm text-gray-400 italic text-center py-4">
              Nenhum membro vinculado a este eixo ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function MembroFormModal({
  open,
  editing,
  form,
  setForm,
  onClose,
  onSave,
}: {
  open: boolean;
  editing: CepedPessoaRecord | null;
  form: CepedPessoaInput;
  setForm: React.Dispatch<React.SetStateAction<CepedPessoaInput>>;
  onClose: () => void;
  onSave: () => void;
}) {
  const fotoRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const update = (field: keyof CepedPessoaInput, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "nome" && !editing) {
        next.iniciais = computeIniciais(value);
      }
      if (field === "setor" && precisaEixo(next.tipo)) {
        next.eixoVinculo = value;
      }
      if (field === "tipo" && precisaEixo(value as CepedTipo)) {
        next.eixoVinculo = next.setor;
      }
      return next;
    });
  };

  const handleFoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toastError("Selecione um arquivo de imagem (JPG, PNG ou WebP).");
      return;
    }
    if (file.size > 400 * 1024) {
      toastError("A foto deve ter no máximo 400 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update("foto", String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editing ? "Editar Membro" : "Novo Membro"}
            </h2>
            <p className="text-sm text-gray-500">
              Cadastre ou atualize dados do organograma e carômetro CEPED.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <div className="md:col-span-2 flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
            {form.foto ? (
              <img src={form.foto} alt="Prévia" className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow" />
            ) : (
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full text-xl font-bold text-white shadow"
                style={{ backgroundColor: form.cor || "#003F7D" }}
              >
                {form.iniciais || computeIniciais(form.nome) || "?"}
              </div>
            )}
            <input
              ref={fotoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFoto(e.target.files?.[0])}
            />
            <div className="flex flex-wrap gap-2 justify-center">
              <Button type="button" variant="outline" size="sm" onClick={() => fotoRef.current?.click()}>
                <Upload size={14} className="mr-1" /> Enviar foto
              </Button>
              {form.foto && (
                <Button type="button" variant="outline" size="sm" onClick={() => update("foto", "")}>
                  Remover foto
                </Button>
              )}
            </div>
          </div>

          <Field label="Nome completo *">
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
            />
          </Field>

          <Field label="Cargo / Função *">
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={form.cargo}
              onChange={(e) => update("cargo", e.target.value)}
            />
          </Field>

          <Field label="Tipo *">
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={form.tipo}
              onChange={(e) => update("tipo", e.target.value)}
            >
              {(Object.keys(TIPO_LABEL) as CepedTipo[]).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {TIPO_LABEL[tipo]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Setor / Eixo *">
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={form.setor}
              onChange={(e) => update("setor", e.target.value)}
            >
              {SETOR_OPCOES.map((setor) => (
                <option key={setor} value={setor}>
                  {setor}
                </option>
              ))}
            </select>
          </Field>

          {precisaEixo(form.tipo) && (
            <Field label="Eixo vinculado">
              <select
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={form.eixoVinculo || form.setor}
                onChange={(e) => update("eixoVinculo", e.target.value)}
              >
                {Object.keys(EIXO_COLOR).map((eixo) => (
                  <option key={eixo} value={eixo}>
                    {eixo}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="E-mail de contato *">
            <input
              type="email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={form.contato}
              onChange={(e) => update("contato", e.target.value)}
            />
          </Field>

          <Field label="Iniciais (avatar sem foto)">
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase"
              maxLength={3}
              value={form.iniciais || ""}
              onChange={(e) => update("iniciais", e.target.value.toUpperCase())}
            />
          </Field>

          <Field label="Cor do avatar">
            <input
              type="color"
              className="h-10 w-full rounded-lg border border-gray-200 cursor-pointer"
              value={form.cor || "#003F7D"}
              onChange={(e) => update("cor", e.target.value)}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 p-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={onSave} className="bg-[#F57C00] hover:bg-[#E86D00] text-white">
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Ceped() {
  const confirm = useConfirm();
  const [equipe, setEquipe] = useState<CepedPessoaRecord[]>(() => getCepedEquipe());
  const [eixoModal, setEixoModal] = useState<string | null>(null);
  const [pessoaModal, setPessoaModal] = useState<CepedPessoaRecord | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editing, setEditing] = useState<CepedPessoaRecord | null>(null);
  const [form, setForm] = useState<CepedPessoaInput>(EMPTY_FORM);

  const refresh = () => setEquipe(getCepedEquipe());

  const totais = useMemo(
    () => ({
      total: equipe.length,
      instrutores: equipe.filter((p) => p.tipo === "instrutor").length,
      responsaveis: equipe.filter((p) => p.tipo === "responsavel").length,
      administrativos: equipe.filter((p) => p.tipo === "administrativo").length,
      eixos: new Set(equipe.filter((p) => p.tipo === "responsavel").map((p) => p.setor)).size,
    }),
    [equipe],
  );

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormModalOpen(true);
  };

  const openEdit = (record: CepedPessoaRecord) => {
    setEditing(record);
    setForm({
      nome: record.nome,
      cargo: record.cargo,
      setor: record.setor,
      contato: record.contato,
      tipo: record.tipo,
      eixoVinculo: record.eixoVinculo || "",
      iniciais: record.iniciais || computeIniciais(record.nome),
      cor: record.cor || "#003F7D",
      foto: record.foto || "",
    });
    setFormModalOpen(true);
    setPessoaModal(null);
  };

  const closeForm = () => {
    setFormModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.nome.trim() || !form.cargo.trim() || !form.contato.trim()) {
      toastError("Preencha nome, cargo e e-mail de contato.");
      return;
    }

    const payload: CepedPessoaInput = {
      ...form,
      iniciais: form.iniciais?.trim() || computeIniciais(form.nome),
      eixoVinculo: precisaEixo(form.tipo) ? form.eixoVinculo || form.setor : "",
      foto: form.foto || "",
    };

    if (
      form.tipo === "ordenador" &&
      equipe.some((p) => p.tipo === "ordenador" && p.id !== editing?.id)
    ) {
      toastError("Já existe um ordenador cadastrado. Edite o registro atual ou altere o tipo.");
      return;
    }

    if (editing) {
      updateCepedPessoa(editing.id, payload);
      toastSuccess("Membro atualizado.");
    } else {
      saveCepedPessoa(payload);
      toastSuccess("Membro cadastrado.");
    }

    refresh();
    closeForm();
  };

  const handleDelete = async (record: CepedPessoaRecord) => {
    const ok = await confirm({
      message: `Deseja excluir "${record.nome}" da equipe CEPED?`,
      destructive: true,
      confirmLabel: "Excluir",
    });
    if (!ok) return;
    deleteCepedPessoa(record.id);
    if (pessoaModal?.id === record.id) setPessoaModal(null);
    refresh();
    toastSuccess("Membro excluído.");
  };

  const handleResetDemo = async () => {
    const ok = await confirm({
      title: "Restaurar demonstração",
      message:
        "Deseja restaurar a equipe de demonstração original?\n\nAs alterações e fotos personalizadas serão substituídas.",
      destructive: true,
      confirmLabel: "Restaurar",
    });
    if (!ok) return;
    resetCepedEquipeDemo();
    refresh();
    toastSuccess("Equipe de demonstração restaurada.");
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="bg-gradient-to-r from-[#003F7D] to-[#00569F] pt-20 pb-10 px-6 lg:pt-10 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0 shadow-inner">
                <GraduationCap size={32} className="text-white" />
              </div>
              <div className="text-white">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-1">
                  SENAC DF
                </p>
                <h1 className="text-3xl font-extrabold">CEPED</h1>
                <p className="text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                  Coordenação de Educação Profissional e Desenvolvimento. Responsável pelo
                  planejamento, supervisão e execução das atividades de ensino profissional no SENAC
                  DF.
                </p>
                <div className="flex flex-wrap gap-4 mt-5">
                  <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                    <p className="text-2xl font-bold">{totais.total}</p>
                    <p className="text-xs text-white/70">Colaboradores</p>
                  </div>
                  <div className="bg-white/10 rounded-lg px-4 py-2 text-center">
                    <p className="text-2xl font-bold">{totais.eixos}</p>
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
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={openNew}
                className="bg-[#F57C00] hover:bg-[#E86D00] text-white"
              >
                <Plus size={16} className="mr-1" /> Novo Membro
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                onClick={handleResetDemo}
              >
                <RotateCcw size={16} className="mr-1" /> Restaurar demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-6 lg:px-8">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
          <div className="flex items-start gap-3">
            <Info size={20} className="mt-0.5 flex-shrink-0" />
            <div>
              <strong>Área institucional — equipe editável</strong>
              <p className="mt-1 text-sm leading-relaxed">
                Organograma e carômetro podem ser personalizados pela equipe CEPED. Use
                &quot;Novo Membro&quot; para cadastrar, edite nomes, cargos e fotos nos cards do
                carômetro, e restaure os dados de demonstração quando necessário. As alterações ficam
                salvas neste navegador.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10 space-y-12">
        <section>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-1 h-5 rounded-full bg-[#F57C00]" />
            <h2 className="text-lg font-bold text-[#003F7D]">Organograma da Equipe</h2>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm overflow-x-auto">
            <Organograma equipe={equipe} onEixoClick={(eixo) => setEixoModal(eixo)} />
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Clique em um eixo para ver os membros vinculados
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-1 h-5 rounded-full bg-[#F57C00]" />
            <h2 className="text-lg font-bold text-[#003F7D]">Equipe por Função</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm group">
              <p className="text-xs font-bold text-[#003F7D] uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <Star size={12} /> Ordenador
              </p>
              {equipe
                .filter((p) => p.tipo === "ordenador")
                .map((p) => (
                  <PessoaCard
                    key={p.id}
                    pessoa={p}
                    onEdit={() => openEdit(p)}
                    onDelete={() => handleDelete(p)}
                  />
                ))}
              {!equipe.some((p) => p.tipo === "ordenador") && (
                <p className="text-sm text-gray-400">Nenhum ordenador cadastrado.</p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <Briefcase size={12} /> Assistentes Administrativos
              </p>
              <div className="space-y-3">
                {equipe
                  .filter((p) => p.tipo === "assistente")
                  .map((p) => (
                    <div key={p.id} className="group relative">
                      <PessoaCard pessoa={p} compact onEdit={() => openEdit(p)} onDelete={() => handleDelete(p)} />
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm lg:col-span-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <Layers size={12} /> Responsáveis de Eixo
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {equipe
                  .filter((p) => p.tipo === "responsavel")
                  .map((p) => (
                    <div key={p.id} className="group relative">
                      <PessoaCard
                        pessoa={p}
                        compact
                        onClick={() => setEixoModal(p.eixoVinculo || p.setor)}
                        onEdit={() => openEdit(p)}
                        onDelete={() => handleDelete(p)}
                      />
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <GraduationCap size={12} /> Instrutores Vinculados ({totais.instrutores})
              </p>
              <div className="space-y-2">
                {equipe
                  .filter((p) => p.tipo === "instrutor")
                  .map((p) => (
                    <div key={p.id} className="group relative">
                      <PessoaCard pessoa={p} compact onEdit={() => openEdit(p)} onDelete={() => handleDelete(p)} />
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                <Building2 size={12} /> Administrativos Vinculados ({totais.administrativos})
              </p>
              <div className="space-y-2">
                {equipe
                  .filter((p) => p.tipo === "administrativo")
                  .map((p) => (
                    <div key={p.id} className="group relative">
                      <PessoaCard pessoa={p} compact onEdit={() => openEdit(p)} onDelete={() => handleDelete(p)} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-1 h-5 rounded-full bg-[#F57C00]" />
            <h2 className="text-lg font-bold text-[#003F7D]">Carômetro da Equipe</h2>
            <span className="text-xs text-gray-400 ml-1">— clique para ver detalhes</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <Carometro
              equipe={equipe}
              onView={setPessoaModal}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          </div>
        </section>
      </div>

      {eixoModal && (
        <ModalEixo equipe={equipe} eixo={eixoModal} onClose={() => setEixoModal(null)} />
      )}

      {pessoaModal && (
        <ModalDetalhePessoa
          pessoa={pessoaModal}
          onClose={() => setPessoaModal(null)}
          onEdit={() => openEdit(pessoaModal)}
          onDelete={() => handleDelete(pessoaModal)}
        />
      )}

      <MembroFormModal
        open={formModalOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        onClose={closeForm}
        onSave={handleSave}
      />
    </div>
  );
}
