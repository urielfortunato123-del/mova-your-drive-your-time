import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Smartphone, 
  ArrowLeft,
  Check,
  AlertCircle,
  Wifi,
  BadgePercent,
  Gift
} from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const OPERADORAS = [
  { value: 'TIM', label: 'TIM', eligible: true },
  { value: 'Claro', label: 'Claro', eligible: true },
  { value: 'Vivo', label: 'Vivo', eligible: true },
  { value: 'Outra', label: 'Outra (sem benefício)', eligible: false },
];

const BENEFICIOS = [
  {
    icon: BadgePercent,
    title: 'Desconto na fatura',
    description: '10% a 25% de desconto',
  },
  {
    icon: Wifi,
    title: 'Bônus de dados',
    description: '+5GB a +15GB/mês',
  },
  {
    icon: Gift,
    title: 'Desconto em aparelhos',
    description: 'Ofertas exclusivas',
  },
];

export default function PremiumTelefonia() {
  const navigate = useNavigate();
  const { driver, refreshDriver } = useAuth();
  const { isPremium, isLoading } = usePremium();
  const [operadora, setOperadora] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (driver?.operadora) {
      setOperadora(driver.operadora);
    }
  }, [driver?.operadora]);

  const handleSaveOperadora = async () => {
    if (!driver?.id || !operadora) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('driver_profiles')
        .update({ operadora })
        .eq('id', driver.id);

      if (error) throw error;

      await refreshDriver();
      toast.success('Operadora salva com sucesso!');
    } catch (error) {
      console.error('Error saving operadora:', error);
      toast.error('Erro ao salvar operadora');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Telefonia & Internet">
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

  const selectedOperadora = OPERADORAS.find(op => op.value === operadora);
  const isEligible = selectedOperadora?.eligible ?? false;

  return (
    <PageContainer title="Telefonia & Internet">
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

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Seu plano continua o mesmo.</h2>
          <h3 className="text-lg font-semibold text-primary mt-1">Sua conta diminui.</h3>
          <p className="text-sm text-muted-foreground mt-3">
            Você não troca número nem chip.
            <br />
            O benefício é aplicado diretamente ao seu plano atual.
          </p>
        </div>

        {/* Operadora Selection */}
        <Card className="p-4">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Operadora atual
          </label>
          <Select value={operadora} onValueChange={setOperadora}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Selecione sua operadora" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              {OPERADORAS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {operadora && operadora !== driver?.operadora && (
            <Button 
              onClick={handleSaveOperadora}
              disabled={saving}
              className="w-full mt-3"
              size="sm"
            >
              {saving ? 'Salvando...' : 'Salvar operadora'}
            </Button>
          )}
        </Card>

        {/* Status Card */}
        {operadora && (
          <Card className={cn(
            "p-4",
            isEligible 
              ? "bg-gradient-to-br from-success/10 to-success/5 border-success/30"
              : "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30"
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                isEligible ? "bg-success/20" : "bg-warning/20"
              )}>
                {isEligible ? (
                  <Check className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warning" />
                )}
              </div>
              <div>
                <p className={cn(
                  "font-semibold",
                  isEligible ? "text-success" : "text-warning"
                )}>
                  {isEligible ? 'Benefício disponível' : 'Benefício indisponível no momento'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isEligible 
                    ? 'Você não precisa trocar de número nem de chip. O benefício é aplicado ao seu plano atual.'
                    : 'No momento, os benefícios estão disponíveis apenas para TIM, Claro e Vivo.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Benefits List */}
        {isEligible && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Seus benefícios</h3>
            {BENEFICIOS.map((beneficio, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <beneficio.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{beneficio.title}</p>
                    <p className="text-xs text-muted-foreground">{beneficio.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Bonus Info */}
        {isEligible && (
          <Card className="p-4 bg-muted/50 border-dashed">
            <div className="flex items-start gap-3">
              <Gift className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground text-sm">Bônus Telefonia: +R$ 50</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ao manter uma operadora elegível ativa, você ganha R$ 50 extras no seu bônus mensal.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Info Note */}
        <Card className="p-4 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            O MOVA respeita o seu plano atual.<br />
            Aqui você não troca número nem chip — apenas ganha benefícios por ser Premium.
          </p>
        </Card>
      </div>
    </PageContainer>
  );
}
