import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone, Share, PlusSquare, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import movaCar from '@/assets/mova-car.png';

interface InstallBannerProps {
  delay?: number;
}

export function InstallBanner({ delay = 2000 }: InstallBannerProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed recently (24h)
    const dismissedAt = localStorage.getItem('install-banner-dismissed-at');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setIsDismissed(true);
        return;
      }
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
    localStorage.setItem('install-banner-dismissed-at', Date.now().toString());
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary to-primary/80 p-6 text-center">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          {/* App Icon */}
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white shadow-lg flex items-center justify-center mb-4 overflow-hidden">
            <img src={movaCar} alt="MOVA" className="w-16 h-16 object-contain" />
          </div>
          
          <h2 className="text-xl font-bold text-white">Instale o App MOVA</h2>
          <p className="text-white/80 text-sm mt-1">
            Acesso rápido direto da sua tela inicial
          </p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Benefits */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Mais rápido
            </div>
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-primary" />
              Offline
            </div>
            <div className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-primary" />
              Grátis
            </div>
          </div>

          {/* Install Actions */}
          {isInstallable ? (
            <Button
              onClick={handleInstall}
              disabled={installing}
              className="w-full h-12 text-base font-semibold gap-2"
              size="lg"
            >
              <Download className="w-5 h-5" />
              {installing ? 'Instalando...' : 'Instalar Agora'}
            </Button>
          ) : isIOS ? (
            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                No Safari, siga os passos:
              </p>
              <div className="flex items-center justify-center gap-6 text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Share className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Compartilhar</span>
                </div>
                <span className="text-muted-foreground">→</span>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <PlusSquare className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Adicionar</span>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to="/install" onClick={handleDismiss}>
                  Ver instruções completas
                </Link>
              </Button>
            </div>
          ) : (
            <Button asChild className="w-full h-12 text-base font-semibold gap-2" size="lg">
              <Link to="/install" onClick={handleDismiss}>
                <Download className="w-5 h-5" />
                Ver como instalar
              </Link>
            </Button>
          )}

          {/* Dismiss link */}
          <button
            onClick={handleDismiss}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Continuar no navegador
          </button>
        </div>
      </div>
    </div>
  );
}
