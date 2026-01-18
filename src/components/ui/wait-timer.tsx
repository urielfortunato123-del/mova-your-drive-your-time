import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Timer, DollarSign, AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface WaitTimerProps {
  startTime: Date;
  ratePerMinute?: number; // R$ 0.25 per minute
  maxMinutes?: number; // 15 minutes limit
  onTimeUp?: () => void;
  onStop?: (minutes: number, value: number) => void;
}

export function WaitTimer({ 
  startTime, 
  ratePerMinute = 0.25, 
  maxMinutes = 15,
  onTimeUp,
  onStop 
}: WaitTimerProps) {
  const [elapsed, setElapsed] = useState(0); // in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const seconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsed(seconds);

      if (seconds >= maxMinutes * 60) {
        clearInterval(interval);
        onTimeUp?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, maxMinutes, onTimeUp]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const value = (elapsed / 60) * ratePerMinute;
  const isNearLimit = minutes >= maxMinutes - 2;
  const isAtLimit = minutes >= maxMinutes;

  const formatTime = (m: number, s: number) => 
    `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <div className={cn(
      "bg-card rounded-2xl border-2 p-6 animate-fade-in",
      isAtLimit ? "border-destructive" : isNearLimit ? "border-warning" : "border-available"
    )}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Timer className={cn(
            "w-5 h-5",
            isAtLimit ? "text-destructive" : "text-available"
          )} />
          <span className="text-sm font-medium text-muted-foreground">
            Tempo de Espera
          </span>
        </div>

        {/* Timer Display */}
        <div className={cn(
          "text-5xl font-display font-bold mb-4 timer-active",
          isAtLimit ? "text-destructive" : isNearLimit ? "text-warning" : "text-primary"
        )}>
          {formatTime(minutes, seconds)}
        </div>

        {/* Value Display */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-success" />
          <span className="text-2xl font-bold text-success">
            R$ {value.toFixed(2)}
          </span>
        </div>

        {/* Info text */}
        <p className="text-xs text-muted-foreground mb-4">
          R$ {ratePerMinute.toFixed(2)}/min • Limite: {maxMinutes} min • 100% para você
        </p>

        {/* Warning */}
        {isNearLimit && !isAtLimit && (
          <div className="flex items-center justify-center gap-2 text-warning text-sm mb-4">
            <AlertTriangle className="w-4 h-4" />
            <span>Aproximando do limite</span>
          </div>
        )}

        {isAtLimit && (
          <div className="flex items-center justify-center gap-2 text-destructive text-sm mb-4">
            <AlertTriangle className="w-4 h-4" />
            <span>Tempo limite atingido</span>
          </div>
        )}

        {/* Stop Button */}
        <Button 
          onClick={() => onStop?.(minutes + seconds / 60, value)}
          variant={isAtLimit ? "destructive" : "default"}
          className="w-full"
        >
          {isAtLimit ? "Cancelar Corrida" : "Passageiro Chegou"}
        </Button>
      </div>
    </div>
  );
}
