import { describe, it, expect } from 'vitest';
import {
  calcGuestExperience,
  calcPayment,
  calcRMS,
  calcHousekeeping,
  calcAll,
} from '@/lib/roi-calculator/utils/calculations';
import type { SharedVariables, GuestExperienceInputs, PaymentInputs, RMSInputs, HousekeepingInputs } from '@/lib/roi-calculator/types/calculator';

const shared: SharedVariables = {
  numberOfRooms: 100,
  averageDailyRate: 150,
  occupancyRate: 70,
  avgLengthOfStay: 2,
  reservationsPerMonth: 1050,
  monthlyRevenue: 315000,
  staffHourlyWage: 20,
};

const gx: GuestExperienceInputs = {
  reservationsPerMonth: 1050,
  averageStaffWage: 20,
  averageDailyRate: 150,
  checkInTime: 5,
  checkOutTime: 3,
  mewsCheckInTime: 1,
  mewsCheckOutTime: 0.5,
  roomAssignmentTime: 2,
  currentCheckInPercentage: 80,
  onlineCheckInPercentage: 30,
  revenueUplift: 5,
  currentDirectBookingPercent: 40,
  directBookingIncrease: 10,
  averageCommission: 15,
};

describe('calcGuestExperience', () => {
  it('returns positive totalSavings for valid inputs', () => {
    const result = calcGuestExperience(gx, shared);
    expect(result.totalSavings).toBeGreaterThan(0);
    expect(result.totalTime).toBeGreaterThan(0);
  });

  it('calculates checkIn time saved correctly', () => {
    const result = calcGuestExperience(gx, shared);
    // (1050 * 12 * (5 - 1)) / 60 = 840 hours
    expect(result.checkInSavings.annualCheckInTimeSaved).toBe(840);
  });
});

const payment: PaymentInputs = {
  transactionsPerMonth: 1050,
  secondsPerTransaction: 120,
  processingWage: 20,
  chargebackRate: 1,
  mewsChargebackRate: 0.1,
  chargebackVolume: 100000,
  chargebackCostPerMonth: 500,
  reconciliationTimeDaily: 60,
  mewsReconciliationTimeDaily: 5,
  reconciliationWage: 20,
  monthlyRevenue: 315000,
  noShowRate: 5,
  noShowWithoutFee: 50,
  foreignCurrencyPercent: 10,
  multiCurrencyAdoption: 20,
  revenueShare: 1,
};

describe('calcPayment', () => {
  it('returns positive totalSavings for valid inputs', () => {
    const result = calcPayment(payment, shared);
    expect(result.totalSavings).toBeGreaterThan(0);
  });

  it('calculates tokenization time saved correctly', () => {
    const result = calcPayment(payment, shared);
    // (1050 * 120 * 12) / 3600 = 420 hours
    expect(result.tokenizationTimeSaved).toBe(420);
  });
});

const rms: RMSInputs = {
  hotelRevPAR: 105,
  numberOfRooms: 100,
  numberOfRatePlans: 5,
  rateUpdateFrequency: 'Daily',
  rateChangesPerWeek: 7,
  numberOfChannels: 5,
  avgTimeToUpdateRate: 10,
  hasRevenueManager: false,
  hasExistingRMS: false,
  estimatedRevenueUplift: 5,
};

describe('calcRMS', () => {
  it('returns positive annualRevenueGain for valid inputs', () => {
    const result = calcRMS(rms, shared);
    expect(result.annualRevenueGain).toBeGreaterThan(0);
  });
});

// ── City Hotel Belgium — 200 rooms ────────────────────────────────────
const sharedBelgium: SharedVariables = {
  numberOfRooms: 200,
  averageDailyRate: 120,
  occupancyRate: 70,
  avgLengthOfStay: 1.7,
  reservationsPerMonth: Math.round((200 * 30 * 0.70) / 1.7),
  monthlyRevenue: 200 * 120 * 30 * 0.70,
  staffHourlyWage: 17,
};

const hk: HousekeepingInputs = {
  hkStaffOnDuty: 8,
  hkStaffOnDutyIsManual: false,
  departureCleanTime: 30,
  stayoverCleanTime: 20,
  amenityCostPerRoomNight: 1.0,
  amenityReductionPct: 0.05,
  roomAssignmentTimeManual: 3.0,
  roomAssignmentMethod: 'manual',
  usesHousekeepingSoftware: false,
};

describe('calcHousekeeping', () => {
  it('returns positive totalSavings and totalTime for a 200-room City Hotel', () => {
    const result = calcHousekeeping(hk, sharedBelgium);
    expect(result.totalSavings).toBeGreaterThan(0);
    expect(result.totalTime).toBeGreaterThan(0);
  });

  it('produces ~1,500 hrs and ~€26k total impact for a City Hotel Belgium baseline', () => {
    const result = calcHousekeeping(hk, sharedBelgium);
    // Ballpark: totalTime ~1,400–2,000 hrs, totalSavings ~€20k–€32k
    expect(result.totalTime).toBeGreaterThan(1000);
    expect(result.totalTime).toBeLessThan(3000);
    expect(result.totalSavings).toBeGreaterThan(15000);
    expect(result.totalSavings).toBeLessThan(40000);
  });

  it('returns zero room assignment when method is fully_digital', () => {
    const result = calcHousekeeping({ ...hk, roomAssignmentMethod: 'fully_digital' }, sharedBelgium);
    expect(result.roomAssignmentHours).toBe(0);
    expect(result.roomAssignmentCost).toBe(0);
  });

  it('reduces savings when usesHousekeepingSoftware is true', () => {
    const withoutSoftware = calcHousekeeping(hk, sharedBelgium);
    const withSoftware = calcHousekeeping({ ...hk, usesHousekeepingSoftware: true }, sharedBelgium);
    expect(withSoftware.totalSavings).toBeLessThan(withoutSoftware.totalSavings);
  });

  it('skips cleaningStatusUpdates when stayoverCleanTime is 0 (STR)', () => {
    const result = calcHousekeeping({ ...hk, stayoverCleanTime: 0 }, sharedBelgium);
    expect(result.cleaningStatusHours).toBe(0);
    expect(result.cleaningStatusCost).toBe(0);
  });
});

describe('calcAll', () => {
  it('sums totalAnnualSavings from all four modules', () => {
    const result = calcAll(shared, gx, payment, rms, hk);
    const gxSavings = calcGuestExperience(gx, shared).totalSavings;
    const paymentSavings = calcPayment(payment, shared).totalSavings;
    const rmsSavings = calcRMS(rms, shared).totalSavings;
    const hkSavings = calcHousekeeping(hk, shared).totalSavings;
    expect(result.totalAnnualSavings).toBe(gxSavings + paymentSavings + rmsSavings + hkSavings);
  });
});
