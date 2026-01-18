import React from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/ui/stat-card";
import { RideCard } from "@/components/ui/ride-card";
import { Button } from "@/components/ui/button";
import { useDriver } from "@/contexts/DriverContext";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, DollarSign, TrendingUp, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const navigate = useNavigate();
  const { dailyStats, todayRides } = useDriver();
  const { driver } = useAuth();

  const nextRide = todayRides
    .filter(r => r.status === 'confirmed')
    .sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime())[0];

  const formatNextTime = () => {
    if (!dailyStats.nextRideTime) return "—";
    const time = new Date(dailyStats.nextRideTime);
    return format(time, "HH:mm", { locale: ptBR });
  };

  return (
    <PageContainer title="MOVA">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="animate-fade-in">
          <p className="text-muted-foreground text-sm">Olá,</p>
          <h2 className="text-2xl font-display font-bold text-foreground">
            {driver?.name?.split(' ')[0] || 'Motorista'}
          </h2>
        </div>

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

        {/* Main Action Button */}
        <Button
          onClick={() => navigate('/rides')}
          className="w-full h-14 text-base font-medium gap-2"
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
              <span className="text-sm text-muted-foreground">
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
          <div className="text-center py-8 animate-fade-in">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
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
