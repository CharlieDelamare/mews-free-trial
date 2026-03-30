// ── Language codes & metadata ────────────────────────────────────────

export type LanguageCode =
  | 'en' | 'fr' | 'es' | 'de' | 'it'
  | 'nl' | 'pt' | 'cs' | 'da' | 'sv'
  | 'no' | 'fi';

export interface SupportedLanguage {
  code: LanguageCode;
  label: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pt', label: 'Português' },
  { code: 'cs', label: 'Čeština' },
  { code: 'da', label: 'Dansk' },
  { code: 'sv', label: 'Svenska' },
  { code: 'no', label: 'Norsk' },
  { code: 'fi', label: 'Suomi' },
];

// ── Translation dictionary shape ────────────────────────────────────

export interface TranslationDictionary {
  /** Short UI labels used across presentation & export */
  labels: {
    totalAnnualImpact: string;
    costSavings: string;
    revenueUplift: string;
    hoursReclaimed: string;
    annualImpact: string;
    impactSummary: string;
    hrs: string;
    perYear: string;
    // PDF MetricCard labels
    annualRevenueGain: string;
    laborCostSavings: string;
    timeSaved: string;
    // PDF info cards
    revpar: string;
    rooms: string;
    revenueUpliftPercent: string;
    // Export modal
    exportRoiReport: string;
    chooseSections: string;
    selectAtLeastOne: string;
    cancel: string;
    exportPdf: string;
    generating: string;
  };

  /** Module display names */
  modules: {
    guestExperience: string;
    payment: string;
    rms: string;
    housekeeping: string;
  };

  /** Short lever labels for cinematic slides */
  levers: {
    checkIn: string;
    roomAssignment: string;
    upsell: string;
    directBooking: string;
    tokenization: string;
    chargeback: string;
    reconciliation: string;
    noShow: string;
    multiCurrency: string;
    revenueUplift: string;
    rateAutomation: string;
    // Housekeeping levers
    hkRoomAssignment: string;
    cleaningStatusUpdates: string;
    maintenanceCommunication: string;
    taskManagement: string;
    amenitiesReduction: string;
    paperElimination: string;
  };

  /** Longer lever labels for PDF slides */
  pdfLevers: {
    checkInAutomation: string;
    roomAssignment: string;
    guestPortalUpselling: string;
    directBookingCommission: string;
    paymentTokenization: string;
    chargebackReduction: string;
    autoReconciliation: string;
    noShowFeeCapture: string;
    multiCurrencyRevenue: string;
    dynamicPricingUplift: string;
    rateUpdateAutomation: string;
    // Housekeeping PDF levers
    hkRoomAssignmentAutomation: string;
    hkCleaningStatusUpdates: string;
    hkMaintenanceCommunication: string;
    hkTaskManagement: string;
    hkAmenitiesReduction: string;
    hkPaperElimination: string;
  };

  /** Lever result type badge labels */
  leverResultType: {
    timeReclaimed: string;
    costSaving: string;
    revenueUplift: string;
  };

  /** Title slide KPI subtexts */
  subtexts: {
    costSavingsSubtext: string;
    revenueUpliftSubtext: string;
    hoursReclaimedSubtext: string;
  };

  /** Dynamic narrative template functions */
  narratives: {
    titleSlideNarrative: (p: {
      costSavings: string;
      revenueUplift: string;
      totalTime: string;
    }) => string;

    guestExperienceNarrative: (p: {
      active: (key: string) => boolean;
      val: (key: string) => string;
    }) => string;

    paymentNarrative: (p: {
      active: (key: string) => boolean;
      val: (key: string) => string;
      chargebackRate?: number;
      mewsChargebackRate?: number;
    }) => string;

    rmsNarrative: (p: {
      active: (key: string) => boolean;
      val: (key: string) => string;
      rooms?: number;
    }) => string;

    rmsManagerNote: (hasManager: boolean) => string;

    summaryNarrative: (p: {
      moduleCount: number;
      costSavings: string;
      revenueUplift: string;
      totalTime: string;
    }) => string;

    /** PDF-specific guest experience narrative (slightly different from cinematic) */
    pdfGuestExperienceNarrative: (p: {
      upsellRevenue: number;
      commissionSaved: number;
      formatCurrency: (v: number) => string;
    }) => string;

    /** PDF-specific payment narrative */
    pdfPaymentNarrative: (p: {
      reconciliationCostSavings: number;
      chargebackReduction: number;
      chargebackRate: number;
      mewsChargebackRate: number;
      noShowRevenue: number;
      multiCurrencyRevenue: number;
      formatCurrency: (v: number) => string;
    }) => string;

    /** PDF-specific RMS narrative */
    pdfRmsNarrative: (p: {
      annualRevenueGain: number;
      annualHoursSaved: number;
      annualLaborCostSavings: number;
      numberOfRooms: number;
      hasRevenueManager: boolean;
      hasExistingRMS: boolean;
      formatCurrency: (v: number) => string;
    }) => string;

    /** Housekeeping narrative (cinematic) */
    housekeepingNarrative: (p: {
      active: (key: string) => boolean;
      val: (key: string) => string;
    }) => string;

    /** PDF-specific housekeeping narrative */
    pdfHousekeepingNarrative: (p: {
      totalTime: number;
      totalSavings: number;
      amenitiesCostSaved: number;
      formatCurrency: (v: number) => string;
    }) => string;
  };

  /** Slide footer text */
  slideFooter: string;

  /** Formula summary template functions for lever calculation displays */
  formulas: {
    checkIn: (p: Record<string, string | number>) => string;
    roomAssignment: (p: Record<string, string | number>) => string;
    upsell: (p: Record<string, string | number>) => string;
    directBooking: (p: Record<string, string | number>) => string;
    tokenization: (p: Record<string, string | number>) => string;
    chargeback: (p: Record<string, string | number>) => string;
    reconciliation: (p: Record<string, string | number>) => string;
    noShow: (p: Record<string, string | number>) => string;
    multiCurrency: (p: Record<string, string | number>) => string;
    revenueUplift: (p: Record<string, string | number>) => string;
    rateAutomation: (p: Record<string, string | number>) => string;
    // Housekeeping formulas
    hkRoomAssignment: (p: Record<string, string | number>) => string;
    cleaningStatusUpdates: (p: Record<string, string | number>) => string;
    maintenanceCommunication: (p: Record<string, string | number>) => string;
    taskManagement: (p: Record<string, string | number>) => string;
    amenitiesReduction: (p: Record<string, string | number>) => string;
    paperElimination: (p: Record<string, string | number>) => string;
  };
}
