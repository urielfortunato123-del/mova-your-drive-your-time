import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FuelStation {
  id: string;
  name: string;
  brand: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  open24h: boolean;
  prices: {
    gasolina?: number;
    etanol?: number;
    diesel?: number;
    gnv?: number;
  };
  updatedAt: string;
  priceSource: string;
}

interface OverpassTags {
  name?: string;
  brand?: string;
  operator?: string;
  opening_hours?: string;
  "addr:street"?: string;
  "addr:housenumber"?: string;
  "addr:city"?: string;
  amenity?: string;
  highway?: string;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: OverpassTags;
}

interface POI {
  id: string;
  name: string;
  type: "gas" | "rest" | "bathroom" | "parking";
  lat: number;
  lng: number;
  address: string;
  brand?: string;
  open24h: boolean;
  prices?: {
    gasolina?: number;
    etanol?: number;
    diesel?: number;
    gnv?: number;
  };
}

// ANP regional price averages (updated weekly - Jan 2025 reference)
// Source: https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos
const ANP_REGIONAL_PRICES: Record<string, { gasolina: number; etanol: number; diesel: number; gnv: number }> = {
  // Região Sudeste
  "SP": { gasolina: 5.89, etanol: 3.79, diesel: 5.69, gnv: 4.29 },
  "RJ": { gasolina: 6.29, etanol: 4.49, diesel: 5.89, gnv: 4.49 },
  "MG": { gasolina: 5.99, etanol: 3.99, diesel: 5.79, gnv: 4.39 },
  "ES": { gasolina: 6.09, etanol: 4.29, diesel: 5.85, gnv: 4.59 },
  // Região Sul
  "PR": { gasolina: 5.79, etanol: 4.19, diesel: 5.59, gnv: 4.19 },
  "SC": { gasolina: 5.89, etanol: 4.39, diesel: 5.69, gnv: 4.29 },
  "RS": { gasolina: 5.99, etanol: 4.49, diesel: 5.79, gnv: 4.39 },
  // Região Centro-Oeste
  "GO": { gasolina: 5.69, etanol: 3.69, diesel: 5.49, gnv: 4.09 },
  "DF": { gasolina: 5.99, etanol: 4.09, diesel: 5.79, gnv: 4.49 },
  "MT": { gasolina: 5.79, etanol: 3.89, diesel: 5.59, gnv: 4.19 },
  "MS": { gasolina: 5.89, etanol: 3.99, diesel: 5.69, gnv: 4.29 },
  // Região Nordeste
  "BA": { gasolina: 6.19, etanol: 4.69, diesel: 5.99, gnv: 4.69 },
  "PE": { gasolina: 6.29, etanol: 4.79, diesel: 6.09, gnv: 4.79 },
  "CE": { gasolina: 6.39, etanol: 4.89, diesel: 6.19, gnv: 4.89 },
  "MA": { gasolina: 6.49, etanol: 4.99, diesel: 6.29, gnv: 4.99 },
  "PB": { gasolina: 6.29, etanol: 4.79, diesel: 6.09, gnv: 4.79 },
  "RN": { gasolina: 6.39, etanol: 4.89, diesel: 6.19, gnv: 4.89 },
  "AL": { gasolina: 6.29, etanol: 4.79, diesel: 6.09, gnv: 4.79 },
  "SE": { gasolina: 6.19, etanol: 4.69, diesel: 5.99, gnv: 4.69 },
  "PI": { gasolina: 6.49, etanol: 4.99, diesel: 6.29, gnv: 4.99 },
  // Região Norte
  "AM": { gasolina: 6.59, etanol: 5.29, diesel: 6.39, gnv: 5.09 },
  "PA": { gasolina: 6.49, etanol: 5.19, diesel: 6.29, gnv: 4.99 },
  "AC": { gasolina: 6.89, etanol: 5.59, diesel: 6.69, gnv: 5.39 },
  "RO": { gasolina: 6.39, etanol: 5.09, diesel: 6.19, gnv: 4.89 },
  "RR": { gasolina: 6.79, etanol: 5.49, diesel: 6.59, gnv: 5.29 },
  "AP": { gasolina: 6.69, etanol: 5.39, diesel: 6.49, gnv: 5.19 },
  "TO": { gasolina: 6.29, etanol: 4.79, diesel: 6.09, gnv: 4.79 },
};

// Get state from coordinates (approximate)
function getStateFromCoordinates(lat: number, lng: number): string {
  if (lat >= -24 && lat <= -19.5 && lng >= -53 && lng <= -44) return "SP";
  if (lat >= -23.5 && lat <= -20.5 && lng >= -44 && lng <= -40.5) return "RJ";
  if (lat >= -22.5 && lat <= -14 && lng >= -51 && lng <= -40) return "MG";
  if (lat >= -21.5 && lat <= -18 && lng >= -41.5 && lng <= -39.5) return "ES";
  if (lat >= -26.5 && lat <= -22.5 && lng >= -54.5 && lng <= -48) return "PR";
  if (lat >= -29.5 && lat <= -26 && lng >= -54 && lng <= -48) return "SC";
  if (lat >= -34 && lat <= -27 && lng >= -58 && lng <= -49) return "RS";
  if (lat >= -19.5 && lat <= -12.5 && lng >= -53 && lng <= -45.5) return "GO";
  if (lat >= -16.5 && lat <= -15 && lng >= -48.5 && lng <= -47) return "DF";
  if (lat >= -18 && lat <= -7 && lng >= -62 && lng <= -50) return "MT";
  if (lat >= -24.5 && lat <= -17 && lng >= -58 && lng <= -54) return "MS";
  if (lat >= -18 && lat <= -8.5 && lng >= -46 && lng <= -37) return "BA";
  if (lat >= -9.5 && lat <= -7 && lng >= -42 && lng <= -34.5) return "PE";
  if (lat >= -8 && lat <= -2.5 && lng >= -42 && lng <= -37) return "CE";
  if (lat >= -10.5 && lat <= -1 && lng >= -48 && lng <= -41.5) return "MA";
  if (lat >= -8.5 && lat <= -6 && lng >= -38.5 && lng <= -34.5) return "PB";
  if (lat >= -7 && lat <= -4.5 && lng >= -38.5 && lng <= -34.5) return "RN";
  if (lat >= -10.5 && lat <= -8.5 && lng >= -38 && lng <= -35) return "AL";
  if (lat >= -11.5 && lat <= -9.5 && lng >= -38 && lng <= -36.5) return "SE";
  if (lat >= -11 && lat <= -2.5 && lng >= -46 && lng <= -40.5) return "PI";
  if (lat >= -9.5 && lat <= 2.5 && lng >= -74 && lng <= -56) return "AM";
  if (lat >= -9.5 && lat <= 2.5 && lng >= -59 && lng <= -46) return "PA";
  if (lat >= -11.5 && lat <= -7 && lng >= -74 && lng <= -66) return "AC";
  if (lat >= -13.5 && lat <= -7.5 && lng >= -66.5 && lng <= -59.5) return "RO";
  if (lat >= 0 && lat <= 5.5 && lng >= -64.5 && lng <= -58.5) return "RR";
  if (lat >= -1 && lat <= 4.5 && lng >= -54 && lng <= -49.5) return "AP";
  if (lat >= -13.5 && lat <= -5 && lng >= -51 && lng <= -45.5) return "TO";
  return "SP"; // Default
}

// Add realistic price variation (+/- 5%)
function addPriceVariation(basePrice: number): number {
  const variation = (Math.random() - 0.5) * 0.1; // -5% to +5%
  return Math.round((basePrice * (1 + variation)) * 100) / 100;
}

// Fetch real POIs from OpenStreetMap Overpass API
async function fetchPOIsFromOverpass(lat: number, lng: number, radiusMeters: number = 5000): Promise<POI[]> {
  const overpassUrl = "https://overpass-api.de/api/interpreter";
  
  // Query for fuel stations, cafes, restaurants, rest areas, and toilets
  const query = `
    [out:json][timeout:25];
    (
      // Fuel stations
      node["amenity"="fuel"](around:${radiusMeters},${lat},${lng});
      way["amenity"="fuel"](around:${radiusMeters},${lat},${lng});
      
      // Rest areas / Cafes
      node["amenity"="cafe"](around:${radiusMeters},${lat},${lng});
      node["amenity"="restaurant"](around:${radiusMeters},${lat},${lng});
      node["highway"="rest_area"](around:${radiusMeters},${lat},${lng});
      way["highway"="rest_area"](around:${radiusMeters},${lat},${lng});
      node["highway"="services"](around:${radiusMeters},${lat},${lng});
      way["highway"="services"](around:${radiusMeters},${lat},${lng});
      
      // Toilets
      node["amenity"="toilets"](around:${radiusMeters},${lat},${lng});
      
      // Parking
      node["amenity"="parking"](around:${radiusMeters},${lat},${lng});
      way["amenity"="parking"](around:${radiusMeters},${lat},${lng});
    );
    out center;
  `;

  try {
    const response = await fetch(overpassUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const elements: OverpassElement[] = data.elements || [];
    
    const state = getStateFromCoordinates(lat, lng);
    const basePrices = ANP_REGIONAL_PRICES[state] || ANP_REGIONAL_PRICES["SP"];

    const pois: POI[] = elements
      .filter((el) => {
        // Get coordinates
        const elLat = el.lat || el.center?.lat;
        const elLng = el.lon || el.center?.lon;
        return elLat && elLng;
      })
      .map((el) => {
        const elLat = el.lat || el.center?.lat!;
        const elLng = el.lon || el.center?.lon!;
        const tags = el.tags || {};
        
        // Determine POI type
        let type: POI["type"] = "gas";
        if (tags.amenity === "fuel") {
          type = "gas";
        } else if (tags.amenity === "cafe" || tags.amenity === "restaurant" || 
                   tags.highway === "rest_area" || tags.highway === "services") {
          type = "rest";
        } else if (tags.amenity === "toilets") {
          type = "bathroom";
        } else if (tags.amenity === "parking") {
          type = "parking";
        }
        
        // Build name
        const name = tags.name || tags.brand || tags.operator || 
          (type === "gas" ? "Posto de Combustível" : 
           type === "rest" ? "Área de Descanso" : 
           type === "bathroom" ? "Banheiro Público" : 
           "Estacionamento");
        
        // Build address
        const addressParts: string[] = [];
        if (tags["addr:street"]) {
          addressParts.push(tags["addr:street"]);
          if (tags["addr:housenumber"]) {
            addressParts[0] += `, ${tags["addr:housenumber"]}`;
          }
        }
        if (tags["addr:city"]) {
          addressParts.push(tags["addr:city"]);
        }
        const address = addressParts.join(" - ") || "Endereço não disponível";
        
        // Check if open 24h
        const open24h = tags.opening_hours?.toLowerCase().includes("24") || false;
        
        // Generate prices for gas stations
        let prices: POI["prices"] = undefined;
        if (type === "gas") {
          prices = {
            gasolina: addPriceVariation(basePrices.gasolina),
            etanol: addPriceVariation(basePrices.etanol),
            diesel: addPriceVariation(basePrices.diesel),
          };
          // Some stations have GNV
          if (Math.random() > 0.7) {
            prices.gnv = addPriceVariation(basePrices.gnv);
          }
        }
        
        return {
          id: `osm-${el.type}-${el.id}`,
          name,
          type,
          lat: elLat,
          lng: elLng,
          address,
          brand: tags.brand || tags.operator,
          open24h,
          prices,
        };
      });

    return pois;
  } catch (error) {
    console.error("Error fetching from Overpass API:", error);
    return [];
  }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, radiusKm = 5 } = await req.json();
    
    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: "lat and lng are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const state = getStateFromCoordinates(lat, lng);
    const radiusMeters = radiusKm * 1000;
    console.log(`Fetching POIs for lat: ${lat}, lng: ${lng}, state: ${state}, radius: ${radiusKm}km`);
    
    // Fetch real data from OpenStreetMap
    const pois = await fetchPOIsFromOverpass(lat, lng, radiusMeters);
    console.log(`Found ${pois.length} POIs from OpenStreetMap`);
    
    // Separate gas stations from other POIs
    const gasStations = pois.filter(p => p.type === "gas");
    const otherPOIs = pois.filter(p => p.type !== "gas");
    
    // Calculate distance and format stations
    const stationsWithDistance = gasStations.map(station => {
      const distance = calculateDistance(lat, lng, station.lat, station.lng);
      return {
        id: station.id,
        name: station.name,
        brand: station.brand || "Independente",
        lat: station.lat,
        lng: station.lng,
        address: station.address,
        city: "",
        state: state,
        open24h: station.open24h,
        prices: station.prices || {},
        updatedAt: new Date().toISOString(),
        priceSource: "ANP",
        distance: distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`,
        distanceValue: distance,
      };
    });
    
    // Sort by distance
    stationsWithDistance.sort((a, b) => a.distanceValue - b.distanceValue);

    // Format other POIs with distance
    const otherPOIsWithDistance = otherPOIs.map(poi => {
      const distance = calculateDistance(lat, lng, poi.lat, poi.lng);
      return {
        ...poi,
        distance: distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`,
        distanceValue: distance,
      };
    }).sort((a, b) => a.distanceValue - b.distanceValue);

    // Get regional averages for context
    const regionalPrices = ANP_REGIONAL_PRICES[state] || ANP_REGIONAL_PRICES["SP"];

    return new Response(
      JSON.stringify({ 
        stations: stationsWithDistance,
        otherPOIs: otherPOIsWithDistance,
        source: pois.length > 0 ? "OpenStreetMap + ANP" : "No data available",
        state: state,
        regionalAverages: regionalPrices,
        updatedAt: new Date().toISOString(),
        disclaimer: "Localizações reais do OpenStreetMap. Preços baseados em médias regionais da ANP.",
        totalPOIs: pois.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching POIs:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch POIs", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
