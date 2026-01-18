import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Calendar, Clock, DollarSign, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Início" },
  { to: "/rides", icon: Calendar, label: "Corridas" },
  { to: "/history", icon: Clock, label: "Histórico" },
  { to: "/earnings", icon: DollarSign, label: "Ganhos" },
  { to: "/benefits", icon: Gift, label: "Benefícios" },
  { to: "/profile", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-nav safe-bottom z-50">
      <div className="flex items-center justify-around px-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "nav-item flex-1",
                isActive && "nav-item-active"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-[10px] transition-colors",
                isActive ? "text-primary font-medium" : "text-muted-foreground"
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
