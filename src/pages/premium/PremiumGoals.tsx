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
  Smartphone
} from 'lucide-react';
import { usePremium, PREMIUM_GOALS, OPERADORAS_ELEGIVEIS } from '@/hooks/usePremium';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { GoalStatusBadge, getGoalStatus, getStatusConfig } from '@/components/premium/GoalStatusBadge';
import { NextStepBlock } from '@/components/premium/NextStepBlock';

// Goal icons mapping
const GOAL_ICONS = {
  corridas: Car,
  horas: Clock,
  combustivel: Fuel,
  manutencao: Wrench,
  seguro: Shield,
  telefonia: Smartphone,
} as const;

// Microcopy for goals
const GOAL_MICROCOPY = {
  corridas: 'Conta para o bônus mensal',
  horas: 'Conta para o bônus mensal',
  combustivel: 'Conta para o bônus mensal',
  manutencao: 'Conta para o bônus mensal',
  seguro: 'Requisito obrigatório',
  telefonia: 'Benefício ativo',
} as const;

export default function PremiumGoals() {
  const navigate = useNavigate();
  const { 
    isPremium, 
    currentGoals, 
    isLoading, 
    operadora,
    calculateProgress, 
    checkBonusEligibility,
    checkTelefoniaEligibility
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
    horas_app_mes: 0,
  };

  const progressItems = [
    {
      key: 'corridas' as const,
      icon: GOAL_ICONS.corridas,
      label: 'Produção',
      current: goals.corridas_mes,
      target: PREMIUM_GOALS.corridas,
      unit: 'corridas',
      microcopy: GOAL_MICROCOPY.corridas,
    },
    {
      key: 'horas' as const,
      icon: GOAL_ICONS.horas,
      label: 'Horas logado',
      current: goals.horas_logadas_mes,
      target: PREMIUM_GOALS.horas,
      unit: 'horas',
      microcopy: GOAL_MICROCOPY.horas,
    },
    {
      key: 'combustivel' as const,
      icon: GOAL_ICONS.combustivel,
      label: 'Combustível (parceiros)',
      current: goals.litros_combustivel_mes,
      target: PREMIUM_GOALS.litros,
      unit: 'litros',
      microcopy: GOAL_MICROCOPY.combustivel,
    },
    {
      key: 'manutencao' as const,
      icon: GOAL_ICONS.manutencao,
      label: 'Manutenção',
      current: goals.gasto_manutencao_mes,
      target: PREMIUM_GOALS.manutencao,
      unit: 'R$',
      prefix: 'R$',
      microcopy: GOAL_MICROCOPY.manutencao,
    },
  ];

  const bonusEligible = checkBonusEligibility();
  const telefoniaEligible = checkTelefoniaEligibility();
  const isOperadoraElegivel = operadora ? OPERADORAS_ELEGIVEIS.includes(operadora) : false;

  return (
    <PageContainer title="Painel de Metas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
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
            : "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl",
              bonusEligible ? "bg-success/20" : "bg-primary/20"
            )}>
              <Trophy className={cn(
                "w-5 h-5",
                bonusEligible ? "text-success" : "text-primary"
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

        {/* Next Step Block */}
        {!bonusEligible && <NextStepBlock />}

        {/* Progress Cards */}
        <div className="space-y-3">
          {progressItems.map((item) => {
            const progress = calculateProgress(item.current, item.target);
            const status = getGoalStatus({
              current: item.current,
              target: item.target,
              isMonthEnded: false,
            });
            const statusConfig = getStatusConfig(status);
            
            return (
              <Card key={item.key} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl", statusConfig.bgColor)}>
                      <item.icon className={cn("w-5 h-5", statusConfig.iconColor)} />
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
                  className={cn("h-2", statusConfig.bgColor)}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-muted-foreground">{item.microcopy}</p>
                  <GoalStatusBadge
                    current={item.current}
                    target={item.target}
                    isMonthEnded={false}
                    className="text-[10px]"
                  />
                </div>
              </Card>
            );
          })}

          {/* Insurance Status */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  goals.seguro_ativo ? "bg-success/10" : "bg-warning/10"
                )}>
                  <Shield className={cn(
                    "w-5 h-5",
                    goals.seguro_ativo ? "text-success" : "text-warning"
                  )} />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">Banco / Seguro</p>
                  <p className="text-xs text-muted-foreground">{GOAL_MICROCOPY.seguro}</p>
                </div>
              </div>
              <GoalStatusBadge
                current={0}
                target={1}
                isMonthEnded={false}
                isRequirement={true}
                requirementMet={goals.seguro_ativo}
              />
            </div>
          </Card>
        </div>

        {/* Telefonia Meta Card */}
        <Card 
          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate('/premium/telefonia')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-xl",
                telefoniaEligible ? "bg-success/10" : isOperadoraElegivel ? "bg-primary/10" : "bg-muted"
              )}>
                <Smartphone className={cn(
                  "w-5 h-5",
                  telefoniaEligible ? "text-success" : isOperadoraElegivel ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Meta Telefonia</p>
                <p className="text-xs text-muted-foreground">
                  {operadora ? `${operadora} • +R$ 50 bônus` : 'Selecione sua operadora'}
                </p>
              </div>
            </div>
            <GoalStatusBadge
              current={0}
              target={1}
              isMonthEnded={false}
              isRequirement={true}
              requirementMet={telefoniaEligible}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 ml-12">
            {telefoniaEligible ? GOAL_MICROCOPY.telefonia : 'Conta para o bônus mensal'}
          </p>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
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
            onClick={() => navigate('/premium/telefonia')}
            className="h-auto py-3 flex-col gap-1"
          >
            <Smartphone className="w-5 h-5" />
            <span className="text-xs">Telefonia</span>
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
