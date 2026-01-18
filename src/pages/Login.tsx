import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import movaCar from "@/assets/mova-car.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success("Bem-vindo de volta!");
        navigate("/dashboard");
      } else {
        toast.error("E-mail ou senha incorretos");
      }
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Header Section with Car Image */}
      <div className="flex-1 flex flex-col items-center justify-end pb-6">
        <div className="w-full animate-fade-in">
          <img 
            src={movaCar} 
            alt="MOVA - Carro" 
            className="w-full h-auto object-cover"
          />
        </div>
        <p className="text-primary-foreground/70 text-center animate-fade-in text-xl mt-4">
          Motorista
        </p>
      </div>

      {/* Form Section */}
      <div className="bg-card rounded-t-3xl px-6 py-8 animate-slide-up">
        <p className="text-center text-muted-foreground text-sm mb-8">
          Mobilidade que respeita seu tempo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-secondary border-0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 bg-secondary border-0"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <button className="w-full text-center text-sm text-muted-foreground hover:text-primary mt-4 py-2 transition-colors">
          Esqueci minha senha
        </button>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </div>
  );
}
