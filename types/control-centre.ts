// ============================================================
// Control Centre — TypeScript types
// ============================================================

// ── Literals ────────────────────────────────────────────────

export type ScenarioType =
  | 'individual'
  | 'groups'
  | 'hostel'
  | 'long_stay'
  | 'packages'
  | 'multi_service';

export type IbeTheme = 'luxury' | 'city' | 'resort' | 'conference' | 'budget';

export type ControlCentreLogType =
  | 'inspect'
  | 'morning_prep'
  | 'auto_checkout'
  | 'close_overdue_tasks'
  | 'scenario'
  | 'doors'
  | 'import';

export type ControlCentreLogStatus = 'processing' | 'completed' | 'failed';

// ── Dashboard ───────────────────────────────────────────────

export interface RoomStatusSummary {
  total: number;
  clean: number;
  dirty: number;
  inspected: number;
  outOfOrder: number;
}

export interface DashboardMetrics {
  rooms: RoomStatusSummary;
  arrivalsToday: number;
  departuresToday: number;
  overdueTaskCount: number;
  checkedInCount: number;
}

// ── Operations ──────────────────────────────────────────────

export interface OperationResult {
  successCount: number;
  failureCount: number;
  errors: string[];
}

// ── Scenario ────────────────────────────────────────────────

export interface ScenarioConfig {
  guestCount: number;
  dateSpreadDays: number;
  priceRangeMin: number;
  priceRangeMax: number;
  label: string;
  description: string;
}

// ── IBE ─────────────────────────────────────────────────────

export interface IbeThemeConfig {
  displayName: string;
  markup: number;        // e.g. 0.15 = 15% markup
  primaryColor: string;  // CSS hex
  description: string;
}

export interface IbeSearchParams {
  enterpriseId: string;
  serviceId?: string;
  checkIn: string;   // ISO date
  checkOut: string;  // ISO date
  guestCount: number;
  theme: IbeTheme;
}

export interface IbeSearchResult {
  rateId: string;
  rateName: string;
  basePrice: number;
  markedUpPrice: number;
  currency: string;
  resourceCategoryId: string;
  resourceCategoryName: string;
}

export interface IbeBookParams {
  enterpriseId: string;
  serviceId: string;
  rateId: string;
  resourceCategoryId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  theme: IbeTheme;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
}

export interface IbeBookResult {
  success: boolean;
  reservationId?: string;
  confirmationNumber?: string;
  sessionId?: string;
  error?: string;
}

// ── OTA ─────────────────────────────────────────────────────

export type OtaChannel = 'booking_com' | 'expedia' | 'airbnb' | 'agoda' | 'direct';

export interface OtaSimulateParams {
  enterpriseId: string;
  channel: OtaChannel;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}

export interface OtaSimulateResult {
  success: boolean;
  reservationId?: string;
  channel: OtaChannel;
  error?: string;
}

// ── Doors ────────────────────────────────────────────────────

export interface DoorAssignment {
  reservationId: string;
  guestName: string;
  roomName: string;
  tokenId?: string;
  tokenValue?: string;
  validFrom?: string;
  validTo?: string;
}

export interface DoorsResult {
  assignments: DoorAssignment[];
}

export interface DoorsProvisionResult {
  successCount: number;
  failureCount: number;
  errors: string[];
}

// ── CSV Import ───────────────────────────────────────────────

export interface ParsedCsvRow {
  GuestFirstName: string;
  GuestLastName: string;
  CheckIn: string;   // YYYY-MM-DD
  CheckOut: string;  // YYYY-MM-DD
  GuestCount: number;
  PricePerNight?: number;
  // Optional columns silently ignored:
  // RoomCategory, RateName
}

export interface CsvParseResult {
  rows: ParsedCsvRow[];
  errors: string[];
}

// ── API Route Request/Response interfaces ────────────────────

// POST /api/control-centre/status
export interface StatusRequest {
  enterpriseId: string;
}
export interface StatusResponse {
  success: boolean;
  metrics?: DashboardMetrics;
  error?: string;
}

// POST /api/control-centre/inspect
export interface InspectRequest {
  enterpriseId: string;
}
export interface InspectResponse {
  success: boolean;
  result?: OperationResult;
  error?: string;
}

// POST /api/control-centre/close-overdue-tasks
export interface CloseOverdueTasksRequest {
  enterpriseId: string;
}
export interface CloseOverdueTasksResponse {
  success: boolean;
  result?: OperationResult;
  error?: string;
}

// POST /api/control-centre/morning-prep (long-running)
export interface MorningPrepRequest {
  enterpriseId: string;
}
export interface MorningPrepResponse {
  success: boolean;
  logId?: string;
  message?: string;
  error?: string;
}

// POST /api/control-centre/auto-checkout (long-running)
export interface AutoCheckoutRequest {
  enterpriseId: string;
}
export interface AutoCheckoutResponse {
  success: boolean;
  logId?: string;
  message?: string;
  error?: string;
}

// POST /api/control-centre/scenario-provision (long-running)
export interface ScenarioProvisionRequest {
  enterpriseId: string;
  scenarioType: ScenarioType;
}
export interface ScenarioProvisionResponse {
  success: boolean;
  logId?: string;
  error?: string;
}

// POST /api/control-centre/ota-simulate
export interface OtaSimulateRequest extends OtaSimulateParams {}
export interface OtaSimulateResponse {
  success: boolean;
  result?: OtaSimulateResult;
  error?: string;
}

// POST /api/control-centre/ibe/search
export interface IbeSearchRequest extends IbeSearchParams {}
export interface IbeSearchResponse {
  success: boolean;
  results?: IbeSearchResult[];
  error?: string;
}

// POST /api/control-centre/ibe/book
export interface IbeBookRequest extends IbeBookParams {}
export interface IbeBookResponse {
  success: boolean;
  result?: IbeBookResult;
  error?: string;
}

// GET /api/control-centre/doors
export interface DoorsRequest {
  enterpriseId: string;
}
export interface DoorsResponse {
  success: boolean;
  result?: DoorsResult;
  error?: string;
}

// POST /api/control-centre/doors/provision (long-running)
export interface DoorsProvisionRequest {
  enterpriseId: string;
  reservationIds: string[];
}
export interface DoorsProvisionResponse {
  success: boolean;
  logId?: string;
  error?: string;
}

// POST /api/control-centre/doors/recover-split
export interface DoorsRecoverSplitRequest {
  enterpriseId: string;
}
export interface DoorsRecoverSplitResponse {
  success: boolean;
  result?: OperationResult;
  error?: string;
}

// POST /api/control-centre/import (long-running)
export interface ImportRequest {
  enterpriseId: string;
  csvText: string;
}
export interface ImportResponse {
  success: boolean;
  logId?: string;
  preview?: ParsedCsvRow[];
  validationErrors?: string[];
  error?: string;
}
