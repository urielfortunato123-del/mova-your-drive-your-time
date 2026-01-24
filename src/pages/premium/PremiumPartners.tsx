import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Fuel,
  Wrench,
  Building2,
  MapPin,
  ExternalLink,
  Star,
  Map,
  List
} from 'lucide-react';
import { usePremium, PremiumPartner } from '@/hooks/usePremium';
import { cn } from '@/lib/utils';
import { PartnersMap } from '@/components/premium/PartnersMap';

const partnerTypes = [
  { value: 'posto', label: 'Postos', icon: Fuel },
  { value: 'oficina', label: 'Oficinas', icon: Wrench },
  { value: 'banco', label: 'Banco', icon: Building2 },
];

export default function PremiumPartners() {
  const navigate = useNavigate();
  const { partners, isLoading } = usePremium();
  const [activeTab, setActiveTab] = useState('posto');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const openMaps = (partner: PremiumPartner) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${partner.latitude},${partner.longitude}`;
    window.open(url, '_blank');
  };

  const filteredPartners = partners.filter(p => p.tipo === activeTab);

  if (isLoading) {
    return (
      <PageContainer title="Parceiros MOVA">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageContainer>
    );
  }

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'posto': return Fuel;
      case 'oficina': return Wrench;
      case 'banco': return Building2;
      default: return MapPin;
    }
  };

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'posto': return 'bg-warning/10 text-warning';
      case 'oficina': return 'bg-primary/10 text-primary';
      case 'banco': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <PageContainer title="Parceiros MOVA">
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/premium/goals')}
          className="gap-2 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        {/* Intro */}
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">
            Parceiros credenciados que contam para suas metas Premium
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            Lista
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
            className="gap-2"
          >
            <Map className="w-4 h-4" />
            Mapa
          </Button>
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <PartnersMap partners={partners} activeFilter={activeTab} />
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            {partnerTypes.map(type => (
              <TabsTrigger key={type.value} value={type.value} className="gap-1.5">
                <type.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{type.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {partnerTypes.map(type => (
            <TabsContent key={type.value} value={type.value} className="mt-4">
              <div className="space-y-3">
                {filteredPartners.length === 0 ? (
                  <Card className="p-8 text-center">
                    <type.icon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Nenhum parceiro encontrado
                    </p>
                  </Card>
                ) : (
                  filteredPartners.map(partner => {
                    const Icon = getTypeIcon(partner.tipo);
                    return (
                      <Card key={partner.id} className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "p-3 rounded-xl flex-shrink-0",
                            getTypeColor(partner.tipo)
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-foreground text-sm">
                                {partner.nome}
                              </h3>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 flex-shrink-0"
                                onClick={() => openMaps(partner)}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{partner.endereco}</span>
                            </div>

                            {partner.servicos && partner.servicos.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {partner.servicos.slice(0, 3).map((servico, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {servico}
                                  </Badge>
                                ))}
                                {partner.servicos.length > 3 && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    +{partner.servicos.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {partner.tag && (
                              <div className="flex items-center gap-1 mt-2">
                                <Star className="w-3 h-3 text-warning fill-warning" />
                                <span className="text-xs text-warning font-medium">
                                  {partner.tag}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </PageContainer>
  );
}
