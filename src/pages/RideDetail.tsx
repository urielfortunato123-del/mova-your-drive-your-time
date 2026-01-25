import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { WaitTimer } from "@/components/ui/wait-timer";
import { Button } from "@/components/ui/button";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { PassengerRatingDialog } from "@/components/ride/PassengerRatingDialog";
import { RideRecorder } from "@/components/ride/RideRecorder";
import { useDriver } from "@/contexts/DriverContext";
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Navigation, 
  X,
  CheckCircle,
  ExternalLink,
  Flag
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function RideDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    rides, 
    activeWaitTimer, 
    startWaitTimer, 
    stopWaitTimer, 
    updateRideStatus,
  } = useDriver();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [isArrived, setIsArrived] = useState(false);

  const ride = rides.find(r => r.id === id);

  if (!ride) {
    return (
      <PageContainer title="Corrida">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Corrida não encontrada</p>
        </div>
      </PageContainer>
    );
  }

  const pickupTime = new Date(ride.pickupTime);
  const isActiveTimer = activeWaitTimer?.rideId === ride.id;

  const openInMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  const handleStartTrip = () => {
    updateRideStatus(ride.id, 'in_progress');
    toast.success("Deslocamento iniciado!");
  };

  const handleArrived = () => {
    setIsArrived(true);
    startWaitTimer(ride.id);
    toast.info("Contador de espera iniciado");
  };

  const handlePassengerArrived = (minutes: number, value: number) => {
    stopWaitTimer();
    setIsArrived(false);
    toast.success(`Passageiro entrou! Espera: R$ ${value.toFixed(2)}`);
  };

  const handleCancel = (reason: string) => {
    updateRideStatus(ride.id, 'cancelled');
    stopWaitTimer();
    setShowCancelDialog(false);
    toast.info("Corrida cancelada");
    navigate('/rides');
  };

  const handleCompleteRide = () => {
    setShowRatingDialog(true);
  };

  const handleSubmitRating = (rating: number, comment?: string) => {
    // Here you would save the rating to the database
    console.log("Rating submitted:", { rideId: ride.id, rating, comment });
    updateRideStatus(ride.id, 'completed');
    stopWaitTimer();
    setShowRatingDialog(false);
    toast.success(`Corrida finalizada! Avaliação: ${rating} estrelas`);
    navigate('/rides');
  };

  const cancelReasons = [
    "Passageiro não apareceu",
    "Passageiro cancelou",
    "Endereço incorreto",
    "Problema com veículo",
    "Outro motivo"
  ];

  return (
    <PageContainer title="Detalhe da Corrida">
      <div className="space-y-6">
        {/* Timer Section - Show when arrived */}
        {isActiveTimer && activeWaitTimer && (
          <WaitTimer
            startTime={activeWaitTimer.startTime}
            onStop={handlePassengerArrived}
            onTimeUp={() => {
              toast.warning("Tempo limite de espera atingido");
            }}
          />
        )}

        {/* Ride Info Card */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4 animate-fade-in">
          {/* Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horário de chegada</p>
                <p className="text-2xl font-display font-bold text-primary">
                  {format(pickupTime, "HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="text-2xl font-bold text-success">
                R$ {ride.estimatedValue.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Passenger */}
          <div className="flex items-center gap-3 pt-3 border-t border-border">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{ride.passengerName}</p>
              {ride.passengerPhone && (
                <p className="text-sm text-muted-foreground">{ride.passengerPhone}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Chat Button */}
              <ChatDrawer
                rideId={ride.id}
                passengerName={ride.passengerName}
                rideStatus={ride.status}
              />
              {/* Phone Button */}
              {ride.passengerPhone && (
                <a
                  href={`tel:${ride.passengerPhone}`}
                  className="w-10 h-10 bg-available/10 rounded-full flex items-center justify-center"
                >
                  <Phone className="w-5 h-5 text-available" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="space-y-3 animate-slide-up">
          {/* Pickup */}
          <button
            onClick={() => openInMaps(ride.pickupAddress)}
            className="w-full bg-card rounded-xl border border-border p-4 flex items-start gap-3 text-left hover:border-primary/30 transition-colors"
          >
            <div className="w-8 h-8 bg-available/10 rounded-lg flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-available" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Origem</p>
              <p className="text-sm font-medium">{ride.pickupAddress}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
          </button>

          {/* Dropoff */}
          <button
            onClick={() => openInMaps(ride.dropoffAddress)}
            className="w-full bg-card rounded-xl border border-border p-4 flex items-start gap-3 text-left hover:border-primary/30 transition-colors"
          >
            <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Destino</p>
              <p className="text-sm font-medium">{ride.dropoffAddress}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
          </button>
        </div>

        {/* Ride Recorder */}
        {(ride.status === 'confirmed' || ride.status === 'in_progress') && (
          <RideRecorder rideId={ride.id} passengerName={ride.passengerName} />
        )}

        {/* Action Buttons */}
        {ride.status === 'confirmed' && !isActiveTimer && (
          <div className="space-y-3 animate-slide-up">
            <Button 
              onClick={handleStartTrip}
              className="w-full h-14 text-base gap-2"
            >
              <Navigation className="w-5 h-5" />
              Iniciar Deslocamento
            </Button>
          </div>
        )}

        {ride.status === 'in_progress' && !isActiveTimer && (
          <div className="space-y-3 animate-slide-up">
            <Button 
              onClick={handleArrived}
              className="w-full h-14 text-base gap-2 bg-available hover:bg-available/90"
            >
              <CheckCircle className="w-5 h-5" />
              Cheguei
            </Button>
          </div>
        )}

        {/* Complete Ride Button - Show when waiting for passenger or timer active */}
        {isActiveTimer && (
          <div className="space-y-3 animate-slide-up">
            <Button 
              onClick={handleCompleteRide}
              className="w-full h-14 text-base gap-2 bg-primary hover:bg-primary/90"
            >
              <Flag className="w-5 h-5" />
              Finalizar Corrida
            </Button>
          </div>
        )}

        {/* Cancel Button */}
        {(ride.status === 'confirmed' || ride.status === 'in_progress') && (
          <Button 
            onClick={() => setShowCancelDialog(true)}
            variant="ghost"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar Corrida
          </Button>
        )}

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar Corrida</DialogTitle>
              <DialogDescription>
                Selecione o motivo do cancelamento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 pt-4">
              {cancelReasons.map((reason) => (
                <Button
                  key={reason}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleCancel(reason)}
                >
                  {reason}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Rating Dialog */}
        <PassengerRatingDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          passengerName={ride.passengerName}
          onSubmit={handleSubmitRating}
        />
      </div>
    </PageContainer>
  );
}
