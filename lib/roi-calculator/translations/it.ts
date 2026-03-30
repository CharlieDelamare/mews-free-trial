import type { TranslationDictionary } from '../types/translations';

const it: TranslationDictionary = {
  labels: {
    totalAnnualImpact: 'impatto annuale totale',
    costSavings: 'risparmio sui costi',
    revenueUplift: 'incremento dei ricavi',
    hoursReclaimed: 'ore recuperate',
    annualImpact: 'impatto annuale',
    impactSummary: 'Riepilogo dell\'impatto',
    hrs: 'ore',
    perYear: 'all\'anno',
    annualRevenueGain: 'Incremento annuale dei ricavi',
    laborCostSavings: 'Risparmio sul costo del lavoro',
    timeSaved: 'Tempo risparmiato',
    revpar: 'RevPAR',
    rooms: 'Camere',
    revenueUpliftPercent: 'Incremento dei ricavi',
    exportRoiReport: 'Esporta report ROI',
    chooseSections: 'Scegli le sezioni da includere nel PDF',
    selectAtLeastOne: 'Seleziona almeno una sezione da esportare.',
    cancel: 'Annulla',
    exportPdf: 'Esporta PDF',
    generating: 'Generazione in corso...',
  },

  modules: {
    guestExperience: 'Esperienza dell\'ospite',
    payment: 'Pagamenti e fatturazione',
    rms: 'Revenue Management',
    housekeeping: 'Housekeeping',
  },

  levers: {
    checkIn: 'Efficienza del check-in',
    roomAssignment: 'Assegnazione camere',
    upsell: 'Upsell dal portale',
    directBooking: 'Prenotazioni dirette',
    tokenization: 'Tokenizzazione',
    chargeback: 'Riduzione chargeback',
    reconciliation: 'Riconciliazione',
    noShow: 'Protezione no-show',
    multiCurrency: 'Multi-valuta',
    revenueUplift: 'Incremento dei ricavi',
    rateAutomation: 'Automazione tariffe',
    hkRoomAssignment: 'Room Assignment Automation',
    cleaningStatusUpdates: 'Cleaning Status Updates',
    maintenanceCommunication: 'Maintenance Communication',
    taskManagement: 'Task Management',
    amenitiesReduction: 'Amenities Reduction',
    paperElimination: 'Paper Elimination',
  },

  pdfLevers: {
    checkInAutomation: 'Automazione check-in e check-out',
    roomAssignment: 'Assegnazione automatica delle camere',
    guestPortalUpselling: 'Upselling dal portale ospiti',
    directBookingCommission: 'Prenotazioni dirette e commissioni risparmiate',
    paymentTokenization: 'Tokenizzazione dei pagamenti',
    chargebackReduction: 'Riduzione dei chargeback',
    autoReconciliation: 'Riconciliazione automatica',
    noShowFeeCapture: 'Recupero penali no-show',
    multiCurrencyRevenue: 'Ricavi multi-valuta',
    dynamicPricingUplift: 'Incremento ricavi da tariffazione dinamica',
    rateUpdateAutomation: 'Automazione aggiornamento tariffe',
    hkRoomAssignmentAutomation: 'Room Assignment Automation',
    hkCleaningStatusUpdates: 'Cleaning Status Updates',
    hkMaintenanceCommunication: 'Maintenance Communication',
    hkTaskManagement: 'Task Management Efficiency',
    hkAmenitiesReduction: 'Amenities Cost Reduction',
    hkPaperElimination: 'Paper Elimination',
  },

  leverResultType: {
    timeReclaimed: 'tempo recuperato',
    costSaving: 'risparmio',
    revenueUplift: 'ricavi',
  },

  subtexts: {
    costSavingsSubtext: 'Da check-in automatizzato, elaborazione pagamenti e riconciliazione',
    revenueUpliftSubtext: 'Da tariffazione dinamica, upsell agli ospiti, prenotazioni dirette e recupero no-show',
    hoursReclaimedSubtext: 'Tempo restituito al team per reception, back office e revenue management',
  },

  narratives: {
    titleSlideNarrative: ({ costSavings, revenueUplift, totalTime }) =>
      `La vostra struttura risparmia ${costSavings} grazie all'automazione, genera ${revenueUplift} di nuovi ricavi e recupera ${totalTime} ore del personale — ogni anno.`,

    guestExperienceNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews trasforma la vostra reception da un collo di bottiglia in un punto di contatto fluido con l\'ospite.');
      if (active('checkIn')) {
        parts.push('Il check-in e il check-out digitali liberano il vostro team per dedicarsi all\'ospitalità anziché alla burocrazia.');
      }
      if (active('roomAssignment')) {
        parts.push('L\'assegnazione automatica delle camere elimina un\'attività quotidiana che sottrae tempo al personale della reception.');
      }
      if (active('upsell')) {
        parts.push(`Il portale ospiti genera ${val('upsell')} di nuovi ricavi attraverso offerte di upsell personalizzate durante il percorso di prenotazione.`);
      }
      if (active('directBooking')) {
        parts.push(`Aumentando le prenotazioni dirette, riducete la dipendenza dalle OTA e trattenete ${val('directBooking')} in più all'anno.`);
      }
      return parts.join(' ');
    },

    paymentNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews Payments elimina la gestione manuale dei pagamenti — il vostro team finanziario dedica meno tempo all\'amministrazione e più tempo alle decisioni strategiche.');
      if (active('tokenization')) {
        parts.push('La tokenizzazione sicura automatizza l\'elaborazione delle transazioni, facendo risparmiare al team ore di lavoro ripetitivo.');
      }
      if (active('reconciliation')) {
        parts.push(`La riconciliazione automatica sostituisce l\'abbinamento manuale, recuperando ${val('reconciliation')} in costi del lavoro.`);
      }
      if (active('chargeback')) {
        parts.push(`La prevenzione integrata delle frodi riduce significativamente i chargeback, con un risparmio di ${val('chargeback')} all'anno.`);
      }
      if (active('noShow')) {
        parts.push(`La garanzia automatica della carta in archivio recupera ${val('noShow')} in penali no-show che altrimenti andrebbero perse.`);
      }
      if (active('multiCurrency')) {
        parts.push('Il supporto multi-valuta consente agli ospiti internazionali di pagare nella propria valuta, eliminando le frizioni e generando ricavi incrementali.');
      }
      return parts.join(' ');
    },

    rmsNarrative: ({ active, val }) => {
      const parts: string[] = [];
      if (active('revenueUplift')) {
        parts.push(`Mews RMS sostituisce le supposizioni con una tariffazione dinamica basata sull'intelligenza artificiale che reagisce alle condizioni di mercato in tempo reale — un motore di ottimizzazione dei ricavi attivo 24/7 che genera ${val('revenueUplift')} di RevPAR aggiuntivo.`);
      }
      if (active('rateAutomation')) {
        parts.push(`La distribuzione automatizzata su tutti i piani tariffari e i canali elimina ore di aggiornamenti manuali, con un risparmio di ${val('rateAutomation')} in costi del lavoro, consentendo al team di concentrarsi sulla strategia anziché sui fogli di calcolo.`);
      }
      return parts.join(' ');
    },

    rmsManagerNote: (hasManager) =>
      hasManager
        ? 'Il vostro revenue manager può concentrarsi sulla strategia e sul posizionamento di mercato anziché sui fogli di calcolo.'
        : 'Ottenete un\'ottimizzazione dei ricavi di livello enterprise senza bisogno di un revenue manager dedicato — l\'IA gestisce le tariffe 24 ore su 24.',

    summaryNarrative: ({ moduleCount, costSavings, revenueUplift, totalTime }) =>
      `Su ${moduleCount} modul${moduleCount > 1 ? 'i' : 'o'}, Mews genera ${costSavings} di risparmio sui costi e ${revenueUplift} di nuovi ricavi — liberando ${totalTime} ore del personale all'anno.`,

    pdfGuestExperienceNarrative: ({ upsellRevenue, commissionSaved, formatCurrency }) => {
      let text = 'Mews trasforma la vostra reception da un collo di bottiglia in un punto di contatto fluido con l\'ospite. Il check-in e il check-out digitali liberano il team per dedicarsi all\'ospitalità anziché alla burocrazia, mentre l\'assegnazione automatica delle camere elimina un\'attività quotidiana.';
      if (upsellRevenue > 0) {
        text += ` Il portale ospiti genera ${formatCurrency(upsellRevenue)} di nuovi ricavi attraverso offerte di upsell personalizzate durante il percorso di prenotazione.`;
      }
      if (commissionSaved > 0) {
        text += ` Aumentando le prenotazioni dirette, riducete la dipendenza dalle OTA e trattenete ${formatCurrency(commissionSaved)} in più all'anno.`;
      }
      return text;
    },

    pdfPaymentNarrative: ({ reconciliationCostSavings, chargebackReduction, chargebackRate, mewsChargebackRate, noShowRevenue, multiCurrencyRevenue, formatCurrency }) => {
      let text = 'Mews Payments elimina la gestione manuale dei pagamenti — il vostro team finanziario dedica meno tempo all\'amministrazione e più tempo alle decisioni strategiche. La tokenizzazione sicura automatizza l\'elaborazione delle transazioni, facendo risparmiare al team ore di lavoro ripetitivo.';
      if (reconciliationCostSavings > 0) {
        text += ` La riconciliazione automatica sostituisce l'abbinamento manuale giornaliero, recuperando ${formatCurrency(reconciliationCostSavings)} in costi del lavoro.`;
      }
      if (chargebackReduction > 0) {
        text += ` La prevenzione integrata delle frodi riduce il tasso di chargeback dal ${chargebackRate}% al ${mewsChargebackRate}%, con un risparmio di ${formatCurrency(chargebackReduction)} all'anno.`;
      }
      if (noShowRevenue > 0) {
        text += ` La garanzia automatica della carta in archivio recupera ${formatCurrency(noShowRevenue)} in penali no-show che altrimenti andrebbero perse.`;
      }
      if (multiCurrencyRevenue > 0) {
        text += ` Il supporto multi-valuta consente agli ospiti internazionali di pagare nella propria valuta, eliminando le frizioni e generando ${formatCurrency(multiCurrencyRevenue)} di ricavi incrementali.`;
      }
      return text;
    },

    pdfRmsNarrative: ({ annualRevenueGain, annualHoursSaved, annualLaborCostSavings, numberOfRooms, hasRevenueManager, hasExistingRMS, formatCurrency }) => {
      let text = `Mews RMS sostituisce le supposizioni con una tariffazione dinamica basata sull'IA che reagisce alle condizioni di mercato in tempo reale — un motore di ottimizzazione dei ricavi attivo 24/7 che genera ${formatCurrency(annualRevenueGain)} di RevPAR aggiuntivo sulle vostre ${numberOfRooms} camere.`;
      if (annualHoursSaved > 0) {
        text += ` La distribuzione automatizzata su tutti i piani tariffari e i canali elimina ore di aggiornamenti manuali, con un risparmio di ${formatCurrency(annualLaborCostSavings)} in costi del lavoro.`;
      }
      text += hasRevenueManager
        ? ' Il vostro revenue manager può concentrarsi sulla strategia e sul posizionamento di mercato anziché sui fogli di calcolo.'
        : ' Ottenete un\'ottimizzazione dei ricavi di livello enterprise senza bisogno di un revenue manager dedicato — l\'IA gestisce le tariffe 24 ore su 24.';
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

  slideFooter: 'Report ROI Mews',

  formulas: {
    checkIn: (p) => `${p.annualRes} prenotazioni/anno x (${p.checkInSaved} check-in + ${p.checkOutSaved} check-out risparmiati) / 60 = ${p.totalHours} ore/anno`,
    roomAssignment: (p) => `${p.annualRes} prenotazioni/anno x ${p.assignTime}/prenotazione / 60 = ${p.totalHours} ore/anno`,
    upsell: (p) => `${p.annualRes} prenotazioni/anno x ${p.cs}${p.adr} ADR x ${p.onlineCheckIn}% check-in online x ${p.uplift}% incremento = ${p.total}`,
    directBooking: (p) => `${p.annualRes} prenotazioni/anno x ${p.directIncrease}% più dirette x ${p.cs}${p.adr} ADR x ${p.commission}% commissione = ${p.total}`,
    tokenization: (p) => `${p.annualRes} prenotazioni/anno x ${p.seconds}s per transazione / 3.600 = ${p.totalHours} ore/anno`,
    chargeback: (p) => `(${p.currentRate}% - ${p.mewsRate}%) riduzione x ${p.cs}${p.costPerMonth}/mese x 12 = ${p.total}`,
    reconciliation: (p) => `(${p.currentDaily} - ${p.mewsDaily}) ore/giorno x 365 giorni = ${p.totalHours} ore/anno`,
    noShow: (p) => `${p.cs}${p.monthlyRev}/mese x 12 x ${p.noShowRate}% no-show x ${p.uncollectedFees}% penali non riscosse = ${p.total}`,
    multiCurrency: (p) => `${p.cs}${p.monthlyRev}/mese x 12 x ${p.foreignPercent}% stranieri x ${p.adoption}% adozione x ${p.share}% quota = ${p.total}`,
    revenueUplift: (p) => `${p.cs}${p.revpar} RevPAR x ${p.upliftPercent}% incremento = ${p.cs}${p.revparUplift}/camera/notte x ${p.rooms} camere x 365 giorni = ${p.total}`,
    rateAutomation: (p) => `${p.updatesPerWeek} aggiornamenti/sett. x 52 sett. x ${p.ratePlans} piani tariffari x ${p.channels} canali x ${p.updateTime} min / 60 = ${p.totalHours} ore/anno`,
    hkRoomAssignment: (p) => `${p.staff} HK staff × (${p.manualTime}m − ${p.digitalTime}m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    cleaningStatusUpdates: (p) => `${p.updatesPerDay} updates/day × (0.5m − 0.05m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    maintenanceCommunication: (p) => `${p.repairsPerDay} repairs/day × (1.0m − 0.15m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    taskManagement: (p) => `${p.tasksPerDay} tasks/day × (0.5m − 0.15m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    amenitiesReduction: (p) => `${p.rooms} rooms × 365 × ${p.occupancy}% occ × ${p.amenityCost} × ${p.reductionPct}% = ${p.total}/yr`,
    paperElimination: (p) => `${p.roomNights} room-nights × €0.005/sheet = ${p.total}/yr`,
  },
};

export default it;
