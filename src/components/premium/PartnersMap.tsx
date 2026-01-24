import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Navigation, MapPin, Star, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumPartner } from '@/hooks/usePremium';
import { useGeolocation } from '@/hooks/useGeolocation';

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

const createDriverIcon = (isTracking: boolean, heading: number | null) => {
  const hasHeading = heading !== null && !isNaN(heading);
  const arrowRotation = hasHeading ? heading : 0;
  
  return L.divIcon({
    className: 'driver-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px;">
        ${hasHeading ? `
          <div style="
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%) rotate(${arrowRotation}deg);
            transform-origin: center bottom;
            z-index: 10;
          ">
            <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
              <path d="M10 0L20 24L10 18L0 24L10 0Z" fill="hsl(var(--primary))" stroke="white" stroke-width="1.5"/>
            </svg>
          </div>
        ` : ''}
        <div style="
          background-color: hsl(var(--primary)); 
          width: 44px; 
          height: 44px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          border: 4px solid ${isTracking ? 'hsl(142.1, 76.2%, 36.3%)' : 'white'}; 
          box-shadow: 0 2px 12px rgba(0,0,0,0.4); 
          font-size: 22px;
        ">
          🚗
          ${isTracking ? '<span style="position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; background: #22c55e; border-radius: 50%; border: 2px solid white; animation: pulse 2s infinite;"></span>' : ''}
        </div>
      </div>
    `,
    iconSize: [44, 60],
    iconAnchor: [22, 30],
  });
};

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

function LocationMarker({ position, isTracking, heading }: { position: [number, number] | null; isTracking: boolean; heading: number | null }) {
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);
  const isFirstUpdate = useRef(true);
  
  useEffect(() => {
    if (position) {
      // Only center on first load, not on every update
      if (isFirstUpdate.current) {
        map.setView(position, 13);
        isFirstUpdate.current = false;
      }
      // Smoothly update marker position and icon
      if (markerRef.current) {
        markerRef.current.setLatLng(position);
        markerRef.current.setIcon(createDriverIcon(isTracking, heading));
      }
    }
  }, [position, map, isTracking, heading]);
  
  const hasHeading = heading !== null && !isNaN(heading);
  
  return position ? (
    <Marker ref={markerRef} position={position} icon={createDriverIcon(isTracking, heading)}>
      <Popup>
        <div className="text-center">
          <strong>Sua localização</strong>
          {isTracking && (
            <p className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Atualizando em tempo real
            </p>
          )}
          {hasHeading && (
            <p className="text-xs text-muted-foreground mt-1">
              Direção: {Math.round(heading)}°
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  ) : null;
}

interface PartnersMapProps {
  partners: PremiumPartner[];
  activeFilter: string;
}

export function PartnersMap({ partners, activeFilter }: PartnersMapProps) {
  const { position, loading, isTracking, heading, speed, startTracking, stopTracking } = useGeolocation({ enableRealtime: true });
  const [selectedPartner, setSelectedPartner] = useState<PremiumPartner | null>(null);

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
      {/* Tracking Toggle */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isTracking ? (
            <>
              <Radio className="w-3.5 h-3.5 text-green-500 animate-pulse" />
              <span className="text-green-600 font-medium">
                Tempo real
                {heading !== null && !isNaN(heading) && (
                  <span className="ml-1 opacity-75">• {Math.round(heading)}°</span>
                )}
                {speed !== null && speed > 0 && (
                  <span className="ml-1 opacity-75">• {Math.round(speed * 3.6)} km/h</span>
                )}
              </span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5" />
              <span>Localização estática</span>
            </>
          )}
        </div>
        <Button
          variant={isTracking ? "default" : "outline"}
          size="sm"
          onClick={() => isTracking ? stopTracking() : startTracking()}
          className="h-7 text-xs gap-1.5"
        >
          <Radio className="w-3 h-3" />
          {isTracking ? 'Parar' : 'Tempo real'}
        </Button>
      </div>

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
            <LocationMarker position={position} isTracking={isTracking} heading={heading} />
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
