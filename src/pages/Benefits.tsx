import React from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDriver } from "@/contexts/DriverContext";
import { useAuth } from "@/contexts/AuthContext";
import { QrCode, Fuel, Wrench, CircleDot, Droplet, Sparkles, ArrowRight, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        {/* Bradesco Partner Banner */}
        <Link to="/bradesco">
          <Card className="overflow-hidden animate-fade-in hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-[#CC092F] to-[#8B0620] p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-[#CC092F] font-bold">B</span>
                    </div>
                    <div>
                      <p className="font-semibold">MOVA + Bradesco S.A.</p>
                      <p className="text-xs text-white/80">Programa de KM exclusivo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Ver benefícios</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>R$ 1 = 0,5 KM</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Fuel className="w-4 h-4" />
                    <span>Combustível</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-4 h-4" />
                    <span>Manutenção</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

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
