import { describe, it, expect } from 'vitest';
import {
  calcGuestExperience,
  calcPayment,
  calcRMS,
  calcAll,
} from '@/lib/roi-calculator/utils/calculations';
import type { SharedVariables, GuestExperienceInputs, PaymentInputs, RMSInputs } from '@/lib/roi-calculator/types/calculator';

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

describe('calcAll', () => {
  it('sums totalAnnualSavings from all three modules', () => {
    const result = calcAll(shared, gx, payment, rms);
    const gxSavings = calcGuestExperience(gx, shared).totalSavings;
    const paymentSavings = calcPayment(payment, shared).totalSavings;
    const rmsSavings = calcRMS(rms, shared).totalSavings;
    expect(result.totalAnnualSavings).toBe(gxSavings + paymentSavings + rmsSavings);
  });
});
