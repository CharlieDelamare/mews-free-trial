import type { TranslationDictionary } from '../types/translations';

const no: TranslationDictionary = {
  labels: {
    totalAnnualImpact: 'total årlig effekt',
    costSavings: 'kostnadsbesparelser',
    revenueUplift: 'inntektsøkning',
    hoursReclaimed: 'timer frigjort',
    annualImpact: 'årlig effekt',
    impactSummary: 'Oppsummering av effekt',
    hrs: 'timer',
    perYear: 'per år',
    annualRevenueGain: 'Årlig inntektsøkning',
    laborCostSavings: 'Besparelser på lønnskostnader',
    timeSaved: 'Tid spart',
    revpar: 'RevPAR',
    rooms: 'Rom',
    revenueUpliftPercent: 'Inntektsøkning',
    exportRoiReport: 'Eksporter ROI-rapport',
    chooseSections: 'Velg seksjoner som skal inkluderes i PDF-en',
    selectAtLeastOne: 'Velg minst én seksjon for eksport.',
    cancel: 'Avbryt',
    exportPdf: 'Eksporter PDF',
    generating: 'Genererer...',
  },

  modules: {
    guestExperience: 'Gjesteopplevelse',
    payment: 'Betaling og fakturering',
    rms: 'Inntektsstyring',
    housekeeping: 'Housekeeping',
  },

  levers: {
    checkIn: 'Effektiv innsjekking',
    roomAssignment: 'Romtildeling',
    upsell: 'Mersalg via portal',
    directBooking: 'Direktebooking',
    tokenization: 'Tokenisering',
    chargeback: 'Tilbakeføringsreduksjon',
    reconciliation: 'Avstemming',
    noShow: 'Beskyttelse mot uteblivelse',
    multiCurrency: 'Flervaluta',
    revenueUplift: 'Inntektsøkning',
    rateAutomation: 'Prisautomatisering',
    hkRoomAssignment: 'Room Assignment Automation',
    cleaningStatusUpdates: 'Cleaning Status Updates',
    maintenanceCommunication: 'Maintenance Communication',
    taskManagement: 'Task Management',
    amenitiesReduction: 'Amenities Reduction',
    paperElimination: 'Paper Elimination',
  },

  pdfLevers: {
    checkInAutomation: 'Automatisering av inn- og utsjekking',
    roomAssignment: 'Automatisk romtildeling',
    guestPortalUpselling: 'Mersalg via gjesteportal',
    directBookingCommission: 'Direktebooking og spart kommisjon',
    paymentTokenization: 'Betalingstokenisering',
    chargebackReduction: 'Reduksjon av tilbakeføringer',
    autoReconciliation: 'Automatisk avstemming',
    noShowFeeCapture: 'Innkreving av uteblivelsesgebyr',
    multiCurrencyRevenue: 'Flervalutainntekter',
    dynamicPricingUplift: 'Inntektsøkning fra dynamisk prising',
    rateUpdateAutomation: 'Automatisering av prisoppdateringer',
    hkRoomAssignmentAutomation: 'Room Assignment Automation',
    hkCleaningStatusUpdates: 'Cleaning Status Updates',
    hkMaintenanceCommunication: 'Maintenance Communication',
    hkTaskManagement: 'Task Management Efficiency',
    hkAmenitiesReduction: 'Amenities Cost Reduction',
    hkPaperElimination: 'Paper Elimination',
  },

  leverResultType: {
    timeReclaimed: 'tid frigjort',
    costSaving: 'besparelse',
    revenueUplift: 'inntekt',
  },

  subtexts: {
    costSavingsSubtext: 'Fra automatisert innsjekking, betalingshåndtering og avstemming',
    revenueUpliftSubtext: 'Fra dynamisk prising, mersalg til gjester, direktebookinger og uteblivelsesinnkreving',
    hoursReclaimedSubtext: 'Resepsjon, backoffice og inntektsstyring — tid tilbakeført til teamet ditt',
  },

  narratives: {
    titleSlideNarrative: ({ costSavings, revenueUplift, totalTime }) =>
      `Eiendommen din sparer ${costSavings} gjennom automatisering, oppnår ${revenueUplift} i ny inntekt og frigjør ${totalTime} arbeidstimer — hvert år.`,

    guestExperienceNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews forvandler resepsjonen fra en flaskehals til et sømløst kontaktpunkt for gjesten.');
      if (active('checkIn')) {
        parts.push('Digital inn- og utsjekking frigjør teamet ditt til å fokusere på gjestfrihet i stedet for papirarbeid.');
      }
      if (active('roomAssignment')) {
        parts.push('Automatisk romtildeling eliminerer en daglig tidkrevende oppgave for resepsjonspersonalet.');
      }
      if (active('upsell')) {
        parts.push(`Gjesteportalen genererer ${val('upsell')} i ny inntekt gjennom personlige mersalgstilbud under bookingprosessen.`);
      }
      if (active('directBooking')) {
        parts.push(`Ved å øke andelen direktebookinger reduserer du OTA-avhengigheten og beholder ${val('directBooking')} mer per år.`);
      }
      return parts.join(' ');
    },

    paymentNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews Payments eliminerer manuell betalingshåndtering — økonomiteamet bruker mindre tid på administrasjon og mer på strategiske beslutninger.');
      if (active('tokenization')) {
        parts.push('Sikker tokenisering automatiserer transaksjonshåndtering og sparer teamet ditt for timer med repetitivt arbeid.');
      }
      if (active('reconciliation')) {
        parts.push(`Automatisert avstemming erstatter manuell matching og frigjør ${val('reconciliation')} i lønnskostnader.`);
      }
      if (active('chargeback')) {
        parts.push(`Innebygd svindelforebygging reduserer tilbakeføringer betydelig og sparer ${val('chargeback')} årlig.`);
      }
      if (active('noShow')) {
        parts.push(`Automatisk kort-på-fil-garanti fanger opp ${val('noShow')} i uteblivelsesgebyrer du ellers ville avskrevet.`);
      }
      if (active('multiCurrency')) {
        parts.push('Flervalutastøtte lar internasjonale gjester betale i egen valuta, fjerner friksjon og frigjør inkrementelle inntekter.');
      }
      return parts.join(' ');
    },

    rmsNarrative: ({ active, val }) => {
      const parts: string[] = [];
      if (active('revenueUplift')) {
        parts.push(`Mews RMS erstatter gjetting med AI-drevet dynamisk prising som reagerer på markedsforhold i sanntid — en døgnkontinuerlig inntektsoptimaliseringsmotor som leverer ${val('revenueUplift')} i ytterligere RevPAR.`);
      }
      if (active('rateAutomation')) {
        parts.push(`Automatisert distribusjon på tvers av alle prisplaner og kanaler eliminerer timer med manuelle oppdateringer, sparer ${val('rateAutomation')} i lønnskostnader og lar teamet ditt fokusere på strategi i stedet for regneark.`);
      }
      return parts.join(' ');
    },

    rmsManagerNote: (hasManager) =>
      hasManager
        ? 'Revenue manageren din kan fokusere på strategi og markedsposisjonering i stedet for regneark.'
        : 'Du får inntektsoptimalisering på bedriftsnivå uten å trenge en dedikert revenue manager — AI håndterer prisingen døgnet rundt.',

    summaryNarrative: ({ moduleCount, costSavings, revenueUplift, totalTime }) =>
      `På tvers av ${moduleCount} modul${moduleCount > 1 ? 'er' : ''} leverer Mews ${costSavings} i kostnadsbesparelser og ${revenueUplift} i ny inntekt — samtidig som ${totalTime} arbeidstimer frigjøres per år.`,

    pdfGuestExperienceNarrative: ({ upsellRevenue, commissionSaved, formatCurrency }) => {
      let text = 'Mews forvandler resepsjonen fra en flaskehals til et sømløst kontaktpunkt for gjesten. Digital inn- og utsjekking frigjør teamet ditt til å fokusere på gjestfrihet i stedet for papirarbeid, mens automatisk romtildeling eliminerer en daglig tidkrevende oppgave.';
      if (upsellRevenue > 0) {
        text += ` Gjesteportalen genererer ${formatCurrency(upsellRevenue)} i ny inntekt gjennom personlige mersalgstilbud under bookingprosessen.`;
      }
      if (commissionSaved > 0) {
        text += ` Ved å øke andelen direktebookinger reduserer du OTA-avhengigheten og beholder ${formatCurrency(commissionSaved)} mer per år.`;
      }
      return text;
    },

    pdfPaymentNarrative: ({ reconciliationCostSavings, chargebackReduction, chargebackRate, mewsChargebackRate, noShowRevenue, multiCurrencyRevenue, formatCurrency }) => {
      let text = 'Mews Payments eliminerer manuell betalingshåndtering — økonomiteamet bruker mindre tid på administrasjon og mer på strategiske beslutninger. Sikker tokenisering automatiserer transaksjonshåndtering og sparer teamet ditt for timer med repetitivt arbeid.';
      if (reconciliationCostSavings > 0) {
        text += ` Automatisert avstemming erstatter daglig manuell matching og frigjør ${formatCurrency(reconciliationCostSavings)} i lønnskostnader.`;
      }
      if (chargebackReduction > 0) {
        text += ` Innebygd svindelforebygging reduserer tilbakeføringsraten fra ${chargebackRate}% til ${mewsChargebackRate}%, og sparer ${formatCurrency(chargebackReduction)} årlig.`;
      }
      if (noShowRevenue > 0) {
        text += ` Automatisk kort-på-fil-garanti fanger opp ${formatCurrency(noShowRevenue)} i uteblivelsesgebyrer du ellers ville avskrevet.`;
      }
      if (multiCurrencyRevenue > 0) {
        text += ` Flervalutastøtte lar internasjonale gjester betale i egen valuta, fjerner friksjon og frigjør ${formatCurrency(multiCurrencyRevenue)} i inkrementelle inntekter.`;
      }
      return text;
    },

    pdfRmsNarrative: ({ annualRevenueGain, annualHoursSaved, annualLaborCostSavings, numberOfRooms, hasRevenueManager, hasExistingRMS, formatCurrency }) => {
      let text = `Mews RMS erstatter gjetting med AI-drevet dynamisk prising som reagerer på markedsforhold i sanntid — en døgnkontinuerlig inntektsoptimaliseringsmotor som leverer ${formatCurrency(annualRevenueGain)} i ytterligere RevPAR på tvers av dine ${numberOfRooms} rom.`;
      if (annualHoursSaved > 0) {
        text += ` Automatisert distribusjon på tvers av alle prisplaner og kanaler eliminerer timer med manuelle oppdateringer, og sparer ${formatCurrency(annualLaborCostSavings)} i lønnskostnader.`;
      }
      text += hasRevenueManager
        ? ' Revenue manageren din kan fokusere på strategi og markedsposisjonering i stedet for regneark.'
        : ' Du får inntektsoptimalisering på bedriftsnivå uten å trenge en dedikert revenue manager — AI håndterer prisingen døgnet rundt.';
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
    checkIn: (p) => `${p.annualRes} reservasjoner/år x (${p.checkInSaved} innsjekking + ${p.checkOutSaved} utsjekking spart) / 60 = ${p.totalHours} timer/år`,
    roomAssignment: (p) => `${p.annualRes} reservasjoner/år x ${p.assignTime}/reservasjon / 60 = ${p.totalHours} timer/år`,
    upsell: (p) => `${p.annualRes} reservasjoner/år x ${p.cs}${p.adr} ADR x ${p.onlineCheckIn}% nettinnsjekking x ${p.uplift}% økning = ${p.total}`,
    directBooking: (p) => `${p.annualRes} reservasjoner/år x ${p.directIncrease}% mer direkte x ${p.cs}${p.adr} ADR x ${p.commission}% kommisjon = ${p.total}`,
    tokenization: (p) => `${p.annualRes} reservasjoner/år x ${p.seconds}s per transaksjon / 3 600 = ${p.totalHours} timer/år`,
    chargeback: (p) => `(${p.currentRate}% - ${p.mewsRate}%) reduksjon x ${p.cs}${p.costPerMonth}/mnd x 12 = ${p.total}`,
    reconciliation: (p) => `(${p.currentDaily} - ${p.mewsDaily}) timer/dag x 365 dager = ${p.totalHours} timer/år`,
    noShow: (p) => `${p.cs}${p.monthlyRev}/mnd x 12 x ${p.noShowRate}% uteblivelser x ${p.uncollectedFees}% uinnkrevde gebyrer = ${p.total}`,
    multiCurrency: (p) => `${p.cs}${p.monthlyRev}/mnd x 12 x ${p.foreignPercent}% utenlandske x ${p.adoption}% adopsjon x ${p.share}% andel = ${p.total}`,
    revenueUplift: (p) => `${p.cs}${p.revpar} RevPAR x ${p.upliftPercent}% økning = ${p.cs}${p.revparUplift}/rom/natt x ${p.rooms} rom x 365 dager = ${p.total}`,
    rateAutomation: (p) => `${p.updatesPerWeek} oppdateringer/uke x 52 uker x ${p.ratePlans} prisplaner x ${p.channels} kanaler x ${p.updateTime} min / 60 = ${p.totalHours} timer/år`,
    hkRoomAssignment: (p) => `${p.staff} HK staff × (${p.manualTime}m − ${p.digitalTime}m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    cleaningStatusUpdates: (p) => `${p.updatesPerDay} updates/day × (0.5m − 0.05m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    maintenanceCommunication: (p) => `${p.repairsPerDay} repairs/day × (1.0m − 0.15m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    taskManagement: (p) => `${p.tasksPerDay} tasks/day × (0.5m − 0.15m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    amenitiesReduction: (p) => `${p.rooms} rooms × 365 × ${p.occupancy}% occ × ${p.amenityCost} × ${p.reductionPct}% = ${p.total}/yr`,
    paperElimination: (p) => `${p.roomNights} room-nights × €0.005/sheet = ${p.total}/yr`,
  },
};

export default no;
