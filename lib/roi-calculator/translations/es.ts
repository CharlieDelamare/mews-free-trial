import type { TranslationDictionary } from '../types/translations';

const es: TranslationDictionary = {
  labels: {
    totalAnnualImpact: 'impacto anual total',
    costSavings: 'ahorro de costes',
    revenueUplift: 'aumento de ingresos',
    hoursReclaimed: 'horas recuperadas',
    annualImpact: 'impacto anual',
    impactSummary: 'Resumen de impacto',
    hrs: 'h',
    perYear: 'por año',
    annualRevenueGain: 'Ganancia anual de ingresos',
    laborCostSavings: 'Ahorro en costes laborales',
    timeSaved: 'Tiempo ahorrado',
    revpar: 'RevPAR',
    rooms: 'Habitaciones',
    revenueUpliftPercent: 'Aumento de ingresos',
    exportRoiReport: 'Exportar informe ROI',
    chooseSections: 'Elija las secciones a incluir en su PDF',
    selectAtLeastOne: 'Seleccione al menos una sección para exportar.',
    cancel: 'Cancelar',
    exportPdf: 'Exportar PDF',
    generating: 'Generando...',
  },

  modules: {
    guestExperience: 'Experiencia del huésped',
    payment: 'Pagos y facturación',
    rms: 'Revenue Management',
    housekeeping: 'Housekeeping',
  },

  levers: {
    checkIn: 'Eficiencia del check-in',
    roomAssignment: 'Asignación de habitaciones',
    upsell: 'Venta adicional en portal',
    directBooking: 'Reserva directa',
    tokenization: 'Tokenización',
    chargeback: 'Reducción de contracargos',
    reconciliation: 'Conciliación',
    noShow: 'Protección de no-show',
    multiCurrency: 'Multidivisa',
    revenueUplift: 'Aumento de ingresos',
    rateAutomation: 'Automatización de tarifas',
    hkRoomAssignment: 'Room Assignment Automation',
    cleaningStatusUpdates: 'Cleaning Status Updates',
    maintenanceCommunication: 'Maintenance Communication',
    taskManagement: 'Task Management',
    amenitiesReduction: 'Amenities Reduction',
    paperElimination: 'Paper Elimination',
  },

  pdfLevers: {
    checkInAutomation: 'Automatización de check-in y check-out',
    roomAssignment: 'Asignación automática de habitaciones',
    guestPortalUpselling: 'Venta adicional en el portal del huésped',
    directBookingCommission: 'Reserva directa y comisiones ahorradas',
    paymentTokenization: 'Tokenización de pagos',
    chargebackReduction: 'Reducción de contracargos',
    autoReconciliation: 'Conciliación automática',
    noShowFeeCapture: 'Recuperación de tarifas de no-show',
    multiCurrencyRevenue: 'Ingresos multidivisa',
    dynamicPricingUplift: 'Aumento de ingresos por precios dinámicos',
    rateUpdateAutomation: 'Automatización de actualización de tarifas',
    hkRoomAssignmentAutomation: 'Room Assignment Automation',
    hkCleaningStatusUpdates: 'Cleaning Status Updates',
    hkMaintenanceCommunication: 'Maintenance Communication',
    hkTaskManagement: 'Task Management Efficiency',
    hkAmenitiesReduction: 'Amenities Cost Reduction',
    hkPaperElimination: 'Paper Elimination',
  },

  leverResultType: {
    timeReclaimed: 'tiempo recuperado',
    costSaving: 'ahorro',
    revenueUplift: 'ingresos',
  },

  subtexts: {
    costSavingsSubtext: 'Gracias a la automatización del check-in, el procesamiento de pagos y la conciliación',
    revenueUpliftSubtext: 'Gracias a precios dinámicos, ventas adicionales, reservas directas y recuperación de no-shows',
    hoursReclaimedSubtext: 'Tiempo devuelto a su equipo en recepción, back-office y revenue management',
  },

  narratives: {
    titleSlideNarrative: ({ costSavings, revenueUplift, totalTime }) =>
      `Su establecimiento ahorra ${costSavings} gracias a la automatización, genera ${revenueUplift} en nuevos ingresos y recupera ${totalTime} horas de trabajo — cada año.`,

    guestExperienceNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews transforma su recepción de un cuello de botella en un punto de contacto fluido con el huésped.');
      if (active('checkIn')) {
        parts.push('El check-in y check-out digitales liberan a su equipo para centrarse en la hospitalidad en lugar del papeleo.');
      }
      if (active('roomAssignment')) {
        parts.push('La asignación automática de habitaciones elimina una tarea diaria que consume mucho tiempo a su personal de recepción.');
      }
      if (active('upsell')) {
        parts.push(`El portal del huésped genera ${val('upsell')} en nuevos ingresos a través de ofertas de venta adicional personalizadas durante el proceso de reserva.`);
      }
      if (active('directBooking')) {
        parts.push(`Al fomentar más reservas directas, reduce la dependencia de las OTA y conserva ${val('directBooking')} más por año.`);
      }
      return parts.join(' ');
    },

    paymentNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews Payments elimina la gestión manual de pagos — su equipo financiero dedica menos tiempo a la administración y más a las decisiones estratégicas.');
      if (active('tokenization')) {
        parts.push('La tokenización segura automatiza el procesamiento de transacciones, ahorrando a su equipo horas de trabajo repetitivo.');
      }
      if (active('reconciliation')) {
        parts.push(`La conciliación automatizada reemplaza el cotejo manual, recuperando ${val('reconciliation')} en costes laborales.`);
      }
      if (active('chargeback')) {
        parts.push(`La prevención de fraude integrada reduce significativamente los contracargos, ahorrando ${val('chargeback')} al año.`);
      }
      if (active('noShow')) {
        parts.push(`La garantía automática con tarjeta registrada recupera ${val('noShow')} en cargos de no-show que de otro modo se perderían.`);
      }
      if (active('multiCurrency')) {
        parts.push('El soporte multidivisa permite a los huéspedes internacionales pagar en su propia moneda, eliminando fricciones y generando ingresos incrementales.');
      }
      return parts.join(' ');
    },

    rmsNarrative: ({ active, val }) => {
      const parts: string[] = [];
      if (active('revenueUplift')) {
        parts.push(`Mews RMS reemplaza la intuición con precios dinámicos impulsados por IA que responden a las condiciones del mercado en tiempo real — un motor de optimización de ingresos 24/7 que genera ${val('revenueUplift')} en RevPAR adicional.`);
      }
      if (active('rateAutomation')) {
        parts.push(`La distribución automatizada en todos sus planes tarifarios y canales elimina horas de actualizaciones manuales, ahorrando ${val('rateAutomation')} en costes laborales y permitiendo a su equipo centrarse en la estrategia en lugar de las hojas de cálculo.`);
      }
      return parts.join(' ');
    },

    rmsManagerNote: (hasManager) =>
      hasManager
        ? 'Su revenue manager puede concentrarse en la estrategia y el posicionamiento de mercado en lugar de las hojas de cálculo.'
        : 'Obtiene optimización de ingresos de nivel empresarial sin necesidad de un revenue manager dedicado — la IA gestiona los precios de forma continua.',

    summaryNarrative: ({ moduleCount, costSavings, revenueUplift, totalTime }) =>
      `En ${moduleCount} módulo${moduleCount > 1 ? 's' : ''}, Mews genera ${costSavings} en ahorro de costes y ${revenueUplift} en nuevos ingresos — liberando ${totalTime} horas de trabajo al año.`,

    pdfGuestExperienceNarrative: ({ upsellRevenue, commissionSaved, formatCurrency }) => {
      let text = 'Mews transforma su recepción de un cuello de botella en un punto de contacto fluido con el huésped. El check-in y check-out digitales liberan a su equipo para centrarse en la hospitalidad en lugar del papeleo, mientras que la asignación automática de habitaciones elimina una tarea diaria que consume mucho tiempo.';
      if (upsellRevenue > 0) {
        text += ` El portal del huésped genera ${formatCurrency(upsellRevenue)} en nuevos ingresos a través de ofertas de venta adicional personalizadas durante el proceso de reserva.`;
      }
      if (commissionSaved > 0) {
        text += ` Al fomentar más reservas directas, reduce la dependencia de las OTA y conserva ${formatCurrency(commissionSaved)} más por año.`;
      }
      return text;
    },

    pdfPaymentNarrative: ({ reconciliationCostSavings, chargebackReduction, chargebackRate, mewsChargebackRate, noShowRevenue, multiCurrencyRevenue, formatCurrency }) => {
      let text = 'Mews Payments elimina la gestión manual de pagos — su equipo financiero dedica menos tiempo a la administración y más a las decisiones estratégicas. La tokenización segura automatiza el procesamiento de transacciones, ahorrando a su equipo horas de trabajo repetitivo.';
      if (reconciliationCostSavings > 0) {
        text += ` La conciliación automatizada reemplaza el cotejo manual diario, recuperando ${formatCurrency(reconciliationCostSavings)} en costes laborales.`;
      }
      if (chargebackReduction > 0) {
        text += ` La prevención de fraude integrada reduce su tasa de contracargos del ${chargebackRate}% al ${mewsChargebackRate}%, ahorrando ${formatCurrency(chargebackReduction)} al año.`;
      }
      if (noShowRevenue > 0) {
        text += ` La garantía automática con tarjeta registrada recupera ${formatCurrency(noShowRevenue)} en cargos de no-show que de otro modo se perderían.`;
      }
      if (multiCurrencyRevenue > 0) {
        text += ` El soporte multidivisa permite a los huéspedes internacionales pagar en su propia moneda, eliminando fricciones y generando ${formatCurrency(multiCurrencyRevenue)} en ingresos incrementales.`;
      }
      return text;
    },

    pdfRmsNarrative: ({ annualRevenueGain, annualHoursSaved, annualLaborCostSavings, numberOfRooms, hasRevenueManager, hasExistingRMS, formatCurrency }) => {
      let text = `Mews RMS reemplaza la intuición con precios dinámicos impulsados por IA que responden a las condiciones del mercado en tiempo real — un motor de optimización de ingresos 24/7 que genera ${formatCurrency(annualRevenueGain)} en RevPAR adicional en sus ${numberOfRooms} habitaciones.`;
      if (annualHoursSaved > 0) {
        text += ` La distribución automatizada en todos sus planes tarifarios y canales elimina horas de actualizaciones manuales, ahorrando ${formatCurrency(annualLaborCostSavings)} en costes laborales.`;
      }
      text += hasRevenueManager
        ? ' Su revenue manager puede concentrarse en la estrategia y el posicionamiento de mercado en lugar de las hojas de cálculo.'
        : ' Obtiene optimización de ingresos de nivel empresarial sin necesidad de un revenue manager dedicado — la IA gestiona los precios de forma continua.';
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

  slideFooter: 'Informe ROI Mews',

  formulas: {
    checkIn: (p) => `${p.annualRes} reservas/año x (${p.checkInSaved} check-in + ${p.checkOutSaved} check-out ahorrados) / 60 = ${p.totalHours} h/año`,
    roomAssignment: (p) => `${p.annualRes} reservas/año x ${p.assignTime}/reserva / 60 = ${p.totalHours} h/año`,
    upsell: (p) => `${p.annualRes} reservas/año x ${p.cs}${p.adr} ADR x ${p.onlineCheckIn}% check-in en línea x ${p.uplift}% aumento = ${p.total}`,
    directBooking: (p) => `${p.annualRes} reservas/año x ${p.directIncrease}% más directas x ${p.cs}${p.adr} ADR x ${p.commission}% comisión = ${p.total}`,
    tokenization: (p) => `${p.annualRes} reservas/año x ${p.seconds}s por transacción / 3.600 = ${p.totalHours} h/año`,
    chargeback: (p) => `(${p.currentRate}% - ${p.mewsRate}%) reducción x ${p.cs}${p.costPerMonth}/mes x 12 = ${p.total}`,
    reconciliation: (p) => `(${p.currentDaily} - ${p.mewsDaily}) h/día x 365 días = ${p.totalHours} h/año`,
    noShow: (p) => `${p.cs}${p.monthlyRev}/mes x 12 x ${p.noShowRate}% no-shows x ${p.uncollectedFees}% cargos no cobrados = ${p.total}`,
    multiCurrency: (p) => `${p.cs}${p.monthlyRev}/mes x 12 x ${p.foreignPercent}% extranjeros x ${p.adoption}% adopción x ${p.share}% cuota = ${p.total}`,
    revenueUplift: (p) => `${p.cs}${p.revpar} RevPAR x ${p.upliftPercent}% aumento = ${p.cs}${p.revparUplift}/habitación/noche x ${p.rooms} habitaciones x 365 días = ${p.total}`,
    rateAutomation: (p) => `${p.updatesPerWeek} actualizaciones/sem x 52 sem x ${p.ratePlans} planes x ${p.channels} canales x ${p.updateTime} min / 60 = ${p.totalHours} h/año`,
    hkRoomAssignment: (p) => `${p.staff} HK staff × (${p.manualTime}m − ${p.digitalTime}m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    cleaningStatusUpdates: (p) => `${p.updatesPerDay} updates/day × (0.5m − 0.05m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    maintenanceCommunication: (p) => `${p.repairsPerDay} repairs/day × (1.0m − 0.15m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    taskManagement: (p) => `${p.tasksPerDay} tasks/day × (0.5m − 0.15m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    amenitiesReduction: (p) => `${p.rooms} rooms × 365 × ${p.occupancy}% occ × ${p.amenityCost} × ${p.reductionPct}% = ${p.total}/yr`,
    paperElimination: (p) => `${p.roomNights} room-nights × €0.005/sheet = ${p.total}/yr`,
  },
};

export default es;
