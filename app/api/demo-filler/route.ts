import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveAccessToken } from '@/lib/reservations';
import { createReservationsForEnvironment } from '@/lib/reservation-service';
import { createDemoFillerLog, updateUnifiedLog } from '@/lib/unified-logger';
import { log, logError } from '@/lib/force-log';
import { runInBackground } from '@/lib/background';

interface DemoFillerRequest {
  enterpriseId: string;
  serviceId?: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  reservationCount: number;
}

interface DemoFillerResponse {
  success: boolean;
  message?: string;
  error?: string;
  enterpriseId?: string;
}

/**
 * POST /api/demo-filler
 * Creates custom reservations for a demo environment
 *
 * Request body:
 * - enterpriseId: string
 * - startDate: string (ISO date)
 * - endDate: string (ISO date)
 * - reservationCount: number (1-500)
 *
 * Response (immediate):
 * - success: boolean
 * - message?: string
 * - error?: string
 *
 * The reservation creation runs in the background (fire-and-forget).
 * Uses the full reservation creation flow with proper state distribution,
 * room preparation, and state transitions.
 */
export async function POST(request: NextRequest): Promise<NextResponse<DemoFillerResponse>> {
  try {
    const body: DemoFillerRequest = await request.json();
    const { enterpriseId, serviceId, startDate, endDate, reservationCount } = body;

    // Log API endpoint entry
    log.demoFiller('API endpoint called', {
      enterpriseId,
      startDate,
      endDate,
      reservationCount
    });

    // Validate required fields
    if (!enterpriseId) {
      return NextResponse.json(
        {
          success: false,
          error: 'enterpriseId is required'
        },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'startDate and endDate are required'
        },
        { status: 400 }
      );
    }

    if (!reservationCount || reservationCount < 1 || reservationCount > 500) {
      return NextResponse.json(
        {
          success: false,
          error: 'reservationCount must be between 1 and 500'
        },
        { status: 400 }
      );
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use ISO date strings (YYYY-MM-DD)'
        },
        { status: 400 }
      );
    }

    // Ensure start date is today or in the future
    const startDateOnly = new Date(start);
    startDateOnly.setHours(0, 0, 0, 0);
    if (startDateOnly < today) {
      return NextResponse.json(
        {
          success: false,
          error: 'Start date must be today or in the future'
        },
        { status: 400 }
      );
    }

    // Ensure end date is today or in the future
    const endDateOnly = new Date(end);
    endDateOnly.setHours(0, 0, 0, 0);
    if (endDateOnly < today) {
      return NextResponse.json(
        {
          success: false,
          error: 'End date must be today or in the future'
        },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        {
          success: false,
          error: 'End date must be after start date'
        },
        { status: 400 }
      );
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'Date range must be at least 3 days'
        },
        { status: 400 }
      );
    }

    // Resolve access token
    log.demoFiller('Resolving access token', { enterpriseId });
    const { token, error: tokenError } = await resolveAccessToken(enterpriseId);

    if (tokenError || !token) {
      console.error('[DEMO-FILLER] ❌ Failed to resolve access token:', tokenError);
      return NextResponse.json(
        {
          success: false,
          error: tokenError || 'Failed to resolve access token'
        },
        { status: 404 }
      );
    }

    // Get access token record from database
    log.demoFiller('Looking up access token record', {});
    const tokenRecord = await prisma.accessToken.findFirst({
      where: { accessToken: token, isEnabled: true },
      orderBy: { receivedAt: 'desc' }
    });

    if (!tokenRecord) {
      console.error('[DEMO-FILLER] ❌ Access token not found in database');
      return NextResponse.json(
        {
          success: false,
          error: 'Access token not found'
        },
        { status: 404 }
      );
    }

    // Create log entry for this demo filler operation
    console.log('[DEMO-FILLER] Creating demo filler log entry...');
    let logId: string | null = null;
    try {
      // Create a new demo filler log entry
      const newLog = await createDemoFillerLog({
        enterpriseId: tokenRecord.enterpriseId,
        accessTokenId: tokenRecord.id,
        totalItems: reservationCount
      });
      logId = newLog.id;
      console.log(`[DEMO-FILLER] Log entry created with ID: ${logId}`);
    } catch (logError) {
      console.error('[DEMO-FILLER] ⚠️ Failed to create log entry:', logError);
      // Continue even if logging fails
    }

    // Trigger reservation creation (fire-and-forget)
    log.demoFiller('Starting fire-and-forget operation', {
      enterpriseId: tokenRecord.enterpriseId,
      startDate,
      endDate,
      reservationCount,
      days: daysDiff
    });

    // Run reservation creation in background
    // skipStateTransitions keeps all reservations in Confirmed state
    const reservationWork = createReservationsForEnvironment(token, tokenRecord.enterpriseId, tokenRecord.id, {
      dateRange: { start, end },
      reservationCount,
      skipStateTransitions: true,
      operationType: 'demo_filler',
      logId: logId || undefined,
      serviceId
    })
      .then(result => {
        log.demoFiller('Operation completed', {
          enterpriseId: tokenRecord.enterpriseId,
          totalReservations: result.totalReservations,
          successCount: result.successCount,
          failureCount: result.failureCount,
          durationSeconds: result.durationSeconds
        });

        // Update log entry to completed
        if (logId) {
          updateUnifiedLog(logId, {
            status: 'completed',
            successCount: result.successCount,
            failureCount: result.failureCount,
            completedAt: new Date()
          })
            .catch(err => console.error('[DEMO-FILLER] Failed to update log:', err));
        }
      })
      .catch(error => {
        logError.demoFiller(`Failed for ${tokenRecord.enterpriseId}`, error);

        // Update log entry to failure
        if (logId) {
          updateUnifiedLog(logId, {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            completedAt: new Date()
          }).catch(err => console.error('[DEMO-FILLER] Failed to update log:', err));
        }
      });
    runInBackground(reservationWork);

    // Return immediate response
    return NextResponse.json(
      {
        success: true,
        message: `Creating ${reservationCount} reservations from ${startDate} to ${endDate}. Check logs for progress.`,
        enterpriseId: tokenRecord.enterpriseId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DEMO-FILLER] ❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Disable caching for this endpoint
export const dynamic = 'force-dynamic';
