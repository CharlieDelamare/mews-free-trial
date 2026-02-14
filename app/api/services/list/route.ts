import { NextRequest, NextResponse } from 'next/server';
import { resolveAccessToken } from '@/lib/reservations';
import { fetchBookableServices } from '@/lib/mews-data-service';
import { getMewsClientToken } from '@/lib/config';

interface ServiceListRequest {
  enterpriseId: string;
}

interface ServiceListResponse {
  success: boolean;
  services?: Array<{ id: string; name: string }>;
  error?: string;
}

/**
 * POST /api/services/list
 * Fetches bookable services for a given enterprise.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ServiceListResponse>> {
  try {
    const body: ServiceListRequest = await request.json();
    const { enterpriseId } = body;

    if (!enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'enterpriseId is required' },
        { status: 400 }
      );
    }

    const { token, error: tokenError } = await resolveAccessToken(enterpriseId);
    if (tokenError || !token) {
      return NextResponse.json(
        { success: false, error: tokenError || 'Failed to resolve access token' },
        { status: 404 }
      );
    }

    const clientToken = getMewsClientToken();
    const services = await fetchBookableServices(clientToken, token);

    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error('[SERVICES-LIST] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
