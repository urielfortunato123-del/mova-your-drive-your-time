import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Calendar,
  Trophy,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone
} from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';
import { cn } from '@/lib/utils';

export default function PremiumHistory() {
  const navigate = useNavigate();
  const { history, isLoading, isPremium } = usePremium();

  if (isLoading) {
    return (
      <PageContainer title="Histórico Premium">
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

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'aprovado':
        return {
          label: 'Aprovado',
          color: 'bg-success/10 text-success',
          icon: CheckCircle,
        };
      case 'reprovado':
        return {
          label: 'Não atingido',
          color: 'bg-destructive/10 text-destructive',
          icon: XCircle,
        };
      default:
        return {
          label: 'Pendente',
          color: 'bg-warning/10 text-warning',
          icon: Clock,
        };
    }
  };

  return (
    <PageContainer title="Histórico Premium">
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

        {/* History List */}
        {history.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground">Nenhum histórico</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Seu histórico de metas aparecerá aqui ao final de cada mês.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((item) => {
              const statusConfig = getStatusConfig(item.status_final);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        item.metas_atingidas ? "bg-success/10" : "bg-muted"
                      )}>
                        <Trophy className={cn(
                          "w-5 h-5",
                          item.metas_atingidas ? "text-success" : "text-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground capitalize">
                          {formatMonthYear(item.month_year)}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn("text-xs", statusConfig.color)}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-bold",
                        item.bonus_recebido > 0 ? "text-success" : "text-muted-foreground"
                      )}>
                        R$ {item.bonus_recebido.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        bônus recebido
                      </p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Corridas:</span>
                      <span className="ml-1 font-medium text-foreground">
                        {item.corridas_total}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Horas:</span>
                      <span className="ml-1 font-medium text-foreground">
                        {item.horas_total.toFixed(0)}h
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Litros:</span>
                      <span className="ml-1 font-medium text-foreground">
                        {item.litros_total.toFixed(0)}L
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Manutenção:</span>
                      <span className="ml-1 font-medium text-foreground">
                        R$ {item.manutencao_total.toFixed(2)}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Telefonia:</span>
                      <span className={cn(
                        "ml-1 font-medium",
                        item.beneficio_telefonia ? "text-success" : "text-muted-foreground"
                      )}>
                        {item.beneficio_telefonia ? `Sim (+R$ ${item.bonus_telefonia.toFixed(2)})` : 'Não'}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
