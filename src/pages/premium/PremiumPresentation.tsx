import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  DollarSign, 
  Fuel, 
  Wrench, 
  Building2, 
  BarChart3,
  Star,
  ArrowRight,
  Crown
} from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';

const benefits = [
  {
    icon: DollarSign,
    title: 'Bônus mensal de até R$ 700',
    description: 'Ganhe bônus por atingir suas metas mensais',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    icon: Fuel,
    title: 'Desconto em combustível',
    description: 'Abasteça em postos parceiros com desconto',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    icon: Wrench,
    title: 'Manutenção com parceiros',
    description: 'Oficinas credenciadas com preços especiais',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Building2,
    title: 'Seguro veicular',
    description: 'Proteção completa para seu veículo',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: BarChart3,
    title: 'Metas claras',
    description: 'Saiba exatamente o que precisa fazer',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
];

export default function PremiumPresentation() {
  const navigate = useNavigate();
  const { isPremium, isLoading } = usePremium();

  if (isLoading) {
    return (
      <PageContainer title="MOVA Premium">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageContainer>
    );
  }

  if (isPremium) {
    navigate('/premium/goals');
    return null;
  }

  return (
    <PageContainer title="MOVA Premium">
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            MOVA Premium
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            Trabalhe com previsibilidade, ganhe bônus mensal e reduza seus custos.
          </p>
          <p className="text-primary font-medium text-sm">
            Aqui o bônus é claro, mensal e por mérito.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="space-y-3">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${benefit.bgColor}`}>
                  <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-sm">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Pricing Preview */}
        <Card className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Investimento mensal</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-foreground">R$ 199,90</span>
                <span className="text-xs text-muted-foreground">/mês</span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-success/10 px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 text-success fill-success" />
              <span className="text-xs font-medium text-success">Retorno garantido</span>
            </div>
          </div>
        </Card>

        {/* CTA Button */}
        <Button 
          onClick={() => navigate('/premium/subscribe')}
          className="w-full h-12 text-base font-semibold gap-2"
          size="lg"
        >
          Quero ser Premium
          <ArrowRight className="w-5 h-5" />
        </Button>

        {/* Footer Note */}
        <p className="text-center text-xs text-muted-foreground">
          Cancele quando quiser. Sem multa ou burocracia.
        </p>
      </div>
    </PageContainer>
  );
}
