import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveAccessToken } from '@/lib/reservations';
import { createReservationsForEnvironment } from '@/lib/reservation-service';

interface DemoFillerRequest {
  enterpriseId: string;
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
 * - reservationCount: number (1-100)
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
    const { enterpriseId, startDate, endDate, reservationCount } = body;

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

    if (!reservationCount || reservationCount < 1 || reservationCount > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'reservationCount must be between 1 and 100'
        },
        { status: 400 }
      );
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use ISO date strings (YYYY-MM-DD)'
        },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        {
          success: false,
          error: 'startDate must be before endDate'
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
    console.log('[DEMO-FILLER] Resolving access token...');
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
    console.log('[DEMO-FILLER] Looking up access token record...');
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

    // Trigger reservation creation (fire-and-forget)
    console.log(
      `[DEMO-FILLER] 🎯 Starting demo filler for enterprise: ${tokenRecord.enterpriseId}`,
      {
        startDate,
        endDate,
        reservationCount,
        days: daysDiff
      }
    );

    // Run reservation creation in background without awaiting
    // skipStateTransitions keeps all reservations in Confirmed state
    createReservationsForEnvironment(token, tokenRecord.enterpriseId, tokenRecord.id, {
      dateRange: { start, end },
      reservationCount,
      skipStateTransitions: true
    })
      .then(result => {
        console.log(
          `[DEMO-FILLER] ✅ Completed for ${tokenRecord.enterpriseId}:`,
          {
            totalReservations: result.totalReservations,
            successCount: result.successCount,
            failureCount: result.failureCount,
            durationSeconds: result.durationSeconds
          }
        );
      })
      .catch(error => {
        console.error(
          `[DEMO-FILLER] ❌ Failed for ${tokenRecord.enterpriseId}:`,
          error
        );
      });

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
