import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-foreground"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Section with Car Image - show full car */}
      <div className="relative overflow-hidden animate-fade-in" style={{ height: '35vh' }}>
        <img
          src={movaCar}
          alt="MOVA - Carro"
          className="w-full h-full object-cover"
        />
        
        {/* Install App Button */}
        {!isInstalled && (
          <Link 
            to="/install"
            className="absolute top-4 right-4 flex items-center gap-2 bg-background/90 backdrop-blur-sm text-foreground px-4 py-2 rounded-full shadow-lg hover:bg-background transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Instalar App</span>
          </Link>
        )}
      </div>

      {/* Form Section */}
      <div className="bg-card rounded-t-3xl px-6 py-8 animate-slide-up relative z-10">
        {isForgotPassword && (
          <button
            type="button"
            onClick={() => setIsForgotPassword(false)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Voltar</span>
          </button>
        )}
        <p className="text-primary text-center animate-fade-in text-xl font-semibold mb-2">
          {isForgotPassword ? "Recuperar Senha" : "Motorista"}
        </p>
        <p className="text-center text-muted-foreground text-sm mb-6">
          {isForgotPassword 
            ? "Digite seu e-mail para receber o link de recuperação." 
            : isSignUp 
              ? "Crie sua conta e comece a dirigir." 
              : "Mobilidade que respeita seu tempo."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && !isForgotPassword && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome completo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 bg-secondary border-0"
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

          {!isForgotPassword && (
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
          )}

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading 
              ? (isForgotPassword ? "Enviando..." : isSignUp ? "Criando conta..." : "Entrando...") 
              : (isForgotPassword ? "Enviar link de recuperação" : isSignUp ? "Criar conta" : "Entrar")}
          </Button>
        </form>

        {!isForgotPassword && (
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-center text-sm text-primary hover:text-primary/80 mt-4 py-2 transition-colors font-medium"
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
