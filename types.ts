export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER'
}

export enum RideStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  password?: string; // Only used for admin creation/mock auth
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string; // Optional resolved address
}

export interface RideRequest {
  id: string;
  customerId: string;
  customerName: string;
  
  // Start Details
  startLocation?: LocationData; // Optional if manual address used
  startAddress: string; // Text representation (either "GPS..." or manual address)
  startMapUri?: string; // Link for start address

  // Destination Details
  destination: string; 
  destinationMapUri?: string;
  
  // Route Details
  distanceKm?: number;
  estimatedPrice?: number;

  // Order Details
  pickupTime: string; // "Sofort" or specific time e.g. "20:30"
  carModel?: string;

  status: RideStatus;
  etaMinutes?: number; // Set by Admin
  etaTimestamp?: number; // Calculated timestamp of arrival
  timestamp: number;
}