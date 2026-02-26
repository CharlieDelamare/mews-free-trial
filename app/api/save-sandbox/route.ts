import { NextRequest, NextResponse } from 'next/server';

const MEWS_CANCEL_EXPIRATION_URL = 'https://app.mews-demo.com/api/general/v1/enterprises/cancelExpiration';

interface SaveSandboxRequest {
  enterpriseId: string;
}

interface SaveSandboxResponse {
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SaveSandboxResponse>> {
  try {
    const body: SaveSandboxRequest = await request.json();
    const { enterpriseId } = body;

    if (!enterpriseId) {
      return NextResponse.json(
        { success: false, error: 'enterpriseId is required' },
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

    console.log(`[SAVE-SANDBOX] Canceling expiration for ${enterpriseId}`);

    const response = await fetch(MEWS_CANCEL_EXPIRATION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        AccessToken: accessToken,
        EnterpriseId: enterpriseId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[SAVE-SANDBOX] Mews API error (${response.status}):`, errorText);

      let errorMessage = 'Failed to cancel sandbox expiration';
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

    console.log(`[SAVE-SANDBOX] Successfully canceled expiration for ${enterpriseId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SAVE-SANDBOX] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
