import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatCard } from "@/components/ui/stat-card";
import { useDriver } from "@/contexts/DriverContext";
import { DollarSign, TrendingUp, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

// Mock data for worked hours per day (last 7 days)
const hoursWorkedData = [
  { day: "Seg", hours: 6.5 },
  { day: "Ter", hours: 8.2 },
  { day: "Qua", hours: 7.0 },
  { day: "Qui", hours: 9.5 },
  { day: "Sex", hours: 10.0 },
  { day: "Sáb", hours: 5.5 },
  { day: "Dom", hours: 3.0 },
];

export default function Earnings() {
  const { earnings, rides } = useDriver();

  const completedRides = rides.filter(r => r.status === 'completed');

  const handleExport = () => {
    toast.info("Exportação disponível em breve!");
  };

  const totalWeekHours = hoursWorkedData.reduce((sum, d) => sum + d.hours, 0);
  const avgDailyHours = (totalWeekHours / 7).toFixed(1);

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

        {/* Hours Worked Chart */}
        <div className="bg-card rounded-xl border border-border p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Horas Trabalhadas</h3>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{totalWeekHours.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">média {avgDailyHours}h/dia</p>
            </div>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursWorkedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}h`}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value}h`, 'Horas']}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {hoursWorkedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === hoursWorkedData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.5)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
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
