import { getCountryBenchmark, getHotelTypeBenchmark } from '@/lib/roi-calculator/data/countryBenchmarks';
import { getStateBenchmarkByName } from '@/lib/roi-calculator/data/usStateBenchmarks';
import type { LanguageCode } from '@/lib/roi-calculator/types/translations';

export interface CountryConfig {
  name: string;
  currency: string;
  currencySymbol: string;
}

export const countries: CountryConfig[] = [
  { name: 'Australia', currency: 'AUD', currencySymbol: 'A$' },
  { name: 'Austria', currency: 'EUR', currencySymbol: '€' },
  { name: 'Belgium', currency: 'EUR', currencySymbol: '€' },
  { name: 'Bulgaria', currency: 'BGN', currencySymbol: 'лв' },
  { name: 'Canada', currency: 'CAD', currencySymbol: 'C$' },
  { name: 'Croatia', currency: 'EUR', currencySymbol: '€' },
  { name: 'Cyprus', currency: 'EUR', currencySymbol: '€' },
  { name: 'Czechia', currency: 'CZK', currencySymbol: 'Kč' },
  { name: 'Denmark', currency: 'DKK', currencySymbol: 'kr' },
  { name: 'Estonia', currency: 'EUR', currencySymbol: '€' },
  { name: 'Finland', currency: 'EUR', currencySymbol: '€' },
  { name: 'France', currency: 'EUR', currencySymbol: '€' },
  { name: 'Germany', currency: 'EUR', currencySymbol: '€' },
  { name: 'Greece', currency: 'EUR', currencySymbol: '€' },
  { name: 'Hungary', currency: 'HUF', currencySymbol: 'Ft' },
  { name: 'Ireland', currency: 'EUR', currencySymbol: '€' },
  { name: 'Italy', currency: 'EUR', currencySymbol: '€' },
  { name: 'Japan', currency: 'JPY', currencySymbol: '¥' },
  { name: 'Latvia', currency: 'EUR', currencySymbol: '€' },
  { name: 'Lithuania', currency: 'EUR', currencySymbol: '€' },
  { name: 'Luxembourg', currency: 'EUR', currencySymbol: '€' },
  { name: 'Malta', currency: 'EUR', currencySymbol: '€' },
  { name: 'Netherlands', currency: 'EUR', currencySymbol: '€' },
  { name: 'Poland', currency: 'PLN', currencySymbol: 'zł' },
  { name: 'Portugal', currency: 'EUR', currencySymbol: '€' },
  { name: 'Romania', currency: 'RON', currencySymbol: 'lei' },
  { name: 'Singapore', currency: 'SGD', currencySymbol: 'S$' },
  { name: 'Slovakia', currency: 'EUR', currencySymbol: '€' },
  { name: 'Slovenia', currency: 'EUR', currencySymbol: '€' },
  { name: 'Spain', currency: 'EUR', currencySymbol: '€' },
  { name: 'Sweden', currency: 'SEK', currencySymbol: 'kr' },
  { name: 'Switzerland', currency: 'CHF', currencySymbol: 'CHF' },
  { name: 'United Arab Emirates', currency: 'AED', currencySymbol: 'AED' },
  { name: 'United Kingdom', currency: 'GBP', currencySymbol: '£' },
  { name: 'United States', currency: 'USD', currencySymbol: '$' },
];

export interface USStateConfig {
  name: string;
  code: string;
}

export const usStates: USStateConfig[] = [
  { name: 'Alabama', code: 'AL' },
  { name: 'Alaska', code: 'AK' },
  { name: 'Arizona', code: 'AZ' },
  { name: 'Arkansas', code: 'AR' },
  { name: 'California', code: 'CA' },
  { name: 'Colorado', code: 'CO' },
  { name: 'Connecticut', code: 'CT' },
  { name: 'Delaware', code: 'DE' },
  { name: 'Florida', code: 'FL' },
  { name: 'Georgia', code: 'GA' },
  { name: 'Hawaii', code: 'HI' },
  { name: 'Idaho', code: 'ID' },
  { name: 'Illinois', code: 'IL' },
  { name: 'Indiana', code: 'IN' },
  { name: 'Iowa', code: 'IA' },
  { name: 'Kansas', code: 'KS' },
  { name: 'Kentucky', code: 'KY' },
  { name: 'Louisiana', code: 'LA' },
  { name: 'Maine', code: 'ME' },
  { name: 'Maryland', code: 'MD' },
  { name: 'Massachusetts', code: 'MA' },
  { name: 'Michigan', code: 'MI' },
  { name: 'Minnesota', code: 'MN' },
  { name: 'Mississippi', code: 'MS' },
  { name: 'Missouri', code: 'MO' },
  { name: 'Montana', code: 'MT' },
  { name: 'Nebraska', code: 'NE' },
  { name: 'Nevada', code: 'NV' },
  { name: 'New Hampshire', code: 'NH' },
  { name: 'New Jersey', code: 'NJ' },
  { name: 'New Mexico', code: 'NM' },
  { name: 'New York', code: 'NY' },
  { name: 'North Carolina', code: 'NC' },
  { name: 'North Dakota', code: 'ND' },
  { name: 'Ohio', code: 'OH' },
  { name: 'Oklahoma', code: 'OK' },
  { name: 'Oregon', code: 'OR' },
  { name: 'Pennsylvania', code: 'PA' },
  { name: 'Rhode Island', code: 'RI' },
  { name: 'South Carolina', code: 'SC' },
  { name: 'South Dakota', code: 'SD' },
  { name: 'Tennessee', code: 'TN' },
  { name: 'Texas', code: 'TX' },
  { name: 'Utah', code: 'UT' },
  { name: 'Vermont', code: 'VT' },
  { name: 'Virginia', code: 'VA' },
  { name: 'Washington', code: 'WA' },
  { name: 'Washington, D.C.', code: 'DC' },
  { name: 'West Virginia', code: 'WV' },
  { name: 'Wisconsin', code: 'WI' },
  { name: 'Wyoming', code: 'WY' },
];

export const COUNTRY_DEFAULT_LANGUAGE: Record<string, LanguageCode> = {
  'Austria': 'de',
  'Belgium': 'fr',
  'Czechia': 'cs',
  'Denmark': 'da',
  'Finland': 'fi',
  'France': 'fr',
  'Germany': 'de',
  'Italy': 'it',
  'Luxembourg': 'fr',
  'Netherlands': 'nl',
  'Portugal': 'pt',
  'Spain': 'es',
  'Sweden': 'sv',
  'Switzerland': 'de',
};

export const hotelTypes = [
  'Boutique Hotel',
  'City Hotel',
  'Conference Hotel',
  'Serviced Apartment',
  'Short-Term Rental',
];

interface HotelDefaults {
  occupancyRate: number;
  avgLengthOfStay: number;
  reservationsPerMonth: number;
  monthlyRevenue: number;
  averageStaffWage: number;
  averageDailyRate: number;
  checkInTime: number;
  checkOutTime: number;
  mewsCheckInTime: number;
  mewsCheckOutTime: number;
  roomAssignmentTime: number;
  currentCheckInPercentage: number;
  onlineCheckInPercentage: number;
  revenueUplift: number;
  directBookingIncrease: number;
  averageCommission: number;
  transactionsPerMonth: number;
  secondsPerTransaction: number;
  processingWage: number;
  chargebackRate: number;
  chargebackVolume: number;
  chargebackCostPerMonth: number;
  reconciliationTimeDaily: number;
  mewsReconciliationTimeDaily: number;
  reconciliationWage: number;
  noShowRate: number;
  noShowWithoutFee: number;
  foreignCurrencyPercent: number;
  multiCurrencyAdoption: number;
  revenueShare: number;
  hotelRevPAR: number;
  numberOfRooms: number;
  numberOfRatePlans: number;
  rateUpdateFrequency: string;
  rateChangesPerWeek: number;
  numberOfChannels: number;
  avgTimeToUpdateRate: number;
  currentDirectBookingPercent: number;
  estimatedRevenueUplift: number;
}

export function getSmartDefaults(country: string, hotelType: string, usState?: string): HotelDefaults {
  const countryBenchmark = getCountryBenchmark(country);
  // When a U.S. state is selected, overlay state-level data onto the country benchmark
  const stateBenchmark = (country === 'United States' && usState) ? getStateBenchmarkByName(usState) : undefined;
  const benchmark = stateBenchmark && countryBenchmark
    ? { ...countryBenchmark, average_daily_rate: stateBenchmark.average_daily_rate, hourly_wage: stateBenchmark.hourly_wage, revpar: stateBenchmark.revpar, staff_turnover_rate: stateBenchmark.staff_turnover_rate, occupancy_city: stateBenchmark.occupancy_city }
    : countryBenchmark;
  const htBenchmark = getHotelTypeBenchmark(hotelType);

  // ── Foreign currency percentage (stays geography-based) ────────────────
  const isUS = country === 'United States';
  const isEasternEU = ['Bulgaria', 'Romania', 'Hungary', 'Poland', 'Slovakia', 'Czechia',
    'Croatia', 'Slovenia', 'Latvia', 'Lithuania', 'Estonia'].includes(country);
  const isWesternEU = ['Austria', 'Belgium', 'France', 'Germany', 'Netherlands', 'Luxembourg', 'Ireland'].includes(country);
  const isSouthernEU = ['Italy', 'Spain', 'Portugal', 'Greece', 'Cyprus', 'Malta'].includes(country);
  const isNordic = ['Denmark', 'Sweden', 'Finland'].includes(country);
  const isUK = country === 'United Kingdom';

  const foreignCurrencyPercent = isUS ? 20
    : (isWesternEU || isSouthernEU || isNordic || isUK) ? 40
    : isEasternEU ? 25
    : 30;

  // ── Hotel-type size and reservation multipliers ────────────────────────
  // These remain as before — they adjust property scale, not financial rates.
  let sizeMultiplier = 1;
  let reservationsMultiplier = 1;

  switch (hotelType) {
    case 'Boutique Hotel':
      sizeMultiplier = 0.30;
      reservationsMultiplier = 0.45;
      break;
    case 'City Hotel':
      sizeMultiplier = 1.00;
      reservationsMultiplier = 1.00;
      break;
    case 'Conference Hotel':
      sizeMultiplier = 1.60;
      reservationsMultiplier = 0.75;
      break;
    case 'Serviced Apartment':
      sizeMultiplier = 0.50;
      reservationsMultiplier = 0.35;
      break;
    case 'Short-Term Rental':
      sizeMultiplier = 0.15;
      reservationsMultiplier = 1.30;
      break;
  }

  // ── Occupancy (from benchmark, adjusted for hotel type) ────────────────
  // benchmark.occupancy_city is the city-hotel annual room occupancy %.
  // htBenchmark.occupancy_multiplier scales it for the selected hotel type.
  const baseOccupancyPct = benchmark?.occupancy_city ?? 65;
  const occupancyPct = baseOccupancyPct * (htBenchmark?.occupancy_multiplier ?? 1.0);

  // ── ADR (Average Daily Rate) ───────────────────────────────────────────
  // Use hotel-type-specific ADR if available, otherwise derive from base ADR.
  // Multipliers are research-based: boutique ~1.38x, conference ~1.15x, SA ~1.25x, STR ~0.95x.
  let averageDailyRate: number;
  if (benchmark) {
    switch (hotelType) {
      case 'City Hotel':
        averageDailyRate = Math.round(benchmark.adr_city_hotel ?? benchmark.average_daily_rate);
        break;
      case 'Boutique Hotel':
        averageDailyRate = Math.round(benchmark.adr_boutique_hotel ?? benchmark.average_daily_rate * 1.38);
        break;
      case 'Conference Hotel':
        averageDailyRate = Math.round(benchmark.adr_conference_hotel ?? benchmark.average_daily_rate * 1.15);
        break;
      case 'Serviced Apartment':
        averageDailyRate = Math.round(benchmark.adr_serviced_apartment ?? benchmark.average_daily_rate * 1.25);
        break;
      case 'Short-Term Rental':
        averageDailyRate = Math.round(benchmark.adr_short_term_rental ?? benchmark.average_daily_rate * 0.95);
        break;
      default:
        averageDailyRate = Math.round(benchmark.average_daily_rate);
    }
  } else {
    // Fallback (no benchmark): USD-based multipliers by region (legacy behaviour)
    averageDailyRate = 159;
  }

  // ── Staff wage ─────────────────────────────────────────────────────────
  const averageStaffWage = benchmark ? Math.round(benchmark.hourly_wage) : 17;

  // ── RevPAR ─────────────────────────────────────────────────────────────
  // For hotel types other than City Hotel, derive RevPAR from ADR × occupancy.
  // For City Hotel use the benchmark RevPAR directly (most accurate).
  let hotelRevPAR: number;
  if (benchmark) {
    if (hotelType === 'City Hotel') {
      hotelRevPAR = Math.round(benchmark.revpar);
    } else {
      // RevPAR = ADR × occupancy% / 100
      hotelRevPAR = Math.round(averageDailyRate * occupancyPct / 100);
    }
  } else {
    hotelRevPAR = Math.round(averageDailyRate * occupancyPct / 100);
  }

  // ── Average length of stay ─────────────────────────────────────────────
  const avgLengthOfStay =
    hotelType === 'Serviced Apartment' ? 4.5
    : hotelType === 'Short-Term Rental' ? 3.5
    : hotelType === 'Conference Hotel' ? 2.2
    : hotelType === 'Boutique Hotel' ? 1.8
    : 1.7; // City Hotel default

  // ── Property size & reservations ──────────────────────────────────────
  const baseRooms = 50;
  const numberOfRooms = Math.round(baseRooms * sizeMultiplier);
  // Reservations derived from the linked model: rooms × 30 × occupancy% / avgStay
  const reservationsPerMonth = Math.max(1, Math.round(numberOfRooms * 30 * occupancyPct / 100 / avgLengthOfStay));

  // ── Revenue ────────────────────────────────────────────────────────────
  // Monthly room revenue: rooms × ADR × 30 × occupancy%
  const monthlyRevenue = Math.round(numberOfRooms * averageDailyRate * 30 * occupancyPct / 100);

  // ── Check-in / check-out times ────────────────────────────────────────
  // Use research-based hotel-type times from HotelTypeBenchmark.
  // Mews times are fixed (1.5 min check-in, 0.5 min check-out) — Mews benchmark.
  const checkInTime = htBenchmark?.checkin_time ?? 7;
  const checkOutTime = htBenchmark?.checkout_time ?? 3;

  // ── Room assignment time (minutes) ────────────────────────────────────
  const roomAssignmentTime = hotelType === 'Conference Hotel' ? 3.0 : 2.5;

  // ── Online check-in adoption (% of reservations via digital check-in) ─
  // Base rate from country benchmark (Mews June 2025 survey), adjusted by hotel type.
  // Multipliers: City 1.0x, Conference 0.9x, Boutique 0.8x, SA 1.1x, STR 1.2x.
  const baseCheckinAdoption = benchmark?.online_checkin_adoption ?? 25;
  const checkinMultiplier: Record<string, number> = {
    'City Hotel': 1.0,
    'Conference Hotel': 0.9,
    'Boutique Hotel': 0.8,
    'Serviced Apartment': 1.1,
    'Short-Term Rental': 1.2,
  };
  const onlineCheckInPercentage = Math.round(
    baseCheckinAdoption * (checkinMultiplier[hotelType] ?? 1.0) / 5
  ) * 5; // Round to nearest 5%

  // ── Revenue uplift & direct booking ───────────────────────────────────
  const revenueUplift = hotelType === 'Boutique Hotel' ? 15 : 10;
  const currentDirectBookingPercent = hotelType === 'Boutique Hotel' ? 30 : 25;
  const directBookingIncrease = hotelType === 'Boutique Hotel' ? 45 : 40;

  // ── RMS estimated revenue uplift (midpoint of range) ────────────────
  const UPLIFT_RANGES: Record<string, { withRM: [number, number]; withoutRM: [number, number] }> = {
    'Boutique Hotel': { withRM: [7, 10], withoutRM: [9, 10] },
    'City Hotel': { withRM: [8, 10], withoutRM: [9, 12] },
    'Conference Hotel': { withRM: [7, 8], withoutRM: [9, 10] },
    'Serviced Apartment': { withRM: [7, 9], withoutRM: [9, 10] },
    'Short-Term Rental': { withRM: [10, 12], withoutRM: [12, 15] },
  };
  const upliftRange = UPLIFT_RANGES[hotelType]?.withoutRM ?? [9, 12];
  const estimatedRevenueUplift = (upliftRange[0] + upliftRange[1]) / 2;

  return {
    occupancyRate: Math.round(occupancyPct),
    avgLengthOfStay,
    reservationsPerMonth,
    monthlyRevenue,
    averageStaffWage,
    averageDailyRate,
    checkInTime,
    checkOutTime,
    mewsCheckInTime: 1.5,
    mewsCheckOutTime: 0.5,
    roomAssignmentTime,
    currentCheckInPercentage: 8,  // Industry avg without Mews promotion (Mews data: 8.6% global portal)
    onlineCheckInPercentage,
    revenueUplift,
    currentDirectBookingPercent,
    directBookingIncrease,
    averageCommission: 18,
    transactionsPerMonth: reservationsPerMonth,
    secondsPerTransaction: 60,
    processingWage: Math.round(averageStaffWage * 0.65),
    chargebackRate: 0.95,
    chargebackVolume: Math.round(reservationsPerMonth * 0.01),
    chargebackCostPerMonth: Math.round(monthlyRevenue * 0.015),
    reconciliationTimeDaily: 3.5,
    mewsReconciliationTimeDaily: 0.5,
    reconciliationWage: Math.round(averageStaffWage * 0.65),
    noShowRate: hotelType === 'City Hotel' ? 2.5 : hotelType === 'Conference Hotel' ? 3.0 : 2.0,
    noShowWithoutFee: 50,
    foreignCurrencyPercent,
    multiCurrencyAdoption: 35,
    revenueShare: 1,
    hotelRevPAR,
    numberOfRooms,
    numberOfRatePlans: hotelType === 'Conference Hotel' ? 7 : hotelType === 'Boutique Hotel' ? 4 : 5,
    rateUpdateFrequency: 'Daily',
    rateChangesPerWeek: ({ 'Serviced Apartment': 2, 'Boutique Hotel': 3, 'Conference Hotel': 5, 'City Hotel': 7, 'Short-Term Rental': 7 } as Record<string, number>)[hotelType] ?? 7,
    numberOfChannels: hotelType === 'Conference Hotel' ? 6 : 4,
    avgTimeToUpdateRate: 5,
    estimatedRevenueUplift,
  };
}

/**
 * Returns the benchmark value for a given state slice.field from a HotelDefaults object.
 * Most fields share the same name; the one exception is staffHourlyWage → averageStaffWage.
 * Returns undefined when the field is not tracked in HotelDefaults.
 */
export function getBenchmarkForField(defaults: HotelDefaults, slice: string, field: string): number | undefined {
  if (slice === 'sharedVariables' && field === 'staffHourlyWage') return defaults.averageStaffWage;
  return (defaults as unknown as Record<string, number>)[field];
}
