// ── State slices ──────────────────────────────────────────────────────

import type { LanguageCode } from './translations';

export interface ConfigState {
  title: string;
  country: string;
  usState: string;            // U.S. state name (empty string = national average)
  currencySymbol: string;
  hotelType: string;
  isInitialLoad: boolean;
  presentationLanguage: LanguageCode;
}

export type ModuleKey = 'guestExperience' | 'payment' | 'rms' | 'housekeeping';

export interface EnabledModules {
  guestExperience: boolean;
  payment: boolean;
  rms: boolean;
  housekeeping: boolean;
}

export type PresetKey = 'full' | 'guest-experience' | 'payment' | 'rms' | 'operations' | 'custom';

export interface LeverExpansion {
  module: ModuleKey;
  lever: string;
}

export interface UIState {
  // Export
  isExportModalOpen: boolean;
  selectedSections: string[];
  isExporting: boolean;

  // Module toggle system
  enabledModules: EnabledModules;
  activeDetailModule: ModuleKey | null;
  activePreset: PresetKey;

  // Presentation mode (full-screen presentation)
  cinematicMode: boolean;
  cinematicSlideIndex: number;
  cinematicAutoAdvance: boolean;

  // Property edit popover
  propertyEditOpen: boolean;

  // Progressive disclosure
  expandedLever: LeverExpansion | null;   // Level 2: lever detail visible
  editingLever: LeverExpansion | null;    // Level 3: sliders visible
}

export interface GuestExperienceInputs {
  reservationsPerMonth: number;
  averageStaffWage: number;
  averageDailyRate: number;
  checkInTime: number;
  checkOutTime: number;
  mewsCheckInTime: number;
  mewsCheckOutTime: number;
  roomAssignmentTime: number;
  currentCheckInPercentage: number;
  onlineCheckInPercentage: number;
  revenueUplift: number;
  currentDirectBookingPercent: number;
  directBookingIncrease: number;
  averageCommission: number;
}

export interface PaymentInputs {
  transactionsPerMonth: number;
  secondsPerTransaction: number;
  processingWage: number;
  chargebackRate: number;
  mewsChargebackRate: number;
  chargebackVolume: number;
  chargebackCostPerMonth: number;
  reconciliationTimeDaily: number;
  mewsReconciliationTimeDaily: number;
  reconciliationWage: number;
  monthlyRevenue: number;
  noShowRate: number;
  noShowWithoutFee: number;
  foreignCurrencyPercent: number;
  multiCurrencyAdoption: number;
  revenueShare: number;
}

export interface HousekeepingInputs {
  hkStaffOnDuty: number;
  hkStaffOnDutyIsManual: boolean;         // false = auto-calculated, true = user override
  departureCleanTime: number;              // minutes
  stayoverCleanTime: number;               // minutes
  amenityCostPerRoomNight: number;         // local currency
  amenityReductionPct: number;             // fraction e.g. 0.05 = 5% reduction (set by smart defaults, not user-editable)
  roomAssignmentTimeManual: number;        // minutes per HK staff per day (set by smart defaults, not user-editable)
  roomAssignmentMethod: 'manual' | 'partially_digital' | 'fully_digital';
  usesHousekeepingSoftware: boolean;
  hasExistingHousekeepingApp: boolean;    // true = already uses HK app → module disabled; false = no HK app → module enabled (default)
}

export interface RMSInputs {
  hotelRevPAR: number;
  numberOfRooms: number;
  numberOfRatePlans: number;
  rateUpdateFrequency: string;
  rateChangesPerWeek: number;
  numberOfChannels: number;
  avgTimeToUpdateRate: number;
  hasRevenueManager: boolean;
  hasExistingRMS: boolean;
  estimatedRevenueUplift: number;
}

export interface SharedVariables {
  // Primary inputs (user-controlled)
  numberOfRooms: number;
  averageDailyRate: number;
  occupancyRate: number;       // % (0-100)
  avgLengthOfStay: number;     // average nights per reservation

  // Derived (auto-calculated from above, can be manually overridden)
  reservationsPerMonth: number;  // = rooms × 30 × occupancy% / avgStay
  monthlyRevenue: number;        // = rooms × ADR × 30 × occupancy%

  // Staffing costs (hourly rate)
  staffHourlyWage: number;
}

export interface CalculatorState {
  config: ConfigState;
  ui: UIState;
  sharedVariables: SharedVariables;
  guestExperience: GuestExperienceInputs;
  payment: PaymentInputs;
  rms: RMSInputs;
  housekeeping: HousekeepingInputs;
}

// ── Derived / computed values ─────────────────────────────────────────

export interface CheckInSavings {
  annualCheckInTimeSaved: number;
  annualCheckOutTimeSaved: number;
  annualTotalCostSavings: number;
}

export interface RoomAssignmentSavings {
  annualTimeSaved: number;
  annualCostSaving: number;
}

export interface TimeCostSavings {
  annualHoursSaved: number;
  annualCostSavings: number;
}

export interface GuestExperienceResults {
  checkInSavings: CheckInSavings;
  roomAssignmentSavings: RoomAssignmentSavings;
  upsellRevenue: number;
  commissionSaved: number;
  totalTime: number;
  totalSavings: number;
}

export interface PaymentResults {
  tokenizationTimeSaved: number;
  tokenizationCostSavings: number;
  chargebackReduction: number;
  reconciliationTimeSaved: number;
  reconciliationCostSavings: number;
  noShowRevenue: number;
  multiCurrencyRevenue: number;
  totalTime: number;
  totalSavings: number;
}

export interface RMSResults {
  estimatedRevenueUplift: number;
  revPARUplift: number;
  newHotelRevPAR: number;
  annualRevenueGain: number;
  avgUpdatesPerWeek: number;
  annualHoursSaved: number;
  annualLaborCostSavings: number;
  totalTime: number;
  totalSavings: number;
}

export interface HousekeepingResults {
  roomAssignmentHours: number;
  roomAssignmentCost: number;
  cleaningStatusHours: number;
  cleaningStatusCost: number;
  maintenanceCommHours: number;
  maintenanceCommCost: number;
  taskMgmtHours: number;
  taskMgmtCost: number;
  amenitiesCostSaved: number;
  paperCostSaved: number;
  totalTime: number;
  totalSavings: number;
}

export interface CostRevenueSplit {
  costSavings: number;
  revenueUplift: number;
  timeSavingsEquivalent: number;
}

export interface ModuleContribution {
  key: ModuleKey;
  label: string;
  savings: number;
  time: number;
  costRevenue: CostRevenueSplit;
  color: string;
  textColor: string;
}

export interface FilteredResults {
  totalTime: number;
  totalSavings: number;
  costSavings: number;
  revenueUplift: number;
  contributions: ModuleContribution[];
}

export interface CalculatorResults {
  guestExperience: GuestExperienceResults;
  payment: PaymentResults;
  rms: RMSResults;
  housekeeping: HousekeepingResults;
  totalTimeSaved: number;
  totalAnnualSavings: number;
}

// ── Lever descriptor types ────────────────────────────────────────────

export interface SliderConfig {
  field: string;
  slice: 'sharedVariables' | 'guestExperience' | 'payment' | 'rms' | 'housekeeping';
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  color?: 'yellow' | 'orange' | 'purple' | 'pink';
  isShared?: boolean;
  formatValue?: (v: number) => string;
  tooltip?: string;
}

export interface LeverDescriptor {
  key: string;
  label: string;
  resultValue: number;
  resultUnit: 'currency' | 'hours';
  resultType: 'costSaving' | 'revenueUplift' | 'timeReclaimed';
  monetaryEquivalent?: number;
  summary: string;
  summaryParams?: Record<string, string | number>;
  sliders: SliderConfig[];
}

// ── Reducer action ────────────────────────────────────────────────────

export type CalculatorAction =
  | { type: 'SET_FIELD'; slice: 'config'; field: keyof ConfigState; value: ConfigState[keyof ConfigState] }
  | { type: 'SET_FIELD'; slice: 'ui'; field: keyof UIState; value: UIState[keyof UIState] }
  | { type: 'SET_FIELD'; slice: 'sharedVariables'; field: keyof SharedVariables; value: number }
  | { type: 'SET_FIELD'; slice: 'guestExperience'; field: keyof GuestExperienceInputs; value: number }
  | { type: 'SET_FIELD'; slice: 'payment'; field: keyof PaymentInputs; value: number }
  | { type: 'SET_FIELD'; slice: 'rms'; field: keyof RMSInputs; value: RMSInputs[keyof RMSInputs] }
  | { type: 'SET_FIELD'; slice: 'housekeeping'; field: keyof HousekeepingInputs; value: HousekeepingInputs[keyof HousekeepingInputs] }
  | { type: 'TOGGLE_EXPORT_SECTION'; sectionId: string }
  | { type: 'APPLY_DEFAULTS'; defaults: Omit<CalculatorState, 'config' | 'ui'> }
  | { type: 'OPEN_EXPORT' }
  | { type: 'SET_EXPORTING'; value: boolean }
  | { type: 'CLOSE_EXPORT' }
  | { type: 'TOGGLE_MODULE'; module: ModuleKey }
  | { type: 'SET_ACTIVE_DETAIL'; module: ModuleKey | null }
  | { type: 'APPLY_PRESET'; preset: PresetKey }
  | { type: 'ENTER_CINEMATIC' }
  | { type: 'EXIT_CINEMATIC' }
  | { type: 'CINEMATIC_NEXT' }
  | { type: 'CINEMATIC_PREV' }
  | { type: 'TOGGLE_CINEMATIC_AUTO' }
  | { type: 'OPEN_PROPERTY_EDIT' }
  | { type: 'CLOSE_PROPERTY_EDIT' }
  | { type: 'EXPAND_LEVER'; module: ModuleKey; lever: string }
  | { type: 'EDIT_LEVER'; module: ModuleKey; lever: string }
  | { type: 'COLLAPSE_LEVER' };
