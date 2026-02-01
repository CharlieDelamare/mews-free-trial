import { NextRequest, NextResponse } from 'next/server';
import { resolveAccessToken, fetchReservations } from '@/lib/reservations';
import type { GetAllReservationsRequest, GetAllReservationsResponse } from '@/types/reservations';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: GetAllReservationsRequest = await request.json();
    const { enterpriseId, accessToken, serviceId, states } = body;

    // Validate at least one identifier is provided
    if (!enterpriseId && !accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either enterpriseId or accessToken must be provided'
        } as GetAllReservationsResponse,
        { status: 400 }
      );
    }

    // Resolve access token
    console.log('[GET-ALL-RESERVATIONS] Resolving access token...');
    const { token, error: tokenError } = await resolveAccessToken(enterpriseId, accessToken);

    if (tokenError || !token) {
      console.error('[GET-ALL-RESERVATIONS] ❌ Failed to resolve access token:', tokenError);
      return NextResponse.json(
        {
          success: false,
          error: tokenError || 'Failed to resolve access token'
        } as GetAllReservationsResponse,
        { status: enterpriseId ? 404 : 401 }
      );
    }

    // Fetch reservations from Mews API
    console.log('[GET-ALL-RESERVATIONS] Fetching reservations...');
    const { reservations, error: fetchError } = await fetchReservations({
      accessToken: token,
      serviceId,
      states
    });

    if (fetchError) {
      console.error('[GET-ALL-RESERVATIONS] ❌ Failed to fetch reservations:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: fetchError,
          details: { message: fetchError }
        } as GetAllReservationsResponse,
        { status: 500 }
      );
    }

    console.log(`[GET-ALL-RESERVATIONS] ✅ Successfully fetched ${reservations.length} reservations`);
    return NextResponse.json({
      success: true,
      reservations,
      count: reservations.length
    } as GetAllReservationsResponse);

  } catch (error) {
    console.error('[GET-ALL-RESERVATIONS] ❌ Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      } as GetAllReservationsResponse,
      { status: 500 }
    );
  }
}
