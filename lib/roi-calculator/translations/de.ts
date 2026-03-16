import type { TranslationDictionary } from '../types/translations';

const de: TranslationDictionary = {
  labels: {
    totalAnnualImpact: 'jährliche Gesamtwirkung',
    costSavings: 'Kosteneinsparungen',
    revenueUplift: 'Umsatzsteigerung',
    hoursReclaimed: 'eingesparte Stunden',
    annualImpact: 'jährliche Wirkung',
    impactSummary: 'Zusammenfassung der Wirkung',
    hrs: 'Std.',
    perYear: 'pro Jahr',
    annualRevenueGain: 'Jährlicher Umsatzgewinn',
    laborCostSavings: 'Einsparungen bei Personalkosten',
    timeSaved: 'Eingesparte Zeit',
    revpar: 'RevPAR',
    rooms: 'Zimmer',
    revenueUpliftPercent: 'Umsatzsteigerung',
    exportRoiReport: 'ROI-Bericht exportieren',
    chooseSections: 'Wählen Sie die Abschnitte für Ihr PDF aus',
    selectAtLeastOne: 'Wählen Sie mindestens einen Abschnitt zum Exportieren.',
    cancel: 'Abbrechen',
    exportPdf: 'PDF exportieren',
    generating: 'Wird erstellt...',
  },

  modules: {
    guestExperience: 'Gästeerlebnis',
    payment: 'Zahlung und Abrechnung',
    rms: 'Revenue Management',
  },

  levers: {
    checkIn: 'Check-in-Effizienz',
    roomAssignment: 'Zimmerzuweisung',
    upsell: 'Portal-Upselling',
    directBooking: 'Direktbuchung',
    tokenization: 'Tokenisierung',
    chargeback: 'Rückbuchungsreduktion',
    reconciliation: 'Abstimmung',
    noShow: 'No-Show-Schutz',
    multiCurrency: 'Mehrwährung',
    revenueUplift: 'Umsatzsteigerung',
    rateAutomation: 'Tarifautomatisierung',
  },

  pdfLevers: {
    checkInAutomation: 'Check-in- und Check-out-Automatisierung',
    roomAssignment: 'Automatische Zimmerzuweisung',
    guestPortalUpselling: 'Upselling über das Gästeportal',
    directBookingCommission: 'Direktbuchung und eingesparte Provisionen',
    paymentTokenization: 'Zahlungstokenisierung',
    chargebackReduction: 'Rückbuchungsreduktion',
    autoReconciliation: 'Automatische Abstimmung',
    noShowFeeCapture: 'Erfassung von No-Show-Gebühren',
    multiCurrencyRevenue: 'Mehrwährungsumsätze',
    dynamicPricingUplift: 'Umsatzsteigerung durch dynamische Preisgestaltung',
    rateUpdateAutomation: 'Automatisierung der Tarifaktualisierung',
  },

  leverResultType: {
    timeReclaimed: 'eingesparte Zeit',
    costSaving: 'Einsparung',
    revenueUplift: 'Umsatz',
  },

  subtexts: {
    costSavingsSubtext: 'Durch automatisierten Check-in, Zahlungsabwicklung und Abstimmung',
    revenueUpliftSubtext: 'Durch dynamische Preisgestaltung, Gäste-Upselling, Direktbuchungen und No-Show-Rückgewinnung',
    hoursReclaimedSubtext: 'Eingesparte Zeit an Rezeption, Back-Office und Revenue Management für Ihr Team',
  },

  narratives: {
    titleSlideNarrative: ({ costSavings, revenueUplift, totalTime }) =>
      `Ihr Haus spart ${costSavings} durch Automatisierung, erzielt ${revenueUplift} an neuen Einnahmen und gewinnt ${totalTime} Arbeitsstunden zurück — jedes Jahr.`,

    guestExperienceNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews verwandelt Ihre Rezeption von einem Engpass in einen nahtlosen Kontaktpunkt für Ihre Gäste.');
      if (active('checkIn')) {
        parts.push('Digitaler Check-in und Check-out geben Ihrem Team die Freiheit, sich auf Gastfreundschaft statt auf Papierkram zu konzentrieren.');
      }
      if (active('roomAssignment')) {
        parts.push('Die automatische Zimmerzuweisung beseitigt eine tägliche zeitraubende Aufgabe für Ihr Rezeptionsteam.');
      }
      if (active('upsell')) {
        parts.push(`Das Gästeportal generiert ${val('upsell')} an neuen Einnahmen durch personalisierte Upselling-Angebote während des Buchungsprozesses.`);
      }
      if (active('directBooking')) {
        parts.push(`Durch die Förderung von Direktbuchungen reduzieren Sie die Abhängigkeit von OTAs und behalten ${val('directBooking')} mehr pro Jahr.`);
      }
      return parts.join(' ');
    },

    paymentNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews Payments beseitigt die manuelle Zahlungsabwicklung — Ihr Finanzteam verbringt weniger Zeit mit Verwaltung und mehr mit strategischen Entscheidungen.');
      if (active('tokenization')) {
        parts.push('Sichere Tokenisierung automatisiert die Transaktionsverarbeitung und spart Ihrem Team Stunden repetitiver Arbeit.');
      }
      if (active('reconciliation')) {
        parts.push(`Automatisierte Abstimmung ersetzt den manuellen Abgleich und spart ${val('reconciliation')} an Personalkosten.`);
      }
      if (active('chargeback')) {
        parts.push(`Integrierte Betrugsprävention reduziert Rückbuchungen deutlich und spart ${val('chargeback')} jährlich.`);
      }
      if (active('noShow')) {
        parts.push(`Automatische Kreditkartengarantien erfassen ${val('noShow')} an No-Show-Gebühren, die Sie sonst abschreiben würden.`);
      }
      if (active('multiCurrency')) {
        parts.push('Mehrwährungsunterstützung ermöglicht internationalen Gästen die Zahlung in ihrer eigenen Währung, beseitigt Reibungspunkte und erschließt zusätzliche Einnahmen.');
      }
      return parts.join(' ');
    },

    rmsNarrative: ({ active, val }) => {
      const parts: string[] = [];
      if (active('revenueUplift')) {
        parts.push(`Mews RMS ersetzt Bauchgefühl durch KI-gesteuerte dynamische Preisgestaltung, die in Echtzeit auf Marktbedingungen reagiert — eine Umsatzoptimierung rund um die Uhr, die ${val('revenueUplift')} an zusätzlichem RevPAR liefert.`);
      }
      if (active('rateAutomation')) {
        parts.push(`Die automatisierte Verteilung über alle Ihre Tarifpläne und Kanäle beseitigt Stunden manueller Aktualisierungen, spart ${val('rateAutomation')} an Personalkosten und ermöglicht Ihrem Team, sich auf Strategie statt auf Tabellen zu konzentrieren.`);
      }
      return parts.join(' ');
    },

    rmsManagerNote: (hasManager) =>
      hasManager
        ? 'Ihr Revenue Manager kann sich auf Strategie und Marktpositionierung konzentrieren, anstatt Tabellen zu pflegen.'
        : 'Sie erhalten Umsatzoptimierung auf Unternehmensniveau, ohne einen dedizierten Revenue Manager zu benötigen — die KI steuert die Preisgestaltung rund um die Uhr.',

    summaryNarrative: ({ moduleCount, costSavings, revenueUplift, totalTime }) =>
      `Über ${moduleCount} Modul${moduleCount > 1 ? 'e' : ''} hinweg liefert Mews ${costSavings} an Kosteneinsparungen und ${revenueUplift} an neuen Einnahmen — und gewinnt dabei ${totalTime} Arbeitsstunden pro Jahr zurück.`,

    pdfGuestExperienceNarrative: ({ upsellRevenue, commissionSaved, formatCurrency }) => {
      let text = 'Mews verwandelt Ihre Rezeption von einem Engpass in einen nahtlosen Kontaktpunkt für Ihre Gäste. Digitaler Check-in und Check-out geben Ihrem Team die Freiheit, sich auf Gastfreundschaft statt auf Papierkram zu konzentrieren, während die automatische Zimmerzuweisung eine tägliche zeitraubende Aufgabe beseitigt.';
      if (upsellRevenue > 0) {
        text += ` Das Gästeportal generiert ${formatCurrency(upsellRevenue)} an neuen Einnahmen durch personalisierte Upselling-Angebote während des Buchungsprozesses.`;
      }
      if (commissionSaved > 0) {
        text += ` Durch die Förderung von Direktbuchungen reduzieren Sie die Abhängigkeit von OTAs und behalten ${formatCurrency(commissionSaved)} mehr pro Jahr.`;
      }
      return text;
    },

    pdfPaymentNarrative: ({ reconciliationCostSavings, chargebackReduction, chargebackRate, mewsChargebackRate, noShowRevenue, multiCurrencyRevenue, formatCurrency }) => {
      let text = 'Mews Payments beseitigt die manuelle Zahlungsabwicklung — Ihr Finanzteam verbringt weniger Zeit mit Verwaltung und mehr mit strategischen Entscheidungen. Sichere Tokenisierung automatisiert die Transaktionsverarbeitung und spart Ihrem Team Stunden repetitiver Arbeit.';
      if (reconciliationCostSavings > 0) {
        text += ` Automatisierte Abstimmung ersetzt den täglichen manuellen Abgleich und spart ${formatCurrency(reconciliationCostSavings)} an Personalkosten.`;
      }
      if (chargebackReduction > 0) {
        text += ` Integrierte Betrugsprävention senkt Ihre Rückbuchungsrate von ${chargebackRate}% auf ${mewsChargebackRate}% und spart ${formatCurrency(chargebackReduction)} jährlich.`;
      }
      if (noShowRevenue > 0) {
        text += ` Automatische Kreditkartengarantien erfassen ${formatCurrency(noShowRevenue)} an No-Show-Gebühren, die Sie sonst abschreiben würden.`;
      }
      if (multiCurrencyRevenue > 0) {
        text += ` Mehrwährungsunterstützung ermöglicht internationalen Gästen die Zahlung in ihrer eigenen Währung, beseitigt Reibungspunkte und erschließt ${formatCurrency(multiCurrencyRevenue)} an zusätzlichen Einnahmen.`;
      }
      return text;
    },

    pdfRmsNarrative: ({ annualRevenueGain, annualHoursSaved, annualLaborCostSavings, numberOfRooms, hasRevenueManager, hasExistingRMS, formatCurrency }) => {
      let text = `Mews RMS ersetzt Bauchgefühl durch KI-gesteuerte dynamische Preisgestaltung, die in Echtzeit auf Marktbedingungen reagiert — eine Umsatzoptimierung rund um die Uhr, die ${formatCurrency(annualRevenueGain)} an zusätzlichem RevPAR über Ihre ${numberOfRooms} Zimmer liefert.`;
      if (annualHoursSaved > 0) {
        text += ` Die automatisierte Verteilung über alle Ihre Tarifpläne und Kanäle beseitigt Stunden manueller Aktualisierungen und spart ${formatCurrency(annualLaborCostSavings)} an Personalkosten.`;
      }
      text += hasRevenueManager
        ? ' Ihr Revenue Manager kann sich auf Strategie und Marktpositionierung konzentrieren, anstatt Tabellen zu pflegen.'
        : ' Sie erhalten Umsatzoptimierung auf Unternehmensniveau, ohne einen dedizierten Revenue Manager zu benötigen — die KI steuert die Preisgestaltung rund um die Uhr.';
      return text;
    },
  },

  slideFooter: 'Mews ROI-Bericht',

  formulas: {
    checkIn: (p) => `${p.annualRes} Reservierungen/Jahr x (${p.checkInSaved} Check-in + ${p.checkOutSaved} Check-out eingespart) / 60 = ${p.totalHours} Std./Jahr`,
    roomAssignment: (p) => `${p.annualRes} Reservierungen/Jahr x ${p.assignTime}/Reservierung / 60 = ${p.totalHours} Std./Jahr`,
    upsell: (p) => `${p.annualRes} Reservierungen/Jahr x ${p.cs}${p.adr} ADR x ${p.onlineCheckIn}% Online-Check-in x ${p.uplift}% Steigerung = ${p.total}`,
    directBooking: (p) => `${p.annualRes} Reservierungen/Jahr x ${p.directIncrease}% mehr Direktbuchungen x ${p.cs}${p.adr} ADR x ${p.commission}% Provision = ${p.total}`,
    tokenization: (p) => `${p.annualRes} Reservierungen/Jahr x ${p.seconds}s pro Transaktion / 3.600 = ${p.totalHours} Std./Jahr`,
    chargeback: (p) => `(${p.currentRate}% - ${p.mewsRate}%) Reduktion x ${p.cs}${p.costPerMonth}/Monat x 12 = ${p.total}`,
    reconciliation: (p) => `(${p.currentDaily} - ${p.mewsDaily}) Std./Tag x 365 Tage = ${p.totalHours} Std./Jahr`,
    noShow: (p) => `${p.cs}${p.monthlyRev}/Monat x 12 x ${p.noShowRate}% No-Shows x ${p.uncollectedFees}% nicht eingezogene Gebühren = ${p.total}`,
    multiCurrency: (p) => `${p.cs}${p.monthlyRev}/Monat x 12 x ${p.foreignPercent}% international x ${p.adoption}% Akzeptanz x ${p.share}% Anteil = ${p.total}`,
    revenueUplift: (p) => `${p.cs}${p.revpar} RevPAR x ${p.upliftPercent}% Steigerung = ${p.cs}${p.revparUplift}/Zimmer/Nacht x ${p.rooms} Zimmer x 365 Tage = ${p.total}`,
    rateAutomation: (p) => `${p.updatesPerWeek} Aktualisierungen/Woche x 52 Wochen x ${p.ratePlans} Pläne x ${p.channels} Kanäle x ${p.updateTime} Min. / 60 = ${p.totalHours} Std./Jahr`,
  },
};

export default de;
