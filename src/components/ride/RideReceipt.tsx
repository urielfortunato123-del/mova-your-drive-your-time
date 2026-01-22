import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Share2, 
  MapPin, 
  Clock, 
  DollarSign,
  User,
  Car,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Ride } from '@/types/ride';

interface RideReceiptProps {
  ride: Ride;
  driverName: string;
  driverPlate: string;
}

export function RideReceipt({ ride, driverName, driverPlate }: RideReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    const receiptText = `
🚗 COMPROVANTE DE CORRIDA MOVA

📅 Data: ${format(new Date(ride.pickupTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

📍 Origem: ${ride.pickupAddress}
📍 Destino: ${ride.dropoffAddress}

💰 Valor Total: R$ ${ride.estimatedValue.toFixed(2)}

🚙 Motorista: ${driverName}
🔖 Placa: ${driverPlate}

✅ Corrida finalizada com sucesso!

Obrigado por usar MOVA.
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Comprovante MOVA',
          text: receiptText,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Erro ao compartilhar');
        }
      }
    } else {
      await navigator.clipboard.writeText(receiptText);
      toast.success('Comprovante copiado!');
    }
  };

  const handleDownload = () => {
    const receiptText = `
═══════════════════════════════════════
           COMPROVANTE DE CORRIDA
                  MOVA
═══════════════════════════════════════

Data: ${format(new Date(ride.pickupTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

TRAJETO
───────────────────────────────────────
Origem:  ${ride.pickupAddress}
Destino: ${ride.dropoffAddress}

DETALHES DA CORRIDA
───────────────────────────────────────
Passageiro:    ${ride.passengerName}

VALORES
───────────────────────────────────────
Valor da corrida:  R$ ${ride.estimatedValue.toFixed(2)}

MOTORISTA
───────────────────────────────────────
Nome:  ${driverName}
Placa: ${driverPlate}

═══════════════════════════════════════
          Obrigado por usar MOVA!
      Mobilidade que respeita seu tempo
═══════════════════════════════════════
    `.trim();

    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comprovante-mova-${format(new Date(ride.pickupTime), 'dd-MM-yyyy-HHmm')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Comprovante baixado!');
  };

  return (
    <Card ref={receiptRef} className="bg-card border-border">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 text-available mb-2">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">Corrida Finalizada</span>
        </div>
        <CardTitle className="text-xl">Comprovante MOVA</CardTitle>
        <p className="text-sm text-muted-foreground">
          {format(new Date(ride.pickupTime), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Route */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-available mt-1.5" />
            <div>
              <p className="text-xs text-muted-foreground">Origem</p>
              <p className="text-sm font-medium">{ride.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive mt-1.5" />
            <div>
              <p className="text-xs text-muted-foreground">Destino</p>
              <p className="text-sm font-medium">{ride.dropoffAddress}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Passageiro</p>
              <p className="font-medium">{ride.passengerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Placa</p>
              <p className="font-medium font-mono">{driverPlate}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-available" />
            <span className="font-medium">Valor Total</span>
          </div>
          <span className="text-2xl font-bold text-available">
            R$ {ride.estimatedValue.toFixed(2)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Baixar
          </Button>
          <Button onClick={handleShare} className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
