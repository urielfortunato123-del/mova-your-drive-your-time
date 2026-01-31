import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  CheckCircle2, 
  Smartphone, 
  Share, 
  PlusSquare,
  MoreVertical,
  Chrome,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Install() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    await install();
    setInstalling(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">Instalar App</h1>
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <span className="text-3xl font-bold text-primary-foreground">M</span>
          </div>
          <h2 className="text-2xl font-bold">MOVA</h2>
          <p className="text-muted-foreground text-center mt-1">
            Mobilidade que respeita seu tempo
          </p>
        </div>

        {/* Already Installed */}
        {isInstalled && (
          <Card className="mb-6 border-green-500/50 bg-green-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-semibold text-green-600">App já instalado!</p>
                  <p className="text-sm text-muted-foreground">
                    Abra pela tela inicial do seu dispositivo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Install Button (Chrome/Edge on Android) */}
        {isInstallable && !isInstalled && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Instalação Rápida
              </CardTitle>
              <CardDescription>
                Clique no botão abaixo para instalar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleInstall} 
                disabled={installing}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {installing ? 'Instalando...' : 'Instalar Agora'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* iOS Instructions */}
        {isIOS && !isInstalled && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Instalar no iPhone/iPad
              </CardTitle>
              <CardDescription>
                Siga os passos abaixo para instalar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Toque no botão Compartilhar</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Share className="h-4 w-4" /> na barra inferior do Safari
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Role e toque em "Adicionar à Tela Inicial"</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <PlusSquare className="h-4 w-4" /> Add to Home Screen
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Confirme tocando em "Adicionar"</p>
                  <p className="text-sm text-muted-foreground">
                    O app aparecerá na sua tela inicial
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Android Instructions (when not showing install button) */}
        {!isIOS && !isInstallable && !isInstalled && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Chrome className="h-5 w-5" />
                Instalar no Android
              </CardTitle>
              <CardDescription>
                Use o Chrome para melhor experiência
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Toque no menu do navegador</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MoreVertical className="h-4 w-4" /> (três pontos no canto superior)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Toque em "Instalar app" ou "Adicionar à tela inicial"</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Download className="h-4 w-4" /> Install app
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Confirme a instalação</p>
                  <p className="text-sm text-muted-foreground">
                    O app aparecerá na sua tela inicial
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Por que instalar?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Acesso rápido pela tela inicial</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Funciona mesmo offline</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Notificações de novas corridas</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Experiência de app nativo</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
