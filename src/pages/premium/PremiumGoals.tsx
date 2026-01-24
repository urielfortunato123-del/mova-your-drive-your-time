import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Car, 
  Clock, 
  Fuel, 
  Wrench, 
  Shield,
  Trophy,
  ArrowRight,
  Crown
} from 'lucide-react';
import { usePremium, PREMIUM_GOALS } from '@/hooks/usePremium';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function PremiumGoals() {
  const navigate = useNavigate();
  const { 
    isPremium, 
    currentGoals, 
    isLoading, 
    calculateProgress, 
    getProgressStatus,
    checkBonusEligibility 
  } = usePremium();

  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: ptBR });

  if (isLoading) {
    return (
      <PageContainer title="Painel de Metas">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageContainer>
    );
  }

  if (!isPremium) {
    navigate('/premium');
    return null;
  }

  const goals = currentGoals || {
    corridas_mes: 0,
    horas_logadas_mes: 0,
    litros_combustivel_mes: 0,
    gasto_manutencao_mes: 0,
    seguro_ativo: false,
  };

  const progressItems = [
    {
      icon: Car,
      label: 'Corridas',
      current: goals.corridas_mes,
      target: PREMIUM_GOALS.corridas,
      unit: 'corridas',
      status: getProgressStatus(goals.corridas_mes, PREMIUM_GOALS.corridas),
    },
    {
      icon: Clock,
      label: 'Horas logado',
      current: goals.horas_logadas_mes,
      target: PREMIUM_GOALS.horas,
      unit: 'horas',
      status: getProgressStatus(goals.horas_logadas_mes, PREMIUM_GOALS.horas),
    },
    {
      icon: Fuel,
      label: 'Combustível (parceiros)',
      current: goals.litros_combustivel_mes,
      target: PREMIUM_GOALS.litros,
      unit: 'litros',
      status: getProgressStatus(goals.litros_combustivel_mes, PREMIUM_GOALS.litros),
    },
    {
      icon: Wrench,
      label: 'Manutenção',
      current: goals.gasto_manutencao_mes,
      target: PREMIUM_GOALS.manutencao,
      unit: 'R$',
      prefix: 'R$',
      status: getProgressStatus(goals.gasto_manutencao_mes, PREMIUM_GOALS.manutencao),
    },
  ];

  const getStatusColor = (status: 'red' | 'yellow' | 'green') => {
    switch (status) {
      case 'green': return 'bg-success';
      case 'yellow': return 'bg-warning';
      case 'red': return 'bg-destructive';
    }
  };

  const getStatusBg = (status: 'red' | 'yellow' | 'green') => {
    switch (status) {
      case 'green': return 'bg-success/10';
      case 'yellow': return 'bg-warning/10';
      case 'red': return 'bg-destructive/10';
    }
  };

  const bonusEligible = checkBonusEligibility();

  return (
    <PageContainer title="Painel de Metas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                MOVA Premium
              </span>
            </div>
            <h2 className="text-lg font-bold text-foreground mt-1 capitalize">
              {currentMonth}
            </h2>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/premium/bonus')}
            className="gap-1"
          >
            <Trophy className="w-4 h-4" />
            Ver Bônus
          </Button>
        </div>

        {/* Bonus Status Card */}
        <Card className={cn(
          "p-4",
          bonusEligible 
            ? "bg-gradient-to-r from-success/10 to-success/5 border-success/30" 
            : "bg-gradient-to-r from-warning/10 to-warning/5 border-warning/30"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl",
              bonusEligible ? "bg-success/20" : "bg-warning/20"
            )}>
              <Trophy className={cn(
                "w-5 h-5",
                bonusEligible ? "text-success" : "text-warning"
              )} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">
                {bonusEligible ? 'Bônus liberado! 🎉' : 'Bônus em progresso'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {bonusEligible 
                  ? 'Parabéns! Você atingiu todas as metas.' 
                  : 'Continue trabalhando para liberar seu bônus.'}
              </p>
            </div>
          </div>
        </Card>

        {/* Progress Cards */}
        <div className="space-y-3">
          {progressItems.map((item, index) => {
            const progress = calculateProgress(item.current, item.target);
            return (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl", getStatusBg(item.status))}>
                      <item.icon className={cn(
                        "w-5 h-5",
                        item.status === 'green' && "text-success",
                        item.status === 'yellow' && "text-warning",
                        item.status === 'red' && "text-destructive"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Meta: {item.prefix || ''}{item.target} {!item.prefix && item.unit}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      {item.prefix || ''}{item.current.toFixed(item.prefix ? 2 : 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {progress.toFixed(0)}%
                    </p>
                  </div>
                </div>
                <Progress 
                  value={progress} 
                  className={cn("h-2", getStatusBg(item.status))}
                />
              </Card>
            );
          })}

          {/* Insurance Status */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  goals.seguro_ativo ? "bg-success/10" : "bg-destructive/10"
                )}>
                  <Shield className={cn(
                    "w-5 h-5",
                    goals.seguro_ativo ? "text-success" : "text-destructive"
                  )} />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Seguro veicular</p>
                  <p className="text-xs text-muted-foreground">Obrigatório para o bônus</p>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                goals.seguro_ativo 
                  ? "bg-success/10 text-success" 
                  : "bg-destructive/10 text-destructive"
              )}>
                {goals.seguro_ativo ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/premium/partners')}
            className="h-auto py-3 flex-col gap-1"
          >
            <Fuel className="w-5 h-5" />
            <span className="text-xs">Parceiros</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/premium/history')}
            className="h-auto py-3 flex-col gap-1"
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs">Histórico</span>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
