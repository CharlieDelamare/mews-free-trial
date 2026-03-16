import type { TranslationDictionary } from '../types/translations';

const da: TranslationDictionary = {
  labels: {
    totalAnnualImpact: 'samlet årlig effekt',
    costSavings: 'omkostningsbesparelser',
    revenueUplift: 'omsætningsvækst',
    hoursReclaimed: 'genvundne timer',
    annualImpact: 'årlig effekt',
    impactSummary: 'Effektoversigt',
    hrs: 'timer',
    perYear: 'pr. år',
    annualRevenueGain: 'Årlig omsætningsvækst',
    laborCostSavings: 'Besparelse på lønomkostninger',
    timeSaved: 'Sparet tid',
    revpar: 'RevPAR',
    rooms: 'Værelser',
    revenueUpliftPercent: 'Omsætningsvækst',
    exportRoiReport: 'Eksporter ROI-rapport',
    chooseSections: 'Vælg sektioner, der skal inkluderes i din PDF',
    selectAtLeastOne: 'Vælg mindst én sektion til eksport.',
    cancel: 'Annuller',
    exportPdf: 'Eksporter PDF',
    generating: 'Genererer...',
  },

  modules: {
    guestExperience: 'Gæsteoplevelse',
    payment: 'Betaling og fakturering',
    rms: 'Revenue management',
  },

  levers: {
    checkIn: 'Check-in-effektivitet',
    roomAssignment: 'Værelsestildeling',
    upsell: 'Portal-mersalg',
    directBooking: 'Direkte booking',
    tokenization: 'Tokenisering',
    chargeback: 'Reduktion af tilbageførsler',
    reconciliation: 'Afstemning',
    noShow: 'Beskyttelse mod udeblivelse',
    multiCurrency: 'Flere valutaer',
    revenueUplift: 'Omsætningsvækst',
    rateAutomation: 'Prisautomatisering',
  },

  pdfLevers: {
    checkInAutomation: 'Automatisering af check-in og check-ud',
    roomAssignment: 'Automatisk værelsestildeling',
    guestPortalUpselling: 'Mersalg via gæsteportal',
    directBookingCommission: 'Direkte bookinger og sparede provisioner',
    paymentTokenization: 'Betalingstokenisering',
    chargebackReduction: 'Reduktion af tilbageførsler',
    autoReconciliation: 'Automatisk afstemning',
    noShowFeeCapture: 'Opkrævning af udeblivelsesgebyrer',
    multiCurrencyRevenue: 'Omsætning fra flere valutaer',
    dynamicPricingUplift: 'Omsætningsvækst fra dynamisk prissætning',
    rateUpdateAutomation: 'Automatisering af prisopdateringer',
  },

  leverResultType: {
    timeReclaimed: 'genvundet tid',
    costSaving: 'besparelse',
    revenueUplift: 'omsætning',
  },

  subtexts: {
    costSavingsSubtext: 'Fra automatiseret check-in, betalingsbehandling og afstemning',
    revenueUpliftSubtext: 'Fra dynamisk prissætning, mersalg til gæster, direkte bookinger og inddrivelse af udeblivelser',
    hoursReclaimedSubtext: 'Tid fra reception, backoffice og revenue management givet tilbage til dit team',
  },

  narratives: {
    titleSlideNarrative: ({ costSavings, revenueUplift, totalTime }) =>
      `Dit hotel sparer ${costSavings} gennem automatisering, opnår ${revenueUplift} i ny omsætning og frigør ${totalTime} medarbejdertimer — hvert år.`,

    guestExperienceNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews forvandler din reception fra en flaskehals til et problemfrit kontaktpunkt med gæsten.');
      if (active('checkIn')) {
        parts.push('Digitalt check-in og check-ud frigør dit team til at fokusere på gæstfrihed i stedet for papirarbejde.');
      }
      if (active('roomAssignment')) {
        parts.push('Automatisk værelsestildeling eliminerer en daglig tidskrævende opgave for din reception.');
      }
      if (active('upsell')) {
        parts.push(`Gæsteportalen skaber ${val('upsell')} i ny omsætning gennem personaliserede mersalgstilbud under bookingforløbet.`);
      }
      if (active('directBooking')) {
        parts.push(`Ved at drive flere direkte bookinger reducerer du afhængigheden af OTA'er og beholder ${val('directBooking')} mere pr. år.`);
      }
      return parts.join(' ');
    },

    paymentNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews Payments eliminerer manuel betalingshåndtering — dit økonomiteam bruger mindre tid på administration og mere tid på strategiske beslutninger.');
      if (active('tokenization')) {
        parts.push('Sikker tokenisering automatiserer transaktionsbehandling og sparer dit team for timer med gentaget arbejde.');
      }
      if (active('reconciliation')) {
        parts.push(`Automatisk afstemning erstatter manuel matchning og genindvinder ${val('reconciliation')} i lønomkostninger.`);
      }
      if (active('chargeback')) {
        parts.push(`Indbygget svindelforebyggelse reducerer tilbageførsler markant og sparer ${val('chargeback')} årligt.`);
      }
      if (active('noShow')) {
        parts.push(`Automatiske kort-på-fil-garantier opfanger ${val('noShow')} i udeblivelsesgebyrer, du ellers ville afskrive.`);
      }
      if (active('multiCurrency')) {
        parts.push('Understøttelse af flere valutaer lader internationale gæster betale i deres egen valuta, fjerner friktion og frigør yderligere omsætning.');
      }
      return parts.join(' ');
    },

    rmsNarrative: ({ active, val }) => {
      const parts: string[] = [];
      if (active('revenueUplift')) {
        parts.push(`Mews RMS erstatter gætterier med AI-drevet dynamisk prissætning, der reagerer på markedsforhold i realtid — en døgnåben omsætningsoptimeringmotor, der leverer ${val('revenueUplift')} i yderligere RevPAR.`);
      }
      if (active('rateAutomation')) {
        parts.push(`Automatiseret distribution på tværs af alle dine prisplaner og kanaler eliminerer timer med manuelle opdateringer, sparer ${val('rateAutomation')} i lønomkostninger og lader dit team fokusere på strategi i stedet for regneark.`);
      }
      return parts.join(' ');
    },

    rmsManagerNote: (hasManager) =>
      hasManager
        ? 'Din revenue manager kan fokusere på strategi og markedspositionering i stedet for regneark.'
        : 'Du opnår omsætningsoptimering på virksomhedsniveau uden behov for en dedikeret revenue manager — AI håndterer prissætning døgnet rundt.',

    summaryNarrative: ({ moduleCount, costSavings, revenueUplift, totalTime }) =>
      `På tværs af ${moduleCount} modul${moduleCount > 1 ? 'er' : ''} leverer Mews ${costSavings} i omkostningsbesparelser og ${revenueUplift} i ny omsætning — samtidig med at ${totalTime} medarbejdertimer frigøres pr. år.`,

    pdfGuestExperienceNarrative: ({ upsellRevenue, commissionSaved, formatCurrency }) => {
      let text = 'Mews forvandler din reception fra en flaskehals til et problemfrit kontaktpunkt med gæsten. Digitalt check-in og check-ud frigør dit team til at fokusere på gæstfrihed i stedet for papirarbejde, mens automatisk værelsestildeling eliminerer en daglig tidskrævende opgave.';
      if (upsellRevenue > 0) {
        text += ` Gæsteportalen skaber ${formatCurrency(upsellRevenue)} i ny omsætning gennem personaliserede mersalgstilbud under bookingforløbet.`;
      }
      if (commissionSaved > 0) {
        text += ` Ved at drive flere direkte bookinger reducerer du afhængigheden af OTA'er og beholder ${formatCurrency(commissionSaved)} mere pr. år.`;
      }
      return text;
    },

    pdfPaymentNarrative: ({ reconciliationCostSavings, chargebackReduction, chargebackRate, mewsChargebackRate, noShowRevenue, multiCurrencyRevenue, formatCurrency }) => {
      let text = 'Mews Payments eliminerer manuel betalingshåndtering — dit økonomiteam bruger mindre tid på administration og mere tid på strategiske beslutninger. Sikker tokenisering automatiserer transaktionsbehandling og sparer dit team for timer med gentaget arbejde.';
      if (reconciliationCostSavings > 0) {
        text += ` Automatisk afstemning erstatter daglig manuel matchning og genindvinder ${formatCurrency(reconciliationCostSavings)} i lønomkostninger.`;
      }
      if (chargebackReduction > 0) {
        text += ` Indbygget svindelforebyggelse reducerer din tilbageførselsrate fra ${chargebackRate}% til ${mewsChargebackRate}% og sparer ${formatCurrency(chargebackReduction)} årligt.`;
      }
      if (noShowRevenue > 0) {
        text += ` Automatiske kort-på-fil-garantier opfanger ${formatCurrency(noShowRevenue)} i udeblivelsesgebyrer, du ellers ville afskrive.`;
      }
      if (multiCurrencyRevenue > 0) {
        text += ` Understøttelse af flere valutaer lader internationale gæster betale i deres egen valuta, fjerner friktion og frigør ${formatCurrency(multiCurrencyRevenue)} i yderligere omsætning.`;
      }
      return text;
    },

    pdfRmsNarrative: ({ annualRevenueGain, annualHoursSaved, annualLaborCostSavings, numberOfRooms, hasRevenueManager, hasExistingRMS, formatCurrency }) => {
      let text = `Mews RMS erstatter gætterier med AI-drevet dynamisk prissætning, der reagerer på markedsforhold i realtid — en døgnåben omsætningsoptimeringmotor, der leverer ${formatCurrency(annualRevenueGain)} i yderligere RevPAR på tværs af dine ${numberOfRooms} værelser.`;
      if (annualHoursSaved > 0) {
        text += ` Automatiseret distribution på tværs af alle dine prisplaner og kanaler eliminerer timer med manuelle opdateringer og sparer ${formatCurrency(annualLaborCostSavings)} i lønomkostninger.`;
      }
      text += hasRevenueManager
        ? ' Din revenue manager kan fokusere på strategi og markedspositionering i stedet for regneark.'
        : ' Du opnår omsætningsoptimering på virksomhedsniveau uden behov for en dedikeret revenue manager — AI håndterer prissætning døgnet rundt.';
      return text;
    },
  },

  slideFooter: 'Mews ROI-rapport',

  formulas: {
    checkIn: (p) => `${p.annualRes} reservationer/år x (${p.checkInSaved} check-in + ${p.checkOutSaved} check-ud sparet) / 60 = ${p.totalHours} timer/år`,
    roomAssignment: (p) => `${p.annualRes} reservationer/år x ${p.assignTime}/reservation / 60 = ${p.totalHours} timer/år`,
    upsell: (p) => `${p.annualRes} reservationer/år x ${p.cs}${p.adr} ADR x ${p.onlineCheckIn}% online check-in x ${p.uplift}% mersalg = ${p.total}`,
    directBooking: (p) => `${p.annualRes} reservationer/år x ${p.directIncrease}% flere direkte x ${p.cs}${p.adr} ADR x ${p.commission}% provision = ${p.total}`,
    tokenization: (p) => `${p.annualRes} reservationer/år x ${p.seconds}s pr. transaktion / 3.600 = ${p.totalHours} timer/år`,
    chargeback: (p) => `(${p.currentRate}% - ${p.mewsRate}%) reduktion x ${p.cs}${p.costPerMonth}/md x 12 = ${p.total}`,
    reconciliation: (p) => `(${p.currentDaily} - ${p.mewsDaily}) timer/dag x 365 dage = ${p.totalHours} timer/år`,
    noShow: (p) => `${p.cs}${p.monthlyRev}/md x 12 x ${p.noShowRate}% udeblivelser x ${p.uncollectedFees}% uopkrævede gebyrer = ${p.total}`,
    multiCurrency: (p) => `${p.cs}${p.monthlyRev}/md x 12 x ${p.foreignPercent}% udenlandske x ${p.adoption}% adoption x ${p.share}% andel = ${p.total}`,
    revenueUplift: (p) => `${p.cs}${p.revpar} RevPAR x ${p.upliftPercent}% vækst = ${p.cs}${p.revparUplift}/værelse/nat x ${p.rooms} værelser x 365 dage = ${p.total}`,
    rateAutomation: (p) => `${p.updatesPerWeek} opdateringer/uge x 52 uger x ${p.ratePlans} planer x ${p.channels} kanaler x ${p.updateTime} min / 60 = ${p.totalHours} timer/år`,
  },
};

export default da;
