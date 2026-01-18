import * as React from "react";
import { cn } from "@/lib/utils";
import { DriverStatus } from "@/types/ride";
import { Circle, Pause, XCircle } from "lucide-react";

interface StatusToggleProps {
  status: DriverStatus;
  onStatusChange: (status: DriverStatus) => void;
}

const statusConfig: Record<DriverStatus, { label: string; icon: React.ReactNode; className: string }> = {
  available: {
    label: "Disponível",
    icon: <Circle className="w-3 h-3 fill-current" />,
    className: "bg-available text-available-foreground",
  },
  paused: {
    label: "Pausado",
    icon: <Pause className="w-3 h-3" />,
    className: "bg-paused text-paused-foreground",
  },
  unavailable: {
    label: "Indisponível",
    icon: <XCircle className="w-3 h-3" />,
    className: "bg-unavailable text-unavailable-foreground",
  },
};

const statusOrder: DriverStatus[] = ["available", "paused", "unavailable"];

export function StatusToggle({ status, onStatusChange }: StatusToggleProps) {
  const config = statusConfig[status];

  const cycleStatus = () => {
    const currentIndex = statusOrder.indexOf(status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    onStatusChange(statusOrder[nextIndex]);
  };

  return (
    <button
      onClick={cycleStatus}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all",
        "shadow-sm hover:shadow-md active:scale-95",
        config.className
      )}
    >
      {config.icon}
      {config.label}
    </button>
  );
}
