import { NextRequest, NextResponse } from 'next/server';

const MEWS_EXTEND_URL = 'https://app.mews-demo.com/api/general/v1/enterprises/extendExpiration';

interface ExtendSandboxRequest {
  enterpriseId: string;
  newExpirationUtc: string;
}

interface ExtendSandboxResponse {
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ExtendSandboxResponse>> {
  try {
    const body: ExtendSandboxRequest = await request.json();
    const { enterpriseId, newExpirationUtc } = body;

    if (!enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'enterpriseId is required' },
        { status: 400 }
      );
    }

    if (!newExpirationUtc) {
      return NextResponse.json(
        { success: false, error: 'newExpirationUtc is required' },
        { status: 400 }
      );
    }

    // Validate the date is in the future
    const expirationDate = new Date(newExpirationUtc);
    if (isNaN(expirationDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'newExpirationUtc must be a valid ISO 8601 date' },
        { status: 400 }
      );
    }

    if (expirationDate <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'newExpirationUtc must be a future date' },
        { status: 400 }
      );
    }

    const accessToken = process.env.MEWS_SAMPLE_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: MEWS_SAMPLE_TOKEN not set' },
        { status: 500 }
      );
    }

    console.log(`[EXTEND-SANDBOX] Extending expiration for ${enterpriseId} to ${newExpirationUtc}`);

    const response = await fetch(MEWS_EXTEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        AccessToken: accessToken,
        EnterpriseId: enterpriseId,
        NewExpirationUtc: newExpirationUtc,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[EXTEND-SANDBOX] Mews API error (${response.status}):`, errorText);

      let errorMessage = 'Failed to extend sandbox expiration';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.Message) {
          errorMessage = errorJson.Message;
        }
      } catch {
        // Use default error message
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    console.log(`[EXTEND-SANDBOX] Successfully extended expiration for ${enterpriseId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[EXTEND-SANDBOX] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
