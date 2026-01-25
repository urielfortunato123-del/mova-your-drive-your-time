import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Trophy,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Phone,
  Clock,
  Car,
  Fuel,
  Wrench,
  Shield,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface PremiumHistoryRecord {
  id: string;
  month_year: string;
  corridas_total: number;
  horas_total: number;
  litros_total: number;
  manutencao_total: number;
  metas_atingidas: boolean;
  bonus_recebido: number;
  bonus_telefonia: number;
  beneficio_telefonia: boolean;
  status_final: string;
  created_at: string;
}

export default function PremiumBonusHistory() {
  const navigate = useNavigate();
  const { driver } = useAuth();
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: ['premium-history', driver?.id],
    queryFn: async () => {
      if (!driver?.id) return [];
      
      const { data, error } = await supabase
        .from('premium_history')
        .select('*')
        .eq('driver_id', driver.id)
        .order('month_year', { ascending: false });

      if (error) throw error;
      return (data || []) as PremiumHistoryRecord[];
    },
    enabled: !!driver?.id,
  });

  const totalBonusReceived = history?.reduce((sum, h) => 
    h.metas_atingidas ? sum + (h.bonus_recebido || 0) + (h.bonus_telefonia || 0) : sum, 0
  ) || 0;

  const monthsWithBonus = history?.filter(h => h.metas_atingidas).length || 0;

  const formatMonthYear = (monthYear: string) => {
    try {
      const date = parse(monthYear, 'yyyy-MM', new Date());
      return format(date, "MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return monthYear;
    }
  };

  const getStatusColor = (status: string, achieved: boolean) => {
    if (achieved) return 'text-success';
    if (status === 'pendente') return 'text-warning';
    return 'text-destructive';
  };

  const getStatusLabel = (status: string, achieved: boolean) => {
    if (achieved) return 'Liberado';
    if (status === 'pendente') return 'Pendente';
    return 'Não atingido';
  };

  if (isLoading) {
    return (
      <PageContainer title="Histórico de Bônus">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Histórico de Bônus">
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/premium/bonus')}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        {/* Summary Card */}
        <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Total recebido</p>
              <p className="text-3xl font-bold text-foreground">
                R$ {totalBonusReceived.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {monthsWithBonus} {monthsWithBonus === 1 ? 'mês' : 'meses'} com bônus liberado
              </p>
            </div>
          </div>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{monthsWithBonus}</p>
            <p className="text-xs text-muted-foreground">Meses atingidos</p>
          </Card>
          <Card className="p-4 text-center">
            <Calendar className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{history?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Total de meses</p>
          </Card>
        </div>

        {/* History List */}
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <History className="w-4 h-4" />
            Histórico Mensal
          </h3>
          
          {!history || history.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Nenhum histórico encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">
                Os registros aparecerão após o fechamento do primeiro mês
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((record) => {
                const isExpanded = expandedMonth === record.id;
                const totalBonus = (record.bonus_recebido || 0) + (record.bonus_telefonia || 0);
                
                return (
                  <Collapsible
                    key={record.id}
                    open={isExpanded}
                    onOpenChange={() => setExpandedMonth(isExpanded ? null : record.id)}
                  >
                    <Card className={cn(
                      "overflow-hidden transition-all",
                      record.metas_atingidas && "border-success/30"
                    )}>
                      <CollapsibleTrigger className="w-full p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              record.metas_atingidas ? "bg-success/10" : "bg-muted"
                            )}>
                              {record.metas_atingidas ? (
                                <CheckCircle className="w-5 h-5 text-success" />
                              ) : (
                                <XCircle className="w-5 h-5 text-destructive" />
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm capitalize">
                                {formatMonthYear(record.month_year)}
                              </p>
                              <p className={cn(
                                "text-xs",
                                getStatusColor(record.status_final, record.metas_atingidas)
                              )}>
                                {getStatusLabel(record.status_final, record.metas_atingidas)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className={cn(
                                "font-bold",
                                record.metas_atingidas ? "text-success" : "text-muted-foreground"
                              )}>
                                R$ {totalBonus.toFixed(2).replace('.', ',')}
                              </p>
                              {record.bonus_telefonia > 0 && (
                                <p className="text-[10px] text-muted-foreground">
                                  +R$ {record.bonus_telefonia.toFixed(2)} telefonia
                                </p>
                              )}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-3">Detalhamento do mês:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 p-2 bg-background rounded-lg">
                              <Car className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Corridas</p>
                                <p className="font-medium text-sm">{record.corridas_total}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-background rounded-lg">
                              <Clock className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Horas</p>
                                <p className="font-medium text-sm">{record.horas_total.toFixed(1)}h</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-background rounded-lg">
                              <Fuel className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Combustível</p>
                                <p className="font-medium text-sm">{record.litros_total.toFixed(0)}L</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-background rounded-lg">
                              <Wrench className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Manutenção</p>
                                <p className="font-medium text-sm">R$ {record.manutencao_total.toFixed(0)}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Telefonia info */}
                          {record.beneficio_telefonia && (
                            <div className="flex items-center gap-2 mt-3 p-2 bg-success/10 rounded-lg">
                              <Phone className="w-4 h-4 text-success" />
                              <p className="text-xs text-success">
                                Bônus telefonia: +R$ {record.bonus_telefonia.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
