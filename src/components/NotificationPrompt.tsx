import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

export function NotificationPrompt() {
  const { permission, isSupported, requestPermission } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Show prompt if notifications are supported but permission not yet granted
    if (isSupported && permission === 'default') {
      const dismissed = localStorage.getItem('mova-notification-prompt-dismissed');
      if (!dismissed) {
        // Delay showing the prompt
        const timer = setTimeout(() => setIsVisible(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isSupported, permission]);

  const handleEnable = async () => {
    setIsLoading(true);
    await requestPermission();
    setIsLoading(false);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('mova-notification-prompt-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up md:left-auto md:right-6 md:max-w-sm">
      <div className="bg-card border border-border rounded-xl p-4 shadow-elegant">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">
              Ativar notificações
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Receba alertas sobre novas corridas e lembretes de horário.
            </p>
            
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleEnable}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Ativando...' : 'Ativar'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-muted-foreground"
              >
                Agora não
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationBadge() {
  const { permission, isSupported, requestPermission } = useNotifications();

  if (!isSupported) return null;

  const handleClick = async () => {
    if (permission === 'default') {
      await requestPermission();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "p-2 rounded-lg transition-colors",
        permission === 'granted' 
          ? "text-accent bg-accent/10" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
      title={
        permission === 'granted' 
          ? 'Notificações ativadas' 
          : permission === 'denied'
            ? 'Notificações bloqueadas'
            : 'Ativar notificações'
      }
    >
      {permission === 'granted' ? (
        <Bell className="w-5 h-5" />
      ) : (
        <BellOff className="w-5 h-5" />
      )}
    </button>
  );
}
