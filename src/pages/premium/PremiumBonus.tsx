import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Trophy, 
  ArrowLeft,
  Car,
  Fuel,
  Wrench,
  Building2,
  CheckCircle,
  XCircle,
  Info,
  Smartphone,
  ChevronRight,
  Shield,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { usePremium, PREMIUM_GOALS, PREMIUM_BONUS_RANGE, TELEFONIA_BONUS, OPERADORAS_ELEGIVEIS } from '@/hooks/usePremium';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PremiumBonus() {
  const navigate = useNavigate();
  const { isPremium, currentGoals, isLoading, operadora, checkBonusEligibility, checkTelefoniaEligibility, refreshGoals } = usePremium();
  const [showBancoDialog, setShowBancoDialog] = useState(false);
  const [showTelefoniaDialog, setShowTelefoniaDialog] = useState(false);
  const [updatingSeguro, setUpdatingSeguro] = useState(false);

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
  const telefoniaEligible = checkTelefoniaEligibility();
  const isOperadoraElegivel = operadora ? OPERADORAS_ELEGIVEIS.includes(operadora) : false;
  
  const baseBonus = bonusEligible 
    ? Math.floor(Math.random() * (PREMIUM_BONUS_RANGE.max - PREMIUM_BONUS_RANGE.min + 1)) + PREMIUM_BONUS_RANGE.min
    : 0;
  const telefoniaBonus = telefoniaEligible ? TELEFONIA_BONUS : 0;
  const totalBonus = baseBonus + telefoniaBonus;

  const handleToggleSeguro = async () => {
    if (!currentGoals?.id) return;
    
    setUpdatingSeguro(true);
    try {
      const newValue = !goals.seguro_ativo;
      const { error } = await supabase
        .from('premium_monthly_goals')
        .update({ seguro_ativo: newValue })
        .eq('id', currentGoals.id);

      if (error) throw error;

      toast.success(newValue ? 'Seguro ativado!' : 'Seguro desativado');
      refreshGoals();
    } catch (error) {
      console.error('Error updating seguro:', error);
      toast.error('Erro ao atualizar seguro');
    } finally {
      setUpdatingSeguro(false);
    }
  };

  const breakdownItems = [
    {
      icon: Car,
      label: 'Produção',
      sublabel: `${goals.corridas_mes}/${PREMIUM_GOALS.corridas} corridas`,
      achieved: goals.corridas_mes >= PREMIUM_GOALS.corridas,
      onClick: undefined,
    },
    {
      icon: Fuel,
      label: 'Combustível',
      sublabel: `${goals.litros_combustivel_mes.toFixed(0)}/${PREMIUM_GOALS.litros} litros`,
      achieved: goals.litros_combustivel_mes >= PREMIUM_GOALS.litros,
      onClick: undefined,
    },
    {
      icon: Wrench,
      label: 'Manutenção',
      sublabel: `R$ ${goals.gasto_manutencao_mes.toFixed(2)}/${PREMIUM_GOALS.manutencao}`,
      achieved: goals.gasto_manutencao_mes >= PREMIUM_GOALS.manutencao,
      onClick: undefined,
    },
    {
      icon: Building2,
      label: 'Banco (Seguro)',
      sublabel: goals.seguro_ativo ? 'Ativo' : 'Inativo',
      achieved: goals.seguro_ativo,
      onClick: () => setShowBancoDialog(true),
      hasAction: true,
    },
    {
      icon: Smartphone,
      label: `Telefonia${operadora ? ` (${operadora})` : ''}`,
      sublabel: telefoniaEligible ? `+R$ ${TELEFONIA_BONUS}` : isOperadoraElegivel ? 'Em progresso' : 'Não configurado',
      achieved: telefoniaEligible,
      isOptional: true,
      onClick: () => setShowTelefoniaDialog(true),
      hasAction: true,
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
              R$ {totalBonus.toFixed(2).replace('.', ',')}
            </span>
            {telefoniaBonus > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                (Base: R$ {baseBonus.toFixed(2).replace('.', ',')} + Telefonia: R$ {telefoniaBonus.toFixed(2).replace('.', ',')})
              </p>
            )}
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
              <Card 
                key={index} 
                className={cn(
                  "p-3 transition-colors",
                  item.hasAction && "cursor-pointer hover:border-primary/50"
                )}
                onClick={item.onClick}
              >
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
                  <div className="flex items-center gap-2">
                    {item.achieved ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    {item.hasAction && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
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

      {/* Banco/Seguro Dialog */}
      <Dialog open={showBancoDialog} onOpenChange={setShowBancoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Banco & Seguro
            </DialogTitle>
            <DialogDescription>
              Gerencie seu seguro e benefícios bancários
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Seguro Toggle */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Seguro Ativo</p>
                    <p className="text-xs text-muted-foreground">
                      {goals.seguro_ativo ? 'Contratado via parceiro' : 'Ative para liberar bônus'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={goals.seguro_ativo}
                  onCheckedChange={handleToggleSeguro}
                  disabled={updatingSeguro}
                />
              </div>
            </Card>

            {/* Bradesco Link */}
            <Card 
              className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => {
                setShowBancoDialog(false);
                navigate('/bradesco');
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#CC092F]/10 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-[#CC092F]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Parceria Bradesco</p>
                    <p className="text-xs text-muted-foreground">
                      Acumule KMs e troque por descontos
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                O seguro deve estar ativo em uma das seguradoras parceiras para validar a meta.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Telefonia Dialog */}
      <Dialog open={showTelefoniaDialog} onOpenChange={setShowTelefoniaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Telefonia & Internet
            </DialogTitle>
            <DialogDescription>
              Ganhe até R$ {TELEFONIA_BONUS} de bônus adicional
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Status atual */}
            <Card className={cn(
              "p-4",
              telefoniaEligible ? "border-success/30 bg-success/5" : ""
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  telefoniaEligible ? "bg-success/20" : "bg-muted"
                )}>
                  {telefoniaEligible ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {operadora ? `Operadora: ${operadora}` : 'Operadora não configurada'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {telefoniaEligible 
                      ? `Bônus de R$ ${TELEFONIA_BONUS} liberado!` 
                      : isOperadoraElegivel 
                        ? 'Complete as metas para liberar' 
                        : 'Configure sua operadora'
                    }
                  </p>
                </div>
              </div>
            </Card>

            {/* Operadoras elegíveis */}
            <div>
              <p className="text-sm font-medium mb-2">Operadoras elegíveis:</p>
              <div className="flex gap-2">
                {OPERADORAS_ELEGIVEIS.map((op) => (
                  <span 
                    key={op}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium",
                      operadora === op 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {op}
                  </span>
                ))}
              </div>
            </div>

            {/* Link para configurar */}
            <Button
              onClick={() => {
                setShowTelefoniaDialog(false);
                navigate('/premium/telefonia');
              }}
              className="w-full gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              {operadora ? 'Gerenciar Telefonia' : 'Configurar Operadora'}
            </Button>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                O bônus de telefonia é adicional e requer operadora TIM, Claro ou Vivo ativa + todas as metas cumpridas.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
