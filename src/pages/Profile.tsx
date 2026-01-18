import React from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  User, 
  Car, 
  MapPin, 
  CheckCircle, 
  Settings, 
  LogOut,
  ChevronRight,
  Mail,
  Phone
} from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const navigate = useNavigate();
  const { driver, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Até logo!");
    navigate("/");
  };

  const handleEdit = () => {
    toast.info("Edição de perfil disponível em breve!");
  };

  if (!driver) {
    return null;
  }

  return (
    <PageContainer title="Perfil" showStatus={false}>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              {driver.photo ? (
                <img 
                  src={driver.photo} 
                  alt={driver.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-display font-bold text-foreground">
                {driver.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 bg-available/10 text-available text-xs font-medium px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Motorista ativo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="space-y-3 animate-slide-up">
          {/* Contact Info */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">{driver.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">{driver.phone}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Veículo</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">{driver.vehicle}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">ABC</span>
                </div>
                <span className="text-foreground font-mono">{driver.plate}</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Localização</h3>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">{driver.city}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-slide-up">
          <Button
            onClick={handleEdit}
            variant="outline"
            className="w-full justify-between h-12"
          >
            <span className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Editar Perfil
            </span>
            <ChevronRight className="w-5 h-5" />
          </Button>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-between h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Sair
            </span>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground">
          MOVA Motorista v1.0.0
        </p>
      </div>
    </PageContainer>
  );
}
