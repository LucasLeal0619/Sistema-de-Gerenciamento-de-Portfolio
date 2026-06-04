import { useState } from "react";
import { Link } from "react-router";
import { SenacLogo } from "../components/SenacLogo";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

export function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simular envio de email
    alert("Email de recuperação enviado!");
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
          <h1 className="text-2xl font-semibold mb-1">Recuperação de conta</h1>
          <p className="text-gray-600 text-sm">Informe o seu email</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button
            type="submit"
            className="w-full bg-[#F57C00] hover:bg-[#E86D00] text-white h-11"
          >
            Enviar
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
