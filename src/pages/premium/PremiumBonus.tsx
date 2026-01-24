import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  ArrowLeft,
  Car,
  Fuel,
  Wrench,
  Building2,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { usePremium, PREMIUM_GOALS, PREMIUM_BONUS_RANGE } from '@/hooks/usePremium';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function PremiumBonus() {
  const navigate = useNavigate();
  const { isPremium, currentGoals, isLoading, checkBonusEligibility } = usePremium();

  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: ptBR });

  if (isLoading) {
    return (
      <PageContainer title="Bônus do Mês">
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
    bonus_valor: 0,
  };

  const bonusEligible = checkBonusEligibility();
  const bonusValue = bonusEligible 
    ? Math.floor(Math.random() * (PREMIUM_BONUS_RANGE.max - PREMIUM_BONUS_RANGE.min + 1)) + PREMIUM_BONUS_RANGE.min
    : 0;

  const breakdownItems = [
    {
      icon: Car,
      label: 'Produção',
      sublabel: `${goals.corridas_mes}/${PREMIUM_GOALS.corridas} corridas`,
      achieved: goals.corridas_mes >= PREMIUM_GOALS.corridas,
    },
    {
      icon: Fuel,
      label: 'Combustível',
      sublabel: `${goals.litros_combustivel_mes.toFixed(0)}/${PREMIUM_GOALS.litros} litros`,
      achieved: goals.litros_combustivel_mes >= PREMIUM_GOALS.litros,
    },
    {
      icon: Wrench,
      label: 'Manutenção',
      sublabel: `R$ ${goals.gasto_manutencao_mes.toFixed(2)}/${PREMIUM_GOALS.manutencao}`,
      achieved: goals.gasto_manutencao_mes >= PREMIUM_GOALS.manutencao,
    },
    {
      icon: Building2,
      label: 'Banco (Seguro)',
      sublabel: goals.seguro_ativo ? 'Ativo' : 'Inativo',
      achieved: goals.seguro_ativo,
    },
  ];

  return (
    <PageContainer title="Bônus do Mês">
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/premium/goals')}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        {/* Status Card */}
        <Card className={cn(
          "p-6 text-center",
          bonusEligible 
            ? "bg-gradient-to-br from-success/10 to-success/5 border-success/30" 
            : "bg-gradient-to-br from-muted/50 to-muted/30"
        )}>
          <div className={cn(
            "mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
            bonusEligible ? "bg-success/20" : "bg-muted"
          )}>
            <Trophy className={cn(
              "w-8 h-8",
              bonusEligible ? "text-success" : "text-muted-foreground"
            )} />
          </div>
          
          <p className="text-sm text-muted-foreground capitalize">{currentMonth}</p>
          
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mt-2",
            bonusEligible 
              ? "bg-success/20 text-success" 
              : "bg-destructive/10 text-destructive"
          )}>
            {bonusEligible ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Liberado
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Não liberado
              </>
            )}
          </div>

          <div className="mt-4">
            <span className="text-4xl font-bold text-foreground">
              R$ {bonusValue.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {bonusEligible && (
            <p className="text-sm text-success mt-2">
              Parabéns! Você atingiu todas as metas! 🎉
            </p>
          )}
        </Card>

        {/* Breakdown */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Detalhamento</h3>
          <div className="space-y-2">
            {breakdownItems.map((item, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      item.achieved ? "bg-success/10" : "bg-destructive/10"
                    )}>
                      <item.icon className={cn(
                        "w-4 h-4",
                        item.achieved ? "text-success" : "text-destructive"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                    </div>
                  </div>
                  {item.achieved ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Info Note */}
        <Card className="p-4 bg-muted/50 border-dashed">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              O bônus é mensal, não acumulativo e pago somente se <strong>todas as metas</strong> forem atingidas 
              até o último dia do mês.
            </p>
          </div>
        </Card>

        {/* Action Button */}
        {!bonusEligible && (
          <Button 
            onClick={() => navigate('/premium/goals')}
            className="w-full"
          >
            Ver Metas Pendentes
          </Button>
        )}
      </div>
    </PageContainer>
  );
}
