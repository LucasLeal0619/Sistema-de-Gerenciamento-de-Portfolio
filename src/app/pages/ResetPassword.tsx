import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { SenacLogo } from "../components/SenacLogo";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export function ResetPassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    // Simular redefinição de senha
    alert("Senha redefinida com sucesso!");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#E8E8E8] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <SenacLogo />
        </div>

        <div className="text-center mb-8">
          <p className="text-gray-600 text-sm mb-4">
            Sistema de Gerenciamento de Portfólio
          </p>
          <h1 className="text-2xl font-semibold mb-1">Redefinir Senha</h1>
          <p className="text-gray-600 text-sm">Crie uma nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="newPassword" className="text-sm font-medium mb-2 block">
              Nova Senha
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-50 border-gray-200 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-medium mb-2 block">
              Confirmar Senha
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-50 border-gray-200 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#F57C00] hover:bg-[#E86D00] text-white h-11"
          >
            Salvar
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-700 text-sm hover:underline">
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  );
}
