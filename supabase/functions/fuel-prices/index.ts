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
  open24h: boolean;
  prices: {
    gasolina?: number;
    etanol?: number;
    diesel?: number;
    gnv?: number;
  };
  updatedAt: string;
}

// Mock data - Replace with real API call when available
const getMockStations = (lat: number, lng: number): FuelStation[] => {
  const now = new Date().toISOString();
  
  return [
    {
      id: "station-1",
      name: "Posto Shell",
      brand: "Shell",
      lat: lat + 0.008,
      lng: lng + 0.005,
      address: "Av. Paulista, 1000",
      city: "São Paulo",
      open24h: true,
      prices: {
        gasolina: 5.89,
        etanol: 3.99,
        diesel: 5.49,
      },
      updatedAt: now,
    },
    {
      id: "station-2",
      name: "Posto Ipiranga",
      brand: "Ipiranga",
      lat: lat - 0.006,
      lng: lng + 0.010,
      address: "Rua Augusta, 500",
      city: "São Paulo",
      open24h: true,
      prices: {
        gasolina: 5.79,
        etanol: 3.89,
        diesel: 5.39,
      },
      updatedAt: now,
    },
    {
      id: "station-3",
      name: "Posto BR",
      brand: "Petrobras",
      lat: lat + 0.003,
      lng: lng - 0.008,
      address: "Av. Rebouças, 1200",
      city: "São Paulo",
      open24h: true,
      prices: {
        gasolina: 5.85,
        etanol: 3.95,
        diesel: 5.45,
        gnv: 4.29,
      },
      updatedAt: now,
    },
    {
      id: "station-4",
      name: "Posto Ale",
      brand: "Ale",
      lat: lat - 0.004,
      lng: lng - 0.006,
      address: "Rua da Consolação, 800",
      city: "São Paulo",
      open24h: false,
      prices: {
        gasolina: 5.69,
        etanol: 3.79,
        diesel: 5.29,
      },
      updatedAt: now,
    },
  ];
};

// TODO: Replace with real API integration
// Example function structure for real API
async function fetchRealFuelPrices(lat: number, lng: number, radiusKm: number): Promise<FuelStation[]> {
  // Option 1: ANP Data (weekly updates)
  // const anpApiKey = Deno.env.get("ANP_API_KEY");
  // const response = await fetch(`https://api.anp.gov.br/...?lat=${lat}&lng=${lng}`);
  
  // Option 2: Third-party API
  // const apiKey = Deno.env.get("FUEL_PRICE_API_KEY");
  // const response = await fetch(`https://api.fuelprices.com/stations?lat=${lat}&lng=${lng}&radius=${radiusKm}`, {
  //   headers: { "Authorization": `Bearer ${apiKey}` }
  // });
  // return await response.json();
  
  // For now, return mock data
  return getMockStations(lat, lng);
}

serve(async (req) => {
  // Handle CORS preflight
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

    console.log(`Fetching fuel prices for lat: ${lat}, lng: ${lng}, radius: ${radiusKm}km`);
    
    const stations = await fetchRealFuelPrices(lat, lng, radiusKm);
    
    // Calculate distance from user for each station
    const stationsWithDistance = stations.map(station => {
      const distance = calculateDistance(lat, lng, station.lat, station.lng);
      return {
        ...station,
        distance: distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`,
        distanceValue: distance,
      };
    });
    
    // Sort by distance
    stationsWithDistance.sort((a, b) => a.distanceValue - b.distanceValue);

    return new Response(
      JSON.stringify({ 
        stations: stationsWithDistance,
        source: "mock", // Change to "api" when using real data
        updatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching fuel prices:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch fuel prices" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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
