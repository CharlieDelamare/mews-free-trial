// TypeScript types for reset environment operations

export interface ResetOperationRequest {
  enterpriseId?: string;
  accessToken?: string;
}

export interface ResetOperationResponse {
  success: boolean;
  operationId?: string;
  message?: string;
  enterpriseId?: string;
  error?: string;
}

export interface ResetOperationLog {
  id: number;
  enterpriseId: string;
  accessTokenId: number;
  status: 'processing' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  startedAt: Date;
  completedAt?: Date;
  errorSummary?: string;
  operationDetails?: ResetOperationDetails;
}

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

export interface ResetResult {
  success: boolean;
  operationId: string;
  summary: ResetOperationDetails;
  durationSeconds: number;
}

export enum ResetStep {
  INIT = 0,
  GET_CONFIG = 1,
  GET_SERVICES = 2,
  GET_RESERVATIONS = 3,
  CANCEL_RESERVATIONS = 4,
  GET_BILLS = 5,
  CLOSE_BILLS = 6,
  CREATE_RESERVATIONS = 7,
  COMPLETE = 8
}

// Bill-related types
export interface Bill {
  Id: string;
  AccountId: string;
  State?: string;
  [key: string]: any;
}

export interface OrderItem {
  Id: string;
  BillId: string;
  Amount: {
    Currency: string;
    GrossValue: number;
    NetValue?: number;
    TaxValues?: any[];
  };
  ConsumedUtc?: string;
  [key: string]: any;
}

export interface PaymentItem {
  Id: string;
  BillId: string;
  AccountId?: string;
  Amount: {
    Currency: string;
    GrossValue: number;
    NetValue?: number;
  };
  State?: string;
  Type?: string;
  [key: string]: any;
}

export interface BillCloseResult {
  billId: string;
  accountId: string;
  success: boolean;
  error?: string;
  totalAmount?: number;
  currency?: string;
  paymentPosted?: boolean;
}

export interface CloseBillsResult {
  totalBills: number;
  successCount: number;
  failureCount: number;
  details: BillCloseResult[];
}
