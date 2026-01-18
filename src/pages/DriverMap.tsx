import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Fuel, 
  Coffee, 
  Bath, 
  Car, 
  Navigation, 
  MapPin,
  Loader2,
  RefreshCw,
  Star,
  Heart
} from "lucide-react";
import { toast } from "sonner";

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons for different POI types
const createIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 18px;">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const driverIcon = L.divIcon({
  className: "driver-marker",
  html: `<div style="background-color: #1e3a5f; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid #10b981; box-shadow: 0 2px 12px rgba(0,0,0,0.4); font-size: 22px;">🚗</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const gasIcon = createIcon("#ef4444", "⛽");
const restIcon = createIcon("#3b82f6", "☕");
const bathroomIcon = createIcon("#8b5cf6", "🚻");
const parkingIcon = createIcon("#10b981", "🅿️");

interface PointOfInterest {
  id: string;
  name: string;
  type: "gas" | "rest" | "bathroom" | "parking";
  lat: number;
  lng: number;
  distance?: string;
  address?: string;
  open24h?: boolean;
}

// Simulated POIs - in production would come from an API
const generatePOIs = (userLat: number, userLng: number): PointOfInterest[] => {
  return [
    {
      id: "1",
      name: "Posto Shell",
      type: "gas",
      lat: userLat + 0.008,
      lng: userLng + 0.005,
      distance: "850m",
      address: "Av. Paulista, 1000",
      open24h: true,
    },
    {
      id: "2",
      name: "Posto Ipiranga",
      type: "gas",
      lat: userLat - 0.006,
      lng: userLng + 0.010,
      distance: "1.2km",
      address: "Rua Augusta, 500",
      open24h: true,
    },
    {
      id: "3",
      name: "Café do Motorista",
      type: "rest",
      lat: userLat + 0.004,
      lng: userLng - 0.007,
      distance: "650m",
      address: "Rua Consolação, 200",
      open24h: false,
    },
    {
      id: "4",
      name: "Lanchonete 24h",
      type: "rest",
      lat: userLat - 0.009,
      lng: userLng - 0.003,
      distance: "1.0km",
      address: "Av. Rebouças, 800",
      open24h: true,
    },
    {
      id: "5",
      name: "Banheiro Público",
      type: "bathroom",
      lat: userLat + 0.002,
      lng: userLng + 0.008,
      distance: "400m",
      address: "Praça da Sé",
      open24h: false,
    },
    {
      id: "6",
      name: "Shopping Banheiro",
      type: "bathroom",
      lat: userLat - 0.005,
      lng: userLng + 0.006,
      distance: "750m",
      address: "Shopping Center Norte",
      open24h: false,
    },
    {
      id: "7",
      name: "Estacionamento Centro",
      type: "parking",
      lat: userLat + 0.007,
      lng: userLng - 0.004,
      distance: "900m",
      address: "Rua Direita, 100",
      open24h: true,
    },
    {
      id: "8",
      name: "Área de Descanso",
      type: "parking",
      lat: userLat - 0.003,
      lng: userLng - 0.009,
      distance: "1.1km",
      address: "Marginal Pinheiros",
      open24h: true,
    },
  ];
};

function LocationMarker({ position }: { position: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
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

const getIconForType = (type: string) => {
  switch (type) {
    case "gas": return gasIcon;
    case "rest": return restIcon;
    case "bathroom": return bathroomIcon;
    case "parking": return parkingIcon;
    default: return gasIcon;
  }
};

const getIconComponent = (type: string) => {
  switch (type) {
    case "gas": return Fuel;
    case "rest": return Coffee;
    case "bathroom": return Bath;
    case "parking": return Car;
    default: return MapPin;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "gas": return "Posto";
    case "rest": return "Descanso";
    case "bathroom": return "Banheiro";
    case "parking": return "Estacionamento";
    default: return "Local";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "gas": return "bg-red-500";
    case "rest": return "bg-blue-500";
    case "bathroom": return "bg-purple-500";
    case "parking": return "bg-green-500";
    default: return "bg-gray-500";
  }
};

// Get favorites from localStorage
const getFavorites = (): string[] => {
  const saved = localStorage.getItem("mova-favorites");
  return saved ? JSON.parse(saved) : [];
};

// Save favorites to localStorage
const saveFavorites = (favorites: string[]) => {
  localStorage.setItem("mova-favorites", JSON.stringify(favorites));
};

export default function DriverMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<PointOfInterest | null>(null);
  const [favorites, setFavorites] = useState<string[]>(getFavorites);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const toggleFavorite = (poiId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(poiId)
        ? prev.filter(id => id !== poiId)
        : [...prev, poiId];
      saveFavorites(newFavorites);
      return newFavorites;
    });
  };

  const isFavorite = (poiId: string) => favorites.includes(poiId);

  const fetchLocation = () => {
    setLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(coords);
          setPois(generatePOIs(coords[0], coords[1]));
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to São Paulo if location fails
          const defaultCoords: [number, number] = [-23.5505, -46.6333];
          setPosition(defaultCoords);
          setPois(generatePOIs(defaultCoords[0], defaultCoords[1]));
          setLoading(false);
          toast.error("Não foi possível obter sua localização. Usando localização padrão.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      const defaultCoords: [number, number] = [-23.5505, -46.6333];
      setPosition(defaultCoords);
      setPois(generatePOIs(defaultCoords[0], defaultCoords[1]));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const filteredPois = pois.filter(poi => {
    const matchesType = activeFilter ? poi.type === activeFilter : true;
    const matchesFavorite = showFavoritesOnly ? favorites.includes(poi.id) : true;
    return matchesType && matchesFavorite;
  });

  const openNavigation = (poi: PointOfInterest) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}&travelmode=driving`;
    window.open(url, "_blank");
    toast.success(`Abrindo navegação para ${poi.name}`);
  };

  const filters = [
    { type: "gas", label: "Postos", icon: Fuel, color: "text-red-500" },
    { type: "rest", label: "Descanso", icon: Coffee, color: "text-blue-500" },
    { type: "bathroom", label: "Banheiros", icon: Bath, color: "text-purple-500" },
    { type: "parking", label: "Estacionar", icon: Car, color: "text-green-500" },
  ];

  if (loading) {
    return (
      <PageContainer title="Mapa">
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Obtendo sua localização...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Mapa">
      <div className="space-y-4 pb-4">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <Button
            variant={activeFilter === null && !showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => { setActiveFilter(null); setShowFavoritesOnly(false); }}
            className="shrink-0"
          >
            Todos
          </Button>
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="shrink-0 gap-2"
          >
            <Heart className={`w-4 h-4 ${!showFavoritesOnly ? "text-pink-500" : ""}`} />
            Favoritos
            {favorites.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {favorites.length}
              </Badge>
            )}
          </Button>
          {filters.map(({ type, label, icon: Icon, color }) => (
            <Button
              key={type}
              variant={activeFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => { setActiveFilter(activeFilter === type ? null : type); setShowFavoritesOnly(false); }}
              className="shrink-0 gap-2"
            >
              <Icon className={`w-4 h-4 ${activeFilter !== type ? color : ""}`} />
              {label}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLocation}
            className="shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Map */}
        <div className="rounded-xl overflow-hidden shadow-card h-[45vh] relative">
          {position && (
            <MapContainer
              center={position}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} />
              {filteredPois.map((poi) => (
                <Marker
                  key={poi.id}
                  position={[poi.lat, poi.lng]}
                  icon={getIconForType(poi.type)}
                  eventHandlers={{
                    click: () => setSelectedPoi(poi),
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <strong>{poi.name}</strong>
                      <p className="text-sm text-gray-500">{poi.distance}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Selected POI Card */}
        {selectedPoi && (
          <Card className="p-4 animate-slide-up">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`${getTypeColor(selectedPoi.type)} text-white text-xs`}>
                    {getTypeLabel(selectedPoi.type)}
                  </Badge>
                  {selectedPoi.open24h && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                      24h
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg">{selectedPoi.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedPoi.address}</p>
                <p className="text-sm font-medium text-primary mt-1">{selectedPoi.distance}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite(selectedPoi.id)}
                  className="shrink-0"
                >
                  <Heart 
                    className={`w-5 h-5 transition-colors ${isFavorite(selectedPoi.id) ? "fill-pink-500 text-pink-500" : "text-muted-foreground"}`} 
                  />
                </Button>
                <Button onClick={() => openNavigation(selectedPoi)} className="shrink-0 gap-2">
                  <Navigation className="w-4 h-4" />
                  Ir
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* POI List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {showFavoritesOnly ? "Seus favoritos" : "Próximos de você"} ({filteredPois.length})
          </h3>
          {filteredPois.length === 0 && showFavoritesOnly && (
            <Card className="p-6 text-center">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhum favorito salvo ainda</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Toque no ❤️ para salvar seus locais favoritos
              </p>
            </Card>
          )}
          {filteredPois.map((poi) => {
            const IconComponent = getIconComponent(poi.type);
            return (
              <Card
                key={poi.id}
                className={`p-3 cursor-pointer transition-all hover:shadow-md ${selectedPoi?.id === poi.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedPoi(poi)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getTypeColor(poi.type)} relative`}>
                    <IconComponent className="w-5 h-5 text-white" />
                    {isFavorite(poi.id) && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                        <Heart className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{poi.name}</h4>
                      {poi.open24h && (
                        <span className="text-xs text-green-600 font-medium">24h</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{poi.address}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(poi.id);
                      }}
                    >
                      <Heart className={`w-4 h-4 transition-colors ${isFavorite(poi.id) ? "fill-pink-500 text-pink-500" : "text-muted-foreground"}`} />
                    </Button>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{poi.distance}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          openNavigation(poi);
                        }}
                      >
                        <Navigation className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
