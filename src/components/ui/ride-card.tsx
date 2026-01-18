import * as React from "react";
import { cn } from "@/lib/utils";
import { Ride, RideStatus } from "@/types/ride";
import { Clock, MapPin, ChevronRight, CheckCircle, XCircle, Navigation } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RideCardProps {
  ride: Ride;
  onClick?: () => void;
  compact?: boolean;
}

const statusConfig: Record<RideStatus, { label: string; className: string; icon: React.ReactNode }> = {
  confirmed: {
    label: "Confirmada",
    className: "bg-primary/10 text-primary",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  in_progress: {
    label: "Em andamento",
    className: "bg-available/10 text-available",
    icon: <Navigation className="w-3 h-3" />,
  },
  completed: {
    label: "Concluída",
    className: "bg-muted text-muted-foreground",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-destructive/10 text-destructive",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export function RideCard({ ride, onClick, compact = false }: RideCardProps) {
  const status = statusConfig[ride.status];
  const pickupTime = new Date(ride.pickupTime);
  const isUpcoming = pickupTime > new Date() && ride.status === 'confirmed';

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left card-ride animate-fade-in",
        isUpcoming && "border-l-4 border-l-primary",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Time and Status */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-primary font-semibold">
              <Clock className="w-4 h-4" />
              <span>{format(pickupTime, "HH:mm", { locale: ptBR })}</span>
            </div>
            <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", status.className)}>
              {status.icon}
              {status.label}
            </span>
          </div>

          {/* Addresses */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-available mt-0.5 shrink-0" />
              <span className="text-sm text-foreground line-clamp-1">{ride.pickupAddress}</span>
            </div>
            {!compact && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground line-clamp-1">{ride.dropoffAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Value and Arrow */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="block text-lg font-bold text-success">
              R$ {ride.estimatedValue.toFixed(2)}
            </span>
            {ride.waitingValue && ride.waitingValue > 0 && (
              <span className="text-xs text-muted-foreground">
                +R$ {ride.waitingValue.toFixed(2)} espera
              </span>
            )}
          </div>
          {onClick && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
        </div>
      </div>
    </button>
  );
}
