import React from "react";
import { Link } from "react-router-dom";
import { StatusToggle } from "@/components/ui/status-toggle";
import { useDriver } from "@/contexts/DriverContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

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
    <header className="sticky top-0 bg-card/80 backdrop-blur-lg border-b border-border z-40 safe-top">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <h1 className="text-xl font-display font-bold text-primary">{title}</h1>
        <div className="flex items-center gap-3">
          {showStatus && (
            <StatusToggle status={status} onStatusChange={setStatus} />
          )}
          <Link to="/profile">
            <Avatar className="h-8 w-8 border-2 border-primary/20 hover:border-primary transition-colors">
              <AvatarImage src={driver?.photo} alt={driver?.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
