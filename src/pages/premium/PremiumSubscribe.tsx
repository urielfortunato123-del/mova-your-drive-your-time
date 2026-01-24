import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Crown, 
  Check, 
  CreditCard,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';
import { toast } from 'sonner';

const includedFeatures = [
  'Bônus mensal de até R$ 700',
  'Desconto em combustível parceiro',
  'Manutenção com preço reduzido',
  'Seguro veicular obrigatório',
  'Suporte prioritário 24h',
  'Dashboard de metas exclusivo',
];

export default function PremiumSubscribe() {
  const navigate = useNavigate();
  const { subscribeToPremium, isLoading } = usePremium();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    if (!acceptedTerms) {
      toast.error('Você precisa aceitar as regras do MOVA Premium');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await subscribeToPremium();

      if (result.success) {
        toast.success('Bem-vindo ao MOVA Premium! 🎉');
        navigate('/premium/goals');
      } else {
        toast.error(result.error || 'Erro ao processar assinatura');
      }
    } catch (error) {
      toast.error('Erro ao processar assinatura');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Adesão Premium">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Adesão Premium">
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/premium')}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        {/* Plan Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg">MOVA Premium</h2>
                <p className="text-white/80 text-sm">Plano mensal completo</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">R$ 199,90</span>
              <span className="text-muted-foreground">/mês</span>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              {includedFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* Payment Info */}
            <Card className="p-4 bg-muted/50 border-dashed">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Cobrança recorrente</p>
                  <p className="text-xs text-muted-foreground">
                    Débito automático todo dia 1º
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Card>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3 p-4 bg-card rounded-xl border">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            className="mt-0.5"
          />
          <label htmlFor="terms" className="text-sm text-foreground cursor-pointer leading-relaxed">
            Li e aceito as <span className="text-primary font-medium">regras do MOVA Premium</span>, 
            incluindo as metas mensais e condições para recebimento do bônus.
          </label>
        </div>

        {/* Subscribe Button */}
        <Button
          onClick={handleSubscribe}
          disabled={!acceptedTerms || isProcessing}
          className="w-full h-12 text-base font-semibold gap-2"
          size="lg"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Processando...
            </>
          ) : (
            <>
              <Crown className="w-5 h-5" />
              Assinar MOVA Premium
            </>
          )}
        </Button>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span className="text-xs">Pagamento seguro e criptografado</span>
        </div>
      </div>
    </PageContainer>
  );
}
