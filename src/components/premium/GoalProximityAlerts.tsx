import React from 'react';
import { Card } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePremiumGoalNotifications } from '@/hooks/usePremiumGoalNotifications';

interface GoalProximityAlertsProps {
  className?: string;
}

export function GoalProximityAlerts({ className }: GoalProximityAlertsProps) {
  const { getGoalProximityAlerts } = usePremiumGoalNotifications();
  const alerts = getGoalProximityAlerts();

  if (alerts.length === 0) return null;

  return (
    <Card className={cn(
      "p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-yellow-500/20 animate-pulse">
          <Bell className="w-4 h-4 text-yellow-600" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-foreground text-sm mb-2">
            🔥 Você está quase lá!
          </p>
          <ul className="space-y-1">
            {alerts.map((alert) => (
              <li 
                key={alert.key} 
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <span>{alert.emoji}</span>
                <span>
                  Faltam <span className="font-semibold text-foreground">
                    {alert.key === 'manutencao' 
                      ? `R$ ${alert.remaining.toFixed(0)}` 
                      : alert.remaining.toFixed(0)
                    }
                  </span> {alert.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
