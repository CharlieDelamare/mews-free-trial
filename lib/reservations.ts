import { prisma } from './prisma';

// Hardcoded client token for Mews demo environment (fallback)
const MEWS_CLIENT_TOKEN = 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';

/**
 * Resolves access token from enterpriseId or returns provided token
 */
export async function resolveAccessToken(
  enterpriseId?: string,
  accessToken?: string
): Promise<{ token: string; error?: string }> {
  if (accessToken) {
    console.log('[RESERVATIONS] Using provided access token');
    return { token: accessToken };
  }

  if (enterpriseId) {
    console.log('[RESERVATIONS] Looking up access token for enterprise:', enterpriseId);
    try {
      const tokenRecord = await prisma.accessToken.findFirst({
        where: { enterpriseId, isEnabled: true },
        orderBy: { receivedAt: 'desc' }
      });

      if (!tokenRecord) {
        console.error('[RESERVATIONS] ❌ No active access token found for enterprise:', enterpriseId);
        return {
          token: '',
          error: `No active access token found for enterprise ${enterpriseId}`
        };
      }

      console.log('[RESERVATIONS] ✅ Found access token for enterprise:', enterpriseId);
      return { token: tokenRecord.accessToken };
    } catch (error) {
      console.error('[RESERVATIONS] ❌ Database error looking up token:', error);
      return {
        token: '',
        error: 'Database error retrieving access token'
      };
    }
  }

  console.error('[RESERVATIONS] ❌ Either enterpriseId or accessToken must be provided');
  return { token: '', error: 'Either enterpriseId or accessToken must be provided' };
}

/**
 * Fetches all reservations from Mews API
 */
export async function fetchReservations(params: {
  accessToken: string;
  serviceId?: string;
  states?: string[];
}): Promise<{ reservations: any[]; error?: string }> {
  const apiUrl = process.env.MEWS_API_URL || 'https://api.mews-demo.com';
  const clientToken = process.env.MEWS_CLIENT_TOKEN || MEWS_CLIENT_TOKEN;

  try {
    console.log('[RESERVATIONS] Fetching reservations from Mews API...');
    const response = await fetch(`${apiUrl}/api/connector/v1/reservations/getAll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: clientToken,
        AccessToken: params.accessToken,
        Client: 'Mews Free Trial App',
        ServiceIds: params.serviceId ? [params.serviceId] : undefined,
        States: params.states,
        Limitation: { Count: 1000 }
      })
    });

    const data = await response.json();

    if (!response.ok || !data.Reservations) {
      console.error('[RESERVATIONS] ❌ Failed to fetch reservations:', data);
      return {
        reservations: [],
        error: data.Message || `Failed to fetch reservations: HTTP ${response.status}`
      };
    }

    console.log(`[RESERVATIONS] ✅ Fetched ${data.Reservations.length} reservations`);
    return { reservations: data.Reservations };
  } catch (error) {
    console.error('[RESERVATIONS] ❌ Error fetching reservations:', error);
    return {
      reservations: [],
      error: error instanceof Error ? error.message : 'Unknown error fetching reservations'
    };
  }
}

/**
 * Cancels a single reservation
 */
export async function cancelReservation(params: {
  accessToken: string;
  reservationId: string;
  postCancellationFee?: boolean;
  sendEmail?: boolean;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const apiUrl = process.env.MEWS_API_URL || 'https://api.mews-demo.com';
  const clientToken = process.env.MEWS_CLIENT_TOKEN || MEWS_CLIENT_TOKEN;

  try {
    console.log(`[RESERVATIONS] Canceling reservation: ${params.reservationId}`);
    const response = await fetch(`${apiUrl}/api/connector/v1/reservations/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: clientToken,
        AccessToken: params.accessToken,
        Client: 'Mews Free Trial App',
        ReservationIds: [params.reservationId],
        PostCancellationFee: params.postCancellationFee ?? false,
        SendEmail: params.sendEmail ?? false,
        Notes: params.notes || 'Canceled via Free Trial App'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[RESERVATIONS] ❌ Failed to cancel reservation ${params.reservationId}:`, data);
      return {
        success: false,
        error: data.Message || `HTTP ${response.status}`
      };
    }

    console.log(`[RESERVATIONS] ✅ Successfully canceled reservation: ${params.reservationId}`);
    return { success: true };
  } catch (error) {
    console.error(`[RESERVATIONS] ❌ Error canceling reservation ${params.reservationId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
