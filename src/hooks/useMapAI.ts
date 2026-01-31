import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PointOfInterest } from './useFuelPrices';
import { toast } from 'sonner';

interface DriverProfile {
  preferredFuelType?: string;
  vehicleType?: string;
  workHours?: string;
  favoriteTypes?: string[];
}

interface AISearchResult {
  pois: Array<{
    name: string;
    type: string;
    description: string;
    amenities?: string[];
    tips?: string[];
    estimatedRating?: number;
    category?: string;
  }>;
  summary: string;
}

interface AIValidationResult {
  validatedPois: Array<{
    id: string;
    isValid: boolean;
    confidence: number;
    issues?: string[];
    suggestions?: string[];
    updatedInfo?: Record<string, any>;
  }>;
  summary: string;
}

interface AISuggestionResult {
  suggestions: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    searchQuery: string;
    timeframe: string;
  }>;
  tips: string[];
  bestTimeToStop?: string;
  nearbyHighlights?: string[];
}

interface AIEnrichResult {
  enrichedPois: Array<{
    id: string;
    enhancedDescription: string;
    tips?: string[];
    amenities?: string[];
    estimatedRating?: number;
    priceLevel?: string;
    bestTimeToVisit?: string;
    motoristHighlights?: string[];
    warnings?: string[];
  }>;
  regionInsights?: string;
}

interface UseMapAIReturn {
  loading: boolean;
  error: string | null;
  searchPOIs: (lat: number, lng: number, query?: string, radius?: number) => Promise<AISearchResult | null>;
  validatePOIs: (lat: number, lng: number, pois: PointOfInterest[]) => Promise<AIValidationResult | null>;
  getSuggestions: (lat: number, lng: number, pois?: PointOfInterest[]) => Promise<AISuggestionResult | null>;
  enrichPOIs: (lat: number, lng: number, pois: PointOfInterest[]) => Promise<AIEnrichResult | null>;
  driverProfile: DriverProfile;
  setDriverProfile: (profile: DriverProfile) => void;
}

export function useMapAI(): UseMapAIReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile>(() => {
    const saved = localStorage.getItem('mova-driver-profile');
    return saved ? JSON.parse(saved) : {
      preferredFuelType: 'gasolina',
      vehicleType: 'sedan',
      workHours: 'flexível',
      favoriteTypes: ['gas', 'rest'],
    };
  });

  const updateDriverProfile = useCallback((profile: DriverProfile) => {
    setDriverProfile(profile);
    localStorage.setItem('mova-driver-profile', JSON.stringify(profile));
  }, []);

  const callMapAI = useCallback(async (
    action: 'search' | 'validate' | 'suggest' | 'enrich',
    lat: number,
    lng: number,
    options: { query?: string; radius?: number; pois?: PointOfInterest[] } = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('map-ai-assistant', {
        body: {
          action,
          lat,
          lng,
          radius: options.radius || 5,
          query: options.query,
          pois: options.pois?.map(p => ({
            id: p.id,
            name: p.name,
            type: p.type,
            lat: p.lat,
            lng: p.lng,
            address: p.address,
            brand: p.brand,
            open24h: p.open24h,
          })),
          driverProfile,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'AI request failed');
      }

      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao consultar IA';
      setError(message);
      
      if (message.includes('Rate limit')) {
        toast.error('Limite de requisições atingido. Tente novamente em alguns minutos.');
      } else if (message.includes('Payment required')) {
        toast.error('Créditos de IA esgotados. Entre em contato com o suporte.');
      } else {
        toast.error(`Erro na IA do mapa: ${message}`);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [driverProfile]);

  const searchPOIs = useCallback(async (
    lat: number,
    lng: number,
    query?: string,
    radius?: number
  ): Promise<AISearchResult | null> => {
    return await callMapAI('search', lat, lng, { query, radius });
  }, [callMapAI]);

  const validatePOIs = useCallback(async (
    lat: number,
    lng: number,
    pois: PointOfInterest[]
  ): Promise<AIValidationResult | null> => {
    return await callMapAI('validate', lat, lng, { pois });
  }, [callMapAI]);

  const getSuggestions = useCallback(async (
    lat: number,
    lng: number,
    pois?: PointOfInterest[]
  ): Promise<AISuggestionResult | null> => {
    return await callMapAI('suggest', lat, lng, { pois });
  }, [callMapAI]);

  const enrichPOIs = useCallback(async (
    lat: number,
    lng: number,
    pois: PointOfInterest[]
  ): Promise<AIEnrichResult | null> => {
    return await callMapAI('enrich', lat, lng, { pois });
  }, [callMapAI]);

  return {
    loading,
    error,
    searchPOIs,
    validatePOIs,
    getSuggestions,
    enrichPOIs,
    driverProfile,
    setDriverProfile: updateDriverProfile,
  };
}
