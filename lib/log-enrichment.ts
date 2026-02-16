import { CustomerCreationLog, ReservationCreationLog } from '@prisma/client';
import type { EnvironmentLog } from '@/types/unified-log';

/**
 * Breakdown of reservation counts by state
 */
export interface ReservationStateBreakdown {
  Confirmed: number;
  Started: number;
  Processed: number;
  Canceled: number;
  Optional: number;
}

/**
 * Statistics about customer and reservation creation for an environment
 */
export interface EnvironmentStatistics {
  customersCreated: number | null;
  customersFailed: number | null;
  reservationsCreated: number | null;
  reservationsFailed: number | null;
  reservationsByState: ReservationStateBreakdown | null;
  isProcessing: boolean;
  hasFailed: boolean;
}

/**
 * Environment log enriched with customer and reservation statistics
 */
export interface EnrichedEnvironmentLog extends EnvironmentLog {
  statistics: EnvironmentStatistics;
}

/**
 * Parses reservation results JSON to extract state breakdown counts
 */
export function parseReservationStates(
  log: ReservationCreationLog | undefined
): ReservationStateBreakdown | null {
  if (!log?.reservationResults) {
    return null;
  }

  const stateCounts: ReservationStateBreakdown = {
    Confirmed: 0,
    Started: 0,
    Processed: 0,
    Canceled: 0,
    Optional: 0,
  };

  try {
    const results = log.reservationResults as Array<{
      id?: string;
      desiredState?: string;
      error?: string;
    }>;

    if (!Array.isArray(results)) {
      return null;
    }

    results.forEach((res) => {
      if (res.desiredState && res.desiredState in stateCounts) {
        stateCounts[res.desiredState as keyof ReservationStateBreakdown]++;
      }
    });

    return stateCounts;
  } catch (error) {
    console.error('Error parsing reservation states:', error);
    return null;
  }
}

/**
 * Builds statistics object from environment log and related creation logs
 */
export function buildStatistics(
  envLog: EnvironmentLog,
  customerLog: CustomerCreationLog | undefined,
  reservationLog: ReservationCreationLog | undefined
): EnvironmentStatistics {
  const isProcessing =
    customerLog?.status === 'processing' || reservationLog?.status === 'processing';
  const hasFailed =
    customerLog?.status === 'failed' || reservationLog?.status === 'failed';

  return {
    customersCreated: customerLog?.successCount ?? null,
    customersFailed: customerLog?.failureCount ?? null,
    reservationsCreated: reservationLog?.successCount ?? null,
    reservationsFailed: reservationLog?.failureCount ?? null,
    reservationsByState: parseReservationStates(reservationLog),
    isProcessing,
    hasFailed,
  };
}

/**
 * Enriches environment logs with customer and reservation statistics
 *
 * @param envLogs - Base environment logs
 * @param customerLogs - All customer creation logs
 * @param reservationLogs - All reservation creation logs
 * @returns Enriched environment logs with statistics
 */
export function enrichEnvironmentLogs(
  envLogs: EnvironmentLog[],
  customerLogs: CustomerCreationLog[],
  reservationLogs: ReservationCreationLog[]
): EnrichedEnvironmentLog[] {
  // Build lookup maps for O(1) access
  const customerMap = new Map<string, CustomerCreationLog>();
  const reservationMap = new Map<string, ReservationCreationLog>();

  // Populate maps with most recent log per enterprise
  customerLogs.forEach((log) => {
    if (!customerMap.has(log.enterpriseId)) {
      customerMap.set(log.enterpriseId, log);
    }
  });

  reservationLogs.forEach((log) => {
    if (!reservationMap.has(log.enterpriseId)) {
      reservationMap.set(log.enterpriseId, log);
    }
  });

  // Enrich each environment log with statistics
  return envLogs.map((envLog) => {
    const enterpriseId = envLog.enterpriseId || '';
    const customerLog = customerMap.get(enterpriseId);
    const reservationLog = reservationMap.get(enterpriseId);

    return {
      ...envLog,
      statistics: buildStatistics(envLog, customerLog, reservationLog),
    };
  });
}
