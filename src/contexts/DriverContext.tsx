import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Ride, DriverStatus, DailyStats, EarningsSummary, Partner, ChatMessage } from '@/types/ride';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface DriverContextType {
  status: DriverStatus;
  setStatus: (status: DriverStatus) => void;
  rides: Ride[];
  todayRides: Ride[];
  dailyStats: DailyStats;
  earnings: EarningsSummary;
  partners: Partner[];
  activeWaitTimer: { rideId: string; startTime: Date } | null;
  startWaitTimer: (rideId: string) => void;
  stopWaitTimer: () => void;
  updateRideStatus: (rideId: string, status: Ride['status']) => void;
  sendMessage: (rideId: string, message: string) => void;
  getMessagesForRide: (rideId: string) => ChatMessage[];
  getUnreadCount: (rideId: string) => number;
  markMessagesAsRead: (rideId: string) => void;
  // Online time tracking
  isOnline: boolean;
  onlineStartTime: Date | null;
  todayOnlineSeconds: number;
  toggleOnline: () => void;
  // Data management
  isLoading: boolean;
  refreshRides: () => Promise<void>;
  addRide: (ride: Omit<Ride, 'id'>) => Promise<void>;
}

const DriverContext = createContext<DriverContextType | undefined>(undefined);

// Mock messages for demo (will be replaced with real chat later)
const mockMessages: ChatMessage[] = [];

const mockPartners: Partner[] = [
  { id: '1', name: 'Posto Shell - Paulista', category: 'Combustível', discount: '5% de desconto' },
  { id: '2', name: 'Auto Center Lopes', category: 'Oficina', discount: '10% em serviços' },
  { id: '3', name: 'Pneus Express', category: 'Pneus', discount: '15% na troca' },
  { id: '4', name: 'Lubrificantes Pro', category: 'Troca de óleo', discount: '20% de desconto' },
  { id: '5', name: 'LavaCar Premium', category: 'Lavagem', discount: 'R$ 10 off' },
];

export function DriverProvider({ children }: { children: ReactNode }) {
  const { driver } = useAuth();
  const [status, setStatus] = useState<DriverStatus>('available');
  const [rides, setRides] = useState<Ride[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [activeWaitTimer, setActiveWaitTimer] = useState<{ rideId: string; startTime: Date } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Online time tracking
  const [isOnline, setIsOnline] = useState(false);
  const [onlineStartTime, setOnlineStartTime] = useState<Date | null>(null);
  const [todayOnlineSeconds, setTodayOnlineSeconds] = useState(0);

  // Fetch rides from database
  const fetchRides = useCallback(async () => {
    if (!driver?.id) {
      setRides([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', driver.id)
        .order('pickup_time', { ascending: false });

      if (error) {
        console.error('Error fetching rides:', error);
        return;
      }

      const mappedRides: Ride[] = (data || []).map(ride => ({
        id: ride.id,
        passengerName: ride.passenger_name,
        passengerPhone: ride.passenger_phone || undefined,
        pickupTime: ride.pickup_time,
        pickupAddress: ride.pickup_address,
        dropoffAddress: ride.dropoff_address,
        estimatedValue: Number(ride.estimated_value),
        status: ride.status as Ride['status'],
        waitingTime: ride.waiting_time || undefined,
        waitingValue: ride.waiting_value ? Number(ride.waiting_value) : undefined,
        startedAt: ride.started_at || undefined,
        completedAt: ride.completed_at || undefined,
        cancelReason: ride.cancel_reason || undefined,
      }));

      setRides(mappedRides);
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setIsLoading(false);
    }
  }, [driver?.id]);

  // Refresh rides
  const refreshRides = useCallback(async () => {
    setIsLoading(true);
    await fetchRides();
  }, [fetchRides]);

  // Add new ride
  const addRide = useCallback(async (ride: Omit<Ride, 'id'>) => {
    if (!driver?.id) return;

    const { error } = await supabase
      .from('rides')
      .insert({
        driver_id: driver.id,
        passenger_name: ride.passengerName,
        passenger_phone: ride.passengerPhone || null,
        pickup_time: ride.pickupTime,
        pickup_address: ride.pickupAddress,
        dropoff_address: ride.dropoffAddress,
        estimated_value: ride.estimatedValue,
        status: ride.status,
      });

    if (error) {
      console.error('Error adding ride:', error);
      throw error;
    }

    await refreshRides();
  }, [driver?.id, refreshRides]);

  // Initial fetch
  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!driver?.id) return;

    const channel = supabase
      .channel('rides-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `driver_id=eq.${driver.id}`,
        },
        () => {
          fetchRides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driver?.id, fetchRides]);

  // Update online timer every second
  useEffect(() => {
    if (!isOnline || !onlineStartTime) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - onlineStartTime.getTime()) / 1000);
      setTodayOnlineSeconds(prev => {
        const baseSeconds = prev - elapsed + 1;
        return baseSeconds + elapsed + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOnline, onlineStartTime]);

  const toggleOnline = () => {
    if (isOnline) {
      setIsOnline(false);
      setOnlineStartTime(null);
    } else {
      setIsOnline(true);
      setOnlineStartTime(new Date());
    }
  };

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const todayRides = rides.filter(ride => {
    const rideDate = new Date(ride.pickupTime);
    return rideDate >= todayStart && rideDate <= todayEnd;
  });

  const confirmedTodayRides = todayRides.filter(r => r.status === 'confirmed' || r.status === 'in_progress');
  const nextRide = confirmedTodayRides.sort((a, b) => 
    new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime()
  )[0];

  const dailyStats: DailyStats = {
    scheduledRides: confirmedTodayRides.length,
    nextRideTime: nextRide?.pickupTime || null,
    estimatedEarnings: confirmedTodayRides.reduce((sum, r) => sum + r.estimatedValue, 0),
    completedRides: todayRides.filter(r => r.status === 'completed').length,
  };

  // Calculate earnings based on actual ride dates
  const completedRides = rides.filter(r => r.status === 'completed');
  
  const todayCompletedRides = completedRides.filter(r => {
    const rideDate = new Date(r.completedAt || r.pickupTime);
    return rideDate >= todayStart && rideDate <= todayEnd;
  });

  const weekCompletedRides = completedRides.filter(r => {
    const rideDate = new Date(r.completedAt || r.pickupTime);
    return rideDate >= weekStart && rideDate <= weekEnd;
  });

  const monthCompletedRides = completedRides.filter(r => {
    const rideDate = new Date(r.completedAt || r.pickupTime);
    return rideDate >= monthStart && rideDate <= monthEnd;
  });

  const earnings: EarningsSummary = {
    today: todayCompletedRides.reduce((sum, r) => sum + r.estimatedValue + (r.waitingValue || 0), 0),
    week: weekCompletedRides.reduce((sum, r) => sum + r.estimatedValue + (r.waitingValue || 0), 0),
    month: monthCompletedRides.reduce((sum, r) => sum + r.estimatedValue + (r.waitingValue || 0), 0),
    waitingTotal: monthCompletedRides.reduce((sum, r) => sum + (r.waitingValue || 0), 0),
  };

  const startWaitTimer = (rideId: string) => {
    setActiveWaitTimer({ rideId, startTime: new Date() });
  };

  const stopWaitTimer = () => {
    setActiveWaitTimer(null);
  };

  const updateRideStatus = async (rideId: string, newStatus: Ride['status']) => {
    const updates: Record<string, unknown> = { status: newStatus };
    
    if (newStatus === 'in_progress') {
      updates.started_at = new Date().toISOString();
    } else if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString();
      
      // Calculate waiting value if timer was active
      if (activeWaitTimer?.rideId === rideId) {
        const minutes = Math.floor((Date.now() - activeWaitTimer.startTime.getTime()) / 60000);
        updates.waiting_time = minutes;
        updates.waiting_value = minutes * 0.25; // R$ 0.25 per minute
        stopWaitTimer();
      }
    }

    const { error } = await supabase
      .from('rides')
      .update(updates)
      .eq('id', rideId);

    if (error) {
      console.error('Error updating ride status:', error);
      return;
    }

    // Optimistic update
    setRides(prev => prev.map(ride => 
      ride.id === rideId ? { ...ride, status: newStatus, ...updates } : ride
    ));
  };

  const sendMessage = (rideId: string, messageText: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      rideId,
      sender: 'driver',
      message: messageText,
      timestamp: new Date().toISOString(),
      read: true,
    };
    setMessages(prev => [...prev, newMessage]);

    // Simulate passenger response
    const responses = [
      "Ok, entendi!",
      "Perfeito, obrigado!",
      "Certo, aguardo você.",
      "Tudo bem!",
      "Beleza, já estou pronto(a).",
    ];
    setTimeout(() => {
      const passengerResponse: ChatMessage = {
        id: `msg-${Date.now()}`,
        rideId,
        sender: 'passenger',
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString(),
        read: false,
      };
      setMessages(prev => [...prev, passengerResponse]);
    }, 2000 + Math.random() * 2000);
  };

  const getMessagesForRide = (rideId: string): ChatMessage[] => {
    return messages.filter(m => m.rideId === rideId).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  const getUnreadCount = (rideId: string): number => {
    return messages.filter(m => m.rideId === rideId && !m.read && m.sender === 'passenger').length;
  };

  const markMessagesAsRead = (rideId: string) => {
    setMessages(prev => prev.map(m => 
      m.rideId === rideId ? { ...m, read: true } : m
    ));
  };

  return (
    <DriverContext.Provider value={{
      status,
      setStatus,
      rides,
      todayRides,
      dailyStats,
      earnings,
      partners: mockPartners,
      activeWaitTimer,
      startWaitTimer,
      stopWaitTimer,
      updateRideStatus,
      sendMessage,
      getMessagesForRide,
      getUnreadCount,
      markMessagesAsRead,
      isOnline,
      onlineStartTime,
      todayOnlineSeconds,
      toggleOnline,
      isLoading,
      refreshRides,
      addRide,
    }}>
      {children}
    </DriverContext.Provider>
  );
}

export function useDriver() {
  const context = useContext(DriverContext);
  if (context === undefined) {
    throw new Error('useDriver must be used within a DriverProvider');
  }
  return context;
}
