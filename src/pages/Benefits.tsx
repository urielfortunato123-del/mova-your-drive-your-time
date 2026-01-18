import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDriver } from "@/contexts/DriverContext";
import { useAuth } from "@/contexts/AuthContext";
import { QrCode, Fuel, Wrench, CircleDot, Droplet, Sparkles } from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  'Combustível': <Fuel className="w-5 h-5" />,
  'Oficina': <Wrench className="w-5 h-5" />,
  'Pneus': <CircleDot className="w-5 h-5" />,
  'Troca de óleo': <Droplet className="w-5 h-5" />,
  'Lavagem': <Sparkles className="w-5 h-5" />,
};

export default function Benefits() {
  const { partners } = useDriver();
  const { driver } = useAuth();

  // Generate a simple QR code placeholder (in production, use a real QR library)
  const qrCodeData = driver?.id || 'MOVA-DRIVER';

  return (
    <PageContainer title="Benefícios">
      <div className="space-y-6">
        {/* QR Code Section */}
        <div className="bg-card rounded-2xl border border-border p-6 animate-fade-in">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <QrCode className="w-4 h-4" />
              Seu QR Code MOVA
            </div>

            {/* QR Code Display */}
            <div className="bg-primary-foreground p-6 rounded-xl inline-block mb-4">
              <div className="w-48 h-48 bg-primary rounded-lg flex items-center justify-center">
                <div className="grid grid-cols-5 gap-1 p-2">
                  {/* Simple QR pattern placeholder */}
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-sm ${
                        Math.random() > 0.4 ? 'bg-primary-foreground' : 'bg-primary'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="font-medium text-foreground">{driver?.name}</p>
            <p className="text-sm text-muted-foreground">ID: {qrCodeData}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-secondary/50 rounded-xl p-4 animate-slide-up">
          <p className="text-sm text-center text-muted-foreground">
            Apresente este QR Code e receba desconto automático nos parceiros MOVA.
          </p>
        </div>

        {/* Partners List */}
        <div className="animate-slide-up">
          <h3 className="font-semibold text-foreground mb-3">Parceiros</h3>
          <div className="space-y-3">
            {partners.map((partner, index) => (
              <div
                key={partner.id}
                className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                  {categoryIcons[partner.category] || <Sparkles className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{partner.name}</p>
                  <p className="text-sm text-muted-foreground">{partner.category}</p>
                </div>
                <div className="bg-success/10 text-success text-sm font-medium px-3 py-1 rounded-full shrink-0">
                  {partner.discount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
