import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Disable caching - this endpoint needs fresh data on every request
export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

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
  signInUrl?: string | null;
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10)));
    const skip = (page - 1) * pageSize;

    // 1. Try the UnifiedLog table (primary path) with server-side pagination
    try {
      const [unifiedLogs, totalCount, activeCount] = await Promise.all([
        prisma.unifiedLog.findMany({
          orderBy: { timestamp: 'desc' },
          take: pageSize,
          skip,
        }),
        prisma.unifiedLog.count(),
        prisma.unifiedLog.count({
          where: { status: { in: ['building', 'processing', 'Updating'] } },
        }),
      ]);

      const logs: TransformedLog[] = unifiedLogs.map(log => ({
        id: log.id,
        logType: log.logType as 'environment' | 'reset' | 'demo_filler',
        type: log.logType as 'environment' | 'reset' | 'demo_filler',
        timestamp: log.timestamp.toISOString(),
        enterpriseId: log.enterpriseId,
        status: log.status,
        completedAt: log.completedAt?.toISOString() || null,
        errorMessage: log.errorMessage,
        propertyName: log.propertyName || undefined,
        customerName: log.customerName || undefined,
        customerEmail: log.customerEmail || undefined,
        propertyCountry: log.propertyCountry || undefined,
        propertyType: log.propertyType || undefined,
        loginUrl: log.loginUrl || undefined,
        loginEmail: log.loginEmail || undefined,
        loginPassword: log.loginPassword || undefined,
        signInUrl: log.signInUrl,
        requestorEmail: log.requestorEmail,
        durationDays: log.durationDays,
        salesforceAccountId: log.salesforceAccountId,
        operationDetails: log.operationDetails,
        currentStep: log.currentStep || undefined,
        totalSteps: log.totalSteps || undefined,
        totalItems: log.totalItems || undefined,
        successCount: log.successCount || undefined,
        failureCount: log.failureCount || undefined,
      }));

      // Enrich with enterprise names
      const enterpriseIds = Array.from(new Set(logs.map(l => l.enterpriseId).filter((id): id is string => id != null)));
      if (enterpriseIds.length > 0) {
        const tokens = await prisma.accessToken.findMany({
          where: { enterpriseId: { in: enterpriseIds } },
          select: { enterpriseId: true, enterpriseName: true },
          distinct: ['enterpriseId'],
        });
        const nameMap = new Map(tokens.map(t => [t.enterpriseId, t.enterpriseName]));
        for (const log of logs) {
          if (log.enterpriseId) {
            log.enterpriseName = nameMap.get(log.enterpriseId);
          }
        }
      }

      return NextResponse.json({
        success: true,
        logs,
        totalCount,
        page,
        pageSize,
        hasActiveOperations: activeCount > 0,
      });
    } catch (error) {
      console.log('[LOGS API] UnifiedLog table not available, using legacy tables');
    }

    // 2. Legacy fallback: fetch from old tables (no pagination — degraded mode)
    const [environmentLogs, customerLogs, reservationLogs] = await Promise.all([
      prisma.environmentLog.findMany({
        orderBy: { timestamp: 'desc' },
      }),
      prisma.customerCreationLog.findMany({
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          enterpriseId: true,
          accessTokenId: true,
          totalCustomers: true,
          successCount: true,
          failureCount: true,
          startedAt: true,
          completedAt: true,
          status: true,
          errorSummary: true,
          // Exclude customerResults (large JSON)
        },
      }),
      prisma.reservationCreationLog.findMany({
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          enterpriseId: true,
          accessTokenId: true,
          totalReservations: true,
          successCount: true,
          failureCount: true,
          startedAt: true,
          completedAt: true,
          status: true,
          errorSummary: true,
          reservationResults: true, // Needed for .byState extraction
          // Exclude individual per-item results where possible
        },
      }),
    ]);

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

    const allLogs: TransformedLog[] = [];

    // Use Set for O(1) dedup instead of O(n) .some()
    const seenEnvironmentNames = new Set<string>();

    for (const log of environmentLogs) {
      if (seenEnvironmentNames.has(log.propertyName)) {
        continue;
      }
      seenEnvironmentNames.add(log.propertyName);

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

      // Use Set for O(1) dedup with composite key (enterpriseId + timestamp second)
      const seenResetKeys = new Set(
        allLogs
          .filter(l => l.logType === 'reset')
          .map(l => `${l.enterpriseId}|${Math.floor(new Date(l.timestamp).getTime() / 1000)}`)
      );

      for (const log of resetLogs) {
        const ts = Math.floor(log.startedAt.getTime() / 1000);
        const key = `${log.enterpriseId}|${ts}`;
        if (seenResetKeys.has(key) ||
            seenResetKeys.has(`${log.enterpriseId}|${ts - 1}`) ||
            seenResetKeys.has(`${log.enterpriseId}|${ts + 1}`)) {
          continue;
        }
        seenResetKeys.add(key);

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
      allLogs.map(l => l.enterpriseId).filter((id): id is string => id != null)
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

    // Apply pagination to legacy fallback
    const paginatedLogs = allLogs.slice(skip, skip + pageSize);

    return NextResponse.json({
      success: true,
      logs: paginatedLogs,
      totalCount: allLogs.length,
      page,
      pageSize,
      hasActiveOperations,
    });
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
