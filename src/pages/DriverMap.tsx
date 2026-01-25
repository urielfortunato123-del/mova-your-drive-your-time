import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Fuel, 
  Coffee, 
  Bath, 
  Car, 
  Navigation, 
  MapPin,
  Loader2,
  RefreshCw,
  Star,
  Heart,
  Wifi,
  WifiOff
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons for different POI types
const createIcon = (color: string, emoji: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 18px;">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const driverIcon = L.divIcon({
  className: "driver-marker",
  html: `<div style="background-color: #1e3a5f; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid #10b981; box-shadow: 0 2px 12px rgba(0,0,0,0.4); font-size: 22px;">🚗</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const gasIcon = createIcon("#ef4444", "⛽");
const restIcon = createIcon("#3b82f6", "☕");
const bathroomIcon = createIcon("#8b5cf6", "🚻");
const parkingIcon = createIcon("#10b981", "🅿️");

interface FuelPrices {
  gasolina?: number;
  etanol?: number;
  diesel?: number;
  gnv?: number;
}

interface RegionalAverages {
  gasolina: number;
  etanol: number;
  diesel: number;
  gnv: number;
}

interface PointOfInterest {
  id: string;
  name: string;
  type: "gas" | "rest" | "bathroom" | "parking";
  lat: number;
  lng: number;
  distance?: string;
  address?: string;
  open24h?: boolean;
  fuelPrices?: FuelPrices;
  brand?: string;
  updatedAt?: string;
  priceSource?: string;
  state?: string;
}

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
  prices: FuelPrices;
  distance: string;
  updatedAt: string;
  priceSource: string;
}

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

// POIs reais pelo Brasil - Postos, Cafés, Banheiros, Áreas de Descanso
const getAllBrazilPOIs = (userLat: number, userLng: number): PointOfInterest[] => {
  const allPOIs: Omit<PointOfInterest, 'distance'>[] = [
    // ============ SÃO PAULO - CAPITAL ============
    // Postos de Combustível
    {
      id: "gas-sp-shell-paulista",
      name: "Posto Shell - Av. Paulista",
      type: "gas",
      lat: -23.5611,
      lng: -46.6559,
      address: "Av. Paulista, 1000 - Bela Vista, São Paulo",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 5.89, etanol: 3.99, diesel: 5.49 },
    },
    {
      id: "gas-sp-ipiranga-faria",
      name: "Posto Ipiranga - Faria Lima",
      type: "gas",
      lat: -23.5874,
      lng: -46.6847,
      address: "Av. Brig. Faria Lima, 2232 - Jardim Paulistano",
      open24h: true,
      brand: "Ipiranga",
      fuelPrices: { gasolina: 5.79, etanol: 3.89, diesel: 5.39 },
    },
    {
      id: "gas-sp-br-marginal",
      name: "Posto BR - Marginal Tietê",
      type: "gas",
      lat: -23.5189,
      lng: -46.6897,
      address: "Marginal Tietê, km 12 - Lapa",
      open24h: true,
      brand: "Petrobras",
      fuelPrices: { gasolina: 5.85, etanol: 3.95, diesel: 5.45, gnv: 4.29 },
    },
    {
      id: "gas-sp-ale-santo-amaro",
      name: "Posto Ale - Santo Amaro",
      type: "gas",
      lat: -23.6544,
      lng: -46.7094,
      address: "Av. Santo Amaro, 5800 - Santo Amaro",
      open24h: false,
      brand: "Ale",
      fuelPrices: { gasolina: 5.69, etanol: 3.79, diesel: 5.29 },
    },
    {
      id: "gas-sp-shell-ibirapuera",
      name: "Posto Shell - Ibirapuera",
      type: "gas",
      lat: -23.6028,
      lng: -46.6652,
      address: "Av. Ibirapuera, 2120 - Moema",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 5.92, etanol: 4.05, diesel: 5.55 },
    },
    
    // Cafés e Áreas de Descanso - SP
    {
      id: "rest-sp-starbucks-paulista",
      name: "Starbucks - Paulista",
      type: "rest",
      lat: -23.5634,
      lng: -46.6543,
      address: "Av. Paulista, 1230 - Bela Vista",
      open24h: false,
    },
    {
      id: "rest-sp-cafe-girondino",
      name: "Café Girondino",
      type: "rest",
      lat: -23.5453,
      lng: -46.6361,
      address: "Praça da Sé, 42 - Centro Histórico",
      open24h: false,
    },
    {
      id: "rest-sp-mcdonalds-24h",
      name: "McDonald's 24h - Pinheiros",
      type: "rest",
      lat: -23.5631,
      lng: -46.6892,
      address: "Rua dos Pinheiros, 890",
      open24h: true,
    },
    {
      id: "rest-sp-padaria-real",
      name: "Padaria Real - Moema",
      type: "rest",
      lat: -23.6012,
      lng: -46.6689,
      address: "Al. dos Arapanés, 321 - Moema",
      open24h: true,
    },
    {
      id: "rest-sp-graal-anhanguera",
      name: "Graal - Anhanguera km 30",
      type: "rest",
      lat: -23.4123,
      lng: -46.8234,
      address: "Rod. Anhanguera, km 30 - São Paulo",
      open24h: true,
    },
    
    // Banheiros Públicos - SP
    {
      id: "bath-sp-se",
      name: "Banheiro Público - Praça da Sé",
      type: "bathroom",
      lat: -23.5505,
      lng: -46.6340,
      address: "Praça da Sé, Centro",
      open24h: false,
    },
    {
      id: "bath-sp-shopping-ibirapuera",
      name: "Shopping Ibirapuera - Banheiros",
      type: "bathroom",
      lat: -23.6109,
      lng: -46.6654,
      address: "Av. Ibirapuera, 3103 - Moema",
      open24h: false,
    },
    {
      id: "bath-sp-terminal-tiete",
      name: "Terminal Tietê - Banheiros",
      type: "bathroom",
      lat: -23.5166,
      lng: -46.6254,
      address: "Av. Cruzeiro do Sul, 1800",
      open24h: true,
    },
    
    // Estacionamentos - SP
    {
      id: "park-sp-centro",
      name: "Estacionamento Centro - 24h",
      type: "parking",
      lat: -23.5489,
      lng: -46.6388,
      address: "Rua Direita, 100 - Centro",
      open24h: true,
    },
    {
      id: "park-sp-marginal-descanso",
      name: "Área de Descanso - Marginal",
      type: "parking",
      lat: -23.5673,
      lng: -46.7012,
      address: "Marginal Pinheiros, km 15",
      open24h: true,
    },

    // ============ RIO DE JANEIRO ============
    {
      id: "gas-rj-shell-copacabana",
      name: "Posto Shell - Copacabana",
      type: "gas",
      lat: -22.9711,
      lng: -43.1822,
      address: "Av. Atlântica, 1702 - Copacabana",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 6.19, etanol: 4.29, diesel: 5.89 },
    },
    {
      id: "gas-rj-ipiranga-barra",
      name: "Posto Ipiranga - Barra",
      type: "gas",
      lat: -23.0012,
      lng: -43.3654,
      address: "Av. das Américas, 4666 - Barra da Tijuca",
      open24h: true,
      brand: "Ipiranga",
      fuelPrices: { gasolina: 6.09, etanol: 4.19, diesel: 5.79 },
    },
    {
      id: "gas-rj-br-centro",
      name: "Posto BR - Centro RJ",
      type: "gas",
      lat: -22.9068,
      lng: -43.1729,
      address: "Av. Presidente Vargas, 1000 - Centro",
      open24h: true,
      brand: "Petrobras",
      fuelPrices: { gasolina: 6.15, etanol: 4.25, diesel: 5.85, gnv: 4.49 },
    },
    {
      id: "rest-rj-confeitaria-colombo",
      name: "Confeitaria Colombo",
      type: "rest",
      lat: -22.9028,
      lng: -43.1764,
      address: "R. Gonçalves Dias, 32 - Centro",
      open24h: false,
    },
    {
      id: "rest-rj-bobs-ipanema",
      name: "Bob's 24h - Ipanema",
      type: "rest",
      lat: -22.9838,
      lng: -43.2096,
      address: "Rua Visconde de Pirajá, 595",
      open24h: true,
    },
    {
      id: "bath-rj-central",
      name: "Central do Brasil - Banheiros",
      type: "bathroom",
      lat: -22.9031,
      lng: -43.1840,
      address: "Praça Cristiano Ottoni - Centro",
      open24h: true,
    },

    // ============ BELO HORIZONTE ============
    {
      id: "gas-bh-shell-savassi",
      name: "Posto Shell - Savassi",
      type: "gas",
      lat: -19.9359,
      lng: -43.9378,
      address: "Av. Getúlio Vargas, 1492 - Savassi",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 5.79, etanol: 3.89, diesel: 5.39 },
    },
    {
      id: "gas-bh-ipiranga-pampulha",
      name: "Posto Ipiranga - Pampulha",
      type: "gas",
      lat: -19.8512,
      lng: -43.9734,
      address: "Av. Portugal, 2000 - Pampulha",
      open24h: true,
      brand: "Ipiranga",
      fuelPrices: { gasolina: 5.75, etanol: 3.85, diesel: 5.35 },
    },
    {
      id: "rest-bh-cafe-nice",
      name: "Café Nice",
      type: "rest",
      lat: -19.9208,
      lng: -43.9378,
      address: "Av. Afonso Pena, 1050 - Centro",
      open24h: false,
    },
    {
      id: "park-bh-central",
      name: "Área de Descanso - Rodoviária BH",
      type: "parking",
      lat: -19.9232,
      lng: -43.9305,
      address: "Praça Rio Branco, 100 - Centro",
      open24h: true,
    },

    // ============ CURITIBA ============
    {
      id: "gas-cwb-shell-batel",
      name: "Posto Shell - Batel",
      type: "gas",
      lat: -25.4372,
      lng: -49.2895,
      address: "Av. do Batel, 1868 - Batel",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 5.69, etanol: 3.79, diesel: 5.29 },
    },
    {
      id: "gas-cwb-br-centro",
      name: "Posto BR - Centro Cívico",
      type: "gas",
      lat: -25.4195,
      lng: -49.2646,
      address: "Av. Cândido de Abreu, 600",
      open24h: true,
      brand: "Petrobras",
      fuelPrices: { gasolina: 5.72, etanol: 3.82, diesel: 5.32 },
    },
    {
      id: "rest-cwb-lucca-cafe",
      name: "Lucca Café - Centro",
      type: "rest",
      lat: -25.4284,
      lng: -49.2716,
      address: "Rua XV de Novembro, 350",
      open24h: false,
    },
    {
      id: "bath-cwb-rodoferroviaria",
      name: "Rodoferroviária - Banheiros",
      type: "bathroom",
      lat: -25.4362,
      lng: -49.2540,
      address: "Av. Presidente Affonso Camargo, 330",
      open24h: true,
    },

    // ============ PORTO ALEGRE ============
    {
      id: "gas-poa-ipiranga-moinhos",
      name: "Posto Ipiranga - Moinhos",
      type: "gas",
      lat: -30.0236,
      lng: -51.2039,
      address: "Rua Padre Chagas, 333 - Moinhos de Vento",
      open24h: true,
      brand: "Ipiranga",
      fuelPrices: { gasolina: 5.85, etanol: 3.95, diesel: 5.45 },
    },
    {
      id: "gas-poa-shell-beira-rio",
      name: "Posto Shell - Beira Rio",
      type: "gas",
      lat: -30.0652,
      lng: -51.2354,
      address: "Av. Edvaldo Pereira Paiva, 1200",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 5.89, etanol: 3.99, diesel: 5.49 },
    },
    {
      id: "rest-poa-casa-cultura",
      name: "Café Casa da Cultura",
      type: "rest",
      lat: -30.0317,
      lng: -51.2306,
      address: "Praça da Alfândega, 40 - Centro",
      open24h: false,
    },

    // ============ BRASÍLIA ============
    {
      id: "gas-bsb-shell-asa-sul",
      name: "Posto Shell - Asa Sul",
      type: "gas",
      lat: -15.8352,
      lng: -47.9127,
      address: "SQS 308 - Asa Sul",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 5.95, etanol: 4.05, diesel: 5.55 },
    },
    {
      id: "gas-bsb-br-plano-piloto",
      name: "Posto BR - Plano Piloto",
      type: "gas",
      lat: -15.7942,
      lng: -47.8825,
      address: "Setor Comercial Norte - Asa Norte",
      open24h: true,
      brand: "Petrobras",
      fuelPrices: { gasolina: 5.99, etanol: 4.09, diesel: 5.59 },
    },
    {
      id: "rest-bsb-cafe-dom",
      name: "Café Ernesto - 408 Sul",
      type: "rest",
      lat: -15.8409,
      lng: -47.9183,
      address: "CLS 408 Bloco C - Asa Sul",
      open24h: false,
    },
    {
      id: "bath-bsb-rodoviaria",
      name: "Rodoviária de Brasília - Banheiros",
      type: "bathroom",
      lat: -15.7942,
      lng: -47.8825,
      address: "Rodoviária do Plano Piloto",
      open24h: true,
    },

    // ============ SALVADOR ============
    {
      id: "gas-ssa-shell-barra",
      name: "Posto Shell - Barra",
      type: "gas",
      lat: -13.0102,
      lng: -38.5312,
      address: "Av. Oceânica, 1200 - Barra",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 6.05, etanol: 4.15, diesel: 5.65 },
    },
    {
      id: "gas-ssa-ipiranga-pelourinho",
      name: "Posto Ipiranga - Pelourinho",
      type: "gas",
      lat: -12.9714,
      lng: -38.5096,
      address: "Av. J. J. Seabra, 500 - Pelourinho",
      open24h: false,
      brand: "Ipiranga",
      fuelPrices: { gasolina: 5.99, etanol: 4.09, diesel: 5.59 },
    },
    {
      id: "rest-ssa-cafe-bahia",
      name: "Café Bahia - Mercado Modelo",
      type: "rest",
      lat: -12.9739,
      lng: -38.5133,
      address: "Praça Visc. de Cayru - Comércio",
      open24h: false,
    },

    // ============ FORTALEZA ============
    {
      id: "gas-for-shell-meireles",
      name: "Posto Shell - Meireles",
      type: "gas",
      lat: -3.7261,
      lng: -38.4983,
      address: "Av. Beira Mar, 2500 - Meireles",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 5.89, etanol: 4.19, diesel: 5.49 },
    },
    {
      id: "gas-for-br-aldeota",
      name: "Posto BR - Aldeota",
      type: "gas",
      lat: -3.7400,
      lng: -38.5012,
      address: "Av. Santos Dumont, 1789 - Aldeota",
      open24h: true,
      brand: "Petrobras",
      fuelPrices: { gasolina: 5.85, etanol: 4.15, diesel: 5.45 },
    },
    {
      id: "rest-for-cafe-central",
      name: "Café Central - Centro",
      type: "rest",
      lat: -3.7260,
      lng: -38.5271,
      address: "Rua Major Facundo, 500 - Centro",
      open24h: false,
    },

    // ============ RECIFE ============
    {
      id: "gas-rec-shell-boa-viagem",
      name: "Posto Shell - Boa Viagem",
      type: "gas",
      lat: -8.1204,
      lng: -34.9034,
      address: "Av. Boa Viagem, 4000 - Boa Viagem",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 5.95, etanol: 4.25, diesel: 5.55 },
    },
    {
      id: "gas-rec-ipiranga-recife-antigo",
      name: "Posto Ipiranga - Recife Antigo",
      type: "gas",
      lat: -8.0631,
      lng: -34.8711,
      address: "Av. Alfredo Lisboa, 200",
      open24h: true,
      brand: "Ipiranga",
      fuelPrices: { gasolina: 5.89, etanol: 4.19, diesel: 5.49 },
    },
    {
      id: "rest-rec-cafe-cordel",
      name: "Café Cordel - Marco Zero",
      type: "rest",
      lat: -8.0631,
      lng: -34.8711,
      address: "Praça Rio Branco - Recife Antigo",
      open24h: false,
    },

    // ============ CAMPINAS ============
    {
      id: "gas-camp-shell-cambuí",
      name: "Posto Shell - Cambuí",
      type: "gas",
      lat: -22.8989,
      lng: -47.0545,
      address: "Av. José de Souza Campos, 1200 - Cambuí",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 5.75, etanol: 3.85, diesel: 5.35 },
    },
    {
      id: "gas-camp-ipiranga-anhanguera",
      name: "Posto Ipiranga - Anhanguera",
      type: "gas",
      lat: -22.8545,
      lng: -47.0912,
      address: "Rod. Anhanguera, km 98 - Campinas",
      open24h: true,
      brand: "Ipiranga",
      fuelPrices: { gasolina: 5.72, etanol: 3.82, diesel: 5.32 },
    },
    {
      id: "rest-camp-graal-bandeirantes",
      name: "Graal - Rod. Bandeirantes km 89",
      type: "rest",
      lat: -22.8821,
      lng: -47.0234,
      address: "Rod. Bandeirantes, km 89",
      open24h: true,
    },

    // ============ GOIÂNIA ============
    {
      id: "gas-gyn-shell-setor-oeste",
      name: "Posto Shell - Setor Oeste",
      type: "gas",
      lat: -16.6869,
      lng: -49.2648,
      address: "Av. T-3, 1500 - Setor Oeste",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 5.69, etanol: 3.79, diesel: 5.29 },
    },
    {
      id: "gas-gyn-br-marista",
      name: "Posto BR - Setor Marista",
      type: "gas",
      lat: -16.7056,
      lng: -49.2606,
      address: "Av. T-10, 800 - Setor Marista",
      open24h: true,
      brand: "Petrobras",
      fuelPrices: { gasolina: 5.72, etanol: 3.82, diesel: 5.32 },
    },
    {
      id: "rest-gyn-cafe-goiano",
      name: "Café Goiano - Centro",
      type: "rest",
      lat: -16.6799,
      lng: -49.2550,
      address: "Av. Goiás, 1000 - Centro",
      open24h: false,
    },

    // ============ RODOVIAS PRINCIPAIS ============
    // Rodovia Presidente Dutra (SP-RJ)
    {
      id: "gas-dutra-graal-sp",
      name: "Posto Graal - Dutra km 170",
      type: "gas",
      lat: -23.1845,
      lng: -45.8567,
      address: "Rod. Presidente Dutra, km 170 - SP",
      open24h: true,
      brand: "Graal",
      fuelPrices: { gasolina: 5.95, etanol: 4.05, diesel: 5.55 },
    },
    {
      id: "rest-dutra-graal-sp",
      name: "Graal Restaurante - Dutra km 170",
      type: "rest",
      lat: -23.1845,
      lng: -45.8567,
      address: "Rod. Presidente Dutra, km 170",
      open24h: true,
    },
    {
      id: "gas-dutra-shell-sjc",
      name: "Posto Shell - São José dos Campos",
      type: "gas",
      lat: -23.1857,
      lng: -45.8844,
      address: "Rod. Presidente Dutra, km 145 - SJC",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 5.89, etanol: 3.99, diesel: 5.49 },
    },

    // Rodovia dos Bandeirantes
    {
      id: "gas-band-ipiranga-km50",
      name: "Posto Ipiranga - Bandeirantes km 50",
      type: "gas",
      lat: -23.1234,
      lng: -46.9567,
      address: "Rod. Bandeirantes, km 50",
      open24h: true,
      brand: "Ipiranga",
      fuelPrices: { gasolina: 5.79, etanol: 3.89, diesel: 5.39 },
    },
    {
      id: "rest-band-graal-km65",
      name: "Graal - Bandeirantes km 65",
      type: "rest",
      lat: -22.9876,
      lng: -47.0234,
      address: "Rod. Bandeirantes, km 65",
      open24h: true,
    },
    {
      id: "bath-band-area-km70",
      name: "Área de Serviço - Bandeirantes km 70",
      type: "bathroom",
      lat: -22.9512,
      lng: -47.0456,
      address: "Rod. Bandeirantes, km 70",
      open24h: true,
    },

    // Rodovia Anhanguera
    {
      id: "gas-anh-shell-km40",
      name: "Posto Shell - Anhanguera km 40",
      type: "gas",
      lat: -23.3456,
      lng: -46.8901,
      address: "Rod. Anhanguera, km 40",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 5.85, etanol: 3.95, diesel: 5.45 },
    },
    {
      id: "rest-anh-graal-km55",
      name: "Graal - Anhanguera km 55",
      type: "rest",
      lat: -23.2345,
      lng: -46.9234,
      address: "Rod. Anhanguera, km 55",
      open24h: true,
    },
    {
      id: "park-anh-descanso-km60",
      name: "Área de Descanso - Anhanguera km 60",
      type: "parking",
      lat: -23.1890,
      lng: -46.9567,
      address: "Rod. Anhanguera, km 60",
      open24h: true,
    },

    // BR-116 (Régis Bittencourt)
    {
      id: "gas-regis-br-km300",
      name: "Posto BR - Régis km 300",
      type: "gas",
      lat: -23.7234,
      lng: -46.7890,
      address: "Rod. Régis Bittencourt, km 300",
      open24h: true,
      brand: "Petrobras",
      fuelPrices: { gasolina: 5.79, etanol: 3.89, diesel: 5.39 },
    },
    {
      id: "rest-regis-parada-km310",
      name: "Parada do Motorista - Régis km 310",
      type: "rest",
      lat: -23.7890,
      lng: -46.8123,
      address: "Rod. Régis Bittencourt, km 310",
      open24h: true,
    },

    // BR-101 (Rio-Santos)
    {
      id: "gas-rio-santos-shell-km100",
      name: "Posto Shell - Rio-Santos km 100",
      type: "gas",
      lat: -23.4567,
      lng: -44.8901,
      address: "Rod. Rio-Santos, km 100",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 6.09, etanol: 4.19, diesel: 5.69 },
    },

    // Fernão Dias (SP-MG)
    {
      id: "gas-fernao-ipiranga-km50",
      name: "Posto Ipiranga - Fernão Dias km 50",
      type: "gas",
      lat: -23.2345,
      lng: -46.4567,
      address: "Rod. Fernão Dias, km 50",
      open24h: true,
      brand: "Ipiranga",
      fuelPrices: { gasolina: 5.82, etanol: 3.92, diesel: 5.42 },
    },
    {
      id: "rest-fernao-graal-km75",
      name: "Graal - Fernão Dias km 75",
      type: "rest",
      lat: -22.9876,
      lng: -46.3456,
      address: "Rod. Fernão Dias, km 75",
      open24h: true,
    },
    {
      id: "bath-fernao-area-km80",
      name: "Área de Serviço - Fernão Dias km 80",
      type: "bathroom",
      lat: -22.9234,
      lng: -46.2890,
      address: "Rod. Fernão Dias, km 80",
      open24h: true,
    },

    // BR-040 (Rio-BH)
    {
      id: "gas-br040-shell-juiz-fora",
      name: "Posto Shell - Juiz de Fora",
      type: "gas",
      lat: -21.7642,
      lng: -43.3503,
      address: "BR-040, km 775 - Juiz de Fora",
      open24h: true,
      brand: "Shell",
      fuelPrices: { gasolina: 5.89, etanol: 3.99, diesel: 5.49 },
    },
    {
      id: "rest-br040-graal-petropolis",
      name: "Graal - Petrópolis",
      type: "rest",
      lat: -22.5112,
      lng: -43.1779,
      address: "BR-040, km 68 - Petrópolis",
      open24h: true,
    },

    // BR-381 (Fernão Dias MG)
    {
      id: "gas-br381-br-pouso-alegre",
      name: "Posto BR - Pouso Alegre",
      type: "gas",
      lat: -22.2339,
      lng: -45.9345,
      address: "BR-381, km 850 - Pouso Alegre",
      open24h: true,
      brand: "Petrobras",
      fuelPrices: { gasolina: 5.75, etanol: 3.85, diesel: 5.35 },
    },
  ];

  // Calculate distance for each POI
  return allPOIs.map(poi => ({
    ...poi,
    distance: formatDistance(calculateDistance(userLat, userLng, poi.lat, poi.lng)),
  }));
};

function LocationMarker({ position }: { position: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);
  
  return position ? (
    <Marker position={position} icon={driverIcon}>
      <Popup>
        <strong>Sua localização</strong>
      </Popup>
    </Marker>
  ) : null;
}

const getIconForType = (type: string) => {
  switch (type) {
    case "gas": return gasIcon;
    case "rest": return restIcon;
    case "bathroom": return bathroomIcon;
    case "parking": return parkingIcon;
    default: return gasIcon;
  }
};

const getIconComponent = (type: string) => {
  switch (type) {
    case "gas": return Fuel;
    case "rest": return Coffee;
    case "bathroom": return Bath;
    case "parking": return Car;
    default: return MapPin;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "gas": return "Posto";
    case "rest": return "Descanso";
    case "bathroom": return "Banheiro";
    case "parking": return "Estacionamento";
    default: return "Local";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "gas": return "bg-red-500";
    case "rest": return "bg-blue-500";
    case "bathroom": return "bg-purple-500";
    case "parking": return "bg-green-500";
    default: return "bg-gray-500";
  }
};

// Get favorites from localStorage
const getFavorites = (): string[] => {
  const saved = localStorage.getItem("mova-favorites");
  return saved ? JSON.parse(saved) : [];
};

// Save favorites to localStorage
const saveFavorites = (favorites: string[]) => {
  localStorage.setItem("mova-favorites", JSON.stringify(favorites));
};

export default function DriverMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<PointOfInterest | null>(null);
  const [favorites, setFavorites] = useState<string[]>(getFavorites);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [fuelDataSource, setFuelDataSource] = useState<"anp" | "database" | "mock">("mock");
  const [loadingFuel, setLoadingFuel] = useState(false);
  const [regionalAverages, setRegionalAverages] = useState<RegionalAverages | null>(null);
  const [currentState, setCurrentState] = useState<string>("");

  // Fetch gas stations from database (premium_partners)
  const fetchGasStationsFromDB = async (userLat: number, userLng: number): Promise<PointOfInterest[]> => {
    try {
      const { data, error } = await supabase
        .from('premium_partners')
        .select('*')
        .eq('tipo', 'posto')
        .eq('is_active', true);

      if (error) throw error;

      const stations: PointOfInterest[] = (data || [])
        .filter(partner => partner.latitude && partner.longitude)
        .map(partner => {
          const distance = calculateDistance(
            userLat, 
            userLng, 
            Number(partner.latitude), 
            Number(partner.longitude)
          );
          
          // Parse fuel types from services
          const services = partner.servicos || [];
          const fuelPrices: FuelPrices = {};
          if (services.some((s: string) => s.toLowerCase().includes('gasolina'))) {
            fuelPrices.gasolina = 5.79 + Math.random() * 0.3; // Simulated prices
          }
          if (services.some((s: string) => s.toLowerCase().includes('etanol'))) {
            fuelPrices.etanol = 3.89 + Math.random() * 0.2;
          }
          if (services.some((s: string) => s.toLowerCase().includes('diesel'))) {
            fuelPrices.diesel = 5.49 + Math.random() * 0.3;
          }
          if (services.some((s: string) => s.toLowerCase().includes('gnv'))) {
            fuelPrices.gnv = 4.29 + Math.random() * 0.2;
          }

          return {
            id: partner.id,
            name: partner.nome,
            type: "gas" as const,
            lat: Number(partner.latitude),
            lng: Number(partner.longitude),
            distance: formatDistance(distance),
            address: partner.endereco || '',
            open24h: partner.tag?.toLowerCase().includes('24h') || false,
            fuelPrices,
            brand: partner.tag || 'Parceiro MOVA',
          };
        })
        .sort((a, b) => {
          const distA = parseFloat(a.distance?.replace('km', '').replace('m', '') || '0');
          const distB = parseFloat(b.distance?.replace('km', '').replace('m', '') || '0');
          return distA - distB;
        });

      return stations;
    } catch (error) {
      console.error('Error fetching gas stations from DB:', error);
      return [];
    }
  };

  const toggleFavorite = (poiId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(poiId)
        ? prev.filter(id => id !== poiId)
        : [...prev, poiId];
      saveFavorites(newFavorites);
      return newFavorites;
    });
  };

  const isFavorite = (poiId: string) => favorites.includes(poiId);

  const fetchFuelPrices = async (lat: number, lng: number) => {
    setLoadingFuel(true);
    try {
      const { data, error } = await supabase.functions.invoke('fuel-prices', {
        body: { lat, lng, radiusKm: 10 }
      });
      
      if (error) throw error;
      
      const fuelStations: PointOfInterest[] = data.stations.map((station: FuelStation) => ({
        id: station.id,
        name: station.name,
        type: "gas" as const,
        lat: station.lat,
        lng: station.lng,
        distance: station.distance,
        address: station.address,
        open24h: station.open24h,
        fuelPrices: station.prices,
        brand: station.brand,
        updatedAt: station.updatedAt,
        priceSource: station.priceSource,
        state: station.state,
      }));
      
      // Set regional data
      if (data.regionalAverages) {
        setRegionalAverages(data.regionalAverages);
      }
      if (data.state) {
        setCurrentState(data.state);
      }
      
      setFuelDataSource("anp");
      return fuelStations;
    } catch (error) {
      console.error("Error fetching fuel prices:", error);
      toast.error("Erro ao buscar preços ANP. Usando dados locais.");
      return [];
    } finally {
      setLoadingFuel(false);
    }
  };

  const fetchLocation = async () => {
    setLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(coords);
          
          // Prioritize ANP API for fuel prices
          setLoadingFuel(true);
          const apiStations = await fetchFuelPrices(coords[0], coords[1]);
          
          // Also fetch from database as supplement
          const dbStations = await fetchGasStationsFromDB(coords[0], coords[1]);
          
          // Combine: API stations first, then DB stations
          const allStations = [...apiStations, ...dbStations];
          setLoadingFuel(false);
          
          // Get all Brazil POIs (non-gas)
          const allBrazilPois = getAllBrazilPOIs(coords[0], coords[1])
            .filter(poi => poi.type !== "gas"); // Avoid duplicates
          
          // Combine all data
          setPois([...allStations, ...allBrazilPois]);
          setLoading(false);
        },
        async (error) => {
          console.error("Error getting location:", error);
          const defaultCoords: [number, number] = [-23.5505, -46.6333];
          setPosition(defaultCoords);
          
          setLoadingFuel(true);
          const apiStations = await fetchFuelPrices(defaultCoords[0], defaultCoords[1]);
          const dbStations = await fetchGasStationsFromDB(defaultCoords[0], defaultCoords[1]);
          setLoadingFuel(false);
          
          const allStations = [...apiStations, ...dbStations];
          const allBrazilPois = getAllBrazilPOIs(defaultCoords[0], defaultCoords[1])
            .filter(poi => poi.type !== "gas");
          
          setPois([...allStations, ...allBrazilPois]);
          setLoading(false);
          toast.error("Não foi possível obter sua localização. Usando localização padrão.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      const defaultCoords: [number, number] = [-23.5505, -46.6333];
      setPosition(defaultCoords);
      
      setLoadingFuel(true);
      const apiStations = await fetchFuelPrices(defaultCoords[0], defaultCoords[1]);
      const dbStations = await fetchGasStationsFromDB(defaultCoords[0], defaultCoords[1]);
      setLoadingFuel(false);
      
      const allStations = [...apiStations, ...dbStations];
      const allBrazilPois = getAllBrazilPOIs(defaultCoords[0], defaultCoords[1])
        .filter(poi => poi.type !== "gas");
      
      setPois([...allStations, ...allBrazilPois]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const filteredPois = pois.filter(poi => {
    const matchesType = activeFilter ? poi.type === activeFilter : true;
    const matchesFavorite = showFavoritesOnly ? favorites.includes(poi.id) : true;
    return matchesType && matchesFavorite;
  });

  const openNavigation = (poi: PointOfInterest) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}&travelmode=driving`;
    window.open(url, "_blank");
    toast.success(`Abrindo navegação para ${poi.name}`);
  };

  const filters = [
    { type: "gas", label: loadingFuel ? "..." : "Postos", icon: Fuel, color: "text-red-500" },
    { type: "rest", label: "Descanso", icon: Coffee, color: "text-blue-500" },
    { type: "bathroom", label: "Banheiros", icon: Bath, color: "text-purple-500" },
    { type: "parking", label: "Estacionar", icon: Car, color: "text-green-500" },
  ];

  const gasStationsCount = pois.filter(p => p.type === "gas").length;

  if (loading) {
    return (
      <PageContainer title="Mapa">
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Obtendo sua localização...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Mapa">
      <div className="space-y-4 pb-4">
        {/* Data source indicator */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {fuelDataSource === "anp" ? (
                <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-300">
                  <Wifi className="w-3 h-3" />
                  Preços ANP
                </Badge>
              ) : fuelDataSource === "database" ? (
                <Badge variant="outline" className="text-xs gap-1 text-blue-600 border-blue-300">
                  <Wifi className="w-3 h-3" />
                  Parceiros MOVA
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300">
                  <WifiOff className="w-3 h-3" />
                  Dados Locais
                </Badge>
              )}
              {currentState && (
                <Badge variant="secondary" className="text-xs">
                  {currentState}
                </Badge>
              )}
              {gasStationsCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {gasStationsCount} postos
                </span>
              )}
            </div>
            {loadingFuel && (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}
          </div>
          
          {/* Regional averages card */}
          {regionalAverages && fuelDataSource === "anp" && (
            <Card className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Fuel className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                  Média Regional ANP - {currentState}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Gasolina</p>
                  <p className="text-sm font-bold text-green-600">R$ {regionalAverages.gasolina.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Etanol</p>
                  <p className="text-sm font-bold text-blue-600">R$ {regionalAverages.etanol.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Diesel</p>
                  <p className="text-sm font-bold text-amber-600">R$ {regionalAverages.diesel.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">GNV</p>
                  <p className="text-sm font-bold text-purple-600">R$ {regionalAverages.gnv.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Fonte: ANP - Atualização semanal
              </p>
            </Card>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <Button
            variant={activeFilter === null && !showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => { setActiveFilter(null); setShowFavoritesOnly(false); }}
            className="shrink-0"
          >
            Todos
          </Button>
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="shrink-0 gap-2"
          >
            <Heart className={`w-4 h-4 ${!showFavoritesOnly ? "text-pink-500" : ""}`} />
            Favoritos
            {favorites.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {favorites.length}
              </Badge>
            )}
          </Button>
          {filters.map(({ type, label, icon: Icon, color }) => (
            <Button
              key={type}
              variant={activeFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => { setActiveFilter(activeFilter === type ? null : type); setShowFavoritesOnly(false); }}
              className="shrink-0 gap-2"
            >
              <Icon className={`w-4 h-4 ${activeFilter !== type ? color : ""}`} />
              {label}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLocation}
            className="shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Map */}
        <div className="rounded-xl overflow-hidden shadow-card h-[45vh] relative">
          {position && (
            <MapContainer
              center={position}
              zoom={15}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} />
              {filteredPois.map((poi) => (
                <Marker
                  key={poi.id}
                  position={[poi.lat, poi.lng]}
                  icon={getIconForType(poi.type)}
                  eventHandlers={{
                    click: () => setSelectedPoi(poi),
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <strong>{poi.name}</strong>
                      <p className="text-sm text-gray-500">{poi.distance}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Selected POI Card */}
        {selectedPoi && (
          <Card className="p-4 animate-slide-up">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`${getTypeColor(selectedPoi.type)} text-white text-xs`}>
                    {getTypeLabel(selectedPoi.type)}
                  </Badge>
                  {selectedPoi.open24h && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                      24h
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg">{selectedPoi.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedPoi.address}</p>
                <p className="text-sm font-medium text-primary mt-1">{selectedPoi.distance}</p>
                
                {/* Fuel Prices */}
                {selectedPoi.type === "gas" && selectedPoi.fuelPrices && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedPoi.fuelPrices.gasolina && (
                      <div className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-md">
                        <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Gasolina</span>
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                          R$ {selectedPoi.fuelPrices.gasolina.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {selectedPoi.fuelPrices.etanol && (
                      <div className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md">
                        <span className="text-xs text-green-700 dark:text-green-400 font-medium">Etanol</span>
                        <p className="text-sm font-bold text-green-800 dark:text-green-300">
                          R$ {selectedPoi.fuelPrices.etanol.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {selectedPoi.fuelPrices.diesel && (
                      <div className="bg-slate-100 dark:bg-slate-900/30 px-2 py-1 rounded-md">
                        <span className="text-xs text-slate-700 dark:text-slate-400 font-medium">Diesel</span>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-300">
                          R$ {selectedPoi.fuelPrices.diesel.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite(selectedPoi.id)}
                  className="shrink-0"
                >
                  <Heart 
                    className={`w-5 h-5 transition-colors ${isFavorite(selectedPoi.id) ? "fill-pink-500 text-pink-500" : "text-muted-foreground"}`} 
                  />
                </Button>
                <Button onClick={() => openNavigation(selectedPoi)} className="shrink-0 gap-2">
                  <Navigation className="w-4 h-4" />
                  Ir
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* POI List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {showFavoritesOnly ? "Seus favoritos" : "Próximos de você"} ({filteredPois.length})
          </h3>
          {filteredPois.length === 0 && showFavoritesOnly && (
            <Card className="p-6 text-center">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhum favorito salvo ainda</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Toque no ❤️ para salvar seus locais favoritos
              </p>
            </Card>
          )}
          {filteredPois.map((poi) => {
            const IconComponent = getIconComponent(poi.type);
            return (
              <Card
                key={poi.id}
                className={`p-3 cursor-pointer transition-all hover:shadow-md ${selectedPoi?.id === poi.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedPoi(poi)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getTypeColor(poi.type)} relative`}>
                    <IconComponent className="w-5 h-5 text-white" />
                    {isFavorite(poi.id) && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                        <Heart className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{poi.name}</h4>
                      {poi.open24h && (
                        <span className="text-xs text-green-600 font-medium">24h</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{poi.address}</p>
                    {/* Fuel prices preview for gas stations */}
                    {poi.type === "gas" && poi.fuelPrices && (
                      <div className="flex gap-2 mt-1">
                        {poi.fuelPrices.gasolina && (
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                            Gas R${poi.fuelPrices.gasolina.toFixed(2)}
                          </span>
                        )}
                        {poi.fuelPrices.etanol && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded font-medium">
                            Eta R${poi.fuelPrices.etanol.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(poi.id);
                      }}
                    >
                      <Heart className={`w-4 h-4 transition-colors ${isFavorite(poi.id) ? "fill-pink-500 text-pink-500" : "text-muted-foreground"}`} />
                    </Button>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{poi.distance}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          openNavigation(poi);
                        }}
                      >
                        <Navigation className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
