import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Navigation, MapPin, ExternalLink, Star } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumPartner } from '@/hooks/usePremium';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different partner types
const createIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 18px;">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const driverIcon = L.divIcon({
  className: 'driver-marker',
  html: `<div style="background-color: hsl(var(--primary)); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid hsl(var(--accent)); box-shadow: 0 2px 12px rgba(0,0,0,0.4); font-size: 22px;">📍</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const postoIcon = createIcon('#f59e0b', '⛽');
const oficinaIcon = createIcon('#3b82f6', '🔧');
const bancoIcon = createIcon('#10b981', '🏦');

const getIconForType = (tipo: string) => {
  switch (tipo) {
    case 'posto': return postoIcon;
    case 'oficina': return oficinaIcon;
    case 'banco': return bancoIcon;
    default: return postoIcon;
  }
};

function LocationMarker({ position }: { position: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [position, map]);
  
  return position ? (
    <Marker position={position} icon={driverIcon}>
      <Popup>
        <strong>Sua localização</strong>
      </Popup>
    </Marker>
  ) : null;
}

interface PartnersMapProps {
  partners: PremiumPartner[];
  activeFilter: string;
}

export function PartnersMap({ partners, activeFilter }: PartnersMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<PremiumPartner | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to São Paulo if location not available
          setPosition([-23.5505, -46.6333]);
          setLoading(false);
          toast.error('Não foi possível obter sua localização');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setPosition([-23.5505, -46.6333]);
      setLoading(false);
    }
  }, []);

  const filteredPartners = partners.filter(p => 
    activeFilter === 'all' || p.tipo === activeFilter
  );

  // Filter partners with valid coordinates
  const mappablePartners = filteredPartners.filter(
    p => p.latitude && p.longitude
  );

  const openNavigation = (partner: PremiumPartner) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${partner.latitude},${partner.longitude}&travelmode=driving`;
    window.open(url, '_blank');
    toast.success(`Abrindo navegação para ${partner.nome}`);
  };

  if (loading) {
    return (
      <div className="rounded-xl overflow-hidden bg-muted h-[35vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (mappablePartners.length === 0) {
    return (
      <div className="rounded-xl overflow-hidden bg-muted h-[35vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <MapPin className="w-10 h-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhum parceiro com localização disponível
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl overflow-hidden shadow-md h-[35vh] relative">
        {position && (
          <MapContainer
            center={position}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} />
            {mappablePartners.map((partner) => (
              <Marker
                key={partner.id}
                position={[partner.latitude!, partner.longitude!]}
                icon={getIconForType(partner.tipo)}
                eventHandlers={{
                  click: () => setSelectedPartner(partner),
                }}
              >
                <Popup>
                  <div className="text-center min-w-[150px]">
                    <strong className="block text-sm">{partner.nome}</strong>
                    {partner.endereco && (
                      <p className="text-xs text-gray-500 mt-1">{partner.endereco}</p>
                    )}
                    <Button
                      size="sm"
                      className="mt-2 w-full text-xs h-7"
                      onClick={() => openNavigation(partner)}
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Navegar
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          Postos
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          Oficinas
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          Bancos
        </div>
      </div>

      {/* Selected Partner Card */}
      {selectedPartner && (
        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{selectedPartner.nome}</h4>
              {selectedPartner.endereco && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedPartner.endereco}
                </p>
              )}
              {selectedPartner.servicos && selectedPartner.servicos.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedPartner.servicos.slice(0, 3).map((servico, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {servico}
                    </Badge>
                  ))}
                </div>
              )}
              {selectedPartner.tag && (
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-3 h-3 text-warning fill-warning" />
                  <span className="text-xs text-warning font-medium">
                    {selectedPartner.tag}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => openNavigation(selectedPartner)}
                className="gap-1.5"
              >
                <Navigation className="w-4 h-4" />
                Ir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPartner(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
