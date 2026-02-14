import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Disable caching - this endpoint needs fresh data on every request
export const dynamic = 'force-dynamic';

interface TransformedLog {
  id: string;
  logType: 'environment' | 'reset' | 'demo_filler';
  type: 'environment' | 'reset' | 'demo_filler';
  timestamp: string;
  enterpriseId?: string | null;
  enterpriseName?: string;
  status: string;
  completedAt?: string | null;
  errorMessage?: string | null;
  // Environment-specific
  propertyName?: string;
  customerName?: string;
  customerEmail?: string;
  propertyCountry?: string;
  propertyType?: string;
  loginUrl?: string;
  loginEmail?: string;
  loginPassword?: string;
  requestorEmail?: string | null;
  durationDays?: number | null;
  salesforceAccountId?: string | null;
  operationDetails?: any;
  // Reset-specific
  currentStep?: number;
  totalSteps?: number;
  // Demo filler-specific
  totalItems?: number;
  successCount?: number;
  failureCount?: number;
}

export async function GET() {
  try {
    const allLogs: TransformedLog[] = [];

    // 1. Try to fetch from new UnifiedLog table first
    try {
      const unifiedLogs = await prisma.unifiedLog.findMany({
        orderBy: { timestamp: 'desc' },
      });

      for (const log of unifiedLogs) {
        allLogs.push({
          id: log.id,
          logType: log.logType as 'environment' | 'reset' | 'demo_filler',
          type: log.logType as 'environment' | 'reset' | 'demo_filler',
          timestamp: log.timestamp.toISOString(),
          enterpriseId: log.enterpriseId,
          status: log.status,
          completedAt: log.completedAt?.toISOString() || null,
          errorMessage: log.errorMessage,
          // Environment fields
          propertyName: log.propertyName || undefined,
          customerName: log.customerName || undefined,
          customerEmail: log.customerEmail || undefined,
          propertyCountry: log.propertyCountry || undefined,
          propertyType: log.propertyType || undefined,
          loginUrl: log.loginUrl || undefined,
          loginEmail: log.loginEmail || undefined,
          loginPassword: log.loginPassword || undefined,
          requestorEmail: log.requestorEmail,
          durationDays: log.durationDays,
          salesforceAccountId: log.salesforceAccountId,
          operationDetails: log.operationDetails,
          // Reset fields
          currentStep: log.currentStep || undefined,
          totalSteps: log.totalSteps || undefined,
          // Demo filler fields
          totalItems: log.totalItems || undefined,
          successCount: log.successCount || undefined,
          failureCount: log.failureCount || undefined,
        });
      }
    } catch (error) {
      console.log('[LOGS API] UnifiedLog table not available, using legacy tables only');
    }

    // 2. Fetch from legacy EnvironmentLog table
    const environmentLogs = await prisma.environmentLog.findMany({
      orderBy: { timestamp: 'desc' },
    });

    // Get customer/reservation stats for each environment log
    const customerLogs = await prisma.customerCreationLog.findMany({
      orderBy: { startedAt: 'desc' },
    });
    const reservationLogs = await prisma.reservationCreationLog.findMany({
      orderBy: { startedAt: 'desc' },
    });

    // Create lookup maps
    const customerLogsByEnterprise = new Map<string, typeof customerLogs[0]>();
    for (const log of customerLogs) {
      if (!customerLogsByEnterprise.has(log.enterpriseId)) {
        customerLogsByEnterprise.set(log.enterpriseId, log);
      }
    }

    const reservationLogsByEnterprise = new Map<string, typeof reservationLogs[0]>();
    for (const log of reservationLogs) {
      if (!reservationLogsByEnterprise.has(log.enterpriseId)) {
        reservationLogsByEnterprise.set(log.enterpriseId, log);
      }
    }

    for (const log of environmentLogs) {
      // Skip if already in unified logs (by property name match)
      if (allLogs.some(l => l.logType === 'environment' && l.propertyName === log.propertyName)) {
        continue;
      }

      // Build operationDetails from legacy customer/reservation logs
      let operationDetails: any = undefined;
      if (log.enterpriseId) {
        const customerLog = customerLogsByEnterprise.get(log.enterpriseId);
        const reservationLog = reservationLogsByEnterprise.get(log.enterpriseId);

        if (customerLog || reservationLog) {
          operationDetails = {};
          if (customerLog) {
            operationDetails.customers = {
              status: customerLog.status === 'completed' ? 'completed' :
                      customerLog.status === 'failed' ? 'failed' : 'processing',
              total: customerLog.totalCustomers,
              success: customerLog.successCount,
              failed: customerLog.failureCount,
            };
          }
          if (reservationLog) {
            operationDetails.reservations = {
              status: reservationLog.status === 'completed' ? 'completed' :
                      reservationLog.status === 'failed' ? 'failed' : 'processing',
              total: reservationLog.totalReservations,
              success: reservationLog.successCount,
              failed: reservationLog.failureCount,
              byState: (reservationLog.reservationResults as any)?.byState,
            };
          }
        }
      }

      // Normalize status: 'Updating' -> 'processing', 'failure' -> 'failed'
      let normalizedStatus = log.status;
      if (normalizedStatus === 'Updating') normalizedStatus = 'processing';
      if (normalizedStatus === 'failure') normalizedStatus = 'failed';

      allLogs.push({
        id: log.id,
        logType: 'environment',
        type: 'environment',
        timestamp: log.timestamp.toISOString(),
        enterpriseId: log.enterpriseId,
        status: normalizedStatus,
        errorMessage: log.errorMessage,
        propertyName: log.propertyName,
        customerName: log.customerName,
        customerEmail: log.customerEmail,
        propertyCountry: log.propertyCountry,
        propertyType: log.propertyType,
        loginUrl: log.loginUrl,
        loginEmail: log.loginEmail,
        loginPassword: log.loginPassword,
        requestorEmail: log.requestorEmail,
        durationDays: log.durationDays,
        salesforceAccountId: log.salesforceAccountId,
        operationDetails,
      });
    }

    // 3. Fetch from legacy ResetOperationLog table
    try {
      const resetLogs = await prisma.resetOperationLog.findMany({
        orderBy: { startedAt: 'desc' },
      });

      for (const log of resetLogs) {
        // Skip if already in unified logs
        if (allLogs.some(l => l.logType === 'reset' && l.enterpriseId === log.enterpriseId &&
            Math.abs(new Date(l.timestamp).getTime() - log.startedAt.getTime()) < 1000)) {
          continue;
        }

        allLogs.push({
          id: String(log.id),
          logType: 'reset',
          type: 'reset',
          timestamp: log.startedAt.toISOString(),
          enterpriseId: log.enterpriseId,
          status: log.status,
          completedAt: log.completedAt?.toISOString() || null,
          errorMessage: log.errorSummary,
          currentStep: log.currentStep,
          totalSteps: log.totalSteps,
          operationDetails: log.operationDetails,
        });
      }
    } catch (error) {
      console.log('[LOGS API] ResetOperationLog table query failed:', error);
    }

    // 4. Fetch enterprise names for all logs
    const enterpriseIds = Array.from(new Set(
      allLogs.map(l => l.enterpriseId).filter((id): id is string => id !== null && id !== undefined)
    ));

    if (enterpriseIds.length > 0) {
      const tokens = await prisma.accessToken.findMany({
        where: { enterpriseId: { in: enterpriseIds } },
        select: { enterpriseId: true, enterpriseName: true },
        distinct: ['enterpriseId'],
      });

      const nameMap = new Map(tokens.map(t => [t.enterpriseId, t.enterpriseName]));

      for (const log of allLogs) {
        if (log.enterpriseId) {
          log.enterpriseName = nameMap.get(log.enterpriseId);
        }
      }
    }

    // 5. Sort all logs by timestamp descending
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 6. Determine if any operations are still in progress
    const ACTIVE_STATUSES = new Set(['building', 'processing', 'Updating']);
    const hasActiveOperations = allLogs.some(log => ACTIVE_STATUSES.has(log.status));

    return NextResponse.json({ success: true, logs: allLogs, hasActiveOperations });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
