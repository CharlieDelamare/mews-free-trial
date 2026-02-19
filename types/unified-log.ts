// TypeScript types for unified logging system

// === Core Types ===
export type LogType = 'environment' | 'reset' | 'demo_filler' | 'close_bills';
export type LogStatus = 'building' | 'processing' | 'completed' | 'failed';

// === operationDetails Types ===

/** Statistics for customer creation embedded in environment logs */
export interface CustomerSetupStats {
  status: 'processing' | 'completed' | 'failed';
  total: number;
  success: number;
  failed: number;
}

/** Statistics for reservation creation embedded in environment logs */
export interface ReservationSetupStats {
  status: 'processing' | 'completed' | 'failed';
  total: number;
  success: number;
  failed: number;
  byState?: Record<string, number>;
  failures?: Array<{
    error: string;
    skipped?: boolean;
    checkInUtc?: string;
    checkOutUtc?: string;
  }>;
}

/** Statistics for task creation embedded in environment logs */
export interface TaskSetupStats {
  status: 'processing' | 'completed' | 'failed';
  total: number;
  success: number;
  failed: number;
}

/** Combined setup statistics for environment logs */
export interface EnvironmentSetupStats {
  customers?: CustomerSetupStats;
  reservations?: ReservationSetupStats;
  tasks?: TaskSetupStats;
  [key: string]: any; // Index signature for Prisma Json compatibility
}

/** Operation details for reset logs */
export interface ResetOperationDetails {
  configuration?: {
    timezone?: string;
    nowUtc?: string;
  };
  services?: {
    serviceId?: string;
    serviceName?: string;
    serviceCount?: number;
    serviceIds?: string[];
  };
  reservationsFetched?: number;
  reservationsCanceled?: number;
  reservationsCancelFailed?: number;
  billsFetched?: number;
  billsClosed?: number;
  billsCloseFailed?: number;
  reservationsCreated?: number;
  reservationsCreateFailed?: number;
  errors?: string[];
  [key: string]: any; // Index signature for Prisma Json compatibility
}

/** Operation details for demo filler logs */
export interface DemoFillerDetails {
  byState?: Record<string, number>;
  [key: string]: any; // Index signature for Prisma Json compatibility
}

/** Operation details for close bills logs */
export interface CloseBillsDetails {
  totalBills?: number;
  billsClosed?: number;
  billsCloseFailed?: number;
  errors?: string[];
  [key: string]: any; // Index signature for Prisma Json compatibility
}

// === Base Log Interface ===
export interface BaseLog {
  id: string;
  logType: LogType;
  timestamp: Date | string;
  enterpriseId?: string | null;
  enterpriseName?: string; // Enriched from AccessToken
  status: LogStatus;
  completedAt?: Date | string | null;
  errorMessage?: string | null;
}

// === Log Type Interfaces ===

/** Environment creation log */
export interface EnvironmentLog extends BaseLog {
  logType: 'environment';
  propertyName: string;
  customerName: string;
  customerEmail: string;
  propertyCountry: string;
  propertyType: string;
  loginUrl: string;
  loginEmail: string;
  loginPassword: string;
  requestorEmail?: string | null;
  durationDays?: number | null;
  roomCount?: number | null;
  dormCount?: number | null;
  apartmentCount?: number | null;
  bedCount?: number | null;
  timezone?: string | null;
  salesforceAccountId?: string | null;
  operationDetails?: EnvironmentSetupStats | null;
}

/** Reset operation log */
export interface ResetLog extends BaseLog {
  logType: 'reset';
  currentStep: number;
  totalSteps: number;
  accessTokenId?: number | null;
  operationDetails?: ResetOperationDetails | null;
}

/** Demo filler operation log */
export interface DemoFillerLog extends BaseLog {
  logType: 'demo_filler';
  accessTokenId?: number | null;
  totalItems: number;
  successCount: number;
  failureCount: number;
  operationDetails?: DemoFillerDetails | null;
}

/** Close bills operation log */
export interface CloseBillsLog extends BaseLog {
  logType: 'close_bills';
  accessTokenId?: number | null;
  totalItems: number;
  successCount: number;
  failureCount: number;
  operationDetails?: CloseBillsDetails | null;
}

/** Discriminated union of all log types */
export type UnifiedLog = EnvironmentLog | ResetLog | DemoFillerLog | CloseBillsLog;

// === Type Guards ===

export function isEnvironmentLog(log: UnifiedLog): log is EnvironmentLog {
  return log.logType === 'environment';
}

export function isResetLog(log: UnifiedLog): log is ResetLog {
  return log.logType === 'reset';
}

export function isDemoFillerLog(log: UnifiedLog): log is DemoFillerLog {
  return log.logType === 'demo_filler';
}

export function isCloseBillsLog(log: UnifiedLog): log is CloseBillsLog {
  return log.logType === 'close_bills';
}

// === Input Types for Creating Logs ===

/** Input for creating an environment log */
export interface CreateEnvironmentLogInput {
  propertyName: string;
  customerName: string;
  customerEmail: string;
  propertyCountry: string;
  propertyType: string;
  loginUrl: string;
  loginEmail: string;
  loginPassword: string;
  status?: LogStatus;
  requestorEmail?: string | null;
  durationDays?: number | null;
  roomCount?: number | null;
  dormCount?: number | null;
  apartmentCount?: number | null;
  bedCount?: number | null;
  salesforceAccountId?: string | null;
}

/** Input for creating a reset log */
export interface CreateResetLogInput {
  enterpriseId: string;
  accessTokenId: number;
  totalSteps?: number;
}

/** Input for creating a demo filler log */
export interface CreateDemoFillerLogInput {
  enterpriseId: string;
  accessTokenId: number;
  totalItems: number;
}

/** Input for creating a close bills log */
export interface CreateCloseBillsLogInput {
  enterpriseId: string;
  accessTokenId: number;
}

// === Update Types ===

/** Partial update for environment logs */
export interface UpdateEnvironmentLogInput {
  status?: LogStatus;
  enterpriseId?: string;
  timezone?: string;
  errorMessage?: string;
  completedAt?: Date;
  operationDetails?: EnvironmentSetupStats;
}

/** Partial update for reset logs */
export interface UpdateResetLogInput {
  status?: LogStatus;
  currentStep?: number;
  errorMessage?: string;
  completedAt?: Date;
  operationDetails?: ResetOperationDetails;
}

/** Partial update for demo filler logs */
export interface UpdateDemoFillerLogInput {
  status?: LogStatus;
  successCount?: number;
  failureCount?: number;
  errorMessage?: string;
  completedAt?: Date;
  operationDetails?: DemoFillerDetails;
}

/** Partial update for close bills logs */
export interface UpdateCloseBillsLogInput {
  status?: LogStatus;
  successCount?: number;
  failureCount?: number;
  errorMessage?: string;
  completedAt?: Date;
  operationDetails?: CloseBillsDetails;
}

// === API Response Types ===

export interface UnifiedLogsResponse {
  success: boolean;
  logs: UnifiedLog[];
  error?: string;
}

// === API Call Log Types ===

export interface ApiCallSummary {
  id: number;
  timestamp: string;
  endpoint: string;
  method: string;
  group: string;
  statusCode: number | null;
  durationMs: number;
  success: boolean;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ApiCallDetail extends ApiCallSummary {
  requestBody: string | null;
  responseBody: string | null;
  url: string;
}

export interface ApiCallGroupSummary {
  group: string;
  count: number;
  avgDurationMs: number;
  totalDurationMs: number;
}

export interface ApiCallLogsResponse {
  success: boolean;
  apiCalls: ApiCallSummary[];
  total: number;
  successCount: number;
  failureCount: number;
  groups: ApiCallGroupSummary[];
}
