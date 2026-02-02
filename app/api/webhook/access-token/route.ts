import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findEnvironmentLogByPropertyName, updateEnvironmentLogById, updateEnvironmentLog } from '@/lib/logger';
import { createReservationsForEnvironment } from '@/lib/reservation-service';
import { sendZapierNotification } from '@/lib/zapier';
import { fetchMewsData, updateBestPriceRate } from '@/lib/mews-data-service';

// Disable caching for GET endpoint - webhook debug data needs to be fresh
export const dynamic = 'force-dynamic';

const MEWS_CLIENT_TOKEN = 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';
const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews.com';

interface MewsWebhookPayload {
  Action: string;
  Data: {
    Enterprise: {
      Id: string;
      Name: string;
    };
    Service?: {
      Id: string;
      Name: string;
    };
    Integration?: {
      Id: string;
      Name: string;
    };
    AccessToken: string;
    CreatedUtc: string;
    IsEnabled: boolean;
    Requestor?: any;
  };
}

interface IntegrationDeletedPayload {
  Action: 'IntegrationDeleted';
  Data: {
    DeletedUtc: string;
    Integration: {
      Id: string;
      Name: string;
    };
  };
}

type MewsWebhook = MewsWebhookPayload | IntegrationDeletedPayload;

/**
 * Handle IntegrationDeleted webhook
 * Soft deletes access tokens by setting isEnabled = false
 */
async function handleIntegrationDeleted(payload: IntegrationDeletedPayload) {
  console.log('[WEBHOOK] Handling IntegrationDeleted:', {
    integrationId: payload.Data.Integration.Id,
    integrationName: payload.Data.Integration.Name,
    deletedUtc: payload.Data.DeletedUtc
  });

  const integrationId = payload.Data.Integration.Id;
  const integrationName = payload.Data.Integration.Name;
  const deletedUtc = payload.Data.DeletedUtc;

  try {
    // Find all AccessToken records with this integrationId
    const matchingTokens = await prisma.accessToken.findMany({
      where: {
        integrationId,
        isEnabled: true  // Only find enabled tokens
      },
      select: {
        id: true,
        enterpriseId: true,
        enterpriseName: true,
        integrationId: true,
        integrationName: true,
        receivedAt: true,
        isEnabled: true
      }
    });

    if (matchingTokens.length === 0) {
      console.log('[WEBHOOK] No enabled tokens found for integration:', integrationId);
      return NextResponse.json({
        success: true,
        message: 'Integration deleted event received, but no enabled tokens found',
        integrationId,
        tokensDisabled: 0
      });
    }

    // Soft delete: set isEnabled = false for all matching tokens
    const updateResult = await prisma.accessToken.updateMany({
      where: {
        integrationId,
        isEnabled: true
      },
      data: {
        isEnabled: false
      }
    });

    console.log(`[WEBHOOK] ✅ Disabled ${updateResult.count} token(s) for integration:`, integrationId);

    return NextResponse.json({
      success: true,
      message: 'Integration deleted and tokens disabled',
      integrationId,
      tokensDisabled: updateResult.count,
      affectedTokenIds: matchingTokens.map(t => t.id)
    });

  } catch (error) {
    console.error('[WEBHOOK] ❌ Error handling IntegrationDeleted:', error);

    return NextResponse.json(
      {
        error: 'Internal server error processing IntegrationDeleted',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhook/access-token
 * Receives access token from hotel creation webhook
 */
export async function POST(request: NextRequest) {
  try {
    const payload: MewsWebhook = await request.json();

    console.log('[WEBHOOK] Received webhook:', {
      action: payload.Action,
      timestamp: new Date().toISOString()
    });

    // Route based on action type
    if (payload.Action === 'IntegrationDeleted') {
      // Validate IntegrationDeleted payload
      if (!payload.Data?.Integration?.Id) {
        console.error('[WEBHOOK] ❌ Validation failed: Missing Integration.Id');
        return NextResponse.json(
          { error: 'Missing Integration.Id in IntegrationDeleted payload' },
          { status: 400 }
        );
      }
      return handleIntegrationDeleted(payload as IntegrationDeletedPayload);
    }

    // Validate for IntegrationCreated
    if (payload.Action !== 'IntegrationCreated') {
      console.warn('[WEBHOOK] ⚠️  Unknown action type:', payload.Action);
      return NextResponse.json(
        { error: `Unsupported webhook action: ${payload.Action}` },
        { status: 400 }
      );
    }

    // Continue with existing IntegrationCreated logic
    const createdPayload = payload as MewsWebhookPayload;
    console.log('[WEBHOOK] IntegrationCreated:', {
      enterpriseId: createdPayload.Data?.Enterprise?.Id,
      enterpriseName: createdPayload.Data?.Enterprise?.Name
    });

    // Validate payload structure
    if (!createdPayload.Data || !createdPayload.Data.AccessToken) {
      console.error('[WEBHOOK] ❌ Validation failed: Missing AccessToken');
      return NextResponse.json(
        { error: 'Missing AccessToken in webhook payload' },
        { status: 400 }
      );
    }

    if (!createdPayload.Data.Enterprise || !createdPayload.Data.Enterprise.Id) {
      console.error('[WEBHOOK] ❌ Validation failed: Missing Enterprise data');
      return NextResponse.json(
        { error: 'Missing Enterprise data in webhook payload' },
        { status: 400 }
      );
    }

    // Create new token entry in database
    const newToken = await prisma.accessToken.create({
      data: {
        accessToken: createdPayload.Data.AccessToken,
        enterpriseId: createdPayload.Data.Enterprise.Id,
        enterpriseName: createdPayload.Data.Enterprise.Name,
        serviceId: createdPayload.Data.Service?.Id,
        serviceName: createdPayload.Data.Service?.Name,
        integrationId: createdPayload.Data.Integration?.Id,
        integrationName: createdPayload.Data.Integration?.Name,
        createdUtc: createdPayload.Data.CreatedUtc,
        isEnabled: createdPayload.Data.IsEnabled,
        action: createdPayload.Action
      }
    });

    console.log('[WEBHOOK] ✅ Access token saved to database:', {
      id: newToken.id,
      action: newToken.action,
      enterpriseId: newToken.enterpriseId,
      enterpriseName: newToken.enterpriseName,
      receivedAt: newToken.receivedAt.toISOString()
    });

    // Find and update the corresponding EnvironmentLog
    // Match by property name (PRIMARY method) since Enterprise.Name in webhook equals our propertyName
    const enterpriseName = payload.Data?.Enterprise?.Name;

    if (!enterpriseName) {
      console.error('[WEBHOOK] ❌ Missing Enterprise.Name in webhook payload');
      return NextResponse.json(
        { success: false, message: 'Missing enterprise name in webhook' },
        { status: 400 }
      );
    }

    const log = await findEnvironmentLogByPropertyName(enterpriseName);

    if (log) {
      console.log('[WEBHOOK] ✅ Matched environment log:', log.id);

      // Backfill enterpriseId and update status to Updating
      await updateEnvironmentLogById(log.id, {
        enterpriseId: newToken.enterpriseId,
        status: 'Updating'
      });

      // Start full environment setup in the background (fire-and-forget)
      console.log('[WEBHOOK] Starting background setup for:', newToken.enterpriseId);
      (async () => {
        try {
          // Fetch timezone from configuration API
          const timezone = await fetchTimezoneFromConfiguration(newToken.accessToken);
          await updateEnvironmentLog(newToken.enterpriseId, { timezone });

          // Fetch Mews data and update Best Price rate
          const mewsData = await fetchMewsData(MEWS_CLIENT_TOKEN, newToken.accessToken);

          if (mewsData.rates.bestPrice) {
            await updateBestPriceRate(
              MEWS_CLIENT_TOKEN,
              newToken.accessToken,
              mewsData.rates.bestPrice
            );
          } else {
            console.warn('[WEBHOOK-SETUP] Best Price rate not found, skipping rate update');
          }

          // Create customers and reservations
          const result = await createReservationsForEnvironment(
            newToken.accessToken,
            newToken.enterpriseId,
            newToken.id
          );

          console.log('[WEBHOOK-SETUP] ✅ Setup complete:', {
            enterpriseId: newToken.enterpriseId,
            customers: result.totalCustomers,
            reservations: result.totalReservations,
            duration: `${result.durationSeconds}s`
          });

          // Send Zapier notification
          await sendZapierNotification('environment_ready', {
            status: 'success',
            propertyName: log.propertyName,
            customerName: log.customerName,
            customerEmail: log.customerEmail,
            requestorEmail: log.requestorEmail || undefined,
            loginUrl: log.loginUrl,
            loginEmail: log.loginEmail,
            loginPassword: log.loginPassword,
            enterpriseId: newToken.enterpriseId,
            enterpriseName: newToken.enterpriseName,
            receivedAt: newToken.receivedAt.toISOString(),
            tokenId: newToken.id,
            customersCreated: result.totalCustomers,
            reservationsCreated: result.totalReservations
          });

          // Update status to completed
          await updateEnvironmentLog(newToken.enterpriseId, { status: 'completed' });

        } catch (error) {
          console.error('[WEBHOOK-SETUP] ❌ Setup failed:', {
            enterpriseId: newToken.enterpriseId,
            error: (error as Error).message
          });
        }
      })();
    } else {
      // No matching log found - this token doesn't match any pending environment
      console.error('[WEBHOOK] ❌ No matching log found:', {
        propertyName: enterpriseName,
        enterpriseId: newToken.enterpriseId
      });

      // Send notification for unmatched token
      try {
        await sendZapierNotification('access_token_no_match', {
          enterpriseId: newToken.enterpriseId,
          enterpriseName: newToken.enterpriseName,
          receivedAt: newToken.receivedAt.toISOString(),
          tokenId: newToken.id
        });
      } catch (error) {
        console.error('[WEBHOOK] Failed to send notification for unmatched token:', (error as Error).message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Access token received and stored',
      tokenId: newToken.id
    });

  } catch (error) {
    console.error('[Webhook] Error processing access token webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error processing webhook' },
      { status: 500 }
    );
  }
}

/**
 * Fetch timezone from Mews configuration API
 */
async function fetchTimezoneFromConfiguration(accessToken: string): Promise<string> {
  try {
    const response = await fetch(`${MEWS_API_URL}/api/connector/v1/configuration/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: MEWS_CLIENT_TOKEN,
        AccessToken: accessToken,
        Client: 'Free Trial Generator'
      })
    });

    if (!response.ok) {
      throw new Error(`Configuration API failed: ${response.status}`);
    }

    const data = await response.json();
    const timezone = data.TimeZoneIdentifier;

    if (!timezone) {
      console.warn('[WEBHOOK] TimeZoneIdentifier not found in configuration response, using UTC');
      return 'UTC';
    }

    return timezone;

  } catch (error) {
    console.error('[WEBHOOK] Failed to fetch timezone:', error);
    console.warn('[WEBHOOK] Falling back to UTC timezone');
    return 'UTC';
  }
}

/**
 * GET /api/webhook/access-token
 * Retrieve stored access tokens (for debugging/admin)
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: filter by enterpriseId from query params
    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get('enterpriseId');

    const tokens = await prisma.accessToken.findMany({
      where: enterpriseId ? { enterpriseId } : undefined,
      orderBy: {
        receivedAt: 'desc'
      }
    });

    return NextResponse.json({ tokens, count: tokens.length });

  } catch (error) {
    console.error('[Webhook] Error retrieving tokens:', error);
    return NextResponse.json(
      { error: 'Internal server error retrieving tokens' },
      { status: 500 }
    );
  }
}
