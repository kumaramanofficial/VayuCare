export interface CityOption {
  name: string;
  admin1: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface HourlyAirPoint {
  time: string;
  hourLabel: string;
  pm25: number;
  pm10: number;
  usAqi: number;
  no2: number;
  ozone: number;
}

export interface AirQualityData {
  location: CityOption & { timezone: string };
  observedAt: string;
  current: {
    usAqi: number;
    level: string;
    advisory: string;
    pm25: number;
    pm10: number;
    no2: number;
    ozone: number;
    so2: number;
    co: number;
    dust: number;
    cigaretteEquivalent: number;
    whoMultiple: number;
  };
  weather: {
    temperatureC: number | null;
    humidityPct: number | null;
    windKmh: number | null;
  };
  windows: {
    safestVentilation: {
      label: string;
      avgPm25: number;
      avgAqi: number;
    };
    peakSmog: {
      label: string;
      avgPm25: number;
      avgAqi: number;
    };
  };
  hourly: HourlyAirPoint[];
}

export interface HouseholdProfile {
  householdSize: number;
  members: string[];
  commuteMode: 'car' | 'two-wheeler' | 'metro-bus' | 'carpool' | 'remote';
  commuteDistanceKm: number;
  homeType: 'high-rise-apartment' | 'low-rise-flat' | 'independent-house';
  hasAirPurifier: boolean;
  cookingFuel: 'lpg-png' | 'induction' | 'mixed-gas-induction' | 'biomass-other';
  priorities: string[];
}

export interface RoutineItem {
  id: string;
  timeSlot: string;
  phase: string;
  title: string;
  action: string;
  lowEmissionHabit: string;
  exposureReductionPct: number;
  co2SavedGrams: number;
  directImpactExplanation: string;
}

export interface IndoorHack {
  id: string;
  title: string;
  category: string;
  budgetTier: 'Zero Cost' | 'Low Cost' | 'Equipment' | string;
  timeRequired: string;
  estimatedPm25Drop: string;
  steps: string[];
  whyItWorks: string;
  tailoredNote: string;
}

export interface SustainableSwap {
  id: string;
  title: string;
  category: string;
  currentHabit: string;
  sustainableAlternative: string;
  weeklyCo2SavedKg: number;
  weeklyPm25PreventedGrams: number;
  personalExposureDropPct: number;
  directImpactExplanation: string;
  communityScaleNote: string;
}

export interface CommunityPlaybook {
  headline: string;
  whatsappMessage: string;
  collectiveActions: Array<{
    title: string;
    description: string;
    expectedImpact: string;
  }>;
}

export interface GeneratedAirPlan {
  executiveSummary: string;
  maskAndOutdoorGuidance: {
    maskGrade: string;
    outdoorExerciseAdvice: string;
    vulnerableMemberNote: string;
  };
  dailyRoutine: RoutineItem[];
  indoorHacks: IndoorHack[];
  sustainableSwaps: SustainableSwap[];
  communityPlaybook: CommunityPlaybook;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export type ActiveTab = 'overview' | 'routine' | 'indoor' | 'impact' | 'community';
