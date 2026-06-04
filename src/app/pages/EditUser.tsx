import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { ChevronLeft, Save, User, Mail, MapPin, Shield } from "lucide-react";
import { getStoredUsers, updateUser, saveUser } from "../utils/store";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

const unidades = [
  "Asa Norte", "Taguatinga", "Gama", "Ceilândia", "Sobradinho",
  "Jessé Freire", "Santa Maria", "São Sebastião", "Brazlândia",
];

const perfis = [
  { value: "admin", label: "Administrador", desc: "Acesso total ao sistema" },
  { value: "editor", label: "Editor", desc: "Pode cadastrar e editar cursos" },
  { value: "consultivo", label: "Consultivo", desc: "Apenas visualização" },
];

export function EditUser() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExisting, setIsExisting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [formData, setFormData] = useState({
    nome: "", email: "", telefone: "", unidade: "", perfil: "", status: "online",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Tenta carregar do localStorage pelo id
    if (id && id !== "novo") {
      const users = getStoredUsers();
      const user = users.find(u => u.id === id);
      if (user) {
        setIsExisting(true);
        setFormData({
          nome: user.name,
          email: user.email,
          telefone: user.telefone === "—" ? "" : user.telefone,
          unidade: user.unidade,
          perfil: user.roleType,
          status: user.status,
        });
        return;
      }
    }
    // Fallback: dados passados via navigation state (prefill de usuário estático)
    const prefill = location.state?.prefill;
    if (prefill) {
      setIsExisting(false);
      setFormData({
        nome: prefill.name || "",
        email: prefill.email || "",
        telefone: prefill.telefone === "—" ? "" : (prefill.telefone || ""),
        unidade: prefill.unidade || "",
        perfil: prefill.roleType || "",
        status: prefill.status || "online",
      });
      return;
    }
    setNotFound(true);
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.nome.trim()) errs.nome = "Nome é obrigatório";
    if (!formData.email.trim()) errs.email = "E-mail é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = "E-mail inválido";
    if (!formData.unidade) errs.unidade = "Selecione a unidade";
    if (!formData.perfil) errs.perfil = "Selecione o perfil";
    return errs;
  };

  const roleLabel: Record<string, string> = { admin: "Administrador", editor: "Editor", consultivo: "Consultivo" };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    if (isExisting && id) {
      updateUser(id, {
        name: formData.nome,
        email: formData.email,
        telefone: formData.telefone || "—",
        unidade: formData.unidade,
        roleType: formData.perfil,
        role: roleLabel[formData.perfil] ?? formData.perfil,
        status: formData.status,
        avatar: formData.nome.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase(),
      });
    } else {
      saveUser({
        nome: formData.nome,
        email: formData.email,
        unidade: formData.unidade,
        perfil: formData.perfil,
        telefone: formData.telefone,
      });
    }

    navigate("/app/usuarios", { state: { success: `Usuário "${formData.nome}" atualizado com sucesso!` } });
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-600">
        <p className="text-lg font-semibold">Usuário não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/app/usuarios")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="h-1 w-full bg-[#F57C00]" />
      {/* Header */}
      <div className="border-b border-gray-200 px-4 lg:px-8 py-6 pt-20 lg:pt-6">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => navigate("/app/usuarios")}>
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#003F7D]">Editar Usuário</h1>
            <p className="text-gray-600 mt-1">{formData.nome || "Carregando..."}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 lg:px-8 py-8 max-w-3xl">

        {/* Dados Pessoais */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-[#003F7D]" />
            <h2 className="text-lg font-semibold text-[#003F7D]">Dados Pessoais</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="lg:col-span-2">
              <Label htmlFor="nome" className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Nome Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome" name="nome" value={formData.nome} onChange={handleChange}
                placeholder="Ex: Ana Paula Souza"
                className={`h-11 ${errors.nome ? "border-red-500" : ""}`}
              />
              {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-1.5 block">
                E-mail <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                  placeholder="usuario@senacdf.com.br"
                  className={`pl-9 h-11 ${errors.email ? "border-red-500" : ""}`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="telefone" className="text-sm font-semibold text-gray-700 mb-1.5 block">Telefone</Label>
              <Input
                id="telefone" name="telefone" value={formData.telefone} onChange={handleChange}
                placeholder="(61) 9 0000-0000" className="h-11"
              />
            </div>
          </div>
        </div>

        {/* Lotação */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-[#003F7D]" />
            <h2 className="text-lg font-semibold text-[#003F7D]">Lotação</h2>
          </div>
          <div>
            <Label htmlFor="unidade" className="text-sm font-semibold text-gray-700 mb-1.5 block">
              Unidade <span className="text-red-500">*</span>
            </Label>
            <select
              id="unidade" name="unidade" value={formData.unidade} onChange={handleChange}
              className={`w-full h-11 px-3 bg-white border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D] ${errors.unidade ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">Selecione a unidade</option>
              {unidades.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            {errors.unidade && <p className="text-red-500 text-xs mt-1">{errors.unidade}</p>}
          </div>
        </div>

        {/* Nível de Acesso */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-[#003F7D]" />
            <h2 className="text-lg font-semibold text-[#003F7D]">Nível de Acesso</h2>
          </div>
          <div>
            <Label htmlFor="perfil" className="text-sm font-semibold text-gray-700 mb-1.5 block">
              Perfil <span className="text-red-500">*</span>
            </Label>
            <select
              id="perfil" name="perfil" value={formData.perfil} onChange={handleChange}
              className={`w-full h-11 px-3 bg-white border rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D] ${errors.perfil ? "border-red-500" : "border-gray-300"}`}
            >
              <option value="">Selecione o nível de acesso</option>
              {perfis.map(p => <option key={p.value} value={p.value}>{p.label} — {p.desc}</option>)}
            </select>
            {errors.perfil && <p className="text-red-500 text-xs mt-1">{errors.perfil}</p>}
          </div>
        </div>

        {/* Status */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-[#003F7D]" />
            <h2 className="text-lg font-semibold text-[#003F7D]">Status</h2>
          </div>
          <select
            name="status" value={formData.status} onChange={handleChange}
            className="w-full h-11 px-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#003F7D]"
          >
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" className="bg-[#F57C00] hover:bg-[#E86D00] h-11 px-8 font-semibold gap-2">
            <Save size={16} />
            Salvar Alterações
          </Button>
          <Button type="button" variant="outline" className="h-11 px-6 gap-2" onClick={() => navigate("/app/usuarios")}>
            <ChevronLeft size={16} />
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
