import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/ui/stat-card";
import { useDriver } from "@/contexts/DriverContext";
import { DollarSign, TrendingUp, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Earnings() {
  const { earnings, rides } = useDriver();

  const completedRides = rides.filter(r => r.status === 'completed');

  const handleExport = () => {
    toast.info("Exportação disponível em breve!");
  };

  return (
    <PageContainer title="Ganhos">
      <div className="space-y-6">
        {/* Main Earnings Card */}
        <div className="bg-card rounded-2xl border border-success/20 p-6 earnings-highlight animate-fade-in">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Total do Mês</p>
            <p className="text-4xl font-display font-bold text-success mb-2">
              R$ {earnings.month.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              Incluindo R$ {earnings.waitingTotal.toFixed(2)} em espera remunerada
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Hoje"
            value={`R$ ${earnings.today.toFixed(2)}`}
            icon={DollarSign}
          />
          <StatCard
            label="Semana"
            value={`R$ ${earnings.week.toFixed(2)}`}
            icon={TrendingUp}
          />
        </div>

        {/* Waiting Earnings Card */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Espera Remunerada</p>
              <p className="text-lg font-bold text-foreground">
                R$ {earnings.waitingTotal.toFixed(2)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              100% para você
            </p>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="animate-slide-up">
          <h3 className="font-semibold text-foreground mb-3">Detalhamento</h3>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {completedRides.slice(0, 5).map((ride) => (
              <div key={ride.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{ride.passengerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {ride.pickupAddress.split(' - ')[0]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-success">
                    R$ {ride.estimatedValue.toFixed(2)}
                  </p>
                  {ride.waitingValue && ride.waitingValue > 0 && (
                    <p className="text-xs text-warning">
                      +R$ {ride.waitingValue.toFixed(2)} espera
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          variant="outline"
          className="w-full gap-2"
        >
          <FileText className="w-4 h-4" />
          Exportar Relatório (PDF)
        </Button>
      </div>
    </PageContainer>
  );
}
