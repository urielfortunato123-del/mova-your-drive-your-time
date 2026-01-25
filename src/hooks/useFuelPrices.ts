import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculateDistance, formatDistance } from '@/utils/geoUtils';

export interface FuelPrices {
  gasolina?: number;
  etanol?: number;
  diesel?: number;
  gnv?: number;
}

export interface RegionalAverages {
  gasolina: number;
  etanol: number;
  diesel: number;
  gnv: number;
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: "gas" | "rest" | "bathroom" | "parking";
  lat: number;
  lng: number;
  distance?: string;
  address?: string;
  open24h?: boolean;
  fuelPrices?: FuelPrices;
  brand?: string;
  updatedAt?: string;
  priceSource?: string;
  state?: string;
}

interface FuelStation {
  id: string;
  name: string;
  brand: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  open24h: boolean;
  prices: FuelPrices;
  distance: string;
  updatedAt: string;
  priceSource: string;
}

interface OtherPOI {
  id: string;
  name: string;
  type: "rest" | "bathroom" | "parking";
  lat: number;
  lng: number;
  address: string;
  open24h: boolean;
  distance: string;
}

interface FuelPricesResponse {
  stations: FuelStation[];
  otherPOIs: OtherPOI[];
  state: string;
  regionalAverages: RegionalAverages;
  source: string;
  totalPOIs: number;
}

export function useFuelPrices() {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<"osm" | "database" | "mock">("mock");
  const [regionalAverages, setRegionalAverages] = useState<RegionalAverages | null>(null);
  const [currentState, setCurrentState] = useState<string>("");

  const fetchPOIs = useCallback(async (lat: number, lng: number, radiusKm: number = 5): Promise<PointOfInterest[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fuel-prices', {
        body: { lat, lng, radiusKm }
      });
      
      if (error) throw error;
      
      const response = data as FuelPricesResponse;
      
      // Set regional data
      if (response.regionalAverages) {
        setRegionalAverages(response.regionalAverages);
      }
      if (response.state) {
        setCurrentState(response.state);
      }
      
      // Convert stations to POIs
      const gasStations: PointOfInterest[] = response.stations.map((station) => ({
        id: station.id,
        name: station.name,
        type: "gas" as const,
        lat: station.lat,
        lng: station.lng,
        distance: station.distance,
        address: station.address,
        open24h: station.open24h,
        fuelPrices: station.prices,
        brand: station.brand,
        updatedAt: station.updatedAt,
        priceSource: station.priceSource,
        state: station.state,
      }));
      
      // Convert other POIs
      const otherPOIs: PointOfInterest[] = (response.otherPOIs || []).map((poi) => ({
        id: poi.id,
        name: poi.name,
        type: poi.type,
        lat: poi.lat,
        lng: poi.lng,
        distance: poi.distance,
        address: poi.address,
        open24h: poi.open24h,
      }));
      
      setDataSource(response.totalPOIs > 0 ? "osm" : "mock");
      
      return [...gasStations, ...otherPOIs];
    } catch (error) {
      console.error("Error fetching POIs:", error);
      toast.error("Erro ao buscar dados. Usando dados locais.");
      setDataSource("mock");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch gas stations from database (premium_partners) as fallback/supplement
  const fetchGasStationsFromDB = useCallback(async (lat: number, lng: number): Promise<PointOfInterest[]> => {
    try {
      const { data, error } = await supabase
        .from('premium_partners')
        .select('*')
        .eq('tipo', 'posto')
        .eq('is_active', true);

      if (error) throw error;

      const stations: PointOfInterest[] = (data || [])
        .filter(partner => partner.latitude && partner.longitude)
        .map(partner => {
          const distance = calculateDistance(
            lat, 
            lng, 
            Number(partner.latitude), 
            Number(partner.longitude)
          );
          
          // Parse fuel types from services
          const services = partner.servicos || [];
          const fuelPrices: FuelPrices = {};
          if (services.some((s: string) => s.toLowerCase().includes('gasolina'))) {
            fuelPrices.gasolina = 5.79 + Math.random() * 0.3;
          }
          if (services.some((s: string) => s.toLowerCase().includes('etanol'))) {
            fuelPrices.etanol = 3.89 + Math.random() * 0.2;
          }
          if (services.some((s: string) => s.toLowerCase().includes('diesel'))) {
            fuelPrices.diesel = 5.49 + Math.random() * 0.3;
          }
          if (services.some((s: string) => s.toLowerCase().includes('gnv'))) {
            fuelPrices.gnv = 4.29 + Math.random() * 0.2;
          }

          return {
            id: partner.id,
            name: partner.nome,
            type: "gas" as const,
            lat: Number(partner.latitude),
            lng: Number(partner.longitude),
            distance: formatDistance(distance),
            address: partner.endereco || '',
            open24h: partner.tag?.toLowerCase().includes('24h') || false,
            fuelPrices,
            brand: partner.tag || 'Parceiro MOVA',
          };
        })
        .sort((a, b) => {
          const distA = parseFloat(a.distance?.replace('km', '').replace('m', '') || '0');
          const distB = parseFloat(b.distance?.replace('km', '').replace('m', '') || '0');
          return distA - distB;
        });

      return stations;
    } catch (error) {
      console.error('Error fetching gas stations from DB:', error);
      return [];
    }
  }, []);

  return {
    loading,
    dataSource,
    regionalAverages,
    currentState,
    fetchPOIs,
    fetchGasStationsFromDB,
  };
}
