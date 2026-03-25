import type { TranslationDictionary } from '../types/translations';

const sv: TranslationDictionary = {
  labels: {
    totalAnnualImpact: 'total årlig effekt',
    costSavings: 'kostnadsbesparingar',
    revenueUplift: 'intäktsökning',
    hoursReclaimed: 'återvunna timmar',
    annualImpact: 'årlig effekt',
    impactSummary: 'Effektsammanfattning',
    hrs: 'tim',
    perYear: 'per år',
    annualRevenueGain: 'Årlig intäktsökning',
    laborCostSavings: 'Besparingar på lönekostnader',
    timeSaved: 'Sparad tid',
    revpar: 'RevPAR',
    rooms: 'Rum',
    revenueUpliftPercent: 'Intäktsökning',
    exportRoiReport: 'Exportera ROI-rapport',
    chooseSections: 'Välj sektioner att inkludera i din PDF',
    selectAtLeastOne: 'Välj minst en sektion att exportera.',
    cancel: 'Avbryt',
    exportPdf: 'Exportera PDF',
    generating: 'Genererar...',
  },

  modules: {
    guestExperience: 'Gästupplevelse',
    payment: 'Betalning och fakturering',
    rms: 'Revenue management',
    housekeeping: 'Housekeeping',
  },

  levers: {
    checkIn: 'Incheckningseffektivitet',
    roomAssignment: 'Rumstilldelning',
    upsell: 'Portalmerförsäljning',
    directBooking: 'Direktbokning',
    tokenization: 'Tokenisering',
    chargeback: 'Minskning av återkrav',
    reconciliation: 'Avstämning',
    noShow: 'Skydd mot uteblivna gäster',
    multiCurrency: 'Flera valutor',
    revenueUplift: 'Intäktsökning',
    rateAutomation: 'Prisautomatisering',
    hkRoomAssignment: 'Room Assignment Automation',
    cleaningStatusUpdates: 'Cleaning Status Updates',
    maintenanceCommunication: 'Maintenance Communication',
    taskManagement: 'Task Management',
    amenitiesReduction: 'Amenities Reduction',
    paperElimination: 'Paper Elimination',
  },

  pdfLevers: {
    checkInAutomation: 'Automatisering av in- och utcheckning',
    roomAssignment: 'Automatisk rumstilldelning',
    guestPortalUpselling: 'Merförsäljning via gästportal',
    directBookingCommission: 'Direktbokningar och sparade provisioner',
    paymentTokenization: 'Betalningstokenisering',
    chargebackReduction: 'Minskning av återkrav',
    autoReconciliation: 'Automatisk avstämning',
    noShowFeeCapture: 'Avgiftsindrivning för uteblivna gäster',
    multiCurrencyRevenue: 'Intäkter från flera valutor',
    dynamicPricingUplift: 'Intäktsökning från dynamisk prissättning',
    rateUpdateAutomation: 'Automatisering av prisuppdateringar',
    hkRoomAssignmentAutomation: 'Room Assignment Automation',
    hkCleaningStatusUpdates: 'Cleaning Status Updates',
    hkMaintenanceCommunication: 'Maintenance Communication',
    hkTaskManagement: 'Task Management Efficiency',
    hkAmenitiesReduction: 'Amenities Cost Reduction',
    hkPaperElimination: 'Paper Elimination',
  },

  leverResultType: {
    timeReclaimed: 'återvunnen tid',
    costSaving: 'besparing',
    revenueUplift: 'intäkter',
  },

  subtexts: {
    costSavingsSubtext: 'Från automatiserad incheckning, betalningshantering och avstämning',
    revenueUpliftSubtext: 'Från dynamisk prissättning, merförsäljning till gäster, direktbokningar och indrivning av uteblivna gäster',
    hoursReclaimedSubtext: 'Tid från reception, backoffice och revenue management som återförs till ditt team',
  },

  narratives: {
    titleSlideNarrative: ({ costSavings, revenueUplift, totalTime }) =>
      `Ditt hotell sparar ${costSavings} genom automatisering, genererar ${revenueUplift} i nya intäkter och frigör ${totalTime} personaltimmar — varje år.`,

    guestExperienceNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews förvandlar din reception från en flaskhals till en sömlös kontaktpunkt med gästen.');
      if (active('checkIn')) {
        parts.push('Digital in- och utcheckning frigör ditt team att fokusera på gästfrihet istället för pappersarbete.');
      }
      if (active('roomAssignment')) {
        parts.push('Automatisk rumstilldelning eliminerar en daglig tidskrävande uppgift för din receptionist.');
      }
      if (active('upsell')) {
        parts.push(`Gästportalen skapar ${val('upsell')} i nya intäkter genom personaliserade merförsäljningserbjudanden under bokningsprocessen.`);
      }
      if (active('directBooking')) {
        parts.push(`Genom att driva fler direktbokningar minskar du beroendet av OTA:er och behåller ${val('directBooking')} mer per år.`);
      }
      return parts.join(' ');
    },

    paymentNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews Payments eliminerar manuell betalningshantering — ditt ekonomiteam spenderar mindre tid på administration och mer tid på strategiska beslut.');
      if (active('tokenization')) {
        parts.push('Säker tokenisering automatiserar transaktionsbearbetning och sparar ditt team timmar av repetitivt arbete.');
      }
      if (active('reconciliation')) {
        parts.push(`Automatisk avstämning ersätter manuell matchning och återvinner ${val('reconciliation')} i lönekostnader.`);
      }
      if (active('chargeback')) {
        parts.push(`Inbyggt bedrägeriskydd minskar återkrav avsevärt och sparar ${val('chargeback')} årligen.`);
      }
      if (active('noShow')) {
        parts.push(`Automatiska kort-på-fil-garantier fångar upp ${val('noShow')} i avgifter för uteblivna gäster som du annars skulle avskriva.`);
      }
      if (active('multiCurrency')) {
        parts.push('Stöd för flera valutor låter internationella gäster betala i sin egen valuta, tar bort friktion och frigör ytterligare intäkter.');
      }
      return parts.join(' ');
    },

    rmsNarrative: ({ active, val }) => {
      const parts: string[] = [];
      if (active('revenueUplift')) {
        parts.push(`Mews RMS ersätter gissningar med AI-driven dynamisk prissättning som reagerar på marknadsförhållanden i realtid — en dygnet-runt-motor för intäktsoptimering som levererar ${val('revenueUplift')} i ytterligare RevPAR.`);
      }
      if (active('rateAutomation')) {
        parts.push(`Automatiserad distribution över alla dina prisplaner och kanaler eliminerar timmar av manuella uppdateringar, sparar ${val('rateAutomation')} i lönekostnader och låter ditt team fokusera på strategi istället för kalkylblad.`);
      }
      return parts.join(' ');
    },

    rmsManagerNote: (hasManager) =>
      hasManager
        ? 'Din revenue manager får möjlighet att fokusera på strategi och marknadspositionering istället för kalkylblad.'
        : 'Du får intäktsoptimering på företagsnivå utan att behöva en dedikerad revenue manager — AI hanterar prissättning dygnet runt.',

    summaryNarrative: ({ moduleCount, costSavings, revenueUplift, totalTime }) =>
      `Över ${moduleCount} modul${moduleCount > 1 ? 'er' : ''} levererar Mews ${costSavings} i kostnadsbesparingar och ${revenueUplift} i nya intäkter — samtidigt som ${totalTime} personaltimmar per år frigörs.`,

    pdfGuestExperienceNarrative: ({ upsellRevenue, commissionSaved, formatCurrency }) => {
      let text = 'Mews förvandlar din reception från en flaskhals till en sömlös kontaktpunkt med gästen. Digital in- och utcheckning frigör ditt team att fokusera på gästfrihet istället för pappersarbete, medan automatisk rumstilldelning eliminerar en daglig tidskrävande uppgift.';
      if (upsellRevenue > 0) {
        text += ` Gästportalen skapar ${formatCurrency(upsellRevenue)} i nya intäkter genom personaliserade merförsäljningserbjudanden under bokningsprocessen.`;
      }
      if (commissionSaved > 0) {
        text += ` Genom att driva fler direktbokningar minskar du beroendet av OTA:er och behåller ${formatCurrency(commissionSaved)} mer per år.`;
      }
      return text;
    },

    pdfPaymentNarrative: ({ reconciliationCostSavings, chargebackReduction, chargebackRate, mewsChargebackRate, noShowRevenue, multiCurrencyRevenue, formatCurrency }) => {
      let text = 'Mews Payments eliminerar manuell betalningshantering — ditt ekonomiteam spenderar mindre tid på administration och mer tid på strategiska beslut. Säker tokenisering automatiserar transaktionsbearbetning och sparar ditt team timmar av repetitivt arbete.';
      if (reconciliationCostSavings > 0) {
        text += ` Automatisk avstämning ersätter daglig manuell matchning och återvinner ${formatCurrency(reconciliationCostSavings)} i lönekostnader.`;
      }
      if (chargebackReduction > 0) {
        text += ` Inbyggt bedrägeriskydd minskar din återkravsfrekvens från ${chargebackRate}% till ${mewsChargebackRate}% och sparar ${formatCurrency(chargebackReduction)} årligen.`;
      }
      if (noShowRevenue > 0) {
        text += ` Automatiska kort-på-fil-garantier fångar upp ${formatCurrency(noShowRevenue)} i avgifter för uteblivna gäster som du annars skulle avskriva.`;
      }
      if (multiCurrencyRevenue > 0) {
        text += ` Stöd för flera valutor låter internationella gäster betala i sin egen valuta, tar bort friktion och frigör ${formatCurrency(multiCurrencyRevenue)} i ytterligare intäkter.`;
      }
      return text;
    },

    pdfRmsNarrative: ({ annualRevenueGain, annualHoursSaved, annualLaborCostSavings, numberOfRooms, hasRevenueManager, hasExistingRMS, formatCurrency }) => {
      let text = `Mews RMS ersätter gissningar med AI-driven dynamisk prissättning som reagerar på marknadsförhållanden i realtid — en dygnet-runt-motor för intäktsoptimering som levererar ${formatCurrency(annualRevenueGain)} i ytterligare RevPAR över dina ${numberOfRooms} rum.`;
      if (annualHoursSaved > 0) {
        text += ` Automatiserad distribution över alla dina prisplaner och kanaler eliminerar timmar av manuella uppdateringar och sparar ${formatCurrency(annualLaborCostSavings)} i lönekostnader.`;
      }
      text += hasRevenueManager
        ? ' Din revenue manager får möjlighet att fokusera på strategi och marknadspositionering istället för kalkylblad.'
        : ' Du får intäktsoptimering på företagsnivå utan att behöva en dedikerad revenue manager — AI hanterar prissättning dygnet runt.';
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
  },

  slideFooter: 'Mews ROI-rapport',

  formulas: {
    checkIn: (p) => `${p.annualRes} bokningar/år x (${p.checkInSaved} incheckning + ${p.checkOutSaved} utcheckning sparad) / 60 = ${p.totalHours} tim/år`,
    roomAssignment: (p) => `${p.annualRes} bokningar/år x ${p.assignTime}/bokning / 60 = ${p.totalHours} tim/år`,
    upsell: (p) => `${p.annualRes} bokningar/år x ${p.cs}${p.adr} ADR x ${p.onlineCheckIn}% online-incheckning x ${p.uplift}% ökning = ${p.total}`,
    directBooking: (p) => `${p.annualRes} bokningar/år x ${p.directIncrease}% fler direkta x ${p.cs}${p.adr} ADR x ${p.commission}% provision = ${p.total}`,
    tokenization: (p) => `${p.annualRes} bokningar/år x ${p.seconds}s per transaktion / 3 600 = ${p.totalHours} tim/år`,
    chargeback: (p) => `(${p.currentRate}% - ${p.mewsRate}%) minskning x ${p.cs}${p.costPerMonth}/mån x 12 = ${p.total}`,
    reconciliation: (p) => `(${p.currentDaily} - ${p.mewsDaily}) tim/dag x 365 dagar = ${p.totalHours} tim/år`,
    noShow: (p) => `${p.cs}${p.monthlyRev}/mån x 12 x ${p.noShowRate}% uteblivna x ${p.uncollectedFees}% ej indrivna avgifter = ${p.total}`,
    multiCurrency: (p) => `${p.cs}${p.monthlyRev}/mån x 12 x ${p.foreignPercent}% utländska x ${p.adoption}% adoption x ${p.share}% andel = ${p.total}`,
    revenueUplift: (p) => `${p.cs}${p.revpar} RevPAR x ${p.upliftPercent}% ökning = ${p.cs}${p.revparUplift}/rum/natt x ${p.rooms} rum x 365 dagar = ${p.total}`,
    rateAutomation: (p) => `${p.updatesPerWeek} uppdateringar/vecka x 52 veckor x ${p.ratePlans} planer x ${p.channels} kanaler x ${p.updateTime} min / 60 = ${p.totalHours} tim/år`,
    hkRoomAssignment: (p) => `${p.staff} HK staff × (${p.manualTime}m − ${p.digitalTime}m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    cleaningStatusUpdates: (p) => `${p.updatesPerDay} updates/day × (0.5m − 0.05m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    maintenanceCommunication: (p) => `${p.repairsPerDay} repairs/day × (1.0m − 0.15m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    taskManagement: (p) => `${p.tasksPerDay} tasks/day × (0.5m − 0.15m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    amenitiesReduction: (p) => `${p.rooms} rooms × 365 × ${p.occupancy}% occ × ${p.amenityCost} × ${p.reductionPct}% = ${p.total}/yr`,
    paperElimination: (p) => `${p.roomNights} room-nights × €0.005/sheet = ${p.total}/yr`,
  },
};

export default sv;
