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
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-available" />
            ) : (
              <Target className="w-5 h-5 text-primary" />
            )}
            <span className="font-medium text-foreground">Meta do Dia</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className={cn(
              "w-4 h-4",
              isCompleted ? "text-available" : "text-muted-foreground"
            )} />
            <span className={cn(
              "font-semibold",
              isCompleted ? "text-available" : "text-foreground"
            )}>
              {percentage.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Progress 
            value={percentage} 
            className={cn(
              "h-3",
              isCompleted && "[&>div]:bg-available"
            )}
          />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              R$ {current.toFixed(0)} / R$ {goal.toFixed(0)}
            </span>
            {!isCompleted && (
              <span className="text-primary font-medium">
                Faltam R$ {remaining.toFixed(0)}
              </span>
            )}
            {isCompleted && (
              <span className="text-available font-medium">
                Meta atingida! 🎉
              </span>
            )}
          </div>
          
          {/* Connection to monthly bonus */}
          <p className="text-xs text-muted-foreground text-center mt-3 pt-3 border-t border-border/50">
            📌 Essa meta te aproxima do bônus mensal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
