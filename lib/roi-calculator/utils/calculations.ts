import type {
  GuestExperienceInputs,
  PaymentInputs,
  RMSInputs,
  SharedVariables,
  GuestExperienceResults,
  PaymentResults,
  RMSResults,
  CalculatorResults,
  CostRevenueSplit,
} from '@/lib/roi-calculator/types/calculator';

// ── Guest Experience ──────────────────────────────────────────────────

export function calcGuestExperience(g: GuestExperienceInputs, shared: SharedVariables): GuestExperienceResults {
  const annualCheckInTimeSaved = Math.round(
    (shared.reservationsPerMonth * 12 * (g.checkInTime - g.mewsCheckInTime)) / 60
  );
  const annualCheckOutTimeSaved = Math.round(
    (shared.reservationsPerMonth * 12 * (g.checkOutTime - g.mewsCheckOutTime)) / 60
  );
  const annualTotalCostSavings = Math.round(
    (annualCheckInTimeSaved + annualCheckOutTimeSaved) * shared.staffHourlyWage
  );

  const roomTimeSaved = Math.round((shared.reservationsPerMonth * 12 * g.roomAssignmentTime) / 60);
  const roomCostSaving = Math.round(roomTimeSaved * shared.staffHourlyWage);

  const upsellRevenue = Math.round(
    shared.reservationsPerMonth * 12 * shared.averageDailyRate * (g.onlineCheckInPercentage / 100) * (g.revenueUplift / 100)
  );

  const commissionSaved = Math.round(
    shared.reservationsPerMonth * 12 * shared.averageDailyRate * (g.currentDirectBookingPercent / 100) * (g.directBookingIncrease / 100) * (g.averageCommission / 100)
  );

  const totalTime = annualCheckInTimeSaved + annualCheckOutTimeSaved + roomTimeSaved;
  const totalSavings = annualTotalCostSavings + roomCostSaving + upsellRevenue + commissionSaved;

  return {
    checkInSavings: { annualCheckInTimeSaved, annualCheckOutTimeSaved, annualTotalCostSavings },
    roomAssignmentSavings: { annualTimeSaved: roomTimeSaved, annualCostSaving: roomCostSaving },
    upsellRevenue,
    commissionSaved,
    totalTime,
    totalSavings,
  };
}

// ── Payment & Billing ─────────────────────────────────────────────────

export function calcPayment(p: PaymentInputs, shared: SharedVariables): PaymentResults {
  const tokenizationTimeSaved = Math.round((shared.reservationsPerMonth * p.secondsPerTransaction * 12) / 3600);
  const tokenizationCostSavings = Math.round(tokenizationTimeSaved * shared.staffHourlyWage);

  const chargebackReduction = Math.round(
    ((p.chargebackRate - p.mewsChargebackRate) / 100) * p.chargebackCostPerMonth * 12
  );

  const reconciliationTimeSaved = Math.round((p.reconciliationTimeDaily - p.mewsReconciliationTimeDaily) * 365);
  const reconciliationCostSavings = Math.round(reconciliationTimeSaved * shared.staffHourlyWage);

  const noShowRevenue = Math.round(
    shared.monthlyRevenue * 12 * (p.noShowRate / 100) * (p.noShowWithoutFee / 100)
  );

  const multiCurrencyRevenue = Math.round(
    shared.monthlyRevenue * 12 * (p.foreignCurrencyPercent / 100) * (p.multiCurrencyAdoption / 100) * (p.revenueShare / 100)
  );

  const totalTime = tokenizationTimeSaved + reconciliationTimeSaved;
  const totalSavings = tokenizationCostSavings + chargebackReduction + reconciliationCostSavings + noShowRevenue + multiCurrencyRevenue;

  return {
    tokenizationTimeSaved,
    tokenizationCostSavings,
    chargebackReduction,
    reconciliationTimeSaved,
    reconciliationCostSavings,
    noShowRevenue,
    multiCurrencyRevenue,
    totalTime,
    totalSavings,
  };
}

// ── Revenue Management ────────────────────────────────────────────────

const FREQUENCY_MAP: Record<string, number> = {
  Daily: 7,
  Weekly: 1,
  'Bi-Weekly': 0.5,
  Monthly: 0.25,
};

export function calcRMS(r: RMSInputs, shared: SharedVariables): RMSResults {
  const estimatedRevenueUplift = r.estimatedRevenueUplift;

  const revPARUplift = r.hotelRevPAR * (estimatedRevenueUplift / 100);
  const newHotelRevPAR = r.hotelRevPAR + revPARUplift;
  const annualRevenueGain = Math.round(revPARUplift * shared.numberOfRooms * 365);

  const avgUpdatesPerWeek = r.rateChangesPerWeek ?? FREQUENCY_MAP[r.rateUpdateFrequency] ?? 1;

  // If the property already has an RMS, they already automated rate updates — no time savings
  const annualHoursSaved = r.hasExistingRMS ? 0 : Math.round(
    (avgUpdatesPerWeek * 52 * r.numberOfRatePlans * r.numberOfChannels * r.avgTimeToUpdateRate) / 60
  );
  const annualLaborCostSavings = Math.round(annualHoursSaved * shared.staffHourlyWage);

  return {
    estimatedRevenueUplift,
    revPARUplift,
    newHotelRevPAR,
    annualRevenueGain,
    avgUpdatesPerWeek,
    annualHoursSaved,
    annualLaborCostSavings,
    totalTime: annualHoursSaved,
    totalSavings: annualRevenueGain + annualLaborCostSavings,
  };
}

// ── Cost vs Revenue Split ─────────────────────────────────────────────

export function splitGuestExperience(r: GuestExperienceResults): CostRevenueSplit {
  const timeSavingsEquivalent = r.checkInSavings.annualTotalCostSavings + r.roomAssignmentSavings.annualCostSaving;
  const costSavings = r.commissionSaved + timeSavingsEquivalent;
  const revenueUplift = r.upsellRevenue;
  return { costSavings, revenueUplift, timeSavingsEquivalent };
}

export function splitPayment(r: PaymentResults): CostRevenueSplit {
  const timeSavingsEquivalent = r.tokenizationCostSavings + r.reconciliationCostSavings;
  const costSavings = r.chargebackReduction + timeSavingsEquivalent;
  const revenueUplift = r.noShowRevenue + r.multiCurrencyRevenue;
  return { costSavings, revenueUplift, timeSavingsEquivalent };
}

export function splitRMS(r: RMSResults): CostRevenueSplit {
  const timeSavingsEquivalent = r.annualLaborCostSavings;
  const costSavings = timeSavingsEquivalent;
  const revenueUplift = r.annualRevenueGain;
  return { costSavings, revenueUplift, timeSavingsEquivalent };
}

// ── Aggregate ─────────────────────────────────────────────────────────

export function calcAll(
  sharedVariables: SharedVariables,
  guestExperience: GuestExperienceInputs,
  payment: PaymentInputs,
  rms: RMSInputs,
): CalculatorResults {
  const ge = calcGuestExperience(guestExperience, sharedVariables);
  const pm = calcPayment(payment, sharedVariables);
  const rm = calcRMS(rms, sharedVariables);

  return {
    guestExperience: ge,
    payment: pm,
    rms: rm,
    totalTimeSaved: ge.totalTime + pm.totalTime + rm.totalTime,
    totalAnnualSavings: ge.totalSavings + pm.totalSavings + rm.totalSavings,
  };
}
