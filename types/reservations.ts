// Reservation state types as defined by Mews API
export type ReservationState =
  | 'Confirmed'
  | 'Started'
  | 'Processed'
  | 'Canceled'
  | 'Optional'
  | 'Inquired'
  | 'Requested';

// Mews reservation object structure
export interface MewsReservation {
  Id: string;
  ServiceId: string;
  AccountId: string;
  State: ReservationState;
  ScheduledStartUtc: string;
  ScheduledEndUtc: string;
  ActualStartUtc?: string;
  ActualEndUtc?: string;
  AssignedResourceId?: string;
  RateId: string;
  Number?: string;
  CreatedUtc: string;
  UpdatedUtc: string;
}

// Request/Response types for GET ALL endpoint
export interface GetAllReservationsRequest {
  enterpriseId?: string;
  accessToken?: string;
  serviceId?: string;
  states?: string[];
}

export interface GetAllReservationsResponse {
  success: boolean;
  reservations?: MewsReservation[];
  count?: number;
  cursor?: string;
  error?: string;
  details?: any;
}

// Request/Response types for CANCEL ALL endpoint
export interface CancelAllReservationsRequest {
  enterpriseId?: string;
  accessToken?: string;
  serviceId?: string;
  postCancellationFee?: boolean;
  sendEmail?: boolean;
  notes?: string;
}

export interface CancellationResult {
  reservationId: string;
  reservationNumber?: string;
  success: boolean;
  error?: string;
}

export interface CancelAllReservationsResponse {
  success: boolean;
  summary?: {
    totalFound: number;
    attempted: number;
    succeeded: number;
    failed: number;
  };
  results?: CancellationResult[];
  error?: string;
  details?: any;
}
