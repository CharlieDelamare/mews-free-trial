// ─── Excel Sheet Types ─────────────────────────────────────────────────────

export interface GeneralQuestionsData {
  type?: string;
  name?: string;
  chainName?: string;
  email?: string;
  telephone?: string;
  websiteUrl?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
  timeZoneId?: string;
  currency?: string;
  checkInTime?: string;
  checkOutTime?: string;
  pricingMode?: string;
}

export interface ResourceCategory {
  name: string;
  spaceType?: string;
  classification?: string;
  capacity?: number;
  description?: string;
}

export interface Resource {
  name: string;
  categoryName?: string;
  floor?: string;
  description?: string;
}

export interface ResourceFeature {
  name: string;
  classification?: string;
}

export interface BookableService {
  name: string;
  productType?: string;
  pricingMode?: string;
  description?: string;
}

export interface ProductCategory {
  name: string;
  serviceName?: string;
}

export interface BookableProduct {
  name: string;
  categoryName?: string;
  productType?: string;
  pricingMode?: string;
  pricing?: string;
  consumptionMoment?: string;
  description?: string;
}

export interface AdditionalService {
  name: string;
  productType?: string;
  pricingMode?: string;
  description?: string;
}

export interface AdditionalProduct {
  name: string;
  serviceName?: string;
  categoryName?: string;
  productType?: string;
  pricingMode?: string;
  pricing?: string;
  consumptionMoment?: string;
  description?: string;
}

export interface BusinessSegment {
  name: string;
  description?: string;
}

export interface Department {
  name: string;
  description?: string;
}

export interface RateGroup {
  name: string;
  rateType?: string;
  description?: string;
}

export interface BaseRate {
  name: string;
  rateGroupName?: string;
  isEnabled?: boolean;
  description?: string;
}

export interface DerivedRate {
  name: string;
  baseRateName?: string;
  adjustment?: string;
  description?: string;
}

export interface RatePrice {
  baseRateName?: string;
  startDate?: string;
  endDate?: string;
  value?: number;
  currencyCode?: string;
}

export interface AccountingCategory {
  name: string;
  code?: string;
  classification?: string;
  description?: string;
}

export interface Translation {
  [key: string]: string | undefined;
}

export interface ExcelTask {
  name?: string;
  description?: string;
  departmentName?: string;
}

// Raw row data from Parameters sheet — used to populate dropdowns
export interface ParametersData {
  propertyTypes: string[];
  pricingModes: string[];
  spaceTypes: string[];
  classifications: string[];
  rateTypes: string[];
  productTypes: string[];
  consumptionMoments: string[];
  countryCodes: Array<{ code: string; name: string }>;
  reservationStrategies: string[];
  availabilityStrategies: string[];
  reservationPurposes: string[];
}

export interface ExcelData {
  generalQuestions: GeneralQuestionsData;
  resourceCategories: ResourceCategory[];
  resources: Resource[];
  resourceFeatures: ResourceFeature[];
  bookableServices: BookableService[];
  bookableProductCategories: ProductCategory[];
  bookableProducts: BookableProduct[];
  additionalServices: AdditionalService[];
  additionalProductCategories: ProductCategory[];
  additionalProducts: AdditionalProduct[];
  businessSegments: BusinessSegment[];
  departments: Department[];
  rateGroups: RateGroup[];
  baseRates: BaseRate[];
  derivedRates: DerivedRate[];
  ratePrices: RatePrice[];
  accountingCategories: AccountingCategory[];
  translations: Translation[];
  tasks: ExcelTask[];
  parameters: ParametersData;
}

// ─── Config Q&A Answer Types (Steps 6–9) ──────────────────────────────────

export interface DistributionAnswers {
  channels?: string[];
  otaLandscape?: string;
  inventoryMirroring?: string;
  accountOwnership?: string;
  taxAndBreakfastHandling?: string;
  channelMapping?: string;
  importChannelReservations?: boolean | null;
}

export interface CancellationPolicyAnswer {
  rateGroupName: string;
  freeCancellationHours?: number;
  penaltyType?: 'FirstNight' | 'FullStay' | 'Percentage' | 'None';
  penaltyValue?: number;
  description?: string;
}

export interface PolicyAnswers {
  cancellationPolicies?: CancellationPolicyAnswer[];
  autoChargeRule?: string;
  otaPaymentFlow?: string;
  acceptedPaymentMethods?: string[];
  depositHandling?: string;
  depositDetails?: string;
}

export interface CityTaxAnswer {
  exists: boolean;
  name?: string;
  amount?: number;
  calculationBase?: 'PerPersonPerNight' | 'PerRoomPerNight';
  exemptions?: string;
}

export interface TaxAnswers {
  cityTax?: CityTaxAnswer;
  cancellationTaxTreatment?: string;
  datevEnabled?: boolean | null;
  paymentMethodPosting?: string;
}

export interface UserAnswer {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface GuestJourneyAnswers {
  ibeCardRequirement?: string;
  ibeLanguage?: string;
  ibeBrandColor?: string;
  termsUrl?: string;
  privacyUrl?: string;
  users?: UserAnswer[];
  twoFactorMethod?: string;
}

export interface OnboardingAnswers {
  distribution?: DistributionAnswers;
  policies?: PolicyAnswers;
  taxes?: TaxAnswers;
  guestJourney?: GuestJourneyAnswers;
}

// ─── Session Shape ─────────────────────────────────────────────────────────

export type OnboardingStatus = 'draft' | 'exported' | 'pushed';

export interface OnboardingSessionData {
  id: string;
  propertyName: string | null;
  status: OnboardingStatus;
  currentStep: number;
  createdBy: string | null;
  enterpriseId: string | null;
  accessTokenId: number | null;
  excelData: ExcelData | null;
  answers: OnboardingAnswers | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Push Types ────────────────────────────────────────────────────────────

export interface PushResult {
  item: string;
  status: 'pushed' | 'staged' | 'failed';
  endpointNote?: string;
  payload?: unknown;
  error?: string;
}

// ─── Wizard Steps ──────────────────────────────────────────────────────────

export interface WizardStep {
  index: number;
  label: string;
  shortLabel: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  { index: 0,  label: 'Upload file',           shortLabel: 'Upload' },
  { index: 1,  label: 'Property basics',       shortLabel: 'Property' },
  { index: 2,  label: 'Rooms & space',         shortLabel: 'Rooms' },
  { index: 3,  label: 'Services & products',   shortLabel: 'Services' },
  { index: 4,  label: 'Rates & packages',      shortLabel: 'Rates' },
  { index: 5,  label: 'Accounting categories', shortLabel: 'Accounting' },
  { index: 6,  label: 'Distribution & OTAs',   shortLabel: 'Distribution' },
  { index: 7,  label: 'Policies & payments',   shortLabel: 'Policies' },
  { index: 8,  label: 'Taxes & accounting',    shortLabel: 'Taxes' },
  { index: 9,  label: 'Guest journey & legal', shortLabel: 'Journey' },
  { index: 10, label: 'Connect & push',        shortLabel: 'Connect' },
];
