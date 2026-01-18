import React from "react";
import { useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { RideCard } from "@/components/ui/ride-card";
import { useDriver } from "@/contexts/DriverContext";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Rides() {
  const navigate = useNavigate();
  const { todayRides, rides } = useDriver();

  // Get upcoming rides (today and future)
  const upcomingRides = rides
    .filter(r => r.status === 'confirmed' || r.status === 'in_progress')
    .sort((a, b) => new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime());

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <PageContainer title="Corridas">
      <div className="space-y-6">
        {/* Date Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 text-primary">
            <Calendar className="w-5 h-5" />
            <span className="font-medium capitalize">{today}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {upcomingRides.length} corrida{upcomingRides.length !== 1 ? 's' : ''} agendada{upcomingRides.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Rides List */}
        <div className="space-y-3">
          {upcomingRides.map((ride, index) => (
            <div 
              key={ride.id} 
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <RideCard
                ride={ride}
                onClick={() => navigate(`/rides/${ride.id}`)}
              />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {upcomingRides.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Nenhuma corrida agendada
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Mantenha seu status como "Disponível" para receber novas corridas agendadas.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
