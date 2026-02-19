import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveAccessToken } from '@/lib/reservations';
import { closeBillsForEnvironment } from '@/lib/bill-service';
import { createCloseBillsLog, updateUnifiedLog } from '@/lib/unified-logger';
import { runInBackground } from '@/lib/background';

interface CloseBillsRequest {
  enterpriseId: string;
}

interface CloseBillsResponse {
  success: boolean;
  message?: string;
  error?: string;
  enterpriseId?: string;
}

/**
 * POST /api/close-bills
 * Closes all open bills for a sandbox environment.
 *
 * For each open bill:
 * 1. Fetches order items and calculates the total
 * 2. Posts an external cash payment if the balance is non-zero
 * 3. Closes the bill
 *
 * The operation runs in the background (fire-and-forget).
 * Progress is tracked via the unified logs system.
 */
export async function POST(request: NextRequest): Promise<NextResponse<CloseBillsResponse>> {
  try {
    const body: CloseBillsRequest = await request.json();
    const { enterpriseId } = body;

    if (!enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'enterpriseId is required' },
        { status: 400 }
      );
    }

    // Resolve access token
    console.log('[CLOSE-BILLS] Resolving access token for', enterpriseId);
    const { token, error: tokenError } = await resolveAccessToken(enterpriseId);

    if (tokenError || !token) {
      console.error('[CLOSE-BILLS] ❌ Failed to resolve access token:', tokenError);
      return NextResponse.json(
        { success: false, error: tokenError || 'Failed to resolve access token' },
        { status: 404 }
      );
    }

    // Get access token record from database
    const tokenRecord = await prisma.accessToken.findFirst({
      where: { accessToken: token, isEnabled: true },
      orderBy: { receivedAt: 'desc' }
    });

    if (!tokenRecord) {
      console.error('[CLOSE-BILLS] ❌ Access token not found in database');
      return NextResponse.json(
        { success: false, error: 'Access token not found' },
        { status: 404 }
      );
    }

    // Create log entry
    console.log('[CLOSE-BILLS] Creating log entry...');
    let logId: string | null = null;
    try {
      const newLog = await createCloseBillsLog({
        enterpriseId: tokenRecord.enterpriseId,
        accessTokenId: tokenRecord.id,
      });
      logId = newLog.id;
      console.log(`[CLOSE-BILLS] Log entry created with ID: ${logId}`);
    } catch (logErr) {
      console.error('[CLOSE-BILLS] ⚠️ Failed to create log entry:', logErr);
    }

    // Fire-and-forget: close all bills
    const closeBillsWork = closeBillsForEnvironment(token, logId || undefined)
      .then(result => {
        console.log(
          `[CLOSE-BILLS] ✅ Completed for ${tokenRecord.enterpriseId}: ${result.successCount}/${result.totalBills} bills closed`
        );

        if (logId) {
          updateUnifiedLog(logId, {
            status: result.failureCount > 0 && result.successCount === 0 ? 'failed' : 'completed',
            successCount: result.successCount,
            failureCount: result.failureCount,
            completedAt: new Date(),
            operationDetails: {
              totalBills: result.totalBills,
              billsClosed: result.successCount,
              billsCloseFailed: result.failureCount,
            }
          }).catch(err => console.error('[CLOSE-BILLS] Failed to update log:', err));
        }
      })
      .catch(error => {
        console.error(`[CLOSE-BILLS] ❌ Failed for ${tokenRecord.enterpriseId}:`, error);
        if (logId) {
          updateUnifiedLog(logId, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date()
          }).catch(err => console.error('[CLOSE-BILLS] Failed to update log:', err));
        }
      });
    runInBackground(closeBillsWork);

    return NextResponse.json(
      {
        success: true,
        message: 'Close bills operation started. Check logs for progress.',
        enterpriseId: tokenRecord.enterpriseId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[CLOSE-BILLS] ❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
