import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-br from-primary to-primary/80",
          "text-primary-foreground",
          "shadow-[0_4px_16px_hsl(var(--primary)/0.3),inset_0_1px_0_hsl(var(--foreground)/0.1)]",
          "hover:shadow-[0_8px_24px_hsl(var(--primary)/0.4),inset_0_1px_0_hsl(var(--foreground)/0.15)]",
          "hover:-translate-y-0.5",
          "border border-primary/30",
        ],
        destructive: [
          "bg-gradient-to-br from-destructive to-destructive/80",
          "text-destructive-foreground",
          "shadow-[0_4px_16px_hsl(var(--destructive)/0.3)]",
          "border border-destructive/30",
        ],
        outline: [
          "border-2 border-primary/40",
          "bg-transparent",
          "text-primary",
          "hover:bg-primary/10",
          "hover:border-primary/60",
          "backdrop-blur-sm",
        ],
        secondary: [
          "bg-gradient-to-br from-secondary to-secondary/80",
          "text-secondary-foreground",
          "hover:from-secondary/90 hover:to-secondary/70",
          "border border-border/30",
        ],
        ghost: [
          "hover:bg-accent/10",
          "hover:text-accent-foreground",
          "backdrop-blur-sm",
        ],
        glass: [
          "bg-gradient-to-br from-card/60 to-card/40",
          "text-foreground",
          "backdrop-blur-[20px] saturate-[180%]",
          "border border-border/30",
          "shadow-[0_4px_16px_hsl(var(--background)/0.2),inset_0_1px_0_hsl(var(--foreground)/0.05)]",
          "hover:shadow-[0_8px_24px_hsl(var(--background)/0.3)]",
          "hover:border-primary/30",
        ],
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
