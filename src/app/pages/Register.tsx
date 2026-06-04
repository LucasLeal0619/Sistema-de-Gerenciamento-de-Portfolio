import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { SenacLogo } from "../components/SenacLogo";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simular cadastro
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
          <h1 className="text-2xl font-semibold mb-1">Cadastro</h1>
          <p className="text-gray-600 text-sm">Crie a sua Conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium mb-2 block">
              Nome
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border-gray-200"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium mb-2 block">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border-gray-200"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium mb-2 block">
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <Button
            type="submit"
            className="w-full bg-[#F57C00] hover:bg-[#E86D00] text-white h-11"
          >
            Cadastrar
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Já possui conta? </span>
          <Link to="/" className="text-[#0066CC] hover:underline">
            Faça login
          </Link>
        </div>
      </div>
    </div>
  );
}
