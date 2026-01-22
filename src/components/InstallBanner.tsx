import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InstallBannerProps {
  delay?: number; // delay in milliseconds before showing
}

export function InstallBanner({ delay = 3000 }: InstallBannerProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem('install-banner-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show banner after delay if not installed
    const timer = setTimeout(() => {
      if (!isInstalled) {
        setIsVisible(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('install-banner-dismissed', 'true');
  };

  const handleInstall = async () => {
    setInstalling(true);
    const success = await install();
    setInstalling(false);
    if (success) {
      setIsVisible(false);
    }
  };

  // Don't show if installed, dismissed, or not visible yet
  if (isInstalled || isDismissed || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
          <Smartphone className="w-6 h-6 text-primary-foreground" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm">Instale o App MOVA</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acesso rápido e notificações de corridas
          </p>

          <div className="flex gap-2 mt-3">
            {isInstallable ? (
              <Button
                size="sm"
                onClick={handleInstall}
                disabled={installing}
                className="h-8 text-xs px-3"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {installing ? 'Instalando...' : 'Instalar'}
              </Button>
            ) : (
              <Button size="sm" asChild className="h-8 text-xs px-3">
                <Link to="/install">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  {isIOS ? 'Ver instruções' : 'Instalar'}
                </Link>
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 text-xs px-3 text-muted-foreground"
            >
              Agora não
            </Button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
