import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  highlight?: boolean;
  subtext?: string;
  className?: string;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon: Icon, highlight, subtext, className }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-2xl p-4 transition-all duration-300",
          "bg-gradient-to-br from-card/80 to-card/60",
          "backdrop-blur-[20px]",
          "border",
          highlight 
            ? "border-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.15)]" 
            : "border-border/40",
          "hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--primary)/0.1)]",
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              {label}
            </p>
            <p className={cn(
              "text-2xl font-display font-bold tracking-tight",
              highlight ? "text-primary" : "text-foreground"
            )}>
              {value}
            </p>
            {subtext && (
              <p className="text-xs text-muted-foreground">{subtext}</p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300",
              "bg-gradient-to-br from-primary/20 to-primary/10",
              "border border-primary/20",
              "text-primary"
            )}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>
    );
  }
);
StatCard.displayName = "StatCard";
