import { formatMinutes } from '@/lib/roi-calculator/utils/timeFormat';
import type {
  LeverDescriptor,
  GuestExperienceInputs,
  PaymentInputs,
  RMSInputs,
  HousekeepingInputs,
  SharedVariables,
  GuestExperienceResults,
  PaymentResults,
  RMSResults,
  HousekeepingResults,
} from '@/lib/roi-calculator/types/calculator';

const fmt = (n: number) => Math.round(n).toLocaleString();

export function getGuestExperienceLevers(
  inputs: GuestExperienceInputs,
  shared: SharedVariables,
  results: GuestExperienceResults,
  cs: string,
): LeverDescriptor[] {
  const annualRes = shared.reservationsPerMonth * 12;
  const checkInMinSaved = inputs.checkInTime - inputs.mewsCheckInTime;
  const checkOutMinSaved = inputs.checkOutTime - inputs.mewsCheckOutTime;
  const totalHoursSaved = results.checkInSavings.annualCheckInTimeSaved + results.checkInSavings.annualCheckOutTimeSaved;

  return [
    {
      key: 'checkIn',
      label: 'Check-In Efficiency',
      resultValue: totalHoursSaved,
      resultUnit: 'hours',
      resultType: 'timeReclaimed',
      monetaryEquivalent: results.checkInSavings.annualTotalCostSavings,
      summary: `${fmt(annualRes)} reservations/yr x (${formatMinutes(checkInMinSaved)} check-in + ${formatMinutes(checkOutMinSaved)} check-out saved) / 60 = ${fmt(totalHoursSaved)} hrs/yr`,
      summaryParams: { annualRes: fmt(annualRes), checkInSaved: formatMinutes(checkInMinSaved), checkOutSaved: formatMinutes(checkOutMinSaved), totalHours: fmt(totalHoursSaved) },
      sliders: [
        { field: 'reservationsPerMonth', slice: 'sharedVariables', label: 'Reservations/Month', min: 0, max: 1000, step: 10, color: 'purple', isShared: true },
        { field: 'checkInTime', slice: 'guestExperience', label: 'Current Check-In Time', min: 0, max: 15, step: 0.5, color: 'yellow', formatValue: formatMinutes },
        { field: 'mewsCheckInTime', slice: 'guestExperience', label: 'Mews Check-In Time', min: 0.1, max: 5, step: 0.1, color: 'pink', formatValue: formatMinutes },
        { field: 'checkOutTime', slice: 'guestExperience', label: 'Current Check-Out Time', min: 0, max: 10, step: 0.5, color: 'yellow', formatValue: formatMinutes },
        { field: 'mewsCheckOutTime', slice: 'guestExperience', label: 'Mews Check-Out Time', min: 0.1, max: 5, step: 0.1, color: 'pink', formatValue: formatMinutes },
      ],
    },
    {
      key: 'roomAssignment',
      label: 'Room Assignment',
      resultValue: results.roomAssignmentSavings.annualTimeSaved,
      resultUnit: 'hours',
      resultType: 'timeReclaimed',
      monetaryEquivalent: results.roomAssignmentSavings.annualCostSaving,
      summary: `${fmt(annualRes)} reservations/yr x ${formatMinutes(inputs.roomAssignmentTime)}/reservation / 60 = ${fmt(results.roomAssignmentSavings.annualTimeSaved)} hrs/yr`,
      summaryParams: { annualRes: fmt(annualRes), assignTime: formatMinutes(inputs.roomAssignmentTime), totalHours: fmt(results.roomAssignmentSavings.annualTimeSaved) },
      sliders: [
        { field: 'reservationsPerMonth', slice: 'sharedVariables', label: 'Reservations/Month', min: 0, max: 1000, step: 10, color: 'purple', isShared: true },
        { field: 'roomAssignmentTime', slice: 'guestExperience', label: 'Time to Assign Rooms', min: 0, max: 10, step: 0.5, color: 'yellow', formatValue: formatMinutes },
      ],
    },
    {
      key: 'upsell',
      label: 'Portal Upsell',
      resultValue: results.upsellRevenue,
      resultUnit: 'currency',
      resultType: 'revenueUplift',
      summary: `${fmt(annualRes)} reservations/yr x ${cs}${shared.averageDailyRate} ADR x ${inputs.onlineCheckInPercentage}% online check-in x ${inputs.revenueUplift}% uplift = ${cs}${fmt(results.upsellRevenue)}`,
      summaryParams: { annualRes: fmt(annualRes), cs, adr: shared.averageDailyRate, onlineCheckIn: inputs.onlineCheckInPercentage, uplift: inputs.revenueUplift, total: `${cs}${fmt(results.upsellRevenue)}` },
      sliders: [
        { field: 'reservationsPerMonth', slice: 'sharedVariables', label: 'Reservations/Month', min: 0, max: 1000, step: 10, color: 'purple', isShared: true },
        { field: 'averageDailyRate', slice: 'sharedVariables', label: 'Average Daily Rate', min: 0, max: 500, step: 5, unit: cs, color: 'purple', isShared: true },
        { field: 'onlineCheckInPercentage', slice: 'guestExperience', label: '% Online Check-In', min: 0, max: 100, step: 5, unit: '%', color: 'pink' },
        { field: 'revenueUplift', slice: 'guestExperience', label: 'Revenue Uplift %', min: 0, max: 30, step: 1, unit: '%', color: 'pink' },
      ],
    },
    {
      key: 'directBooking',
      label: 'Direct Booking',
      resultValue: results.commissionSaved,
      resultUnit: 'currency',
      resultType: 'costSaving',
      summary: `${fmt(annualRes)} reservations/yr x ${inputs.currentDirectBookingPercent}% direct x ${inputs.directBookingIncrease}% uplift x ${cs}${shared.averageDailyRate} ADR x ${inputs.averageCommission}% commission = ${cs}${fmt(results.commissionSaved)}`,
      summaryParams: { annualRes: fmt(annualRes), currentDirect: inputs.currentDirectBookingPercent, directIncrease: inputs.directBookingIncrease, cs, adr: shared.averageDailyRate, commission: inputs.averageCommission, total: `${cs}${fmt(results.commissionSaved)}` },
      sliders: [
        { field: 'reservationsPerMonth', slice: 'sharedVariables', label: 'Reservations/Month', min: 0, max: 1000, step: 10, color: 'purple', isShared: true },
        { field: 'averageDailyRate', slice: 'sharedVariables', label: 'Average Daily Rate', min: 0, max: 500, step: 5, unit: cs, color: 'purple', isShared: true },
        { field: 'currentDirectBookingPercent', slice: 'guestExperience', label: 'Current Direct Booking %', min: 0, max: 100, step: 5, unit: '%', color: 'yellow' },
        { field: 'averageCommission', slice: 'guestExperience', label: 'OTA Commission Rate', min: 0, max: 30, step: 1, unit: '%', color: 'yellow' },
        { field: 'directBookingIncrease', slice: 'guestExperience', label: 'Direct Booking Uplift', min: 0, max: 100, step: 5, unit: '%', color: 'pink' },
      ],
    },
  ];
}

export function getPaymentLevers(
  inputs: PaymentInputs,
  shared: SharedVariables,
  results: PaymentResults,
  cs: string,
): LeverDescriptor[] {
  const annualRes = shared.reservationsPerMonth * 12;

  return [
    {
      key: 'tokenization',
      label: 'Tokenization',
      resultValue: results.tokenizationTimeSaved,
      resultUnit: 'hours',
      resultType: 'timeReclaimed',
      monetaryEquivalent: results.tokenizationCostSavings,
      summary: `${fmt(annualRes)} reservations/yr x ${inputs.secondsPerTransaction}s per transaction / 3,600 = ${fmt(results.tokenizationTimeSaved)} hrs/yr`,
      summaryParams: { annualRes: fmt(annualRes), seconds: inputs.secondsPerTransaction, totalHours: fmt(results.tokenizationTimeSaved) },
      sliders: [
        { field: 'reservationsPerMonth', slice: 'sharedVariables', label: 'Transactions/Month', min: 0, max: 1000, step: 10, color: 'purple', isShared: true },
        { field: 'secondsPerTransaction', slice: 'payment', label: 'Seconds per Transaction', min: 0, max: 300, step: 5, color: 'yellow' },
      ],
    },
    {
      key: 'chargeback',
      label: 'Chargeback Reduction',
      resultValue: results.chargebackReduction,
      resultUnit: 'currency',
      resultType: 'costSaving',
      summary: `(${inputs.chargebackRate}% - ${inputs.mewsChargebackRate}%) reduction x ${cs}${fmt(inputs.chargebackCostPerMonth)}/mo x 12 = ${cs}${fmt(results.chargebackReduction)}`,
      summaryParams: { currentRate: inputs.chargebackRate, mewsRate: inputs.mewsChargebackRate, cs, costPerMonth: fmt(inputs.chargebackCostPerMonth), total: `${cs}${fmt(results.chargebackReduction)}` },
      sliders: [
        { field: 'chargebackRate', slice: 'payment', label: 'Current Chargeback Rate', min: 0, max: 5, step: 0.05, unit: '%', color: 'yellow' },
        { field: 'chargebackVolume', slice: 'payment', label: 'Chargeback Volume/Month', min: 0, max: 200, step: 5, color: 'yellow' },
        { field: 'chargebackCostPerMonth', slice: 'payment', label: 'Chargeback Cost/Month', min: 0, max: 10000, step: 100, unit: cs, color: 'yellow' },
      ],
    },
    {
      key: 'reconciliation',
      label: 'Reconciliation',
      resultValue: results.reconciliationTimeSaved,
      resultUnit: 'hours',
      resultType: 'timeReclaimed',
      monetaryEquivalent: results.reconciliationCostSavings,
      summary: `(${inputs.reconciliationTimeDaily} - ${inputs.mewsReconciliationTimeDaily}) hrs/day x 365 days = ${fmt(results.reconciliationTimeSaved)} hrs/yr`,
      summaryParams: { currentDaily: inputs.reconciliationTimeDaily, mewsDaily: inputs.mewsReconciliationTimeDaily, totalHours: fmt(results.reconciliationTimeSaved) },
      sliders: [
        { field: 'reconciliationTimeDaily', slice: 'payment', label: 'Daily Reconciliation (hrs)', min: 0, max: 8, step: 0.25, color: 'yellow' },
      ],
    },
    {
      key: 'noShow',
      label: 'No-Show Protection',
      resultValue: results.noShowRevenue,
      resultUnit: 'currency',
      resultType: 'revenueUplift',
      summary: `${cs}${fmt(shared.monthlyRevenue)}/mo x 12 x ${inputs.noShowRate}% no-shows x ${inputs.noShowWithoutFee}% uncollected fees = ${cs}${fmt(results.noShowRevenue)}`,
      summaryParams: { cs, monthlyRev: fmt(shared.monthlyRevenue), noShowRate: inputs.noShowRate, uncollectedFees: inputs.noShowWithoutFee, total: `${cs}${fmt(results.noShowRevenue)}` },
      sliders: [
        { field: 'noShowRate', slice: 'payment', label: 'No-Show Rate', min: 0, max: 10, step: 0.5, unit: '%', color: 'yellow' },
        { field: 'noShowWithoutFee', slice: 'payment', label: '% Without Fee Collection', min: 0, max: 100, step: 5, unit: '%', color: 'yellow' },
      ],
    },
    {
      key: 'multiCurrency',
      label: 'Multi-Currency',
      resultValue: results.multiCurrencyRevenue,
      resultUnit: 'currency',
      resultType: 'revenueUplift',
      summary: `${cs}${fmt(shared.monthlyRevenue)}/mo x 12 x ${inputs.foreignCurrencyPercent}% foreign x ${inputs.multiCurrencyAdoption}% adoption x ${inputs.revenueShare}% share = ${cs}${fmt(results.multiCurrencyRevenue)}`,
      summaryParams: { cs, monthlyRev: fmt(shared.monthlyRevenue), foreignPercent: inputs.foreignCurrencyPercent, adoption: inputs.multiCurrencyAdoption, share: inputs.revenueShare, total: `${cs}${fmt(results.multiCurrencyRevenue)}` },
      sliders: [
        { field: 'foreignCurrencyPercent', slice: 'payment', label: '% Foreign Currency Revenue', min: 0, max: 100, step: 5, unit: '%', color: 'yellow' },
        { field: 'multiCurrencyAdoption', slice: 'payment', label: 'Adoption Rate', min: 0, max: 100, step: 5, unit: '%', color: 'pink' },
        { field: 'revenueShare', slice: 'payment', label: 'Revenue Share %', min: 0, max: 5, step: 0.1, unit: '%', color: 'pink' },
      ],
    },
  ];
}

export function getRMSLevers(
  inputs: RMSInputs,
  shared: SharedVariables,
  results: RMSResults,
  cs: string,
): LeverDescriptor[] {
  return [
    {
      key: 'revenueUplift',
      label: 'Revenue Uplift',
      resultValue: results.annualRevenueGain,
      resultUnit: 'currency',
      resultType: 'revenueUplift',
      summary: `${cs}${inputs.hotelRevPAR} RevPAR x ${results.estimatedRevenueUplift.toFixed(1)}% uplift = ${cs}${results.revPARUplift.toFixed(2)}/room/night x ${shared.numberOfRooms} rooms x 365 days = ${cs}${fmt(results.annualRevenueGain)}`,
      summaryParams: { cs, revpar: inputs.hotelRevPAR, upliftPercent: results.estimatedRevenueUplift.toFixed(1), revparUplift: results.revPARUplift.toFixed(2), rooms: shared.numberOfRooms, total: `${cs}${fmt(results.annualRevenueGain)}` },
      sliders: [
        { field: 'hotelRevPAR', slice: 'rms', label: 'Current RevPAR', min: 0, max: 300, step: 5, unit: cs, color: 'yellow' },
        { field: 'estimatedRevenueUplift', slice: 'rms', label: 'Revenue Uplift %', min: 0, max: 25, step: 0.5, unit: '%', color: 'pink' },
        { field: 'numberOfRooms', slice: 'sharedVariables', label: 'Number of Rooms', min: 1, max: 200, step: 1, color: 'purple', isShared: true },
      ],
    },
    {
      key: 'rateAutomation',
      label: 'Rate Automation',
      resultValue: results.annualHoursSaved,
      resultUnit: 'hours',
      resultType: 'timeReclaimed',
      monetaryEquivalent: results.annualLaborCostSavings,
      summary: `${results.avgUpdatesPerWeek.toFixed(0)} updates/wk x 52 wks x ${inputs.numberOfRatePlans} plans x ${inputs.numberOfChannels} channels x ${inputs.avgTimeToUpdateRate} min / 60 = ${fmt(results.annualHoursSaved)} hrs/yr`,
      summaryParams: { updatesPerWeek: results.avgUpdatesPerWeek.toFixed(0), ratePlans: inputs.numberOfRatePlans, channels: inputs.numberOfChannels, updateTime: inputs.avgTimeToUpdateRate, totalHours: fmt(results.annualHoursSaved) },
      sliders: [
        { field: 'numberOfRatePlans', slice: 'rms', label: 'Rate Plans', min: 1, max: 20, step: 1, color: 'yellow' },
        { field: 'numberOfChannels', slice: 'rms', label: 'Distribution Channels', min: 1, max: 15, step: 1, color: 'yellow' },
        { field: 'avgTimeToUpdateRate', slice: 'rms', label: 'Avg Update Time (min)', min: 1, max: 15, step: 0.5, color: 'pink' },
      ],
    },
  ];
}

// ── Housekeeping ──────────────────────────────────────────────────────

const HK_DIGITAL_TIME = {
  roomAssignment: 0.5,
  cleaningUpdate: 0.05,
  repairComm: 0.15,
  taskComm: 0.15,
};

export function getHousekeepingLevers(
  inputs: HousekeepingInputs,
  shared: SharedVariables,
  results: HousekeepingResults,
  cs: string,
): LeverDescriptor[] {
  const occupiedRooms = shared.numberOfRooms * (shared.occupancyRate / 100);
  const departures = occupiedRooms / Math.max(shared.avgLengthOfStay, 1);
  const stayovers = occupiedRooms - departures;
  const updatesPerDay = stayovers * 1 + departures * 2;
  const repairsPerDay = occupiedRooms * 0.26;
  const tasksPerDay = occupiedRooms * 1.45;
  const occupiedRoomNights = shared.numberOfRooms * 365 * (shared.occupancyRate / 100);
  const annualAmenitySpend = shared.numberOfRooms * 365 * (shared.occupancyRate / 100) * inputs.amenityCostPerRoomNight;

  const levers: LeverDescriptor[] = [
    // Lever 1: Room Assignment Automation
    {
      key: 'hkRoomAssignment',
      label: 'Room Assignment Automation',
      resultValue: results.roomAssignmentHours,
      resultUnit: 'hours',
      resultType: 'timeReclaimed',
      monetaryEquivalent: results.roomAssignmentCost,
      summary: `${inputs.hkStaffOnDuty} HK staff × (${inputs.roomAssignmentTimeManual}m − ${HK_DIGITAL_TIME.roomAssignment}m) / 60 × 365 = ${fmt(results.roomAssignmentHours)} hrs/yr`,
      summaryParams: { staff: inputs.hkStaffOnDuty, manualTime: inputs.roomAssignmentTimeManual, digitalTime: HK_DIGITAL_TIME.roomAssignment, totalHours: fmt(results.roomAssignmentHours) },
      sliders: [
        { field: 'hkStaffOnDuty', slice: 'housekeeping', label: 'HK Staff on Duty', min: 1, max: 200, step: 1, color: 'orange' },
        { field: 'roomAssignmentTimeManual', slice: 'housekeeping', label: 'Manual Assignment Time (min)', min: 0.5, max: 10, step: 0.5, color: 'yellow', formatValue: formatMinutes },
      ],
    },

    // Lever 3: Maintenance Communication
    {
      key: 'maintenanceCommunication',
      label: 'Maintenance Communication',
      resultValue: results.maintenanceCommHours,
      resultUnit: 'hours',
      resultType: 'timeReclaimed',
      monetaryEquivalent: results.maintenanceCommCost,
      summary: `${fmt(repairsPerDay)} repairs/day × (1.0m − ${HK_DIGITAL_TIME.repairComm}m) / 60 × 365 = ${fmt(results.maintenanceCommHours)} hrs/yr`,
      summaryParams: { repairsPerDay: fmt(repairsPerDay), totalHours: fmt(results.maintenanceCommHours) },
      sliders: [
        { field: 'numberOfRooms', slice: 'sharedVariables', label: 'Number of Rooms', min: 1, max: 1000, step: 1, color: 'purple', isShared: true },
        { field: 'occupancyRate', slice: 'sharedVariables', label: 'Occupancy Rate', min: 10, max: 100, step: 1, unit: '%', color: 'purple', isShared: true },
      ],
    },

    // Lever 4: Task Management Efficiency
    {
      key: 'taskManagement',
      label: 'Task Management Efficiency',
      resultValue: results.taskMgmtHours,
      resultUnit: 'hours',
      resultType: 'timeReclaimed',
      monetaryEquivalent: results.taskMgmtCost,
      summary: `${fmt(tasksPerDay)} tasks/day × (0.5m − ${HK_DIGITAL_TIME.taskComm}m) / 60 × 365 = ${fmt(results.taskMgmtHours)} hrs/yr`,
      summaryParams: { tasksPerDay: fmt(tasksPerDay), totalHours: fmt(results.taskMgmtHours) },
      sliders: [
        { field: 'numberOfRooms', slice: 'sharedVariables', label: 'Number of Rooms', min: 1, max: 1000, step: 1, color: 'purple', isShared: true },
        { field: 'occupancyRate', slice: 'sharedVariables', label: 'Occupancy Rate', min: 10, max: 100, step: 1, unit: '%', color: 'purple', isShared: true },
      ],
    },

    // Lever 5: Amenities Cost Reduction
    {
      key: 'amenitiesReduction',
      label: 'Amenities Cost Reduction',
      resultValue: results.amenitiesCostSaved,
      resultUnit: 'currency',
      resultType: 'costSaving',
      summary: `${shared.numberOfRooms} rooms × 365 × ${shared.occupancyRate}% occ × ${cs}${inputs.amenityCostPerRoomNight.toFixed(2)} × ${(inputs.amenityReductionPct * 100).toFixed(0)}% = ${cs}${fmt(results.amenitiesCostSaved)}/yr`,
      summaryParams: { rooms: shared.numberOfRooms, occupancy: shared.occupancyRate, amenityCost: `${cs}${inputs.amenityCostPerRoomNight.toFixed(2)}`, reductionPct: (inputs.amenityReductionPct * 100).toFixed(0), total: `${cs}${fmt(results.amenitiesCostSaved)}` },
      sliders: [
        { field: 'amenityCostPerRoomNight', slice: 'housekeeping', label: 'Amenity Cost/Room/Night', min: 0.10, max: 25, step: 0.10, unit: cs, color: 'orange' },
        { field: 'occupancyRate', slice: 'sharedVariables', label: 'Occupancy Rate', min: 10, max: 100, step: 1, unit: '%', color: 'purple', isShared: true },
      ],
    },

    // Lever 6: Paper Elimination
    {
      key: 'paperElimination',
      label: 'Paper Elimination 🌿',
      resultValue: results.paperCostSaved,
      resultUnit: 'currency',
      resultType: 'costSaving',
      summary: `${fmt(occupiedRoomNights)} room-nights × ${cs}0.005/sheet = ${cs}${fmt(results.paperCostSaved)}/yr`,
      summaryParams: { roomNights: fmt(occupiedRoomNights), total: `${cs}${fmt(results.paperCostSaved)}`, sustainabilityBadge: 1 },
      sliders: [
        { field: 'numberOfRooms', slice: 'sharedVariables', label: 'Number of Rooms', min: 1, max: 1000, step: 1, color: 'purple', isShared: true },
        { field: 'occupancyRate', slice: 'sharedVariables', label: 'Occupancy Rate', min: 10, max: 100, step: 1, unit: '%', color: 'purple', isShared: true },
      ],
    },
  ];

  // Insert lever 2 (Cleaning Status Updates) only if stayovers exist (skip for short-term rentals)
  if (inputs.stayoverCleanTime > 0) {
    levers.splice(1, 0, {
      key: 'cleaningStatusUpdates',
      label: 'Cleaning Status Updates',
      resultValue: results.cleaningStatusHours,
      resultUnit: 'hours',
      resultType: 'timeReclaimed',
      monetaryEquivalent: results.cleaningStatusCost,
      summary: `${fmt(updatesPerDay)} updates/day × (0.5m − ${HK_DIGITAL_TIME.cleaningUpdate}m) / 60 × 365 = ${fmt(results.cleaningStatusHours)} hrs/yr`,
      summaryParams: { updatesPerDay: fmt(updatesPerDay), totalHours: fmt(results.cleaningStatusHours) },
      sliders: [
        { field: 'numberOfRooms', slice: 'sharedVariables', label: 'Number of Rooms', min: 1, max: 1000, step: 1, color: 'purple', isShared: true },
        { field: 'occupancyRate', slice: 'sharedVariables', label: 'Occupancy Rate', min: 10, max: 100, step: 1, unit: '%', color: 'purple', isShared: true },
        { field: 'avgLengthOfStay', slice: 'sharedVariables', label: 'Avg Length of Stay', min: 1, max: 30, step: 0.1, unit: 'nights', color: 'purple', isShared: true },
      ],
    });
  }

  return levers;
}
