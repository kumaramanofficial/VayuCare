import type { CityOption, HouseholdProfile } from '../types';

export const DEFAULT_CITY: CityOption = {
  name: 'New Delhi',
  admin1: 'Delhi',
  country: 'India',
  latitude: 28.6139,
  longitude: 77.209,
};

export const DEFAULT_PROFILE: HouseholdProfile = {
  householdSize: 4,
  members: ['School-age children', 'Elderly parent (65+)'],
  commuteMode: 'car',
  commuteDistanceKm: 18,
  homeType: 'high-rise-apartment',
  hasAirPurifier: false,
  cookingFuel: 'lpg-png',
  priorities: ['Safe school commute', 'Cleaner indoor air without high cost', 'Lower daily emissions'],
};

export interface AqiVisualTheme {
  label: string;
  textClass: string;
  surfaceClass: string;
  borderClass: string;
  barHex: string;
}

export function getAqiVisualTheme(aqi: number): AqiVisualTheme {
  if (aqi <= 50) {
    return {
      label: 'Good',
      textClass: 'text-emerald-800',
      surfaceClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      barHex: '#15803D',
    };
  }
  if (aqi <= 100) {
    return {
      label: 'Moderate',
      textClass: 'text-amber-800',
      surfaceClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
      barHex: '#CA8A04',
    };
  }
  if (aqi <= 150) {
    return {
      label: 'Unhealthy for Sensitive',
      textClass: 'text-orange-800',
      surfaceClass: 'bg-orange-50',
      borderClass: 'border-orange-200',
      barHex: '#EA580C',
    };
  }
  if (aqi <= 200) {
    return {
      label: 'Unhealthy',
      textClass: 'text-red-800',
      surfaceClass: 'bg-red-50',
      borderClass: 'border-red-200',
      barHex: '#DC2626',
    };
  }
  if (aqi <= 300) {
    return {
      label: 'Very Unhealthy',
      textClass: 'text-purple-900',
      surfaceClass: 'bg-purple-50',
      borderClass: 'border-purple-200',
      barHex: '#7E22CE',
    };
  }
  return {
    label: 'Hazardous',
    textClass: 'text-rose-950',
    surfaceClass: 'bg-rose-50',
    borderClass: 'border-rose-300',
    barHex: '#881337',
  };
}

export const COMMUTE_LABELS: Record<HouseholdProfile['commuteMode'], string> = {
  car: 'Solo Car (Petrol/Diesel)',
  'two-wheeler': 'Petrol Two-Wheeler',
  'metro-bus': 'Metro / Public Transit',
  carpool: 'Shared Carpool / Cab',
  remote: 'Work From Home',
};

export const HOME_TYPE_LABELS: Record<HouseholdProfile['homeType'], string> = {
  'high-rise-apartment': 'High-Rise Apartment',
  'low-rise-flat': 'Low-Rise Builder Flat',
  'independent-house': 'Independent House',
};

export const COOKING_FUEL_LABELS: Record<HouseholdProfile['cookingFuel'], string> = {
  'lpg-png': 'LPG / Piped Natural Gas',
  induction: 'Electric Induction',
  'mixed-gas-induction': 'Gas + Induction Mix',
  'biomass-other': 'Solid Fuel / Other',
};
