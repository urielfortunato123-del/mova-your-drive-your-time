import { useState, useEffect, useCallback } from 'react';

export interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
  isPWA: boolean;
}

export function useNotifications() {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    permission: 'default',
    isSupported: false,
    isPWA: false,
  });

  useEffect(() => {
    const isSupported = 'Notification' in window;
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setPermissionState({
      permission: isSupported ? Notification.permission : 'denied',
      isSupported,
      isPWA,
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!permissionState.isSupported) {
      console.warn('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [permissionState.isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions): Notification | null => {
    if (!permissionState.isSupported || permissionState.permission !== 'granted') {
      console.warn('Cannot send notification: permission not granted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [permissionState]);

  const scheduleRideReminder = useCallback((rideId: string, passengerName: string, pickupTime: Date, minutesBefore: number = 15) => {
    const now = new Date();
    const reminderTime = new Date(pickupTime.getTime() - minutesBefore * 60000);
    const delay = reminderTime.getTime() - now.getTime();

    if (delay <= 0) {
      return null;
    }

    const timeoutId = setTimeout(() => {
      const timeString = pickupTime.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      sendNotification('🚗 Corrida em breve!', {
        body: `${passengerName} às ${timeString}. Prepare-se para sair!`,
        tag: `ride-reminder-${rideId}`,
        requireInteraction: true,
        data: { rideId, type: 'reminder' },
      });
    }, delay);

    return timeoutId;
  }, [sendNotification]);

  const notifyNewRide = useCallback((passengerName: string, pickupTime: Date, estimatedValue: number) => {
    const timeString = pickupTime.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const valueString = estimatedValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return sendNotification('📅 Nova corrida agendada!', {
      body: `${passengerName} às ${timeString} - ${valueString}`,
      tag: 'new-ride',
      requireInteraction: true,
      data: { type: 'new-ride' },
    });
  }, [sendNotification]);

  return {
    ...permissionState,
    requestPermission,
    sendNotification,
    scheduleRideReminder,
    notifyNewRide,
  };
}
