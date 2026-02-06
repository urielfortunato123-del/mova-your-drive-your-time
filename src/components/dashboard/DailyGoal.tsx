import { useEffect, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';

interface DailyGoalProps {
  current: number;
  goal: number;
  className?: string;
}

export function DailyGoal({ current, goal, className }: DailyGoalProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  const remaining = Math.max(goal - current, 0);
  const isCompleted = current >= goal;
  
  const { permission, notifyGoalReached, sendNotification } = useNotifications();
  const notifiedMilestonesRef = useRef<Set<number>>(new Set());
  const previousPercentageRef = useRef(0);

  // Milestone notifications (50%, 75%, 100%)
  useEffect(() => {
    const milestones = [
      { threshold: 50, emoji: '💪', message: 'Você está na metade! Continue assim!' },
      { threshold: 75, emoji: '🔥', message: 'Quase lá! Faltam só 25% para bater sua meta!' },
      { threshold: 100, emoji: '🎉', message: `Parabéns! Você alcançou R$ ${current.toFixed(0)} hoje!` },
    ];

    for (const milestone of milestones) {
      // Only trigger if crossing the threshold upward and not already notified
      if (
        percentage >= milestone.threshold &&
        previousPercentageRef.current < milestone.threshold &&
        !notifiedMilestonesRef.current.has(milestone.threshold)
      ) {
        notifiedMilestonesRef.current.add(milestone.threshold);

        // Send push notification if permission granted
        if (permission === 'granted') {
          if (milestone.threshold === 100) {
            notifyGoalReached(current, goal);
          } else {
            sendNotification(`${milestone.emoji} ${milestone.threshold}% da Meta!`, {
              body: milestone.message,
              tag: `goal-progress-${milestone.threshold}`,
              data: { type: 'goal-progress', percentage: milestone.threshold },
            });
          }
        }

        // Show in-app toast
        const toastType = milestone.threshold === 100 ? 'success' : 'info';
        toast[toastType](`${milestone.emoji} ${milestone.threshold}% da Meta!`, {
          description: milestone.message,
          duration: 4000,
        });
      }
    }

    previousPercentageRef.current = percentage;
  }, [percentage, current, goal, permission, notifyGoalReached, sendNotification]);

  return (
    <Card className={cn("card-modern overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              isCompleted 
                ? "bg-primary/20 text-primary" 
                : "bg-secondary text-muted-foreground"
            )}>
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Target className="w-5 h-5" />
              )}
            </div>
            <span className="font-display font-semibold text-foreground">Meta do Dia</span>
          </div>
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
            isCompleted ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
          )}>
            <TrendingUp className="w-4 h-4" />
            <span className="font-bold text-sm">
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Progress 
              value={percentage} 
              className={cn(
                "h-3 bg-secondary/80",
                isCompleted && "[&>div]:bg-primary"
              )}
            />
            {/* Glow effect when completed */}
            {isCompleted && (
              <div className="absolute inset-0 h-3 rounded-full glow-success opacity-50" />
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">R$ {current.toFixed(0)}</span> / R$ {goal.toFixed(0)}
            </span>
            {!isCompleted && (
              <span className="text-primary font-semibold text-sm">
                Faltam R$ {remaining.toFixed(0)}
              </span>
            )}
            {isCompleted && (
              <span className="text-primary font-semibold text-sm flex items-center gap-1">
                Meta atingida! 🎉
              </span>
            )}
          </div>
          
          {/* Connection to monthly bonus */}
          <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t border-border/50">
            📌 Essa meta te aproxima do bônus mensal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
