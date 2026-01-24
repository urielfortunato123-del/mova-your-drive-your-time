import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export interface PremiumGoals {
  id: string;
  driver_id: string;
  month_year: string;
  corridas_mes: number;
  horas_logadas_mes: number;
  litros_combustivel_mes: number;
  gasto_manutencao_mes: number;
  seguro_ativo: boolean;
  bonus_status: 'em_progresso' | 'liberado' | 'nao_liberado';
  bonus_valor: number;
  meta_telefonia: boolean;
  horas_app_mes: number;
}

export interface PremiumHistory {
  id: string;
  month_year: string;
  metas_atingidas: boolean;
  bonus_recebido: number;
  status_final: string;
  corridas_total: number;
  horas_total: number;
  litros_total: number;
  manutencao_total: number;
  beneficio_telefonia: boolean;
  bonus_telefonia: number;
}

export interface PremiumPartner {
  id: string;
  tipo: 'posto' | 'oficina' | 'banco';
  nome: string;
  endereco: string;
  cidade: string;
  latitude: number;
  longitude: number;
  servicos: string[];
  tag: string;
}

// Metas fixas do Premium
export const PREMIUM_GOALS = {
  corridas: 160,
  horas: 192,
  litros: 400,
  manutencao: 120,
  horasApp: 10, // Horas mínimas de uso do app para meta telefonia
};

export const PREMIUM_BONUS_RANGE = {
  min: 600,
  max: 700,
};

export const TELEFONIA_BONUS = 50;

export const OPERADORAS_ELEGIVEIS = ['TIM', 'Claro', 'Vivo'];

export function usePremium() {
  const { driver } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<string>('inativo');
  const [currentGoals, setCurrentGoals] = useState<PremiumGoals | null>(null);
  const [history, setHistory] = useState<PremiumHistory[]>([]);
  const [partners, setPartners] = useState<PremiumPartner[]>([]);
  const [operadora, setOperadora] = useState<string | null>(null);
  const currentMonthYear = format(new Date(), 'yyyy-MM');

  const fetchPremiumStatus = useCallback(async () => {
    if (!driver?.id) return;

    try {
      const { data: profileData } = await supabase
        .from('driver_profiles')
        .select('plano, premium_status, premium_inicio, operadora')
        .eq('id', driver.id)
        .single();

      if (profileData) {
        setIsPremium(profileData.plano === 'premium');
        setPremiumStatus(profileData.premium_status || 'inativo');
        setOperadora(profileData.operadora || null);
      }
    } catch (error) {
      console.error('Error fetching premium status:', error);
    }
  }, [driver?.id]);

  const fetchCurrentGoals = useCallback(async () => {
    if (!driver?.id) return;

    try {
      const { data, error } = await supabase
        .from('premium_monthly_goals')
        .select('*')
        .eq('driver_id', driver.id)
        .eq('month_year', currentMonthYear)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching goals:', error);
        return;
      }

      if (data) {
        setCurrentGoals({
          id: data.id,
          driver_id: data.driver_id,
          month_year: data.month_year,
          corridas_mes: data.corridas_mes || 0,
          horas_logadas_mes: Number(data.horas_logadas_mes) || 0,
          litros_combustivel_mes: Number(data.litros_combustivel_mes) || 0,
          gasto_manutencao_mes: Number(data.gasto_manutencao_mes) || 0,
          seguro_ativo: data.seguro_ativo || false,
          bonus_status: data.bonus_status as 'em_progresso' | 'liberado' | 'nao_liberado',
          bonus_valor: Number(data.bonus_valor) || 0,
          meta_telefonia: data.meta_telefonia || false,
          horas_app_mes: Number(data.horas_app_mes) || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching current goals:', error);
    }
  }, [driver?.id, currentMonthYear]);

  const fetchHistory = useCallback(async () => {
    if (!driver?.id) return;

    try {
      const { data, error } = await supabase
        .from('premium_history')
        .select('*')
        .eq('driver_id', driver.id)
        .order('month_year', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
        return;
      }

      if (data) {
        setHistory(data.map(item => ({
          id: item.id,
          month_year: item.month_year,
          metas_atingidas: item.metas_atingidas || false,
          bonus_recebido: Number(item.bonus_recebido) || 0,
          status_final: item.status_final || 'pendente',
          corridas_total: item.corridas_total || 0,
          horas_total: Number(item.horas_total) || 0,
          litros_total: Number(item.litros_total) || 0,
          manutencao_total: Number(item.manutencao_total) || 0,
          beneficio_telefonia: item.beneficio_telefonia || false,
          bonus_telefonia: Number(item.bonus_telefonia) || 0,
        })));
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, [driver?.id]);

  const fetchPartners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('premium_partners')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching partners:', error);
        return;
      }

      if (data) {
        setPartners(data.map(item => ({
          id: item.id,
          tipo: item.tipo as 'posto' | 'oficina' | 'banco',
          nome: item.nome,
          endereco: item.endereco || '',
          cidade: item.cidade || '',
          latitude: Number(item.latitude) || 0,
          longitude: Number(item.longitude) || 0,
          servicos: item.servicos || [],
          tag: item.tag || '',
        })));
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  }, []);

  const subscribeToPremium = async (): Promise<{ success: boolean; error?: string }> => {
    if (!driver?.id) return { success: false, error: 'Driver not found' };

    try {
      // Update driver profile to premium
      const { error: profileError } = await supabase
        .from('driver_profiles')
        .update({
          plano: 'premium',
          premium_status: 'ativo',
          premium_inicio: new Date().toISOString(),
        })
        .eq('id', driver.id);

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      // Create initial monthly goals record
      const { error: goalsError } = await supabase
        .from('premium_monthly_goals')
        .upsert({
          driver_id: driver.id,
          month_year: currentMonthYear,
          corridas_mes: 0,
          horas_logadas_mes: 0,
          litros_combustivel_mes: 0,
          gasto_manutencao_mes: 0,
          seguro_ativo: false,
          bonus_status: 'em_progresso',
          bonus_valor: 0,
        }, {
          onConflict: 'driver_id,month_year',
        });

      if (goalsError) {
        console.error('Goals creation error:', goalsError);
      }

      setIsPremium(true);
      setPremiumStatus('ativo');
      await fetchCurrentGoals();

      return { success: true };
    } catch (error) {
      console.error('Error subscribing to premium:', error);
      return { success: false, error: 'Erro ao processar assinatura' };
    }
  };

  const updateGoals = async (updates: Partial<PremiumGoals>): Promise<boolean> => {
    if (!driver?.id || !currentGoals) return false;

    try {
      const { error } = await supabase
        .from('premium_monthly_goals')
        .update(updates)
        .eq('id', currentGoals.id);

      if (error) {
        console.error('Error updating goals:', error);
        return false;
      }

      await fetchCurrentGoals();
      return true;
    } catch (error) {
      console.error('Error updating goals:', error);
      return false;
    }
  };

  const checkBonusEligibility = (): boolean => {
    if (!currentGoals) return false;

    return (
      currentGoals.corridas_mes >= PREMIUM_GOALS.corridas &&
      currentGoals.horas_logadas_mes >= PREMIUM_GOALS.horas &&
      currentGoals.litros_combustivel_mes >= PREMIUM_GOALS.litros &&
      currentGoals.gasto_manutencao_mes >= PREMIUM_GOALS.manutencao &&
      currentGoals.seguro_ativo === true
    );
  };

  const checkTelefoniaEligibility = (): boolean => {
    if (!currentGoals || !operadora) return false;
    
    const isOperadoraElegivel = OPERADORAS_ELEGIVEIS.includes(operadora);
    const metaHorasApp = currentGoals.horas_app_mes >= PREMIUM_GOALS.horasApp;
    
    return isOperadoraElegivel && metaHorasApp;
  };

  const calculateTotalBonus = (): number => {
    const baseBonus = checkBonusEligibility() 
      ? Math.floor(Math.random() * (PREMIUM_BONUS_RANGE.max - PREMIUM_BONUS_RANGE.min + 1)) + PREMIUM_BONUS_RANGE.min
      : 0;
    
    const telefoniaBonus = checkTelefoniaEligibility() ? TELEFONIA_BONUS : 0;
    
    return baseBonus + telefoniaBonus;
  };

  const calculateProgress = (current: number, target: number): number => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressStatus = (current: number, target: number): 'red' | 'yellow' | 'green' => {
    const progress = (current / target) * 100;
    if (progress >= 100) return 'green';
    if (progress >= 50) return 'yellow';
    return 'red';
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchPremiumStatus(),
        fetchCurrentGoals(),
        fetchHistory(),
        fetchPartners(),
      ]);
      setIsLoading(false);
    };

    if (driver?.id) {
      loadData();
    }
  }, [driver?.id, fetchPremiumStatus, fetchCurrentGoals, fetchHistory, fetchPartners]);

  return {
    isLoading,
    isPremium,
    premiumStatus,
    currentGoals,
    history,
    partners,
    operadora,
    subscribeToPremium,
    updateGoals,
    checkBonusEligibility,
    checkTelefoniaEligibility,
    calculateTotalBonus,
    calculateProgress,
    getProgressStatus,
    refreshGoals: fetchCurrentGoals,
    refreshHistory: fetchHistory,
  };
}
