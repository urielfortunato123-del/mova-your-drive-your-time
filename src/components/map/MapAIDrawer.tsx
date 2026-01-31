import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  Search, 
  CheckCircle2, 
  Lightbulb, 
  Star,
  Loader2,
  MapPin,
  Fuel,
  Coffee,
  Bath,
  Car,
  Clock,
  AlertTriangle,
  ThumbsUp,
  Send
} from 'lucide-react';
import { useMapAI } from '@/hooks/useMapAI';
import { PointOfInterest } from '@/hooks/useFuelPrices';

interface MapAIDrawerProps {
  position: [number, number] | null;
  pois: PointOfInterest[];
  onNewPOIsFound?: (pois: any[]) => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'gas': return <Fuel className="w-4 h-4 text-red-500" />;
    case 'rest': return <Coffee className="w-4 h-4 text-blue-500" />;
    case 'bathroom': return <Bath className="w-4 h-4 text-purple-500" />;
    case 'parking': return <Car className="w-4 h-4 text-green-500" />;
    default: return <MapPin className="w-4 h-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-amber-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

export function MapAIDrawer({ position, pois, onNewPOIsFound }: MapAIDrawerProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggest' | 'search' | 'enrich'>('suggest');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  
  const { loading, getSuggestions, searchPOIs, enrichPOIs } = useMapAI();

  const handleGetSuggestions = async () => {
    if (!position) return;
    const data = await getSuggestions(position[0], position[1], pois);
    setResults({ type: 'suggestions', data });
  };

  const handleSearch = async () => {
    if (!position || !searchQuery.trim()) return;
    const data = await searchPOIs(position[0], position[1], searchQuery);
    setResults({ type: 'search', data });
    if (data?.pois && onNewPOIsFound) {
      onNewPOIsFound(data.pois);
    }
  };

  const handleEnrich = async () => {
    if (!position || pois.length === 0) return;
    const data = await enrichPOIs(position[0], position[1], pois.slice(0, 5));
    setResults({ type: 'enrich', data });
  };

  const tabs = [
    { id: 'suggest', label: 'Sugestões', icon: Lightbulb, action: handleGetSuggestions },
    { id: 'search', label: 'Buscar', icon: Search, action: null },
    { id: 'enrich', label: 'Detalhes', icon: Star, action: handleEnrich },
  ];

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="sm"
          className="gap-2 bg-gradient-to-r from-primary to-accent text-white shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          IA do Mapa
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Assistente IA do Mapa
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-4">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setResults(null);
                }}
                className="flex-1 gap-1"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Search Input (only for search tab) */}
          {activeTab === 'search' && (
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Ex: posto com loja 24h, café com wifi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          )}

          {/* Action Button (for suggest and enrich tabs) */}
          {activeTab !== 'search' && (
            <Button
              onClick={activeTab === 'suggest' ? handleGetSuggestions : handleEnrich}
              disabled={loading || !position || (activeTab === 'enrich' && pois.length === 0)}
              className="w-full mb-4 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando...
                </>
              ) : activeTab === 'suggest' ? (
                <>
                  <Lightbulb className="w-4 h-4" />
                  Obter Sugestões Personalizadas
                </>
              ) : (
                <>
                  <Star className="w-4 h-4" />
                  Enriquecer Informações ({pois.length} POIs)
                </>
              )}
            </Button>
          )}

          {/* Results */}
          <ScrollArea className="h-[50vh]">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">A IA está analisando...</p>
              </div>
            )}

            {!loading && results?.type === 'suggestions' && results.data?.suggestions && (
              <div className="space-y-3">
                {results.data.suggestions.map((suggestion: any, idx: number) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(suggestion.priority)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getTypeIcon(suggestion.type)}
                          <span className="font-medium capitalize">{suggestion.type}</span>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.timeframe}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                        <p className="text-xs text-primary mt-1">
                          Buscar: "{suggestion.searchQuery}"
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}

                {results.data.tips && results.data.tips.length > 0 && (
                  <Card className="p-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-400 mb-1">Dicas</p>
                        <ul className="text-xs text-amber-700 dark:text-amber-500 space-y-1">
                          {results.data.tips.map((tip: string, i: number) => (
                            <li key={i}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                )}

                {results.data.bestTimeToStop && (
                  <Card className="p-3 bg-green-50 dark:bg-green-950/20 border-green-200">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-400">
                          Melhor horário para parar
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-500">
                          {results.data.bestTimeToStop}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {!loading && results?.type === 'search' && results.data?.pois && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-2">{results.data.summary}</p>
                {results.data.pois.map((poi: any, idx: number) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start gap-3">
                      {getTypeIcon(poi.type)}
                      <div className="flex-1">
                        <p className="font-medium">{poi.name}</p>
                        <p className="text-sm text-muted-foreground">{poi.description}</p>
                        {poi.amenities && poi.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {poi.amenities.map((a: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {a}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {poi.tips && poi.tips.length > 0 && (
                          <p className="text-xs text-primary mt-2">💡 {poi.tips[0]}</p>
                        )}
                      </div>
                      {poi.estimatedRating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-medium">{poi.estimatedRating}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {!loading && results?.type === 'enrich' && results.data?.enrichedPois && (
              <div className="space-y-3">
                {results.data.regionInsights && (
                  <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 mb-3">
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      📍 {results.data.regionInsights}
                    </p>
                  </Card>
                )}
                {results.data.enrichedPois.map((poi: any, idx: number) => (
                  <Card key={idx} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">POI #{idx + 1}</p>
                        {poi.estimatedRating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-medium">{poi.estimatedRating}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{poi.enhancedDescription}</p>
                      
                      {poi.motoristHighlights && poi.motoristHighlights.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> Para motoristas:
                          </p>
                          <ul className="text-xs text-muted-foreground">
                            {poi.motoristHighlights.map((h: string, i: number) => (
                              <li key={i}>• {h}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {poi.amenities && poi.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {poi.amenities.map((a: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {poi.tips && poi.tips.length > 0 && (
                        <div className="bg-muted/50 rounded-md p-2">
                          <p className="text-xs font-medium mb-1">💡 Dicas:</p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {poi.tips.map((t: string, i: number) => (
                              <li key={i}>• {t}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {poi.warnings && poi.warnings.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-950/20 rounded-md p-2">
                          <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">⚠️ Avisos:</p>
                          <ul className="text-xs text-red-600 dark:text-red-500 space-y-0.5">
                            {poi.warnings.map((w: string, i: number) => (
                              <li key={i}>• {w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {poi.bestTimeToVisit && (
                        <p className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Melhor horário: {poi.bestTimeToVisit}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {!loading && !results && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <Sparkles className="w-12 h-12 text-muted-foreground/30" />
                <div>
                  <p className="font-medium text-muted-foreground">Assistente IA do Mapa</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    {activeTab === 'suggest' && 'Receba sugestões personalizadas de paradas'}
                    {activeTab === 'search' && 'Busque novos POIs com IA'}
                    {activeTab === 'enrich' && 'Obtenha detalhes extras sobre os POIs'}
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
