import type { TranslationDictionary } from '../types/translations';

const nl: TranslationDictionary = {
  labels: {
    totalAnnualImpact: 'totale jaarlijkse impact',
    costSavings: 'kostenbesparing',
    revenueUplift: 'omzetgroei',
    hoursReclaimed: 'teruggewonnen uren',
    annualImpact: 'jaarlijkse impact',
    impactSummary: 'Impactoverzicht',
    hrs: 'uur',
    perYear: 'per jaar',
    annualRevenueGain: 'Jaarlijkse omzetgroei',
    laborCostSavings: 'Besparing op arbeidskosten',
    timeSaved: 'Tijdsbesparing',
    revpar: 'RevPAR',
    rooms: 'Kamers',
    revenueUpliftPercent: 'Omzetgroei',
    exportRoiReport: 'ROI-rapport exporteren',
    chooseSections: 'Kies de secties die u in de PDF wilt opnemen',
    selectAtLeastOne: 'Selecteer minimaal één sectie om te exporteren.',
    cancel: 'Annuleren',
    exportPdf: 'PDF exporteren',
    generating: 'Genereren...',
  },

  modules: {
    guestExperience: 'Gastbeleving',
    payment: 'Betalingen en facturering',
    rms: 'Revenue Management',
    housekeeping: 'Housekeeping',
  },

  levers: {
    checkIn: 'Check-in efficiëntie',
    roomAssignment: 'Kamertoewijzing',
    upsell: 'Portaal-upselling',
    directBooking: 'Directe boekingen',
    tokenization: 'Tokenisatie',
    chargeback: 'Chargeback-reductie',
    reconciliation: 'Reconciliatie',
    noShow: 'No-show-bescherming',
    multiCurrency: 'Multivaluta',
    revenueUplift: 'Omzetgroei',
    rateAutomation: 'Tariefautomatisering',
    hkRoomAssignment: 'Room Assignment Automation',
    cleaningStatusUpdates: 'Cleaning Status Updates',
    maintenanceCommunication: 'Maintenance Communication',
    taskManagement: 'Task Management',
    amenitiesReduction: 'Amenities Reduction',
    paperElimination: 'Paper Elimination',
  },

  pdfLevers: {
    checkInAutomation: 'Automatisering van check-in en check-out',
    roomAssignment: 'Automatische kamertoewijzing',
    guestPortalUpselling: 'Upselling via het gastenportaal',
    directBookingCommission: 'Directe boekingen en bespaarde commissie',
    paymentTokenization: 'Betaaltokenisatie',
    chargebackReduction: 'Chargeback-reductie',
    autoReconciliation: 'Automatische reconciliatie',
    noShowFeeCapture: 'No-show-vergoeding incasseren',
    multiCurrencyRevenue: 'Multivaluta-omzet',
    dynamicPricingUplift: 'Omzetgroei door dynamische prijsstelling',
    rateUpdateAutomation: 'Automatisering van tariefupdates',
    hkRoomAssignmentAutomation: 'Room Assignment Automation',
    hkCleaningStatusUpdates: 'Cleaning Status Updates',
    hkMaintenanceCommunication: 'Maintenance Communication',
    hkTaskManagement: 'Task Management Efficiency',
    hkAmenitiesReduction: 'Amenities Cost Reduction',
    hkPaperElimination: 'Paper Elimination',
  },

  leverResultType: {
    timeReclaimed: 'teruggewonnen tijd',
    costSaving: 'besparing',
    revenueUplift: 'omzet',
  },

  subtexts: {
    costSavingsSubtext: 'Door geautomatiseerde check-in, betalingsverwerking en reconciliatie',
    revenueUpliftSubtext: 'Door dynamische prijsstelling, gastupselling, directe boekingen en no-show-herstel',
    hoursReclaimedSubtext: 'Receptie-, backoffice- en revenue-managementtijd teruggegeven aan uw team',
  },

  narratives: {
    titleSlideNarrative: ({ costSavings, revenueUplift, totalTime }) =>
      `Uw accommodatie bespaart ${costSavings} dankzij automatisering, genereert ${revenueUplift} aan nieuwe omzet en wint ${totalTime} personeelsuren terug — elk jaar.`,

    guestExperienceNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews transformeert uw receptie van een knelpunt in een naadloos contactpunt met de gast.');
      if (active('checkIn')) {
        parts.push('Digitale check-in en check-out geven uw team de ruimte om zich te richten op gastvrijheid in plaats van administratie.');
      }
      if (active('roomAssignment')) {
        parts.push('Automatische kamertoewijzing elimineert een dagelijkse tijdverspilling voor uw receptiepersoneel.');
      }
      if (active('upsell')) {
        parts.push(`Het gastenportaal genereert ${val('upsell')} aan nieuwe omzet door gepersonaliseerde upsellaanbiedingen tijdens het boekingsproces.`);
      }
      if (active('directBooking')) {
        parts.push(`Door meer directe boekingen te stimuleren, vermindert u de afhankelijkheid van OTA's en houdt u ${val('directBooking')} meer per jaar over.`);
      }
      return parts.join(' ');
    },

    paymentNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews Payments elimineert handmatige betalingsverwerking — uw financiële team besteedt minder tijd aan administratie en meer aan strategische beslissingen.');
      if (active('tokenization')) {
        parts.push('Veilige tokenisatie automatiseert de transactieverwerking en bespaart uw team uren aan repetitief werk.');
      }
      if (active('reconciliation')) {
        parts.push(`Geautomatiseerde reconciliatie vervangt handmatige afstemming en bespaart ${val('reconciliation')} aan arbeidskosten.`);
      }
      if (active('chargeback')) {
        parts.push(`Ingebouwde fraudepreventie vermindert chargebacks aanzienlijk, met een besparing van ${val('chargeback')} per jaar.`);
      }
      if (active('noShow')) {
        parts.push(`Automatische kaartgarantie incasseert ${val('noShow')} aan no-show-vergoedingen die u anders zou moeten afschrijven.`);
      }
      if (active('multiCurrency')) {
        parts.push('Multivaluta-ondersteuning laat internationale gasten betalen in hun eigen valuta, waardoor drempels verdwijnen en extra omzet wordt gegenereerd.');
      }
      return parts.join(' ');
    },

    rmsNarrative: ({ active, val }) => {
      const parts: string[] = [];
      if (active('revenueUplift')) {
        parts.push(`Mews RMS vervangt giswerk door AI-gestuurde dynamische prijsstelling die in real time reageert op marktomstandigheden — een 24/7 omzetoptimalisatie-engine die ${val('revenueUplift')} aan extra RevPAR oplevert.`);
      }
      if (active('rateAutomation')) {
        parts.push(`Geautomatiseerde distributie over al uw tariefplannen en kanalen elimineert uren aan handmatige updates, bespaart ${val('rateAutomation')} aan arbeidskosten en geeft uw team de ruimte om zich te richten op strategie in plaats van spreadsheets.`);
      }
      return parts.join(' ');
    },

    rmsManagerNote: (hasManager) =>
      hasManager
        ? 'Uw revenue manager kan zich richten op strategie en marktpositionering in plaats van spreadsheets.'
        : 'U krijgt omzetoptimalisatie op enterprise-niveau zonder een dedicated revenue manager — AI beheert de prijsstelling dag en nacht.',

    summaryNarrative: ({ moduleCount, costSavings, revenueUplift, totalTime }) =>
      `Over ${moduleCount} module${moduleCount > 1 ? 's' : ''} levert Mews ${costSavings} aan kostenbesparingen en ${revenueUplift} aan nieuwe omzet — terwijl ${totalTime} personeelsuren per jaar worden vrijgemaakt.`,

    pdfGuestExperienceNarrative: ({ upsellRevenue, commissionSaved, formatCurrency }) => {
      let text = 'Mews transformeert uw receptie van een knelpunt in een naadloos contactpunt met de gast. Digitale check-in en check-out geven uw team de ruimte om zich te richten op gastvrijheid in plaats van administratie, terwijl automatische kamertoewijzing een dagelijkse tijdverspilling elimineert.';
      if (upsellRevenue > 0) {
        text += ` Het gastenportaal genereert ${formatCurrency(upsellRevenue)} aan nieuwe omzet door gepersonaliseerde upsellaanbiedingen tijdens het boekingsproces.`;
      }
      if (commissionSaved > 0) {
        text += ` Door meer directe boekingen te stimuleren, vermindert u de afhankelijkheid van OTA's en houdt u ${formatCurrency(commissionSaved)} meer per jaar over.`;
      }
      return text;
    },

    pdfPaymentNarrative: ({ reconciliationCostSavings, chargebackReduction, chargebackRate, mewsChargebackRate, noShowRevenue, multiCurrencyRevenue, formatCurrency }) => {
      let text = 'Mews Payments elimineert handmatige betalingsverwerking — uw financiële team besteedt minder tijd aan administratie en meer aan strategische beslissingen. Veilige tokenisatie automatiseert de transactieverwerking en bespaart uw team uren aan repetitief werk.';
      if (reconciliationCostSavings > 0) {
        text += ` Geautomatiseerde reconciliatie vervangt dagelijkse handmatige afstemming en bespaart ${formatCurrency(reconciliationCostSavings)} aan arbeidskosten.`;
      }
      if (chargebackReduction > 0) {
        text += ` Ingebouwde fraudepreventie verlaagt uw chargebackpercentage van ${chargebackRate}% naar ${mewsChargebackRate}%, met een besparing van ${formatCurrency(chargebackReduction)} per jaar.`;
      }
      if (noShowRevenue > 0) {
        text += ` Automatische kaartgarantie incasseert ${formatCurrency(noShowRevenue)} aan no-show-vergoedingen die u anders zou moeten afschrijven.`;
      }
      if (multiCurrencyRevenue > 0) {
        text += ` Multivaluta-ondersteuning laat internationale gasten betalen in hun eigen valuta, waardoor drempels verdwijnen en ${formatCurrency(multiCurrencyRevenue)} aan extra omzet wordt gegenereerd.`;
      }
      return text;
    },

    pdfRmsNarrative: ({ annualRevenueGain, annualHoursSaved, annualLaborCostSavings, numberOfRooms, hasRevenueManager, hasExistingRMS, formatCurrency }) => {
      let text = `Mews RMS vervangt giswerk door AI-gestuurde dynamische prijsstelling die in real time reageert op marktomstandigheden — een 24/7 omzetoptimalisatie-engine die ${formatCurrency(annualRevenueGain)} aan extra RevPAR oplevert over uw ${numberOfRooms} kamers.`;
      if (annualHoursSaved > 0) {
        text += ` Geautomatiseerde distributie over al uw tariefplannen en kanalen elimineert uren aan handmatige updates, met een besparing van ${formatCurrency(annualLaborCostSavings)} aan arbeidskosten.`;
      }
      text += hasRevenueManager
        ? ' Uw revenue manager kan zich richten op strategie en marktpositionering in plaats van spreadsheets.'
        : ' U krijgt omzetoptimalisatie op enterprise-niveau zonder een dedicated revenue manager — AI beheert de prijsstelling dag en nacht.';
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
    checkIn: (p) => `${p.annualRes} boekingen/jaar x (${p.checkInSaved} check-in + ${p.checkOutSaved} check-out bespaard) / 60 = ${p.totalHours} uur/jaar`,
    roomAssignment: (p) => `${p.annualRes} boekingen/jaar x ${p.assignTime}/boeking / 60 = ${p.totalHours} uur/jaar`,
    upsell: (p) => `${p.annualRes} boekingen/jaar x ${p.cs}${p.adr} ADR x ${p.onlineCheckIn}% online check-in x ${p.uplift}% toename = ${p.total}`,
    directBooking: (p) => `${p.annualRes} boekingen/jaar x ${p.directIncrease}% meer direct x ${p.cs}${p.adr} ADR x ${p.commission}% commissie = ${p.total}`,
    tokenization: (p) => `${p.annualRes} boekingen/jaar x ${p.seconds}s per transactie / 3.600 = ${p.totalHours} uur/jaar`,
    chargeback: (p) => `(${p.currentRate}% - ${p.mewsRate}%) reductie x ${p.cs}${p.costPerMonth}/maand x 12 = ${p.total}`,
    reconciliation: (p) => `(${p.currentDaily} - ${p.mewsDaily}) uur/dag x 365 dagen = ${p.totalHours} uur/jaar`,
    noShow: (p) => `${p.cs}${p.monthlyRev}/maand x 12 x ${p.noShowRate}% no-shows x ${p.uncollectedFees}% niet-geïnde kosten = ${p.total}`,
    multiCurrency: (p) => `${p.cs}${p.monthlyRev}/maand x 12 x ${p.foreignPercent}% buitenlands x ${p.adoption}% adoptie x ${p.share}% aandeel = ${p.total}`,
    revenueUplift: (p) => `${p.cs}${p.revpar} RevPAR x ${p.upliftPercent}% toename = ${p.cs}${p.revparUplift}/kamer/nacht x ${p.rooms} kamers x 365 dagen = ${p.total}`,
    rateAutomation: (p) => `${p.updatesPerWeek} updates/week x 52 weken x ${p.ratePlans} tariefplannen x ${p.channels} kanalen x ${p.updateTime} min / 60 = ${p.totalHours} uur/jaar`,
    hkRoomAssignment: (p) => `${p.staff} HK staff × (${p.manualTime}m − ${p.digitalTime}m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    cleaningStatusUpdates: (p) => `${p.updatesPerDay} updates/day × (0.5m − 0.05m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    maintenanceCommunication: (p) => `${p.repairsPerDay} repairs/day × (1.0m − 0.15m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    taskManagement: (p) => `${p.tasksPerDay} tasks/day × (0.5m − 0.15m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    amenitiesReduction: (p) => `${p.rooms} rooms × 365 × ${p.occupancy}% occ × ${p.amenityCost} × ${p.reductionPct}% = ${p.total}/yr`,
    paperElimination: (p) => `${p.roomNights} room-nights × €0.005/sheet = ${p.total}/yr`,
  },
};

export default nl;
