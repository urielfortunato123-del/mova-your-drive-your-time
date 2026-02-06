import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, Map, DollarSign, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Início" },
  { to: "/rides", icon: Calendar, label: "Corridas" },
  { to: "/map", icon: Map, label: "Mapa" },
  { to: "/earnings", icon: DollarSign, label: "Ganhos" },
  { to: "/premium", icon: Crown, label: "Premium" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 safe-bottom z-50">
      <div className="flex items-center justify-around px-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "nav-item flex-1 relative py-3",
                isActive && "nav-item-active"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
              )}
              <div className={cn(
                "p-2 rounded-xl transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <span className={cn(
                "text-[10px] transition-colors mt-1",
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
