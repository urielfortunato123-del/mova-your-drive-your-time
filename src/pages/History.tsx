import React, { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { RideCard } from "@/components/ui/ride-card";
import { useDriver } from "@/contexts/DriverContext";
import { useNavigate } from "react-router-dom";
import { Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterPeriod = 'today' | 'week' | 'month';

export default function History() {
  const navigate = useNavigate();
  const { rides } = useDriver();
  const [filter, setFilter] = useState<FilterPeriod>('today');

  const filteredRides = rides.filter(ride => {
    const rideDate = new Date(ride.pickupTime);
    const now = new Date();
    
    switch (filter) {
      case 'today':
        return rideDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return rideDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return rideDate >= monthAgo;
      default:
        return true;
    }
  }).sort((a, b) => new Date(b.pickupTime).getTime() - new Date(a.pickupTime).getTime());

  const filterOptions: { key: FilterPeriod; label: string }[] = [
    { key: 'today', label: 'Hoje' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mês' },
  ];

  return (
    <PageContainer title="Histórico">
      <div className="space-y-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 animate-fade-in">
          {filterOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
                filter === key 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Período selecionado</p>
              <p className="text-2xl font-display font-bold text-foreground">
                {filteredRides.length} corrida{filteredRides.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor total</p>
              <p className="text-2xl font-bold text-success">
                R$ {filteredRides.reduce((sum, r) => sum + r.estimatedValue + (r.waitingValue || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Rides List */}
        <div className="space-y-3">
          {filteredRides.map((ride, index) => (
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
        {filteredRides.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Nenhuma corrida neste período
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
