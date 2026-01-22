import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyGoalProps {
  current: number;
  goal: number;
  className?: string;
}

export function DailyGoal({ current, goal, className }: DailyGoalProps) {
  const percentage = Math.min((current / goal) * 100, 100);
  const remaining = Math.max(goal - current, 0);
  const isCompleted = current >= goal;

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
        </div>
      </CardContent>
    </Card>
  );
}
