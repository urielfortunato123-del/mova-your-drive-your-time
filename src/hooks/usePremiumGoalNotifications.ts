import { useEffect, useRef, useCallback } from 'react';
import { useNotifications } from './useNotifications';
import { usePremium, PREMIUM_GOALS } from './usePremium';
import { toast } from 'sonner';

interface GoalThreshold {
  key: string;
  label: string;
  emoji: string;
  remaining: number;
}

// Thresholds for "close to goal" notifications
const GOAL_THRESHOLDS = {
  corridas: [5, 10, 20], // Notify when X rides remaining
  horas: [5, 10, 20], // Notify when X hours remaining
  litros: [20, 50, 100], // Notify when X liters remaining
  manutencao: [10, 20, 50], // Notify when R$ X remaining
};

const GOAL_LABELS = {
  corridas: { label: 'corridas', emoji: '🚗', unit: '' },
  horas: { label: 'horas', emoji: '⏰', unit: 'h' },
  litros: { label: 'litros de combustível', emoji: '⛽', unit: 'L' },
  manutencao: { label: 'em manutenção', emoji: '🔧', unit: 'R$' },
};

export function usePremiumGoalNotifications() {
  const { permission, sendNotification } = useNotifications();
  const { currentGoals, isPremium } = usePremium();
  
  // Track which thresholds have been notified to avoid duplicates
  const notifiedThresholds = useRef<Set<string>>(new Set());
  const previousGoals = useRef<typeof currentGoals>(null);

  const checkAndNotify = useCallback((
    key: keyof typeof GOAL_THRESHOLDS,
    current: number,
    target: number,
    previousValue: number
  ) => {
    const remaining = target - current;
    const previousRemaining = target - previousValue;
    const thresholds = GOAL_THRESHOLDS[key];
    const { label, emoji, unit } = GOAL_LABELS[key];

    for (const threshold of thresholds) {
      const notificationKey = `${key}-${threshold}`;
      
      // Check if we crossed this threshold (going down) and haven't notified yet
      if (
        remaining <= threshold &&
        previousRemaining > threshold &&
        !notifiedThresholds.current.has(notificationKey)
      ) {
        notifiedThresholds.current.add(notificationKey);
        
        const message = unit === 'R$' 
          ? `Faltam apenas ${unit} ${remaining.toFixed(0)} ${label}!`
          : `Faltam apenas ${remaining.toFixed(0)}${unit} ${label}!`;

        // Send push notification
        if (permission === 'granted') {
          sendNotification(`${emoji} Quase lá!`, {
            body: message + ' Continue assim para liberar seu bônus!',
            tag: `premium-goal-${key}-${threshold}`,
            data: { type: 'premium-goal', goal: key, remaining },
          });
        }

        // Show in-app toast
        toast.success(`${emoji} Quase lá!`, {
          description: message,
          duration: 5000,
        });

        // Only notify for the closest threshold
        break;
      }
    }

    // Special notification when goal is complete
    if (current >= target && previousValue < target) {
      const completeKey = `${key}-complete`;
      
      if (!notifiedThresholds.current.has(completeKey)) {
        notifiedThresholds.current.add(completeKey);
        
        const completeMessage = `Meta de ${label} concluída!`;

        if (permission === 'granted') {
          sendNotification(`🎉 Meta atingida!`, {
            body: completeMessage,
            tag: `premium-goal-complete-${key}`,
            data: { type: 'premium-goal-complete', goal: key },
          });
        }

        toast.success(`🎉 Meta atingida!`, {
          description: completeMessage,
          duration: 5000,
        });
      }
    }
  }, [permission, sendNotification]);

  // Monitor goal changes
  useEffect(() => {
    if (!isPremium || !currentGoals) return;

    const prevGoals = previousGoals.current;
    
    if (prevGoals) {
      checkAndNotify(
        'corridas',
        currentGoals.corridas_mes,
        PREMIUM_GOALS.corridas,
        prevGoals.corridas_mes
      );
      
      checkAndNotify(
        'horas',
        currentGoals.horas_logadas_mes,
        PREMIUM_GOALS.horas,
        prevGoals.horas_logadas_mes
      );
      
      checkAndNotify(
        'litros',
        currentGoals.litros_combustivel_mes,
        PREMIUM_GOALS.litros,
        prevGoals.litros_combustivel_mes
      );
      
      checkAndNotify(
        'manutencao',
        currentGoals.gasto_manutencao_mes,
        PREMIUM_GOALS.manutencao,
        prevGoals.gasto_manutencao_mes
      );
    }

    previousGoals.current = { ...currentGoals };
  }, [currentGoals, isPremium, checkAndNotify]);

  // Get current goal progress summary for display
  const getGoalProximityAlerts = useCallback((): GoalThreshold[] => {
    if (!currentGoals) return [];

    const alerts: GoalThreshold[] = [];
    const goals = [
      { key: 'corridas', current: currentGoals.corridas_mes, target: PREMIUM_GOALS.corridas },
      { key: 'horas', current: currentGoals.horas_logadas_mes, target: PREMIUM_GOALS.horas },
      { key: 'litros', current: currentGoals.litros_combustivel_mes, target: PREMIUM_GOALS.litros },
      { key: 'manutencao', current: currentGoals.gasto_manutencao_mes, target: PREMIUM_GOALS.manutencao },
    ];

    for (const goal of goals) {
      const remaining = goal.target - goal.current;
      const { label, emoji } = GOAL_LABELS[goal.key as keyof typeof GOAL_LABELS];
      const thresholds = GOAL_THRESHOLDS[goal.key as keyof typeof GOAL_THRESHOLDS];
      
      // Check if within notification range
      if (remaining > 0 && remaining <= thresholds[thresholds.length - 1]) {
        alerts.push({
          key: goal.key,
          label,
          emoji,
          remaining,
        });
      }
    }

    return alerts;
  }, [currentGoals]);

  // Reset notifications for new month
  const resetNotifications = useCallback(() => {
    notifiedThresholds.current.clear();
  }, []);

  return {
    getGoalProximityAlerts,
    resetNotifications,
  };
}
