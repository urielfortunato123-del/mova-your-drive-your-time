import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Mail, Lock, Eye, EyeOff, User, Download, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { InstallBanner } from "@/components/InstallBanner";
import { toast } from "sonner";
import movaCar from "@/assets/mova-car.png";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

const signUpSchema = z.object({
  name: z.string().trim().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.string().trim().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { login, signUp, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { isInstalled } = usePWAInstall();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isForgotPassword) {
        const emailValidation = z.string().trim().email({ message: "E-mail inválido" }).safeParse(email);
        if (!emailValidation.success) {
          toast.error(emailValidation.error.errors[0].message);
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/`,
        });

        if (error) {
          toast.error("Erro ao enviar e-mail de recuperação");
        } else {
          toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
          setIsForgotPassword(false);
        }
      } else if (isSignUp) {
        const validation = signUpSchema.safeParse({ name, email, password });
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setIsLoading(false);
          return;
        }

        const { error } = await signUp(email, password, name);
        if (error) {
          toast.error(error);
        } else {
          toast.success("Conta criada com sucesso! Bem-vindo!");
          navigate("/dashboard");
        }
      } else {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          setIsLoading(false);
          return;
        }

        const { error } = await login(email, password);
        if (error) {
          toast.error(error);
        } else {
          toast.success("Bem-vindo de volta!");
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast.error("Erro ao processar sua solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Theme Toggle */}
      <div className="absolute top-4 left-4 z-20">
        <ThemeToggle />
      </div>

      {/* Header Section with Car Image */}
      <div className="relative overflow-hidden animate-fade-in" style={{ height: '32vh' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background z-10" />
        <img
          src={movaCar}
          alt="MOVA - Carro"
          className="w-full h-full object-cover"
        />
        
        {/* Install App Button */}
        {!isInstalled && (
          <Link 
            to="/install"
            className="absolute top-4 right-4 flex items-center gap-2 glass text-foreground px-4 py-2.5 rounded-xl shadow-lg hover:bg-card transition-all duration-200 z-20"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Instalar</span>
          </Link>
        )}
      </div>

      {/* Form Section */}
      <div className="flex-1 bg-card rounded-t-[2rem] px-6 py-8 animate-slide-up relative z-10 -mt-6 shadow-xl">
        {isForgotPassword && (
          <button
            type="button"
            onClick={() => setIsForgotPassword(false)}
            className="flex items-center gap-1 text-muted-foreground hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </button>
        )}
        
        {/* Logo/Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-display font-bold text-gradient-primary mb-2">MOVA</h1>
          <p className="text-muted-foreground text-sm">
            {isForgotPassword 
              ? "Digite seu e-mail para recuperar a senha" 
              : isSignUp 
                ? "Crie sua conta e comece a dirigir" 
                : "Motorista • Mobilidade que respeita seu tempo"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && !isForgotPassword && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome completo
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-12"
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12"
                required
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold mt-6"
            disabled={isLoading}
          >
            {isLoading 
              ? (isForgotPassword ? "Enviando..." : isSignUp ? "Criando conta..." : "Entrando...") 
              : (isForgotPassword ? "Enviar link" : isSignUp ? "Criar conta" : "Entrar")}
          </Button>
        </form>

        {!isForgotPassword && (
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-center text-sm text-primary hover:text-primary/80 mt-4 py-2 transition-colors font-semibold"
          >
            {isSignUp ? "Já tenho uma conta" : "Criar nova conta"}
          </button>
        )}

        {!isSignUp && !isForgotPassword && (
          <button 
            onClick={() => setIsForgotPassword(true)}
            className="w-full text-center text-sm text-muted-foreground hover:text-primary mt-2 py-2 transition-colors"
          >
            Esqueci minha senha
          </button>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          {isForgotPassword 
            ? "Você receberá um e-mail com instruções para redefinir sua senha."
            : `Ao ${isSignUp ? "criar sua conta" : "entrar"}, você concorda com nossos Termos de Uso e Política de Privacidade.`}
        </p>
      </div>

      {/* Floating Install Banner */}
      <InstallBanner delay={3000} />
    </div>
  );
}
