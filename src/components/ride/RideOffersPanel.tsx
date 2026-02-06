import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, User, Navigation, Loader2, Wifi, WifiOff, CreditCard, Banknote, QrCode } from 'lucide-react';
import { useRideOffers } from '@/hooks/useRideOffers';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function RideOffersPanel() {
  const { offers, isLoading, connectionStatus, error, refreshOffers, acceptRide } = useRideOffers();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const handleAccept = async (rideId: string) => {
    setAcceptingId(rideId);
    await acceptRide(rideId);
    setAcceptingId(null);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return 'Expirado';
    const seconds = Math.floor(diff / 1000);
    return `${seconds}s`;
  };

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">Conectado</span>
            </>
          ) : connectionStatus === 'connecting' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
              <span className="text-sm text-yellow-600">Conectando...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">Desconectado</span>
            </>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={refreshOffers}>
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      {offers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Navigation className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma corrida disponível</p>
            <p className="text-sm text-muted-foreground mt-1">
              Fique online para receber novas solicitações
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <RideOfferCard
              key={offer.id}
              offer={offer}
              onAccept={() => handleAccept(offer.ride_id)}
              isAccepting={acceptingId === offer.ride_id}
              timeRemaining={getTimeRemaining(offer.expires_at)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface RideOfferCardProps {
  offer: any;
  onAccept: () => void;
  isAccepting: boolean;
  timeRemaining: string;
}

function RideOfferCard({ offer, onAccept, isAccepting, timeRemaining }: RideOfferCardProps) {
  const ride = offer.rides_v2 || offer.ride;
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const expires = new Date(offer.expires_at);
      const diff = expires.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown('Expirado');
        clearInterval(interval);
      } else {
        setCountdown(`${Math.floor(diff / 1000)}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [offer.expires_at]);

  const isExpired = countdown === 'Expirado';

  if (!ride) return null;

  return (
    <Card className={`overflow-hidden transition-all ${isExpired ? 'opacity-50' : 'border-primary/50 shadow-md'}`}>
      <CardHeader className="pb-2 bg-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            {ride.passenger?.full_name || 'Passageiro'}
          </CardTitle>
          <Badge variant={isExpired ? 'secondary' : 'default'} className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {countdown}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-3 space-y-3">
        {/* Origin */}
        <div className="flex items-start gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Origem</p>
            <p className="text-sm font-medium truncate">{ride.origin_address}</p>
          </div>
        </div>

        {/* Destination */}
        <div className="flex items-start gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Destino</p>
            <p className="text-sm font-medium truncate">{ride.dest_address}</p>
          </div>
        </div>

        {/* Payment Method */}
        <PaymentMethodBadge 
          method={ride.payment_method} 
          status={ride.payment_status} 
        />

        {/* Price */}
        {ride.price_cents > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-bold text-lg text-green-600">
              R$ {(ride.price_cents / 100).toFixed(2)}
            </span>
          </div>
        )}

        {/* Accept Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={onAccept}
          disabled={isAccepting || isExpired}
        >
          {isAccepting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Aceitando...
            </>
          ) : isExpired ? (
            'Oferta Expirada'
          ) : (
            'Aceitar Corrida'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Componente de badge de pagamento
function PaymentMethodBadge({ method, status }: { method?: string; status?: string }) {
  const getPaymentInfo = () => {
    switch (method) {
      case 'credit_card':
        return {
          icon: CreditCard,
          label: 'Crédito',
          color: status === 'paid' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-blue-100 text-blue-700 border-blue-300',
          sublabel: status === 'paid' ? 'Pago antecipado' : 'Paga no carro',
        };
      case 'debit_card':
        return {
          icon: CreditCard,
          label: 'Débito',
          color: 'bg-purple-100 text-purple-700 border-purple-300',
          sublabel: 'Paga no carro',
        };
      case 'pix':
        return {
          icon: QrCode,
          label: 'PIX',
          color: 'bg-green-100 text-green-700 border-green-300',
          sublabel: 'Pago antecipado ✓',
        };
      case 'cash':
      default:
        return {
          icon: Banknote,
          label: 'Dinheiro',
          color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
          sublabel: 'Paga no carro',
        };
    }
  };

  const info = getPaymentInfo();
  const Icon = info.icon;

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border ${info.color}`}>
      <Icon className="w-5 h-5" />
      <div className="flex-1">
        <p className="font-medium text-sm">{info.label}</p>
        <p className="text-xs opacity-80">{info.sublabel}</p>
      </div>
      {status === 'paid' && (
        <Badge variant="outline" className="bg-green-500 text-white border-green-500 text-xs">
          PAGO
        </Badge>
      )}
    </div>
  );
}
