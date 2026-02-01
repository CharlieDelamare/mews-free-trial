import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ConfigurationRequest {
  ClientToken: string;
  AccessToken: string;
  Client: string;
}

interface ConfigurationResponse {
  NowUtc: string;
  Enterprise: {
    Id: string;
    Name: string;
    [key: string]: any;
  };
  Service?: {
    Id: string;
    Name: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * POST /api/add-environment
 * Manually add an environment by providing an access token
 */
export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Access token is required' },
        { status: 400 }
      );
    }

    console.log('[ADD-ENVIRONMENT] Validating access token with Mews Configuration API...');

    // Call Mews Configuration API to validate token and get enterprise details
    const mewsApiUrl = process.env.MEWS_API_URL || 'https://api.mews.com';
    const configUrl = `${mewsApiUrl}/api/connector/v1/configuration/get`;

    const configRequest: ConfigurationRequest = {
      ClientToken: process.env.MEWS_CLIENT_TOKEN || '',
      AccessToken: accessToken,
      Client: 'Mews Free Trial App v1.0'
    };

    const configResponse = await fetch(configUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(configRequest)
    });

    if (!configResponse.ok) {
      const errorText = await configResponse.text();
      console.error('[ADD-ENVIRONMENT] Configuration API error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Invalid access token or configuration error' },
        { status: 400 }
      );
    }

    const configData: ConfigurationResponse = await configResponse.json();

    console.log('[ADD-ENVIRONMENT] Configuration data received:', {
      enterpriseId: configData.Enterprise.Id,
      enterpriseName: configData.Enterprise.Name,
      serviceId: configData.Service?.Id,
      serviceName: configData.Service?.Name
    });

    // Check if this access token already exists
    const existingToken = await prisma.accessToken.findFirst({
      where: {
        accessToken: accessToken
      }
    });

    if (existingToken) {
      console.log('[ADD-ENVIRONMENT] Access token already exists in database');
      return NextResponse.json(
        { success: false, error: 'This access token has already been added' },
        { status: 409 }
      );
    }

    // Store the access token and enterprise data
    const newToken = await prisma.accessToken.create({
      data: {
        accessToken: accessToken,
        enterpriseId: configData.Enterprise.Id,
        enterpriseName: configData.Enterprise.Name,
        serviceId: configData.Service?.Id || null,
        serviceName: configData.Service?.Name || null,
        integrationId: null,
        integrationName: null,
        createdUtc: configData.NowUtc,
        isEnabled: true,
        action: 'manual-addition'
      }
    });

    console.log('[ADD-ENVIRONMENT] Access token stored successfully:', {
      id: newToken.id,
      enterpriseId: newToken.enterpriseId,
      enterpriseName: newToken.enterpriseName
    });

    return NextResponse.json({
      success: true,
      message: 'Environment added successfully',
      data: {
        id: newToken.id,
        enterpriseId: newToken.enterpriseId,
        enterpriseName: newToken.enterpriseName,
        serviceId: newToken.serviceId,
        serviceName: newToken.serviceName,
        receivedAt: newToken.receivedAt
      }
    });

  } catch (error) {
    console.error('[ADD-ENVIRONMENT] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
