import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveAccessToken } from '@/lib/reservations';
import { resetEnvironment } from '@/lib/reset-service';
import type { ResetOperationRequest, ResetOperationResponse } from '@/types/reset';
import { runInBackground } from '@/lib/background';
import { flushApiCallLogs } from '@/lib/api-call-logger';

/**
 * POST /api/reset-environment
 * Triggers a reset operation for a trial sandbox
 *
 * Request body:
 * - enterpriseId?: string (or)
 * - accessToken?: string
 *
 * Response (immediate):
 * - success: boolean
 * - message?: string
 * - enterpriseId?: string
 * - error?: string
 *
 * The reset operation runs in the background (fire-and-forget).
 * Progress can be tracked via the ResetOperationLog table.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ResetOperationResponse>> {
  try {
    const body: ResetOperationRequest = await request.json();
    const { enterpriseId, accessToken } = body;

    // Validate at least one identifier is provided
    if (!enterpriseId && !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either enterpriseId or accessToken must be provided'
        },
        { status: 400 }
      );
    }

    // Resolve access token
    console.log('[RESET-ENVIRONMENT] Resolving access token...');
    const { token, error: tokenError } = await resolveAccessToken(enterpriseId, accessToken);

    if (tokenError || !token) {
      console.error('[RESET-ENVIRONMENT] ❌ Failed to resolve access token:', tokenError);
      return NextResponse.json(
        {
          success: false,
          error: tokenError || 'Failed to resolve access token'
        },
        { status: enterpriseId ? 404 : 401 }
      );
    }

    // Get access token record from database
    console.log('[RESET-ENVIRONMENT] Looking up access token record...');
    const tokenRecord = await prisma.accessToken.findFirst({
      where: { accessToken: token, isEnabled: true },
      orderBy: { receivedAt: 'desc' }
    });

    if (!tokenRecord) {
      console.error('[RESET-ENVIRONMENT] ❌ Access token not found in database');
      return NextResponse.json(
        {
          success: false,
          error: 'Access token not found'
        },
        { status: 404 }
      );
    }

    // Trigger reset operation (fire-and-forget)
    console.log(
      `[RESET-ENVIRONMENT] 🔄 Starting reset operation for enterprise: ${tokenRecord.enterpriseId}`
    );

    // Run reset in background
    const resetWork = resetEnvironment(token, tokenRecord.enterpriseId, tokenRecord.id)
      .then(result => {
        console.log(
          `[RESET-ENVIRONMENT] ✅ Reset completed for ${tokenRecord.enterpriseId}:`,
          result.summary
        );
      })
      .catch(error => {
        console.error(
          `[RESET-ENVIRONMENT] ❌ Reset failed for ${tokenRecord.enterpriseId}:`,
          error
        );
      })
      .finally(() => {
        flushApiCallLogs().catch(err => console.error('[RESET-ENVIRONMENT] Failed to flush API call logs:', err));
      });
    runInBackground(resetWork);

    // Return immediate response
    return NextResponse.json(
      {
        success: true,
        message: 'Reset operation started. Check logs for progress.',
        enterpriseId: tokenRecord.enterpriseId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[RESET-ENVIRONMENT] ❌ Error:', error);
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
