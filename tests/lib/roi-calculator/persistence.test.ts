import { describe, it, expect } from 'vitest';
import {
  serializeState,
  deserializeState,
  extractMetadata,
} from '@/lib/roi-calculator/utils/persistence';
import type { CalculatorState } from '@/lib/roi-calculator/types/calculator';

const minimalState: CalculatorState = {
  config: {
    title: '',
    country: 'United Kingdom',
    usState: '',
    currencySymbol: '£',
    hotelType: 'City Hotel',
    isInitialLoad: false,
    presentationLanguage: 'en',
  },
  ui: {
    isExportModalOpen: false,
    selectedSections: [],
    isExporting: false,
    enabledModules: { guestExperience: true, payment: true, rms: true },
    activeDetailModule: null,
    activePreset: 'full',
    cinematicMode: true,
    cinematicSlideIndex: 3,
    cinematicAutoAdvance: false,
    propertyEditOpen: true,
    expandedLever: null,
    editingLever: null,
  },
  sharedVariables: {
    numberOfRooms: 80,
    averageDailyRate: 120,
    occupancyRate: 75,
    avgLengthOfStay: 2,
    reservationsPerMonth: 900,
    monthlyRevenue: 216000,
    staffHourlyWage: 18,
  },
  guestExperience: {
    reservationsPerMonth: 900,
    averageStaffWage: 18,
    averageDailyRate: 120,
    checkInTime: 6,
    checkOutTime: 1.5,
    mewsCheckInTime: 1,
    mewsCheckOutTime: 0.5,
    roomAssignmentTime: 2,
    currentCheckInPercentage: 10,
    onlineCheckInPercentage: 30,
    revenueUplift: 12,
    currentDirectBookingPercent: 30,
    directBookingIncrease: 40,
    averageCommission: 15,
  },
  payment: {
    transactionsPerMonth: 900,
    secondsPerTransaction: 55,
    processingWage: 14,
    chargebackRate: 0.4,
    mewsChargebackRate: 0.15,
    chargebackVolume: 40,
    chargebackCostPerMonth: 1800,
    reconciliationTimeDaily: 2,
    mewsReconciliationTimeDaily: 0.5,
    reconciliationWage: 14,
    monthlyRevenue: 216000,
    noShowRate: 2,
    noShowWithoutFee: 50,
    foreignCurrencyPercent: 25,
    multiCurrencyAdoption: 30,
    revenueShare: 1,
  },
  rms: {
    hotelRevPAR: 90,
    numberOfRooms: 80,
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
    hasExistingHousekeepingApp: false,
  },
};

describe('serializeState', () => {
  it('strips the ui slice', () => {
    const result = serializeState(minimalState);
    expect(result).not.toHaveProperty('ui');
  });

  it('preserves all non-ui slices', () => {
    const result = serializeState(minimalState);
    expect(result.config.country).toBe('United Kingdom');
    expect(result.sharedVariables.numberOfRooms).toBe(80);
    expect(result.guestExperience.checkInTime).toBe(6);
    expect(result.payment.chargebackRate).toBe(0.4);
    expect(result.rms.numberOfRooms).toBe(80);
  });
});

describe('deserializeState', () => {
  it('returns null for null input', () => {
    expect(deserializeState(null)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(deserializeState('invalid')).toBeNull();
    expect(deserializeState(42)).toBeNull();
    expect(deserializeState([])).toBeNull();
  });

  it('restores a valid serialized state', () => {
    const serialized = serializeState(minimalState);
    const restored = deserializeState(serialized);
    expect(restored).not.toBeNull();
    expect(restored!.config.country).toBe('United Kingdom');
    expect(restored!.sharedVariables.numberOfRooms).toBe(80);
  });

  it('fills missing fields with defaults when state is partial', () => {
    const partial = { config: { country: 'France' } };
    const restored = deserializeState(partial);
    expect(restored).not.toBeNull();
    expect(restored!.sharedVariables).toBeDefined();
    expect(restored!.guestExperience).toBeDefined();
    expect(restored!.payment).toBeDefined();
    expect(restored!.rms).toBeDefined();
    expect(restored!.config.country).toBe('France');
  });

  it('does not include ui in restored state', () => {
    const restored = deserializeState(serializeState(minimalState));
    expect(restored).not.toHaveProperty('ui');
  });
});

describe('extractMetadata', () => {
  it('extracts country, hotelType, numberOfRooms from state', () => {
    const serialized = serializeState(minimalState);
    const meta = extractMetadata(serialized);
    expect(meta.country).toBe('United Kingdom');
    expect(meta.hotelType).toBe('City Hotel');
    expect(meta.numberOfRooms).toBe(80);
  });

  it('returns a non-negative totalAnnualSavings', () => {
    const serialized = serializeState(minimalState);
    const meta = extractMetadata(serialized);
    expect(meta.totalAnnualSavings).toBeGreaterThanOrEqual(0);
  });
});
