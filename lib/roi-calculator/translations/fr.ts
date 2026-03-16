import type { TranslationDictionary } from '../types/translations';

const fr: TranslationDictionary = {
  labels: {
    totalAnnualImpact: 'impact annuel total',
    costSavings: 'économies de coûts',
    revenueUplift: 'hausse du chiffre d\'affaires',
    hoursReclaimed: 'heures récupérées',
    annualImpact: 'impact annuel',
    impactSummary: 'Résumé de l\'impact',
    hrs: 'h',
    perYear: 'par an',
    annualRevenueGain: 'Gain annuel de revenus',
    laborCostSavings: 'Économies en coûts de main-d\'œuvre',
    timeSaved: 'Temps économisé',
    revpar: 'RevPAR',
    rooms: 'Chambres',
    revenueUpliftPercent: 'Hausse du chiffre d\'affaires',
    exportRoiReport: 'Exporter le rapport ROI',
    chooseSections: 'Choisissez les sections à inclure dans votre PDF',
    selectAtLeastOne: 'Sélectionnez au moins une section à exporter.',
    cancel: 'Annuler',
    exportPdf: 'Exporter en PDF',
    generating: 'Génération en cours...',
  },

  modules: {
    guestExperience: 'Expérience client',
    payment: 'Paiement et facturation',
    rms: 'Revenue Management',
  },

  levers: {
    checkIn: 'Efficacité du check-in',
    roomAssignment: 'Attribution des chambres',
    upsell: 'Vente additionnelle portail',
    directBooking: 'Réservation directe',
    tokenization: 'Tokenisation',
    chargeback: 'Réduction des contestations',
    reconciliation: 'Réconciliation',
    noShow: 'Protection no-show',
    multiCurrency: 'Multi-devises',
    revenueUplift: 'Hausse du chiffre d\'affaires',
    rateAutomation: 'Automatisation tarifaire',
  },

  pdfLevers: {
    checkInAutomation: 'Automatisation du check-in et check-out',
    roomAssignment: 'Attribution automatique des chambres',
    guestPortalUpselling: 'Vente additionnelle via le portail client',
    directBookingCommission: 'Réservation directe et commissions économisées',
    paymentTokenization: 'Tokenisation des paiements',
    chargebackReduction: 'Réduction des contestations',
    autoReconciliation: 'Réconciliation automatique',
    noShowFeeCapture: 'Récupération des frais de no-show',
    multiCurrencyRevenue: 'Revenus multi-devises',
    dynamicPricingUplift: 'Hausse des revenus par tarification dynamique',
    rateUpdateAutomation: 'Automatisation des mises à jour tarifaires',
  },

  leverResultType: {
    timeReclaimed: 'temps récupéré',
    costSaving: 'économie',
    revenueUplift: 'revenus',
  },

  subtexts: {
    costSavingsSubtext: 'Grâce à l\'automatisation du check-in, du traitement des paiements et de la réconciliation',
    revenueUpliftSubtext: 'Grâce à la tarification dynamique, aux ventes additionnelles, aux réservations directes et à la récupération des no-shows',
    hoursReclaimedSubtext: 'Temps restitué à votre équipe : réception, back-office et revenue management',
  },

  narratives: {
    titleSlideNarrative: ({ costSavings, revenueUplift, totalTime }) =>
      `Votre établissement économise ${costSavings} grâce à l'automatisation, génère ${revenueUplift} de nouveaux revenus et récupère ${totalTime} heures de travail — chaque année.`,

    guestExperienceNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews transforme votre réception, d\'un goulet d\'étranglement en un point de contact fluide pour vos clients.');
      if (active('checkIn')) {
        parts.push('Le check-in et le check-out numériques libèrent votre équipe pour se concentrer sur l\'hospitalité plutôt que sur la paperasse.');
      }
      if (active('roomAssignment')) {
        parts.push('L\'attribution automatique des chambres élimine une tâche chronophage quotidienne pour votre personnel de réception.');
      }
      if (active('upsell')) {
        parts.push(`Le portail client génère ${val('upsell')} de nouveaux revenus grâce à des offres de vente additionnelle personnalisées pendant le parcours de réservation.`);
      }
      if (active('directBooking')) {
        parts.push(`En favorisant les réservations directes, vous réduisez la dépendance aux OTA et conservez ${val('directBooking')} de plus par an.`);
      }
      return parts.join(' ');
    },

    paymentNarrative: ({ active, val }) => {
      const parts: string[] = [];
      parts.push('Mews Payments élimine la gestion manuelle des paiements — votre équipe financière consacre moins de temps à l\'administration et plus aux décisions stratégiques.');
      if (active('tokenization')) {
        parts.push('La tokenisation sécurisée automatise le traitement des transactions, épargnant à votre équipe des heures de travail répétitif.');
      }
      if (active('reconciliation')) {
        parts.push(`La réconciliation automatisée remplace le rapprochement manuel, récupérant ${val('reconciliation')} en coûts de main-d'œuvre.`);
      }
      if (active('chargeback')) {
        parts.push(`La prévention intégrée de la fraude réduit considérablement les contestations, économisant ${val('chargeback')} par an.`);
      }
      if (active('noShow')) {
        parts.push(`La garantie automatique par carte enregistrée récupère ${val('noShow')} en frais de no-show que vous auriez autrement passés en pertes.`);
      }
      if (active('multiCurrency')) {
        parts.push('Le support multi-devises permet aux clients internationaux de payer dans leur propre devise, supprimant les frictions et générant des revenus supplémentaires.');
      }
      return parts.join(' ');
    },

    rmsNarrative: ({ active, val }) => {
      const parts: string[] = [];
      if (active('revenueUplift')) {
        parts.push(`Mews RMS remplace l'intuition par une tarification dynamique pilotée par l'IA qui s'adapte aux conditions du marché en temps réel — un moteur d'optimisation des revenus 24h/24, 7j/7, générant ${val('revenueUplift')} de RevPAR supplémentaire.`);
      }
      if (active('rateAutomation')) {
        parts.push(`La distribution automatisée sur l'ensemble de vos plans tarifaires et canaux élimine des heures de mises à jour manuelles, économisant ${val('rateAutomation')} en coûts de main-d'œuvre et permettant à votre équipe de se concentrer sur la stratégie plutôt que sur les tableurs.`);
      }
      return parts.join(' ');
    },

    rmsManagerNote: (hasManager) =>
      hasManager
        ? 'Votre revenue manager peut se concentrer sur la stratégie et le positionnement marché plutôt que sur les tableurs.'
        : 'Vous bénéficiez d\'une optimisation des revenus de niveau entreprise sans avoir besoin d\'un revenue manager dédié — l\'IA gère la tarification en continu.',

    summaryNarrative: ({ moduleCount, costSavings, revenueUplift, totalTime }) =>
      `Sur ${moduleCount} module${moduleCount > 1 ? 's' : ''}, Mews génère ${costSavings} d'économies et ${revenueUplift} de nouveaux revenus — tout en libérant ${totalTime} heures de travail par an.`,

    pdfGuestExperienceNarrative: ({ upsellRevenue, commissionSaved, formatCurrency }) => {
      let text = 'Mews transforme votre réception, d\'un goulet d\'étranglement en un point de contact fluide pour vos clients. Le check-in et le check-out numériques libèrent votre équipe pour se concentrer sur l\'hospitalité plutôt que sur la paperasse, tandis que l\'attribution automatique des chambres élimine une tâche chronophage quotidienne.';
      if (upsellRevenue > 0) {
        text += ` Le portail client génère ${formatCurrency(upsellRevenue)} de nouveaux revenus grâce à des offres de vente additionnelle personnalisées pendant le parcours de réservation.`;
      }
      if (commissionSaved > 0) {
        text += ` En favorisant les réservations directes, vous réduisez la dépendance aux OTA et conservez ${formatCurrency(commissionSaved)} de plus par an.`;
      }
      return text;
    },

    pdfPaymentNarrative: ({ reconciliationCostSavings, chargebackReduction, chargebackRate, mewsChargebackRate, noShowRevenue, multiCurrencyRevenue, formatCurrency }) => {
      let text = 'Mews Payments élimine la gestion manuelle des paiements — votre équipe financière consacre moins de temps à l\'administration et plus aux décisions stratégiques. La tokenisation sécurisée automatise le traitement des transactions, épargnant à votre équipe des heures de travail répétitif.';
      if (reconciliationCostSavings > 0) {
        text += ` La réconciliation automatisée remplace le rapprochement manuel quotidien, récupérant ${formatCurrency(reconciliationCostSavings)} en coûts de main-d'œuvre.`;
      }
      if (chargebackReduction > 0) {
        text += ` La prévention intégrée de la fraude réduit votre taux de contestation de ${chargebackRate}% à ${mewsChargebackRate}%, économisant ${formatCurrency(chargebackReduction)} par an.`;
      }
      if (noShowRevenue > 0) {
        text += ` La garantie automatique par carte enregistrée récupère ${formatCurrency(noShowRevenue)} en frais de no-show que vous auriez autrement passés en pertes.`;
      }
      if (multiCurrencyRevenue > 0) {
        text += ` Le support multi-devises permet aux clients internationaux de payer dans leur propre devise, supprimant les frictions et générant ${formatCurrency(multiCurrencyRevenue)} de revenus supplémentaires.`;
      }
      return text;
    },

    pdfRmsNarrative: ({ annualRevenueGain, annualHoursSaved, annualLaborCostSavings, numberOfRooms, hasRevenueManager, hasExistingRMS, formatCurrency }) => {
      let text = `Mews RMS remplace l'intuition par une tarification dynamique pilotée par l'IA qui s'adapte aux conditions du marché en temps réel — un moteur d'optimisation des revenus 24h/24, 7j/7, générant ${formatCurrency(annualRevenueGain)} de RevPAR supplémentaire sur vos ${numberOfRooms} chambres.`;
      if (annualHoursSaved > 0) {
        text += ` La distribution automatisée sur l'ensemble de vos plans tarifaires et canaux élimine des heures de mises à jour manuelles, économisant ${formatCurrency(annualLaborCostSavings)} en coûts de main-d'œuvre.`;
      }
      text += hasRevenueManager
        ? ' Votre revenue manager peut se concentrer sur la stratégie et le positionnement marché plutôt que sur les tableurs.'
        : ' Vous bénéficiez d\'une optimisation des revenus de niveau entreprise sans avoir besoin d\'un revenue manager dédié — l\'IA gère la tarification en continu.';
      return text;
    },
  },

  slideFooter: 'Rapport ROI Mews',

  formulas: {
    checkIn: (p) => `${p.annualRes} réservations/an x (${p.checkInSaved} check-in + ${p.checkOutSaved} check-out économisés) / 60 = ${p.totalHours} h/an`,
    roomAssignment: (p) => `${p.annualRes} réservations/an x ${p.assignTime}/réservation / 60 = ${p.totalHours} h/an`,
    upsell: (p) => `${p.annualRes} réservations/an x ${p.cs}${p.adr} ADR x ${p.onlineCheckIn}% check-in en ligne x ${p.uplift}% hausse = ${p.total}`,
    directBooking: (p) => `${p.annualRes} réservations/an x ${p.directIncrease}% réservations directes en plus x ${p.cs}${p.adr} ADR x ${p.commission}% commission = ${p.total}`,
    tokenization: (p) => `${p.annualRes} réservations/an x ${p.seconds}s par transaction / 3 600 = ${p.totalHours} h/an`,
    chargeback: (p) => `(${p.currentRate}% - ${p.mewsRate}%) réduction x ${p.cs}${p.costPerMonth}/mois x 12 = ${p.total}`,
    reconciliation: (p) => `(${p.currentDaily} - ${p.mewsDaily}) h/jour x 365 jours = ${p.totalHours} h/an`,
    noShow: (p) => `${p.cs}${p.monthlyRev}/mois x 12 x ${p.noShowRate}% no-shows x ${p.uncollectedFees}% frais non perçus = ${p.total}`,
    multiCurrency: (p) => `${p.cs}${p.monthlyRev}/mois x 12 x ${p.foreignPercent}% étrangers x ${p.adoption}% adoption x ${p.share}% part = ${p.total}`,
    revenueUplift: (p) => `${p.cs}${p.revpar} RevPAR x ${p.upliftPercent}% hausse = ${p.cs}${p.revparUplift}/chambre/nuit x ${p.rooms} chambres x 365 jours = ${p.total}`,
    rateAutomation: (p) => `${p.updatesPerWeek} mises à jour/sem x 52 sem x ${p.ratePlans} plans x ${p.channels} canaux x ${p.updateTime} min / 60 = ${p.totalHours} h/an`,
  },
};

export default fr;
