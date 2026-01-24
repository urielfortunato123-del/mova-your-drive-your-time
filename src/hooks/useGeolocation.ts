import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface GeolocationState {
  position: [number, number] | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    loading: true,
    error: null,
  });

  const requestLocation = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    if (!('geolocation' in navigator)) {
      setState({
        position: [-23.5505, -46.6333], // Default to São Paulo
        loading: false,
        error: 'Geolocalização não suportada',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: [pos.coords.latitude, pos.coords.longitude],
          loading: false,
          error: null,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Default to São Paulo if location not available
        setState({
          position: [-23.5505, -46.6333],
          loading: false,
          error: 'Não foi possível obter sua localização',
        });
        toast.error('Usando localização padrão (São Paulo)');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    ...state,
    refresh: requestLocation,
  };
}
