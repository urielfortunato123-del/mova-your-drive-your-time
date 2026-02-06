import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface RideOffer {
  id: string;
  ride_id: string;
  status: string;
  expires_at: string;
  created_at: string;
  ride?: {
    id: string;
    origin_address: string;
    dest_address: string;
    origin_lat: number;
    origin_lng: number;
    dest_lat: number;
    dest_lng: number;
    price_cents: number;
    status: string;
    passenger?: {
      full_name: string;
      phone: string;
    };
  };
}

interface UseRideOffersReturn {
  offers: RideOffer[];
  isLoading: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  error: string | null;
  refreshOffers: () => Promise<void>;
  acceptRide: (rideId: string) => Promise<boolean>;
}

export function useRideOffers(): UseRideOffersReturn {
  const { driver, user } = useAuth();
  const [offers, setOffers] = useState<RideOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  const fetchOffers = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-driver-offers`,
        {
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers || []);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError('Erro ao buscar ofertas');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const acceptRide = useCallback(async (rideId: string): Promise<boolean> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Você precisa estar logado');
        return false;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-ride-accept`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ride_id: rideId }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('Corrida aceita!');
        // Remove offer from list
        setOffers(prev => prev.filter(o => o.ride_id !== rideId));
        return true;
      } else {
        toast.error(data.error || 'Erro ao aceitar corrida');
        return false;
      }
    } catch (err) {
      console.error('Error accepting ride:', err);
      toast.error('Erro ao aceitar corrida');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchOffers();

    // Subscribe to new offers using user ID
    const channel = supabase
      .channel(`driver-offers-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_offers',
          filter: `driver_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New ride offer received:', payload);
          toast.info('🚗 Nova corrida disponível!', {
            duration: 10000,
            action: {
              label: 'Ver',
              onClick: () => fetchOffers(),
            },
          });
          fetchOffers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ride_offers',
          filter: `driver_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Offer updated:', payload);
          // Remove expired offers
          if (payload.new && (payload.new as any).status !== 'SENT') {
            setOffers(prev => prev.filter(o => o.id !== (payload.new as any).id));
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Subscription status:', status, err);
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('disconnected');
          setError('Conexão perdida. Reconectando...');
          // Auto-retry
          setTimeout(() => channel.subscribe(), 3000);
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected');
        }
      });

    // Polling fallback every 15 seconds
    const pollInterval = setInterval(fetchOffers, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [userId, fetchOffers]);

  return {
    offers,
    isLoading,
    connectionStatus,
    error,
    refreshOffers: fetchOffers,
    acceptRide,
  };
}
