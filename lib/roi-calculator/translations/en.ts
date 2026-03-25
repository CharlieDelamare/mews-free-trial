import type { TranslationDictionary } from '../types/translations';

const en: TranslationDictionary = {
  labels: {
    totalAnnualImpact: 'total annual impact',
    costSavings: 'cost savings',
    revenueUplift: 'revenue uplift',
    hoursReclaimed: 'hours reclaimed',
    annualImpact: 'annual impact',
    impactSummary: 'Impact Summary',
    hrs: 'hrs',
    perYear: 'per year',
    annualRevenueGain: 'Annual Revenue Gain',
    laborCostSavings: 'Labor Cost Savings',
    timeSaved: 'Time Saved',
    revpar: 'RevPAR',
    rooms: 'Rooms',
    revenueUpliftPercent: 'Revenue Uplift',
    exportRoiReport: 'Export ROI Report',
    chooseSections: 'Choose sections to include in your PDF',
    selectAtLeastOne: 'Select at least one section to export.',
    cancel: 'Cancel',
    exportPdf: 'Export PDF',
    generating: 'Generating...',
  },

  modules: {
    guestExperience: 'Guest Experience',
    payment: 'Payment & Billing',
    rms: 'Revenue Management',
    housekeeping: 'Housekeeping',
  },

  levers: {
    checkIn: 'Check-In Efficiency',
    roomAssignment: 'Room Assignment',
    upsell: 'Portal Upsell',
    directBooking: 'Direct Booking',
    tokenization: 'Tokenization',
    chargeback: 'Chargeback Reduction',
    reconciliation: 'Reconciliation',
    noShow: 'No-Show Protection',
    multiCurrency: 'Multi-Currency',
    revenueUplift: 'Revenue Uplift',
    rateAutomation: 'Rate Automation',
    hkRoomAssignment: 'Room Assignment Automation',
    cleaningStatusUpdates: 'Cleaning Status Updates',
    maintenanceCommunication: 'Maintenance Communication',
    taskManagement: 'Task Management',
    amenitiesReduction: 'Amenities Reduction',
    paperElimination: 'Paper Elimination',
  },

  pdfLevers: {
    checkInAutomation: 'Check-In & Check-Out Automation',
    roomAssignment: 'Automatic Room Assignment',
    guestPortalUpselling: 'Guest Portal Upselling',
    directBookingCommission: 'Direct Booking & Commission Saved',
    paymentTokenization: 'Payment Tokenization',
    chargebackReduction: 'Chargeback Reduction',
    autoReconciliation: 'Auto-Reconciliation',
    noShowFeeCapture: 'No-Show Fee Capture',
    multiCurrencyRevenue: 'Multi-Currency Revenue',
    dynamicPricingUplift: 'Dynamic Pricing Revenue Uplift',
    rateUpdateAutomation: 'Rate Update Automation',
    hkRoomAssignmentAutomation: 'Room Assignment Automation',
    hkCleaningStatusUpdates: 'Cleaning Status Updates',
    hkMaintenanceCommunication: 'Maintenance Communication',
    hkTaskManagement: 'Task Management Efficiency',
    hkAmenitiesReduction: 'Amenities Cost Reduction',
    hkPaperElimination: 'Paper Elimination',
  },

  leverResultType: {
    timeReclaimed: 'time reclaimed',
    costSaving: 'saving',
    revenueUplift: 'revenue',
  },

  subtexts: {
    costSavingsSubtext: 'From automated check-in, payment processing, and reconciliation',
    revenueUpliftSubtext: 'From dynamic pricing, guest upsells, direct bookings, and no-show recovery',
    hoursReclaimedSubtext: 'Front desk, back office, and revenue management time returned to your team',
  },

  narratives: {
    titleSlideNarrative: ({ costSavings, revenueUplift, totalTime }) =>
      `Your property saves ${costSavings} through automation, gains ${revenueUplift} in new revenue, and reclaims ${totalTime} staff hours — every year.`,

    guestExperienceNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews transforms your front desk from a bottleneck into a seamless guest touchpoint.');
      if (active('checkIn')) {
        parts.push('Digital check-in and check-out free your team to focus on hospitality instead of paperwork.');
      }
      if (active('roomAssignment')) {
        parts.push('Automated room assignment eliminates a daily time sink for your front-desk staff.');
      }
      if (active('upsell')) {
        parts.push(`The guest portal creates ${val('upsell')} in new revenue through personalized upsell offers during the booking journey.`);
      }
      if (active('directBooking')) {
        parts.push(`By driving more direct bookings, you reduce OTA dependency and keep ${val('directBooking')} more per year.`);
      }
      return parts.join(' ');
    },

    paymentNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews Payments eliminates manual payment handling — your finance team spends less time on admin and more on strategic decisions.');
      if (active('tokenization')) {
        parts.push('Secure tokenization automates transaction processing, saving your team hours of repetitive work.');
      }
      if (active('reconciliation')) {
        parts.push(`Automated reconciliation replaces manual matching, recovering ${val('reconciliation')} in labor costs.`);
      }
      if (active('chargeback')) {
        parts.push(`Built-in fraud prevention significantly reduces chargebacks, saving ${val('chargeback')} annually.`);
      }
      if (active('noShow')) {
        parts.push(`Automatic card-on-file guarantees capture ${val('noShow')} in no-show fees you'd otherwise write off.`);
      }
      if (active('multiCurrency')) {
        parts.push('Multi-currency support lets international guests pay in their own currency, removing friction and unlocking incremental revenue.');
      }
      return parts.join(' ');
    },

    rmsNarrative: ({ active, val }) => {
      const parts: string[] = [];
      if (active('revenueUplift')) {
        parts.push(`Mews RMS replaces guesswork with AI-powered dynamic pricing that responds to market conditions in real time — a 24/7 revenue optimization engine delivering ${val('revenueUplift')} in additional RevPAR.`);
      }
      if (active('rateAutomation')) {
        parts.push(`Automated distribution across all your rate plans and channels eliminates hours of manual updates, saving ${val('rateAutomation')} in labor costs and letting your team focus on strategy instead of spreadsheets.`);
      }
      return parts.join(' ');
    },

    rmsManagerNote: (hasManager) =>
      hasManager
        ? 'Your revenue manager is empowered to focus on strategy and market positioning instead of spreadsheets.'
        : 'You gain enterprise-level revenue optimization without needing a dedicated revenue manager — AI handles pricing around the clock.',

    summaryNarrative: ({ moduleCount, costSavings, revenueUplift, totalTime }) =>
      `Across ${moduleCount} module${moduleCount > 1 ? 's' : ''}, Mews delivers ${costSavings} in cost savings and ${revenueUplift} in new revenue — while freeing ${totalTime} staff hours per year.`,

    pdfGuestExperienceNarrative: ({ upsellRevenue, commissionSaved, formatCurrency }) => {
      let text = 'Mews transforms your front desk from a bottleneck into a seamless guest touchpoint. Digital check-in and check-out free your team to focus on hospitality instead of paperwork, while automated room assignment eliminates a daily time sink.';
      if (upsellRevenue > 0) {
        text += ` The guest portal creates ${formatCurrency(upsellRevenue)} in new revenue through personalized upsell offers during the booking journey.`;
      }
      if (commissionSaved > 0) {
        text += ` By driving more direct bookings, you reduce OTA dependency and keep ${formatCurrency(commissionSaved)} more per year.`;
      }
      return text;
    },

    pdfPaymentNarrative: ({ reconciliationCostSavings, chargebackReduction, chargebackRate, mewsChargebackRate, noShowRevenue, multiCurrencyRevenue, formatCurrency }) => {
      let text = 'Mews Payments eliminates manual payment handling — your finance team spends less time on admin and more on strategic decisions. Secure tokenization automates transaction processing, saving your team hours of repetitive work.';
      if (reconciliationCostSavings > 0) {
        text += ` Automated reconciliation replaces daily manual matching, recovering ${formatCurrency(reconciliationCostSavings)} in labor costs.`;
      }
      if (chargebackReduction > 0) {
        text += ` Built-in fraud prevention reduces your chargeback rate from ${chargebackRate}% to ${mewsChargebackRate}%, saving ${formatCurrency(chargebackReduction)} annually.`;
      }
      if (noShowRevenue > 0) {
        text += ` Automatic card-on-file guarantees capture ${formatCurrency(noShowRevenue)} in no-show fees you'd otherwise write off.`;
      }
      if (multiCurrencyRevenue > 0) {
        text += ` Multi-currency support lets international guests pay in their own currency, removing friction and unlocking ${formatCurrency(multiCurrencyRevenue)} in incremental revenue.`;
      }
      return text;
    },

    housekeepingNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews Housekeeping streamlines every aspect of room operations — from assignment to cleaning updates to maintenance coordination.');
      if (active('hkRoomAssignment')) {
        parts.push(`Automated room assignment eliminates the daily briefing bottleneck, saving ${val('hkRoomAssignment')} in housekeeping labor each year.`);
      }
      if (active('cleaningStatusUpdates')) {
        parts.push('Real-time cleaning status updates replace phone calls and paper checklists, keeping the whole team in sync instantly.');
      }
      if (active('maintenanceCommunication')) {
        parts.push('Digital maintenance reporting means repairs are logged and dispatched in seconds, not minutes.');
      }
      if (active('amenitiesReduction')) {
        parts.push(`Smart amenity management reduces unnecessary replenishment, saving ${val('amenitiesReduction')} in supply costs.`);
      }
      if (active('paperElimination')) {
        parts.push('Going fully digital eliminates paper-based processes — better for your team and better for the planet.');
      }
      return parts.join(' ');
    },

    pdfHousekeepingNarrative: ({ totalTime, totalSavings, amenitiesCostSaved, formatCurrency }) => {
      let text = `Mews Housekeeping streamlines room assignment, cleaning status updates, and maintenance coordination — returning ${totalTime.toLocaleString()} staff hours annually and saving ${formatCurrency(totalSavings)} in total operational costs.`;
      if (amenitiesCostSaved > 0) {
        text += ` Smart amenity management alone reduces replenishment costs by ${formatCurrency(amenitiesCostSaved)} per year, while digital-first processes eliminate paper waste across every shift.`;
      }
      return text;
    },

    pdfRmsNarrative: ({ annualRevenueGain, annualHoursSaved, annualLaborCostSavings, numberOfRooms, hasRevenueManager, hasExistingRMS, formatCurrency }) => {
      if (hasExistingRMS) {
        let text = `While you already have a revenue management system in place, switching to Mews RMS offers an estimated incremental ~2% RevPAR uplift through tighter PMS integration and real-time data sync — delivering ${formatCurrency(annualRevenueGain)} in additional revenue across your ${numberOfRooms} rooms.`;
        text += hasRevenueManager
          ? ' Your revenue manager benefits from a unified platform that eliminates data silos between your PMS and RMS.'
          : ' The seamless PMS–RMS integration removes manual data transfers and ensures pricing decisions are always based on the latest booking data.';
        return text;
      }
      let text = `Mews RMS replaces guesswork with AI-powered dynamic pricing that responds to market conditions in real time — a 24/7 revenue optimization engine delivering ${formatCurrency(annualRevenueGain)} in additional RevPAR across your ${numberOfRooms} rooms.`;
      if (annualHoursSaved > 0) {
        text += ` Automated distribution across all your rate plans and channels eliminates hours of manual updates, saving ${formatCurrency(annualLaborCostSavings)} in labor costs.`;
      }
      text += hasRevenueManager
        ? ' Your revenue manager is empowered to focus on strategy and market positioning instead of spreadsheets.'
        : ' You gain enterprise-level revenue optimization without needing a dedicated revenue manager — AI handles pricing around the clock.';
      return text;
    },
  },

  slideFooter: 'Mews ROI Report',

  formulas: {
    checkIn: (p) => `${p.annualRes} reservations/yr x (${p.checkInSaved} check-in + ${p.checkOutSaved} check-out saved) / 60 = ${p.totalHours} hrs/yr`,
    roomAssignment: (p) => `${p.annualRes} reservations/yr x ${p.assignTime}/reservation / 60 = ${p.totalHours} hrs/yr`,
    upsell: (p) => `${p.annualRes} reservations/yr x ${p.cs}${p.adr} ADR x ${p.onlineCheckIn}% online check-in x ${p.uplift}% uplift = ${p.total}`,
    directBooking: (p) => `${p.annualRes} reservations/yr x ${p.directIncrease}% more direct x ${p.cs}${p.adr} ADR x ${p.commission}% commission = ${p.total}`,
    tokenization: (p) => `${p.annualRes} reservations/yr x ${p.seconds}s per transaction / 3,600 = ${p.totalHours} hrs/yr`,
    chargeback: (p) => `(${p.currentRate}% - ${p.mewsRate}%) reduction x ${p.cs}${p.costPerMonth}/mo x 12 = ${p.total}`,
    reconciliation: (p) => `(${p.currentDaily} - ${p.mewsDaily}) hrs/day x 365 days = ${p.totalHours} hrs/yr`,
    noShow: (p) => `${p.cs}${p.monthlyRev}/mo x 12 x ${p.noShowRate}% no-shows x ${p.uncollectedFees}% uncollected fees = ${p.total}`,
    multiCurrency: (p) => `${p.cs}${p.monthlyRev}/mo x 12 x ${p.foreignPercent}% foreign x ${p.adoption}% adoption x ${p.share}% share = ${p.total}`,
    revenueUplift: (p) => `${p.cs}${p.revpar} RevPAR x ${p.upliftPercent}% uplift = ${p.cs}${p.revparUplift}/room/night x ${p.rooms} rooms x 365 days = ${p.total}`,
    rateAutomation: (p) => `${p.updatesPerWeek} updates/wk x 52 wks x ${p.ratePlans} plans x ${p.channels} channels x ${p.updateTime} min / 60 = ${p.totalHours} hrs/yr`,
    hkRoomAssignment: (p) => `${p.staff} HK staff × (${p.manualTime}m − ${p.digitalTime}m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    cleaningStatusUpdates: (p) => `${p.updatesPerDay} updates/day × (0.5m − 0.05m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    maintenanceCommunication: (p) => `${p.repairsPerDay} repairs/day × (1.0m − 0.15m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    taskManagement: (p) => `${p.tasksPerDay} tasks/day × (0.5m − 0.15m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    amenitiesReduction: (p) => `${p.rooms} rooms × 365 × ${p.occupancy}% occ × ${p.amenityCost} × ${p.reductionPct}% = ${p.total}/yr`,
    paperElimination: (p) => `${p.roomNights} room-nights × €0.005/sheet = ${p.total}/yr`,
  },
};

export default en;
