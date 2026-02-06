import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: [
          "border-primary/30",
          "bg-gradient-to-br from-primary/20 to-primary/10",
          "text-primary",
          "backdrop-blur-sm",
        ],
        secondary: [
          "border-border/30",
          "bg-gradient-to-br from-secondary/60 to-secondary/40",
          "text-secondary-foreground",
          "backdrop-blur-sm",
        ],
        destructive: [
          "border-destructive/30",
          "bg-gradient-to-br from-destructive/20 to-destructive/10",
          "text-destructive",
          "backdrop-blur-sm",
        ],
        success: [
          "border-success/30",
          "bg-gradient-to-br from-success/20 to-success/10",
          "text-success",
          "backdrop-blur-sm",
        ],
        warning: [
          "border-warning/30",
          "bg-gradient-to-br from-warning/20 to-warning/10",
          "text-warning-foreground",
          "backdrop-blur-sm",
        ],
        outline: [
          "text-foreground",
          "border-border/50",
          "backdrop-blur-sm",
        ],
        glass: [
          "border-border/30",
          "bg-gradient-to-br from-card/60 to-card/40",
          "text-foreground",
          "backdrop-blur-[20px] saturate-[180%]",
          "shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)]",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
