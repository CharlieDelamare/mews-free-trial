import type {
  GuestExperienceInputs,
  PaymentInputs,
  RMSInputs,
  HousekeepingInputs,
  SharedVariables,
  GuestExperienceResults,
  PaymentResults,
  RMSResults,
  HousekeepingResults,
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

// ── Housekeeping ──────────────────────────────────────────────────────

const HK_CONSTANTS = {
  roomAssignmentTimeDigital: 0.5,    // minutes per HK staff member
  cleaningUpdateTimeManual: 0.5,     // minutes per update
  cleaningUpdateTimeDigital: 0.05,   // 3 seconds
  repairCommTimeManual: 1.0,         // minutes per repair
  repairCommTimeDigital: 0.15,       // 9 seconds
  taskCommTimeManual: 0.5,           // minutes per task
  taskCommTimeDigital: 0.15,         // 9 seconds
  repairsPerOccupiedRoom: 0.26,      // per occupied room per day
  tasksPerOccupiedRoom: 1.45,        // per occupied room per day
  paperSheetsPerOccupiedRoom: 1,     // per occupied room per day
  paperCostPerSheet: 0.005,          // EUR base
  hkWageMultiplier: 0.85,            // HK staff earn ~85% of average staff wage
};

const ALREADY_DIGITAL_MULTIPLIERS = {
  roomAssignment: 0.30,
  cleaningStatusUpdates: 0.50,
  maintenanceCommunication: 0.50,
  taskManagement: 0.60,
  amenitiesReduction: 1.0,
  paperElimination: 1.0,
};

export function calcHousekeeping(h: HousekeepingInputs, shared: SharedVariables): HousekeepingResults {
  const occupiedRooms = shared.numberOfRooms * (shared.occupancyRate / 100);
  const hkWage = shared.staffHourlyWage * HK_CONSTANTS.hkWageMultiplier;
  const software = h.usesHousekeepingSoftware;

  // Lever 1: Room Assignment Automation
  // Condition: skip if fully_digital, halve if partially_digital
  const methodMultiplier = h.roomAssignmentMethod === 'fully_digital' ? 0
    : h.roomAssignmentMethod === 'partially_digital' ? 0.5 : 1.0;
  const raTimeDelta = h.roomAssignmentTimeManual - HK_CONSTANTS.roomAssignmentTimeDigital;
  const rawRoomAssignmentHours = h.hkStaffOnDuty * raTimeDelta * 365 / 60 * methodMultiplier;
  const roomAssignmentHours = Math.round(rawRoomAssignmentHours * (software ? ALREADY_DIGITAL_MULTIPLIERS.roomAssignment : 1));
  const roomAssignmentCost = Math.round(roomAssignmentHours * hkWage);

  // Lever 2: Cleaning Status Updates
  // Skip for short-term rentals (stayoverCleanTime === 0)
  let cleaningStatusHours = 0;
  let cleaningStatusCost = 0;
  if (h.stayoverCleanTime > 0) {
    const departures = occupiedRooms / Math.max(shared.avgLengthOfStay, 1);
    const stayovers = occupiedRooms - departures;
    const updatesPerDay = stayovers * 1 + departures * 2;
    const csTimeDelta = HK_CONSTANTS.cleaningUpdateTimeManual - HK_CONSTANTS.cleaningUpdateTimeDigital;
    const rawHours = updatesPerDay * csTimeDelta * 365 / 60;
    cleaningStatusHours = Math.round(rawHours * (software ? ALREADY_DIGITAL_MULTIPLIERS.cleaningStatusUpdates : 1));
    cleaningStatusCost = Math.round(cleaningStatusHours * hkWage);
  }

  // Lever 3: Maintenance Communication
  const repairsPerDay = occupiedRooms * HK_CONSTANTS.repairsPerOccupiedRoom;
  const mcTimeDelta = HK_CONSTANTS.repairCommTimeManual - HK_CONSTANTS.repairCommTimeDigital;
  const rawMcHours = repairsPerDay * mcTimeDelta * 365 / 60;
  const maintenanceCommHours = Math.round(rawMcHours * (software ? ALREADY_DIGITAL_MULTIPLIERS.maintenanceCommunication : 1));
  const maintenanceCommCost = Math.round(maintenanceCommHours * hkWage);

  // Lever 4: Task Management Efficiency
  const tasksPerDay = occupiedRooms * HK_CONSTANTS.tasksPerOccupiedRoom;
  const tmTimeDelta = HK_CONSTANTS.taskCommTimeManual - HK_CONSTANTS.taskCommTimeDigital;
  const rawTmHours = tasksPerDay * tmTimeDelta * 365 / 60;
  const taskMgmtHours = Math.round(rawTmHours * (software ? ALREADY_DIGITAL_MULTIPLIERS.taskManagement : 1));
  const taskMgmtCost = Math.round(taskMgmtHours * hkWage);

  // Lever 5: Amenities Cost Reduction
  const annualAmenitySpend = shared.numberOfRooms * 365 * (shared.occupancyRate / 100) * h.amenityCostPerRoomNight;
  const amenitiesCostSaved = Math.round(annualAmenitySpend * h.amenityReductionPct * ALREADY_DIGITAL_MULTIPLIERS.amenitiesReduction);

  // Lever 6: Paper Elimination
  const occupiedRoomNights = shared.numberOfRooms * 365 * (shared.occupancyRate / 100);
  const paperCostSaved = Math.round(
    occupiedRoomNights * HK_CONSTANTS.paperSheetsPerOccupiedRoom * HK_CONSTANTS.paperCostPerSheet
    * ALREADY_DIGITAL_MULTIPLIERS.paperElimination
  );

  const totalTime = roomAssignmentHours + cleaningStatusHours + maintenanceCommHours + taskMgmtHours;
  const totalSavings = roomAssignmentCost + cleaningStatusCost + maintenanceCommCost + taskMgmtCost + amenitiesCostSaved + paperCostSaved;

  return {
    roomAssignmentHours,
    roomAssignmentCost,
    cleaningStatusHours,
    cleaningStatusCost,
    maintenanceCommHours,
    maintenanceCommCost,
    taskMgmtHours,
    taskMgmtCost,
    amenitiesCostSaved,
    paperCostSaved,
    totalTime,
    totalSavings,
  };
}

// ── Cost vs Revenue Split ─────────────────────────────────────────────

export function splitHousekeeping(r: HousekeepingResults): CostRevenueSplit {
  const timeSavingsEquivalent = r.roomAssignmentCost + r.cleaningStatusCost + r.maintenanceCommCost + r.taskMgmtCost;
  const costSavings = timeSavingsEquivalent + r.amenitiesCostSaved + r.paperCostSaved;
  return { costSavings, revenueUplift: 0, timeSavingsEquivalent };
}

// ── Aggregate ─────────────────────────────────────────────────────────

export function calcAll(
  sharedVariables: SharedVariables,
  guestExperience: GuestExperienceInputs,
  payment: PaymentInputs,
  rms: RMSInputs,
  housekeeping: HousekeepingInputs,
): CalculatorResults {
  const ge = calcGuestExperience(guestExperience, sharedVariables);
  const pm = calcPayment(payment, sharedVariables);
  const rm = calcRMS(rms, sharedVariables);
  const hk = calcHousekeeping(housekeeping, sharedVariables);

  return {
    guestExperience: ge,
    payment: pm,
    rms: rm,
    housekeeping: hk,
    totalTimeSaved: ge.totalTime + pm.totalTime + rm.totalTime + hk.totalTime,
    totalAnnualSavings: ge.totalSavings + pm.totalSavings + rm.totalSavings + hk.totalSavings,
  };
}
