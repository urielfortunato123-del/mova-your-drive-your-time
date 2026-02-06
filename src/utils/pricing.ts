// === CONFIGURAÇÃO DE PREÇOS MOVA ===
// Valores compartilhados entre app Passageiro e Motorista

export const PRICING = {
  BASE_FARE: 5.00,        // Tarifa base (R$)
  PRICE_PER_KM: 2.00,     // Preço por km (R$)
  WAIT_PER_MIN: 0.25,     // Espera após tolerância (R$/min)
  WAIT_TOLERANCE: 15,     // Tolerância de espera (minutos)
};

export interface RidePriceResult {
  baseFare: number;
  distanceValue: number;
  waitingValue: number;
  totalValue: number;
  distanceKm: number;
}

// Calcula o valor da corrida
export function calculateRidePrice(
  distanceKm: number, 
  waitingMinutes: number = 0
): RidePriceResult {
  const baseFare = PRICING.BASE_FARE;
  const distanceValue = distanceKm * PRICING.PRICE_PER_KM;
  
  // Espera só cobra após tolerância
  const chargeableWait = Math.max(0, waitingMinutes - PRICING.WAIT_TOLERANCE);
  const waitingValue = chargeableWait * PRICING.WAIT_PER_MIN;
  
  const totalValue = baseFare + distanceValue + waitingValue;

  return {
    baseFare: Math.round(baseFare * 100) / 100,
    distanceValue: Math.round(distanceValue * 100) / 100,
    waitingValue: Math.round(waitingValue * 100) / 100,
    totalValue: Math.round(totalValue * 100) / 100,
    distanceKm: Math.round(distanceKm * 10) / 10,
  };
}

// Formata valor em reais
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Converte centavos para reais
export function centsToReais(cents: number): number {
  return cents / 100;
}

// Converte reais para centavos
export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}
