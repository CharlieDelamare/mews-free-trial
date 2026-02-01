import { NextRequest, NextResponse } from 'next/server';
import { resolveAccessToken, fetchReservations, cancelReservation } from '@/lib/reservations';
import type {
  CancelAllReservationsRequest,
  CancelAllReservationsResponse,
  CancellationResult
} from '@/types/reservations';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CancelAllReservationsRequest = await request.json();
    const {
      enterpriseId,
      accessToken,
      serviceId,
      postCancellationFee,
      sendEmail,
      notes
    } = body;

    // Validate at least one identifier is provided
    if (!enterpriseId && !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either enterpriseId or accessToken must be provided'
        } as CancelAllReservationsResponse,
        { status: 400 }
      );
    }

    // Resolve access token
    console.log('[CANCEL-ALL-RESERVATIONS] Resolving access token...');
    const { token, error: tokenError } = await resolveAccessToken(enterpriseId, accessToken);

    if (tokenError || !token) {
      console.error('[CANCEL-ALL-RESERVATIONS] ❌ Failed to resolve access token:', tokenError);
      return NextResponse.json(
        {
          success: false,
          error: tokenError || 'Failed to resolve access token'
        } as CancelAllReservationsResponse,
        { status: enterpriseId ? 404 : 401 }
      );
    }

    // Step 1: Fetch all reservations
    console.log('[CANCEL-ALL-RESERVATIONS] Fetching all reservations...');
    const { reservations, error: fetchError } = await fetchReservations({
      accessToken: token,
      serviceId,
      states: ['Confirmed', 'Started'] // Only fetch cancelable reservations
    });

    if (fetchError) {
      console.error('[CANCEL-ALL-RESERVATIONS] ❌ Failed to fetch reservations:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: fetchError,
          details: { message: fetchError }
        } as CancelAllReservationsResponse,
        { status: 500 }
      );
    }

    // If no reservations found, return success with 0 count
    if (reservations.length === 0) {
      console.log('[CANCEL-ALL-RESERVATIONS] ℹ️  No reservations to cancel');
      return NextResponse.json({
        success: true,
        summary: {
          totalFound: 0,
          attempted: 0,
          succeeded: 0,
          failed: 0
        },
        results: []
      } as CancelAllReservationsResponse);
    }

    console.log(`[CANCEL-ALL-RESERVATIONS] Found ${reservations.length} reservations to cancel`);

    // Step 2: Cancel each reservation
    const results: CancellationResult[] = [];
    let succeeded = 0;
    let failed = 0;

    for (const reservation of reservations) {
      const result = await cancelReservation({
        accessToken: token,
        reservationId: reservation.Id,
        postCancellationFee,
        sendEmail,
        notes
      });

      results.push({
        reservationId: reservation.Id,
        reservationNumber: reservation.Number,
        success: result.success,
        error: result.error
      });

      if (result.success) {
        succeeded++;
      } else {
        failed++;
      }
    }

    // Determine overall success
    const allSucceeded = failed === 0;

    console.log(
      `[CANCEL-ALL-RESERVATIONS] ${allSucceeded ? '✅' : '⚠️'} Completed: ${succeeded} succeeded, ${failed} failed`
    );

    return NextResponse.json({
      success: allSucceeded,
      summary: {
        totalFound: reservations.length,
        attempted: reservations.length,
        succeeded,
        failed
      },
      results
    } as CancelAllReservationsResponse);

  } catch (error) {
    console.error('[CANCEL-ALL-RESERVATIONS] ❌ Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      } as CancelAllReservationsResponse,
      { status: 500 }
    );
  }
}
