import React from "react";
import { Link } from "react-router-dom";
import { StatusToggle } from "@/components/ui/status-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useDriver } from "@/contexts/DriverContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  title?: string;
  showStatus?: boolean;
}

export function Header({ title = "MOVA", showStatus = true }: HeaderProps) {
  const { status, setStatus } = useDriver();
  const { driver } = useAuth();

  const initials = driver?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'MO';

  return (
    <header className="sticky top-0 glass border-b border-border/50 z-40 safe-top">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <h1 className="text-xl font-display font-bold text-gradient-primary">{title}</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {showStatus && (
            <StatusToggle status={status} onStatusChange={setStatus} />
          )}
          <Link to="/profile">
            <Avatar className="h-9 w-9 border-2 border-primary/30 hover:border-primary transition-colors ring-2 ring-primary/10">
              <AvatarImage src={driver?.photo} alt={driver?.name} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
