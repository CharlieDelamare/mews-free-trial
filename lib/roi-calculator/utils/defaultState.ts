import type { CalculatorState } from '@/lib/roi-calculator/types/calculator';

// Derivation helpers (exported so the hook can import them instead of duplicating)
export function deriveReservations(rooms: number, occupancy: number, avgStay: number): number {
  if (avgStay <= 0 || rooms <= 0) return 1;
  return Math.max(1, Math.round(rooms * 30 * (occupancy / 100) / avgStay));
}

export function deriveMonthlyRevenue(rooms: number, adr: number, occupancy: number): number {
  return Math.max(0, Math.round(rooms * adr * 30 * (occupancy / 100)));
}

export const defaultCalculatorState: CalculatorState = {
  config: {
    title: '',
    country: 'Belgium',
    usState: '',
    currencySymbol: '€',
    hotelType: 'City Hotel',
    isInitialLoad: true,
    presentationLanguage: 'en',
  },
  ui: {
    isExportModalOpen: false,
    selectedSections: [],
    isExporting: false,

    enabledModules: { guestExperience: true, payment: true, rms: true, housekeeping: true },
    activeDetailModule: null,
    activePreset: 'custom',

    cinematicMode: false,
    cinematicSlideIndex: 0,
    cinematicAutoAdvance: false,

    propertyEditOpen: false,

    expandedLever: null,
    editingLever: null,
  },
  sharedVariables: {
    numberOfRooms: 50,
    averageDailyRate: 80,
    occupancyRate: 70,
    avgLengthOfStay: 1.7,
    reservationsPerMonth: deriveReservations(50, 70, 1.7),
    monthlyRevenue: deriveMonthlyRevenue(50, 80, 70),
    staffHourlyWage: 15,
  },
  guestExperience: {
    reservationsPerMonth: 250,
    averageStaffWage: 17,
    averageDailyRate: 80,
    checkInTime: 5.0,
    checkOutTime: 1.0,
    mewsCheckInTime: 1.0,
    mewsCheckOutTime: 0.5,
    roomAssignmentTime: 2.0,
    currentCheckInPercentage: 8,
    onlineCheckInPercentage: 25,
    revenueUplift: 10,
    currentDirectBookingPercent: 25,
    directBookingIncrease: 40,
    averageCommission: 15,
  },
  payment: {
    transactionsPerMonth: 250,
    secondsPerTransaction: 60,
    processingWage: 12,
    chargebackRate: 0.5,
    mewsChargebackRate: 0.15,
    chargebackVolume: 50,
    chargebackCostPerMonth: 2000,
    reconciliationTimeDaily: 2.5,
    mewsReconciliationTimeDaily: 0.5,
    reconciliationWage: 12,
    monthlyRevenue: 100000,
    noShowRate: 2,
    noShowWithoutFee: 50,
    foreignCurrencyPercent: 30,
    multiCurrencyAdoption: 35,
    revenueShare: 1,
  },
  rms: {
    hotelRevPAR: Math.round(80 * 70 / 100),
    numberOfRooms: 50,
    numberOfRatePlans: 5,
    rateUpdateFrequency: 'Daily',
    rateChangesPerWeek: 7,
    numberOfChannels: 4,
    avgTimeToUpdateRate: 5,
    hasRevenueManager: false,
    hasExistingRMS: false,
    estimatedRevenueUplift: 10.5,
  },
  housekeeping: {
    hkStaffOnDuty: 3,
    hkStaffOnDutyIsManual: false,
    departureCleanTime: 30,
    stayoverCleanTime: 20,
    amenityCostPerRoomNight: 1.00,
    amenityReductionPct: 0.05,
    roomAssignmentTimeManual: 3.0,
    roomAssignmentMethod: 'manual',
    usesHousekeepingSoftware: false,
  },
};
