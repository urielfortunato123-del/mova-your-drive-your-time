import React from 'react';
import { Clock, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type GoalStatus = 'not_started' | 'in_progress' | 'pending_requirement' | 'completed' | 'failed';

interface GoalStatusBadgeProps {
  current: number;
  target: number;
  isMonthEnded?: boolean;
  isRequirement?: boolean;
  requirementMet?: boolean;
}

export function getGoalStatus({
  current,
  target,
  isMonthEnded = false,
  isRequirement = false,
  requirementMet = false,
}: GoalStatusBadgeProps): GoalStatus {
  if (isRequirement) {
    if (requirementMet) return 'completed';
    if (isMonthEnded) return 'failed';
    return 'pending_requirement';
  }

  const progress = (current / target) * 100;

  if (progress >= 100) return 'completed';
  if (isMonthEnded) return 'failed';
  if (progress === 0) return 'not_started';
  return 'in_progress';
}

interface StatusConfig {
  label: string;
  icon: React.ElementType;
  bgColor: string;
  textColor: string;
  iconColor: string;
}

export function getStatusConfig(status: GoalStatus): StatusConfig {
  switch (status) {
    case 'not_started':
      return {
        label: 'A iniciar',
        icon: Clock,
        bgColor: 'bg-muted',
        textColor: 'text-muted-foreground',
        iconColor: 'text-muted-foreground',
      };
    case 'in_progress':
      return {
        label: 'Em progresso',
        icon: RefreshCw,
        bgColor: 'bg-primary/10',
        textColor: 'text-primary',
        iconColor: 'text-primary',
      };
    case 'pending_requirement':
      return {
        label: 'Requisito pendente',
        icon: AlertTriangle,
        bgColor: 'bg-warning/10',
        textColor: 'text-warning',
        iconColor: 'text-warning',
      };
    case 'completed':
      return {
        label: 'Concluído',
        icon: CheckCircle,
        bgColor: 'bg-success/10',
        textColor: 'text-success',
        iconColor: 'text-success',
      };
    case 'failed':
      return {
        label: 'Não atingido',
        icon: XCircle,
        bgColor: 'bg-destructive/10',
        textColor: 'text-destructive',
        iconColor: 'text-destructive',
      };
  }
}

interface GoalStatusBadgeComponentProps extends GoalStatusBadgeProps {
  className?: string;
}

export function GoalStatusBadge({
  current,
  target,
  isMonthEnded = false,
  isRequirement = false,
  requirementMet = false,
  className,
}: GoalStatusBadgeComponentProps) {
  const status = getGoalStatus({ current, target, isMonthEnded, isRequirement, requirementMet });
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className={cn(
      "px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1",
      config.bgColor,
      config.textColor,
      className
    )}>
      <Icon className={cn("w-3 h-3", config.iconColor)} />
      {config.label}
    </div>
  );
}
