export type RideStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type DriverStatus = 'available' | 'paused' | 'unavailable';

export interface Ride {
  id: string;
  passengerName: string;
  passengerPhone?: string;
  pickupTime: string; // ISO string
  pickupAddress: string;
  dropoffAddress: string;
  estimatedValue: number;
  status: RideStatus;
  waitingTime?: number; // in minutes
  waitingValue?: number; // calculated based on waiting time
  startedAt?: string;
  completedAt?: string;
  cancelReason?: string;
}

export interface DailyStats {
  scheduledRides: number;
  nextRideTime: string | null;
  estimatedEarnings: number;
  completedRides: number;
}

export interface EarningsSummary {
  today: number;
  week: number;
  month: number;
  waitingTotal: number;
}

export interface Partner {
  id: string;
  name: string;
  category: string;
  discount: string;
  logo?: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  vehicle: string;
  plate: string;
  city: string;
  isActive: boolean;
}
