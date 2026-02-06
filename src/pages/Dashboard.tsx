import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/ui/stat-card";
import { RideCard } from "@/components/ui/ride-card";
import { Button } from "@/components/ui/button";
import { DailyGoal } from "@/components/dashboard/DailyGoal";
import { RideOffersPanel } from "@/components/ride/RideOffersPanel";
import { useDriver } from "@/contexts/DriverContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium } from "@/hooks/usePremium";
import { Calendar, Clock, DollarSign, TrendingUp, MapPin, Power, Timer, ArrowRight, CreditCard, Crown, Star, Navigation } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Daily goal (can be made configurable later)
const DAILY_GOAL = 300;

export default function Dashboard() {
  const navigate = useNavigate();
  const { dailyStats, todayRides, isOnline, todayOnlineSeconds, toggleOnline, earnings } = useDriver();
  const { driver } = useAuth();
  const { isPremium } = usePremium();

  const nextRide = todayRides
    .filter(r => r.status === 'confirmed')
    .sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime())[0];

  const formatNextTime = () => {
    if (!dailyStats.nextRideTime) return "—";
    const time = new Date(dailyStats.nextRideTime);
    return format(time, "HH:mm", { locale: ptBR });
  };

  const formatOnlineTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <PageContainer title="MOVA">
      <div className="space-y-5">
        {/* Welcome Section */}
        <div className="animate-fade-in">
          <p className="text-muted-foreground text-sm">Olá,</p>
          <h2 className="text-2xl font-display font-bold text-foreground">
            {driver?.name?.split(' ')[0] || 'Motorista'}
          </h2>
        </div>

        {/* Online Toggle Section */}
        <div className={cn(
          "card-modern animate-fade-in overflow-hidden",
          isOnline && "border-primary/40 glow-primary"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                isOnline 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                  : "bg-secondary text-muted-foreground"
              )}>
                <Timer className="w-7 h-7" />
              </div>
              <div>
                <p className={cn(
                  "font-display font-bold text-lg",
                  isOnline ? "text-primary" : "text-muted-foreground"
                )}>
                  {isOnline ? "Online" : "Offline"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Hoje: <span className="font-mono font-semibold text-foreground">{formatOnlineTime(todayOnlineSeconds)}</span>
                </p>
              </div>
            </div>
            <Button
              onClick={toggleOnline}
              size="lg"
              className={cn(
                "gap-2 min-w-[110px] h-12 font-semibold transition-all",
                isOnline 
                  ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/25" 
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
              )}
            >
              <Power className="w-5 h-5" />
              {isOnline ? "Parar" : "Iniciar"}
            </Button>
          </div>
        </div>

        {/* Ride Offers Section - Shows when online */}
        {isOnline && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Navigation className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Corridas Disponíveis</h3>
            </div>
            <RideOffersPanel />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          <StatCard
            label="Corridas Hoje"
            value={dailyStats.scheduledRides}
            icon={Calendar}
          />
          <StatCard
            label="Próxima às"
            value={formatNextTime()}
            icon={Clock}
          />
          <StatCard
            label="Ganho Previsto"
            value={`R$ ${dailyStats.estimatedEarnings.toFixed(0)}`}
            icon={DollarSign}
            highlight
          />
          <StatCard
            label="Concluídas"
            value={dailyStats.completedRides}
            icon={TrendingUp}
          />
        </div>

        {/* Daily Goal */}
        <DailyGoal 
          current={earnings.today} 
          goal={DAILY_GOAL} 
          className="animate-slide-up"
        />

        {/* Premium Banner */}
        <Link to={isPremium ? "/premium/goals" : "/premium"} className="block animate-slide-up">
          <div className={cn(
            "card-modern border-0 overflow-hidden",
            isPremium 
              ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-white"
              : "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-display font-bold text-lg flex items-center gap-1">
                    MOVA Premium
                    {isPremium && <Star className="w-4 h-4 fill-current" />}
                  </p>
                  <p className="text-sm opacity-90">
                    {isPremium ? "Ver suas metas" : "Bônus de até R$ 700/mês"}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 opacity-80" />
            </div>
          </div>
        </Link>

        {/* Bradesco Banner */}
        <Link to="/bradesco" className="block animate-slide-up">
          <div className="card-modern border-0 bg-gradient-to-r from-[#CC092F] to-[#8B0620] text-white overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-[#CC092F] font-bold text-xl">B</span>
                </div>
                <div>
                  <p className="font-display font-bold text-lg">MOVA + Bradesco</p>
                  <p className="text-sm text-white/80 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> R$ 1 gasto = 0,5 KM
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 opacity-80" />
            </div>
          </div>
        </Link>

        {/* Main Action Button */}
        <Button
          onClick={() => navigate('/rides')}
          className="w-full h-14 text-base font-semibold gap-2"
          size="lg"
        >
          <Calendar className="w-5 h-5" />
          Ver Corridas Agendadas
        </Button>

        {/* Next Ride Preview */}
        {nextRide && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Próxima Corrida</h3>
              <span className="text-sm text-muted-foreground font-mono">
                {format(new Date(nextRide.pickupTime), "HH:mm")}
              </span>
            </div>
            <RideCard 
              ride={nextRide} 
              onClick={() => navigate(`/rides/${nextRide.id}`)}
            />
          </div>
        )}

        {/* Empty State */}
        {!nextRide && dailyStats.scheduledRides === 0 && (
          <div className="text-center py-10 animate-fade-in">
            <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">
              Nenhuma corrida agendada para hoje
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Mantenha seu status disponível para receber novas corridas
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
