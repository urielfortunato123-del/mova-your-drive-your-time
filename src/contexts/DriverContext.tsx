import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Ride, DriverStatus, DailyStats, EarningsSummary, Partner, ChatMessage } from '@/types/ride';

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
}

const DriverContext = createContext<DriverContextType | undefined>(undefined);

// Mock messages for demo
const mockMessages: ChatMessage[] = [
  {
    id: 'msg1',
    rideId: '1',
    sender: 'passenger',
    message: 'Olá! Estou aguardando na portaria do prédio.',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    read: false,
  },
  {
    id: 'msg2',
    rideId: '1',
    sender: 'passenger',
    message: 'Estou com uma mala grande, ok?',
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
    read: false,
  },
];

// Mock data
const mockRides: Ride[] = [
  {
    id: '1',
    passengerName: 'Ana Santos',
    passengerPhone: '(11) 98888-7777',
    pickupTime: new Date(Date.now() + 30 * 60000).toISOString(),
    pickupAddress: 'Av. Paulista, 1000 - Bela Vista, São Paulo',
    dropoffAddress: 'Rua Augusta, 500 - Consolação, São Paulo',
    estimatedValue: 45.00,
    status: 'confirmed',
  },
  {
    id: '2',
    passengerName: 'Roberto Lima',
    passengerPhone: '(11) 97777-6666',
    pickupTime: new Date(Date.now() + 90 * 60000).toISOString(),
    pickupAddress: 'Shopping Ibirapuera - Moema, São Paulo',
    dropoffAddress: 'Aeroporto de Congonhas, São Paulo',
    estimatedValue: 65.00,
    status: 'confirmed',
  },
  {
    id: '3',
    passengerName: 'Maria Oliveira',
    passengerPhone: '(11) 96666-5555',
    pickupTime: new Date(Date.now() + 180 * 60000).toISOString(),
    pickupAddress: 'Hospital Sírio-Libanês - Bela Vista',
    dropoffAddress: 'Parque do Ibirapuera - Moema',
    estimatedValue: 38.00,
    status: 'confirmed',
  },
  {
    id: '4',
    passengerName: 'João Pereira',
    pickupTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    pickupAddress: 'Estação Sé - Centro',
    dropoffAddress: 'Rua Oscar Freire - Jardins',
    estimatedValue: 52.00,
    status: 'completed',
    waitingTime: 5,
    waitingValue: 1.25,
  },
];

const mockPartners: Partner[] = [
  { id: '1', name: 'Posto Shell - Paulista', category: 'Combustível', discount: '5% de desconto' },
  { id: '2', name: 'Auto Center Lopes', category: 'Oficina', discount: '10% em serviços' },
  { id: '3', name: 'Pneus Express', category: 'Pneus', discount: '15% na troca' },
  { id: '4', name: 'Lubrificantes Pro', category: 'Troca de óleo', discount: '20% de desconto' },
  { id: '5', name: 'LavaCar Premium', category: 'Lavagem', discount: 'R$ 10 off' },
];

export function DriverProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<DriverStatus>('available');
  const [rides, setRides] = useState<Ride[]>(mockRides);
  const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
  const [activeWaitTimer, setActiveWaitTimer] = useState<{ rideId: string; startTime: Date } | null>(null);

  const todayRides = rides.filter(ride => {
    const rideDate = new Date(ride.pickupTime);
    const today = new Date();
    return rideDate.toDateString() === today.toDateString();
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

  const completedRides = rides.filter(r => r.status === 'completed');
  const earnings: EarningsSummary = {
    today: completedRides.reduce((sum, r) => sum + r.estimatedValue + (r.waitingValue || 0), 0),
    week: completedRides.reduce((sum, r) => sum + r.estimatedValue + (r.waitingValue || 0), 0) * 5,
    month: completedRides.reduce((sum, r) => sum + r.estimatedValue + (r.waitingValue || 0), 0) * 22,
    waitingTotal: completedRides.reduce((sum, r) => sum + (r.waitingValue || 0), 0),
  };

  const startWaitTimer = (rideId: string) => {
    setActiveWaitTimer({ rideId, startTime: new Date() });
  };

  const stopWaitTimer = () => {
    setActiveWaitTimer(null);
  };

  const updateRideStatus = (rideId: string, newStatus: Ride['status']) => {
    setRides(prev => prev.map(ride => 
      ride.id === rideId ? { ...ride, status: newStatus } : ride
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

    // Simulate passenger response after 2-4 seconds
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
