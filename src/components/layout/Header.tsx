import React from "react";
import { StatusToggle } from "@/components/ui/status-toggle";
import { useDriver } from "@/contexts/DriverContext";

interface HeaderProps {
  title?: string;
  showStatus?: boolean;
}

export function Header({ title = "MOVA", showStatus = true }: HeaderProps) {
  const { status, setStatus } = useDriver();

  return (
    <header className="sticky top-0 bg-card/80 backdrop-blur-lg border-b border-border z-40 safe-top">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        <h1 className="text-xl font-display font-bold text-primary">{title}</h1>
        {showStatus && (
          <StatusToggle status={status} onStatusChange={setStatus} />
        )}
      </div>
    </header>
  );
}
