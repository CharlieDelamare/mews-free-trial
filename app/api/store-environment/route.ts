import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMewsClientToken, getMewsApiUrl } from '@/lib/config';

const MEWS_CLIENT_TOKEN = getMewsClientToken();

interface ConfigurationResponse {
  NowUtc: string;
  Enterprise: {
    Id: string;
    Name: string;
  };
  Service?: {
    Id: string;
    Name: string;
  };
}

/**
 * POST /api/store-environment
 * Lightweight endpoint to validate and store an access token so the environment
 * appears in the sandbox dropdown immediately, without waiting for the Mews webhook.
 *
 * The webhook will arrive later and update the record with integrationId,
 * then run the full environment setup (customers, reservations, tasks).
 */
export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Access token is required' },
        { status: 400 }
      );
    }

    // Mews access tokens are short strings — anything over 500 chars is invalid
    if (accessToken.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Invalid access token' },
        { status: 400 }
      );
    }

    // Check if this access token already exists
    const existingToken = await prisma.accessToken.findFirst({
      where: { accessToken }
    });

    if (existingToken) {
      return NextResponse.json(
        { success: false, error: 'This access token has already been added' },
        { status: 409 }
      );
    }

    // Validate token via Mews Configuration API
    const mewsApiUrl = getMewsApiUrl();
    const configResponse = await fetch(`${mewsApiUrl}/api/connector/v1/configuration/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: MEWS_CLIENT_TOKEN,
        AccessToken: accessToken,
        Client: 'Mews Sandbox Manager'
      })
    });

    if (!configResponse.ok) {
      const errorText = await configResponse.text();
      console.error('[STORE-ENVIRONMENT] Configuration API error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Invalid access token or configuration error' },
        { status: 400 }
      );
    }

    const configData: ConfigurationResponse = await configResponse.json();

    console.log('[STORE-ENVIRONMENT] Storing access token:', {
      enterpriseId: configData.Enterprise.Id,
      enterpriseName: configData.Enterprise.Name
    });

    // Store the access token
    const newToken = await prisma.accessToken.create({
      data: {
        accessToken,
        enterpriseId: configData.Enterprise.Id,
        enterpriseName: configData.Enterprise.Name,
        serviceId: configData.Service?.Id || null,
        serviceName: configData.Service?.Name || null,
        integrationId: null,
        integrationName: null,
        createdUtc: configData.NowUtc,
        isEnabled: true,
        action: 'manual-storage'
      }
    });

    console.log('[STORE-ENVIRONMENT] Token stored successfully:', {
      id: newToken.id,
      enterpriseId: newToken.enterpriseId,
      enterpriseName: newToken.enterpriseName
    });

    return NextResponse.json({
      success: true,
      message: 'Environment stored successfully',
      data: {
        id: newToken.id,
        enterpriseId: newToken.enterpriseId,
        enterpriseName: newToken.enterpriseName
      }
    });
  } catch (error) {
    console.error('[STORE-ENVIRONMENT] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
