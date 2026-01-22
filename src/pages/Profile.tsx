import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { 
  User, 
  Car, 
  MapPin, 
  CheckCircle, 
  Settings, 
  LogOut,
  ChevronRight,
  Mail,
  Phone,
  Star,
  Camera,
  Moon,
  Sun,
  Monitor
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

// Mock rating stats (will be replaced with real data from database)
const ratingStats = {
  average: 4.7,
  total: 142,
  breakdown: { 5: 98, 4: 35, 3: 9 }
};

export default function Profile() {
  const navigate = useNavigate();
  const { driver, logout, refreshDriver } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const { uploadPhoto, uploading } = useProfilePhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    toast.success("Até logo!");
    navigate("/");
  };

  const handleEdit = () => {
    toast.info("Edição de perfil disponível em breve!");
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && driver) {
      const newPhotoUrl = await uploadPhoto(file, driver.id);
      if (newPhotoUrl) {
        refreshDriver();
      }
    }
  };

  const handleThemeToggle = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-5 h-5" />;
    if (theme === 'light') return <Sun className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const getThemeLabel = () => {
    if (theme === 'dark') return 'Escuro';
    if (theme === 'light') return 'Claro';
    return 'Sistema';
  };

  if (!driver) {
    return null;
  }

  return (
    <PageContainer title="Perfil" showStatus={false}>
      <div className="space-y-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />

        {/* Profile Header */}
        <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePhotoClick}
              disabled={uploading}
              className="relative w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center group overflow-hidden"
            >
              {driver.photo ? (
                <img 
                  src={driver.photo} 
                  alt={driver.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
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

        {/* Rating Stats */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Avaliações Dadas</h3>
          <div className="flex items-center gap-4">
            {/* Average */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <span className="text-3xl font-bold text-foreground">{ratingStats.average}</span>
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              </div>
              <span className="text-xs text-muted-foreground">{ratingStats.total} avaliações</span>
            </div>
            
            {/* Breakdown bars */}
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3].map((stars) => {
                const count = ratingStats.breakdown[stars as keyof typeof ratingStats.breakdown];
                const percentage = (count / ratingStats.total) * 100;
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-3">{stars}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
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

        {/* Theme Toggle */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getThemeIcon()}
              <div>
                <p className="font-medium text-foreground">Tema</p>
                <p className="text-sm text-muted-foreground">{getThemeLabel()}</p>
              </div>
            </div>
            <Button
              onClick={handleThemeToggle}
              variant="outline"
              size="sm"
            >
              Alterar
            </Button>
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
