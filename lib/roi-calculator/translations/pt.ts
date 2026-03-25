import type { TranslationDictionary } from '../types/translations';

const pt: TranslationDictionary = {
  labels: {
    totalAnnualImpact: 'impacto anual total',
    costSavings: 'redução de custos',
    revenueUplift: 'aumento de receita',
    hoursReclaimed: 'horas recuperadas',
    annualImpact: 'impacto anual',
    impactSummary: 'Resumo do impacto',
    hrs: 'hrs',
    perYear: 'por ano',
    annualRevenueGain: 'Ganho anual de receita',
    laborCostSavings: 'Economia em custos de mão de obra',
    timeSaved: 'Tempo economizado',
    revpar: 'RevPAR',
    rooms: 'Quartos',
    revenueUpliftPercent: 'Aumento de receita',
    exportRoiReport: 'Exportar relatório de ROI',
    chooseSections: 'Escolha as secções a incluir no PDF',
    selectAtLeastOne: 'Selecione pelo menos uma secção para exportar.',
    cancel: 'Cancelar',
    exportPdf: 'Exportar PDF',
    generating: 'A gerar...',
  },

  modules: {
    guestExperience: 'Experiência do hóspede',
    payment: 'Pagamentos e faturação',
    rms: 'Revenue Management',
    housekeeping: 'Housekeeping',
  },

  levers: {
    checkIn: 'Eficiência do check-in',
    roomAssignment: 'Atribuição de quartos',
    upsell: 'Upsell no portal',
    directBooking: 'Reservas diretas',
    tokenization: 'Tokenização',
    chargeback: 'Redução de chargebacks',
    reconciliation: 'Reconciliação',
    noShow: 'Proteção contra no-show',
    multiCurrency: 'Multidivisa',
    revenueUplift: 'Aumento de receita',
    rateAutomation: 'Automatização de tarifas',
    hkRoomAssignment: 'Room Assignment Automation',
    cleaningStatusUpdates: 'Cleaning Status Updates',
    maintenanceCommunication: 'Maintenance Communication',
    taskManagement: 'Task Management',
    amenitiesReduction: 'Amenities Reduction',
    paperElimination: 'Paper Elimination',
  },

  pdfLevers: {
    checkInAutomation: 'Automatização de check-in e check-out',
    roomAssignment: 'Atribuição automática de quartos',
    guestPortalUpselling: 'Upselling no portal do hóspede',
    directBookingCommission: 'Reservas diretas e comissões poupadas',
    paymentTokenization: 'Tokenização de pagamentos',
    chargebackReduction: 'Redução de chargebacks',
    autoReconciliation: 'Reconciliação automática',
    noShowFeeCapture: 'Recuperação de taxas de no-show',
    multiCurrencyRevenue: 'Receita multidivisa',
    dynamicPricingUplift: 'Aumento de receita com preços dinâmicos',
    rateUpdateAutomation: 'Automatização de atualização de tarifas',
    hkRoomAssignmentAutomation: 'Room Assignment Automation',
    hkCleaningStatusUpdates: 'Cleaning Status Updates',
    hkMaintenanceCommunication: 'Maintenance Communication',
    hkTaskManagement: 'Task Management Efficiency',
    hkAmenitiesReduction: 'Amenities Cost Reduction',
    hkPaperElimination: 'Paper Elimination',
  },

  leverResultType: {
    timeReclaimed: 'tempo recuperado',
    costSaving: 'poupança',
    revenueUplift: 'receita',
  },

  subtexts: {
    costSavingsSubtext: 'De check-in automatizado, processamento de pagamentos e reconciliação',
    revenueUpliftSubtext: 'De preços dinâmicos, upselling a hóspedes, reservas diretas e recuperação de no-shows',
    hoursReclaimedSubtext: 'Tempo de receção, back office e revenue management devolvido à sua equipa',
  },

  narratives: {
    titleSlideNarrative: ({ costSavings, revenueUplift, totalTime }) =>
      `A sua propriedade poupa ${costSavings} através da automatização, gera ${revenueUplift} em nova receita e recupera ${totalTime} horas de equipa — todos os anos.`,

    guestExperienceNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('O Mews transforma a sua receção de um ponto de estrangulamento num ponto de contacto fluido com o hóspede.');
      if (active('checkIn')) {
        parts.push('O check-in e check-out digitais libertam a sua equipa para se focar na hospitalidade em vez da burocracia.');
      }
      if (active('roomAssignment')) {
        parts.push('A atribuição automática de quartos elimina uma tarefa diária que consome tempo ao pessoal da receção.');
      }
      if (active('upsell')) {
        parts.push(`O portal do hóspede gera ${val('upsell')} em nova receita através de ofertas de upsell personalizadas durante o processo de reserva.`);
      }
      if (active('directBooking')) {
        parts.push(`Ao impulsionar mais reservas diretas, reduz a dependência de OTAs e retém ${val('directBooking')} a mais por ano.`);
      }
      return parts.join(' ');
    },

    paymentNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('O Mews Payments elimina o processamento manual de pagamentos — a sua equipa financeira dedica menos tempo à administração e mais às decisões estratégicas.');
      if (active('tokenization')) {
        parts.push('A tokenização segura automatiza o processamento de transações, poupando à equipa horas de trabalho repetitivo.');
      }
      if (active('reconciliation')) {
        parts.push(`A reconciliação automatizada substitui a correspondência manual, recuperando ${val('reconciliation')} em custos de mão de obra.`);
      }
      if (active('chargeback')) {
        parts.push(`A prevenção integrada de fraude reduz significativamente os chargebacks, poupando ${val('chargeback')} por ano.`);
      }
      if (active('noShow')) {
        parts.push(`A garantia automática de cartão em arquivo recupera ${val('noShow')} em taxas de no-show que de outra forma seriam perdidas.`);
      }
      if (active('multiCurrency')) {
        parts.push('O suporte multidivisa permite que hóspedes internacionais paguem na sua própria moeda, eliminando barreiras e gerando receita incremental.');
      }
      return parts.join(' ');
    },

    rmsNarrative: ({ active, val }) => {
      const parts: string[] = [];
      if (active('revenueUplift')) {
        parts.push(`O Mews RMS substitui a intuição por preços dinâmicos baseados em IA que respondem às condições de mercado em tempo real — um motor de otimização de receita 24/7 que gera ${val('revenueUplift')} em RevPAR adicional.`);
      }
      if (active('rateAutomation')) {
        parts.push(`A distribuição automatizada em todos os seus planos de tarifas e canais elimina horas de atualizações manuais, poupando ${val('rateAutomation')} em custos de mão de obra e permitindo que a equipa se foque na estratégia em vez de folhas de cálculo.`);
      }
      return parts.join(' ');
    },

    rmsManagerNote: (hasManager) =>
      hasManager
        ? 'O seu revenue manager pode focar-se na estratégia e no posicionamento de mercado em vez de folhas de cálculo.'
        : 'Obtém otimização de receita de nível empresarial sem necessidade de um revenue manager dedicado — a IA gere os preços a toda a hora.',

    summaryNarrative: ({ moduleCount, costSavings, revenueUplift, totalTime }) =>
      `Em ${moduleCount} módulo${moduleCount > 1 ? 's' : ''}, o Mews gera ${costSavings} em redução de custos e ${revenueUplift} em nova receita — libertando ${totalTime} horas de equipa por ano.`,

    pdfGuestExperienceNarrative: ({ upsellRevenue, commissionSaved, formatCurrency }) => {
      let text = 'O Mews transforma a sua receção de um ponto de estrangulamento num ponto de contacto fluido com o hóspede. O check-in e check-out digitais libertam a equipa para se focar na hospitalidade em vez da burocracia, enquanto a atribuição automática de quartos elimina uma tarefa diária que consome tempo.';
      if (upsellRevenue > 0) {
        text += ` O portal do hóspede gera ${formatCurrency(upsellRevenue)} em nova receita através de ofertas de upsell personalizadas durante o processo de reserva.`;
      }
      if (commissionSaved > 0) {
        text += ` Ao impulsionar mais reservas diretas, reduz a dependência de OTAs e retém ${formatCurrency(commissionSaved)} a mais por ano.`;
      }
      return text;
    },

    pdfPaymentNarrative: ({ reconciliationCostSavings, chargebackReduction, chargebackRate, mewsChargebackRate, noShowRevenue, multiCurrencyRevenue, formatCurrency }) => {
      let text = 'O Mews Payments elimina o processamento manual de pagamentos — a sua equipa financeira dedica menos tempo à administração e mais às decisões estratégicas. A tokenização segura automatiza o processamento de transações, poupando à equipa horas de trabalho repetitivo.';
      if (reconciliationCostSavings > 0) {
        text += ` A reconciliação automatizada substitui a correspondência manual diária, recuperando ${formatCurrency(reconciliationCostSavings)} em custos de mão de obra.`;
      }
      if (chargebackReduction > 0) {
        text += ` A prevenção integrada de fraude reduz a taxa de chargeback de ${chargebackRate}% para ${mewsChargebackRate}%, poupando ${formatCurrency(chargebackReduction)} por ano.`;
      }
      if (noShowRevenue > 0) {
        text += ` A garantia automática de cartão em arquivo recupera ${formatCurrency(noShowRevenue)} em taxas de no-show que de outra forma seriam perdidas.`;
      }
      if (multiCurrencyRevenue > 0) {
        text += ` O suporte multidivisa permite que hóspedes internacionais paguem na sua própria moeda, eliminando barreiras e gerando ${formatCurrency(multiCurrencyRevenue)} em receita incremental.`;
      }
      return text;
    },

    pdfRmsNarrative: ({ annualRevenueGain, annualHoursSaved, annualLaborCostSavings, numberOfRooms, hasRevenueManager, hasExistingRMS, formatCurrency }) => {
      let text = `O Mews RMS substitui a intuição por preços dinâmicos baseados em IA que respondem às condições de mercado em tempo real — um motor de otimização de receita 24/7 que gera ${formatCurrency(annualRevenueGain)} em RevPAR adicional nos seus ${numberOfRooms} quartos.`;
      if (annualHoursSaved > 0) {
        text += ` A distribuição automatizada em todos os planos de tarifas e canais elimina horas de atualizações manuais, poupando ${formatCurrency(annualLaborCostSavings)} em custos de mão de obra.`;
      }
      text += hasRevenueManager
        ? ' O seu revenue manager pode focar-se na estratégia e no posicionamento de mercado em vez de folhas de cálculo.'
        : ' Obtém otimização de receita de nível empresarial sem necessidade de um revenue manager dedicado — a IA gere os preços a toda a hora.';
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

  slideFooter: 'Relatório ROI Mews',

  formulas: {
    checkIn: (p) => `${p.annualRes} reservas/ano x (${p.checkInSaved} check-in + ${p.checkOutSaved} check-out poupados) / 60 = ${p.totalHours} hrs/ano`,
    roomAssignment: (p) => `${p.annualRes} reservas/ano x ${p.assignTime}/reserva / 60 = ${p.totalHours} hrs/ano`,
    upsell: (p) => `${p.annualRes} reservas/ano x ${p.cs}${p.adr} ADR x ${p.onlineCheckIn}% check-in online x ${p.uplift}% aumento = ${p.total}`,
    directBooking: (p) => `${p.annualRes} reservas/ano x ${p.directIncrease}% mais diretas x ${p.cs}${p.adr} ADR x ${p.commission}% comissão = ${p.total}`,
    tokenization: (p) => `${p.annualRes} reservas/ano x ${p.seconds}s por transação / 3.600 = ${p.totalHours} hrs/ano`,
    chargeback: (p) => `(${p.currentRate}% - ${p.mewsRate}%) redução x ${p.cs}${p.costPerMonth}/mês x 12 = ${p.total}`,
    reconciliation: (p) => `(${p.currentDaily} - ${p.mewsDaily}) hrs/dia x 365 dias = ${p.totalHours} hrs/ano`,
    noShow: (p) => `${p.cs}${p.monthlyRev}/mês x 12 x ${p.noShowRate}% no-shows x ${p.uncollectedFees}% taxas não cobradas = ${p.total}`,
    multiCurrency: (p) => `${p.cs}${p.monthlyRev}/mês x 12 x ${p.foreignPercent}% estrangeiros x ${p.adoption}% adoção x ${p.share}% quota = ${p.total}`,
    revenueUplift: (p) => `${p.cs}${p.revpar} RevPAR x ${p.upliftPercent}% aumento = ${p.cs}${p.revparUplift}/quarto/noite x ${p.rooms} quartos x 365 dias = ${p.total}`,
    rateAutomation: (p) => `${p.updatesPerWeek} atualizações/sem. x 52 sem. x ${p.ratePlans} planos de tarifas x ${p.channels} canais x ${p.updateTime} min / 60 = ${p.totalHours} hrs/ano`,
    hkRoomAssignment: (p) => `${p.staff} HK staff × (${p.manualTime}m − ${p.digitalTime}m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    cleaningStatusUpdates: (p) => `${p.updatesPerDay} updates/day × (0.5m − 0.05m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    maintenanceCommunication: (p) => `${p.repairsPerDay} repairs/day × (1.0m − 0.15m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    taskManagement: (p) => `${p.tasksPerDay} tasks/day × (0.5m − 0.15m) / 60 × 365 = ${p.totalHours} hrs/yr`,
    amenitiesReduction: (p) => `${p.rooms} rooms × 365 × ${p.occupancy}% occ × ${p.amenityCost} × ${p.reductionPct}% = ${p.total}/yr`,
    paperElimination: (p) => `${p.roomNights} room-nights × €0.005/sheet = ${p.total}/yr`,
  },
};

export default pt;
