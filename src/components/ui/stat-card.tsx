import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  highlight?: boolean;
  subtext?: string;
}

export function StatCard({ label, value, icon: Icon, highlight, subtext }: StatCardProps) {
  return (
    <div className={cn(
      "card-stat",
      highlight && "earnings-highlight"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className={cn(
            "text-2xl font-bold font-display",
            highlight ? "text-success" : "text-foreground"
          )}>
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "p-2 rounded-lg",
            highlight ? "bg-success/10" : "bg-primary/10"
          )}>
            <Icon className={cn(
              "w-5 h-5",
              highlight ? "text-success" : "text-primary"
            )} />
          </div>
        )}
      </div>
    </div>
  );
}
