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

export function StatCard({ label, value, icon: Icon, highlight, subtext, className }: StatCardProps) {
  return (
    <div className={cn(
      "card-modern group",
      highlight && "border-primary/30 bg-primary/5",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className={cn(
            "text-2xl font-display font-bold",
            highlight ? "text-primary" : "text-foreground"
          )}>
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "p-2.5 rounded-xl transition-all duration-300",
            highlight 
              ? "bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground" 
              : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
