export interface CustomerStats {
  status: 'processing' | 'completed' | 'failed';
  total: number;
  success: number;
  failed: number;
}

export interface ReservationStats {
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

export interface EnvironmentSetupStats {
  customers?: CustomerStats;
  reservations?: ReservationStats;
}

export interface BaseLog {
  id: string;
  logType: 'environment' | 'reset' | 'demo_filler';
  type: 'environment' | 'reset' | 'demo_filler';
  timestamp: string;
  enterpriseId?: string;
  enterpriseName?: string;
  status: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface EnvironmentLog extends BaseLog {
  logType: 'environment';
  type: 'environment';
  propertyName: string;
  customerName: string;
  customerEmail: string;
  propertyCountry: string;
  propertyType: string;
  loginUrl: string;
  loginEmail: string;
  loginPassword: string;
  status: 'building' | 'processing' | 'completed' | 'failed' | 'Updating' | 'failure';
  requestorEmail?: string;
  durationDays?: number;
  salesforceAccountId?: string;
  operationDetails?: EnvironmentSetupStats;
}

export interface ResetLog extends BaseLog {
  logType: 'reset';
  type: 'reset';
  status: 'processing' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  operationDetails?: any;
}

export interface DemoFillerLog extends BaseLog {
  logType: 'demo_filler';
  type: 'demo_filler';
  status: 'processing' | 'completed' | 'failed';
  totalItems: number;
  successCount: number;
  failureCount: number;
  operationDetails?: { byState?: Record<string, number> };
}

export type UnifiedLog = EnvironmentLog | ResetLog | DemoFillerLog;
