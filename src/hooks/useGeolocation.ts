import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface GeolocationState {
  position: [number, number] | null;
  loading: boolean;
  error: string | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  isTracking: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  enableRealtime?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    enableRealtime = false,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    position: null,
    loading: true,
    error: null,
    accuracy: null,
    heading: null,
    speed: null,
    isTracking: false,
  });

  const watchIdRef = useRef<number | null>(null);

  const updatePosition = useCallback((pos: GeolocationPosition) => {
    setState({
      position: [pos.coords.latitude, pos.coords.longitude],
      loading: false,
      error: null,
      accuracy: pos.coords.accuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      isTracking: enableRealtime,
    });
  }, [enableRealtime]);

  const handleError = useCallback((error: GeolocationPositionError) => {
    console.error('Geolocation error:', error);
    setState(prev => ({
      ...prev,
      position: prev.position || [-23.5505, -46.6333], // Keep existing or default to SP
      loading: false,
      error: error.message,
      isTracking: false,
    }));
    if (!state.position) {
      toast.error('Usando localização padrão (São Paulo)');
    }
  }, [state.position]);

  const startTracking = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState(prev => ({
        ...prev,
        position: [-23.5505, -46.6333],
        loading: false,
        error: 'Geolocalização não suportada',
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    if (enableRealtime) {
      // Use watchPosition for real-time updates
      watchIdRef.current = navigator.geolocation.watchPosition(
        updatePosition,
        handleError,
        { enableHighAccuracy, timeout, maximumAge }
      );
    } else {
      // Single position request
      navigator.geolocation.getCurrentPosition(
        updatePosition,
        handleError,
        { enableHighAccuracy, timeout, maximumAge }
      );
    }
  }, [enableRealtime, enableHighAccuracy, timeout, maximumAge, updatePosition, handleError]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setState(prev => ({ ...prev, isTracking: false }));
    }
  }, []);

  const refresh = useCallback(() => {
    stopTracking();
    startTracking();
  }, [stopTracking, startTracking]);

  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);

  return {
    ...state,
    refresh,
    startTracking,
    stopTracking,
  };
}
