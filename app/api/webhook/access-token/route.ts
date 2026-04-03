import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { findEnvironmentLogByPropertyName, updateUnifiedLog } from '@/lib/unified-logger';
import { createReservationsForEnvironment } from '@/lib/reservation-service';
import { sendZapierNotification } from '@/lib/zapier';
import { fetchMewsData, updateBestPriceRate } from '@/lib/mews-data-service';
import { fetchTimezoneFromConfiguration } from '@/lib/timezone-service';
import { getMewsClientToken } from '@/lib/config';
import { runInBackground } from '@/lib/background';
import { flushApiCallLogs } from '@/lib/api-call-logger';

// Disable caching for GET endpoint - webhook debug data needs to be fresh
export const dynamic = 'force-dynamic';

const MEWS_CLIENT_TOKEN = getMewsClientToken();

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
    Requestor?: unknown;
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

    console.log(`[WEBHOOK] Disabled ${updateResult.count} token(s) for integration:`, integrationId);

    return NextResponse.json({
      success: true,
      message: 'Integration deleted and tokens disabled',
      integrationId,
      tokensDisabled: updateResult.count,
      affectedTokenIds: matchingTokens.map(t => t.id)
    });

  } catch (error) {
    console.error('[WEBHOOK] Error handling IntegrationDeleted:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error processing IntegrationDeleted' },
      { status: 500 }
    );
  }
}


/**
 * Verify the webhook secret query parameter using constant-time comparison.
 * Fails closed: if WEBHOOK_SECRET is not configured, all requests are rejected.
 */
function verifyWebhookSecret(request: NextRequest): boolean {
  const expectedSecret = process.env.WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error('[WEBHOOK] WEBHOOK_SECRET is not configured — rejecting request');
    return false; // fail closed: no secret = no access
  }

  const providedSecret = request.nextUrl.searchParams.get('secret') ?? '';
  if (providedSecret.length !== expectedSecret.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(providedSecret),
    Buffer.from(expectedSecret),
  );
}

/**
 * POST /api/webhook/access-token
 * Receives access token from hotel creation webhook
 */
export async function POST(request: NextRequest) {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

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
        console.error('[WEBHOOK] Validation failed: Missing Integration.Id');
        return NextResponse.json(
          { success: false, error: 'Missing Integration.Id in IntegrationDeleted payload' },
          { status: 400 }
        );
      }
      return handleIntegrationDeleted(payload as IntegrationDeletedPayload);
    }

    // Validate for IntegrationCreated
    if (payload.Action !== 'IntegrationCreated') {
      console.warn('[WEBHOOK] Unknown action type:', payload.Action);
      return NextResponse.json(
        { success: false, error: `Unsupported webhook action: ${payload.Action}` },
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
      console.error('[WEBHOOK] Validation failed: Missing AccessToken');
      return NextResponse.json(
        { success: false, error: 'Missing AccessToken in webhook payload' },
        { status: 400 }
      );
    }

    if (!createdPayload.Data.Enterprise || !createdPayload.Data.Enterprise.Id) {
      console.error('[WEBHOOK] Validation failed: Missing Enterprise data');
      return NextResponse.json(
        { success: false, error: 'Missing Enterprise data in webhook payload' },
        { status: 400 }
      );
    }

    // Idempotency check: skip duplicate webhooks
    const existingToken = await prisma.accessToken.findFirst({
      where: {
        enterpriseId: createdPayload.Data.Enterprise.Id,
        integrationId: createdPayload.Data.Integration?.Id ?? null,
        accessToken: createdPayload.Data.AccessToken,
      }
    });

    if (existingToken) {
      console.log('[WEBHOOK] Duplicate webhook detected, skipping:', {
        enterpriseId: createdPayload.Data.Enterprise.Id,
        tokenId: existingToken.id
      });
      return NextResponse.json({
        success: true,
        message: 'Duplicate webhook - already processed',
        tokenId: existingToken.id
      });
    }

    // Check if this token was manually stored (same accessToken, no integrationId).
    // If so, update the existing record with webhook data instead of creating a duplicate.
    const manuallyStoredToken = await prisma.accessToken.findFirst({
      where: {
        accessToken: createdPayload.Data.AccessToken,
        integrationId: null,
      }
    });

    let newToken;
    if (manuallyStoredToken) {
      console.log('[WEBHOOK] Found manually-stored token, updating with webhook data:', {
        tokenId: manuallyStoredToken.id,
        enterpriseId: manuallyStoredToken.enterpriseId
      });
      newToken = await prisma.accessToken.update({
        where: { id: manuallyStoredToken.id },
        data: {
          integrationId: createdPayload.Data.Integration?.Id,
          integrationName: createdPayload.Data.Integration?.Name,
          serviceId: createdPayload.Data.Service?.Id ?? manuallyStoredToken.serviceId,
          serviceName: createdPayload.Data.Service?.Name ?? manuallyStoredToken.serviceName,
          action: createdPayload.Action
        }
      });
    } else {
      // Create new token entry in database
      newToken = await prisma.accessToken.create({
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
    }

    // Find and update the corresponding EnvironmentLog
    // Match by property name (PRIMARY method) since Enterprise.Name in webhook equals our propertyName
    const enterpriseName = payload.Data?.Enterprise?.Name;

    if (!enterpriseName) {
      console.error('[WEBHOOK] Missing Enterprise.Name in webhook payload');
      return NextResponse.json(
        { success: false, error: 'Missing enterprise name in webhook' },
        { status: 400 }
      );
    }

    const log = await findEnvironmentLogByPropertyName(enterpriseName);

    if (log) {
      // Backfill enterpriseId and update status to processing
      await updateUnifiedLog(log.id, {
        enterpriseId: newToken.enterpriseId,
        status: 'processing'
      });

      // Send Zapier notification and email immediately when build completes (building → processing)
      // Re-fetch log to ensure we have latest data (including signInUrl saved by create-trial)
      const freshLog = await findEnvironmentLogByPropertyName(enterpriseName, false) || log;

      await sendZapierNotification('environment_ready', {
        status: 'success',
        propertyName: freshLog.propertyName,
        customerName: freshLog.customerName,
        customerEmail: freshLog.customerEmail,
        requestorEmail: freshLog.requestorEmail || undefined,
        loginUrl: freshLog.loginUrl,
        loginEmail: freshLog.loginEmail,
        loginPassword: freshLog.loginPassword,
        signInUrl: freshLog.signInUrl || undefined,
        enterpriseId: newToken.enterpriseId,
        enterpriseName: newToken.enterpriseName,
        receivedAt: newToken.receivedAt.toISOString(),
        tokenId: newToken.id,
      });

      // Start full environment setup in the background
      const backgroundWork = (async () => {
        try {
          // Fetch timezone and language from configuration API
          const timezoneResult = await fetchTimezoneFromConfiguration(MEWS_CLIENT_TOKEN, newToken.accessToken, log.id);
          const timezone = timezoneResult.timezone;
          const languageCode = timezoneResult.defaultLanguageCode;
          await updateUnifiedLog(log.id, { timezone });

          // Fetch Mews data and update Best Price rate
          const mewsData = await fetchMewsData(MEWS_CLIENT_TOKEN, newToken.accessToken, { logId: log.id });

          const bestPriceRate = mewsData.rates.find(r => r.name === 'Best Price');
          if (bestPriceRate && timezone) {
            await updateBestPriceRate(
              MEWS_CLIENT_TOKEN,
              newToken.accessToken,
              bestPriceRate.id,
              timezone,
              log.id
            );
          } else {
            console.warn('[WEBHOOK-SETUP] Best Price rate or timezone not found, skipping rate update');
          }

          // Create customers and reservations
          // Pass the log ID so the service can update operationDetails
          const result = await createReservationsForEnvironment(
            newToken.accessToken,
            newToken.enterpriseId,
            newToken.id,
            { operationType: 'automatic', logId: log.id, languageCode }
          );

          // Create onboarding tasks
          try {
            const { createOnboardingTasks } = await import('@/lib/task-service');
            const taskResult = await createOnboardingTasks(
              newToken.accessToken,
              newToken.enterpriseId,
              newToken.id,
              { logId: log.id, languageCode }
            );
            console.log(`[WEBHOOK-SETUP] Tasks created: ${taskResult.successCount}/${taskResult.totalTasks}`);
          } catch (taskError) {
            console.error('[WEBHOOK-SETUP] Task creation failed (non-blocking):', (taskError as Error).message);
          }

          // Update status to completed
          await updateUnifiedLog(log.id, { status: 'completed', completedAt: new Date() });

        } catch (error) {
          console.error('[WEBHOOK-SETUP] Setup failed:', {
            enterpriseId: newToken.enterpriseId,
            error: (error as Error).message
          });
          // Update log status to 'failed' so it doesn't stay stuck in 'processing'
          try {
            await updateUnifiedLog(log.id, {
              status: 'failed',
              errorMessage: `Setup failed: ${(error as Error).message}`,
              completedAt: new Date()
            });
          } catch (updateError) {
            console.error('[WEBHOOK-SETUP] Failed to update log status to failed:', updateError);
          }
        } finally {
          // Ensure all buffered API call logs are written to DB before function exits
          try {
            await flushApiCallLogs();
          } catch (flushError) {
            console.error('[WEBHOOK-SETUP] Failed to flush API call logs:', flushError);
          }
        }
      })();
      runInBackground(backgroundWork);
    } else {
      // No matching log found - this token doesn't match any pending environment
      // Store the token but don't send notifications
      console.log('[WEBHOOK] No matching log found, token stored for future use:', {
        propertyName: enterpriseName,
        enterpriseId: newToken.enterpriseId,
        tokenId: newToken.id
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Access token received and stored',
      tokenId: newToken.id
    });

  } catch (error) {
    console.error('[Webhook] Error processing access token webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing webhook' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhook/access-token
 * Retrieve stored access tokens (for debugging/admin)
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get('enterpriseId');

    const tokens = await prisma.accessToken.findMany({
      where: enterpriseId ? { enterpriseId } : undefined,
      orderBy: { receivedAt: 'desc' },
      select: {
        id: true,
        enterpriseId: true,
        enterpriseName: true,
        integrationId: true,
        integrationName: true,
        serviceId: true,
        serviceName: true,
        action: true,
        isEnabled: true,
        receivedAt: true,
        createdUtc: true,
        // accessToken field intentionally omitted — never return credentials in API responses
      },
    });

    return NextResponse.json({ tokens, count: tokens.length });
  } catch (error) {
    console.error('[Webhook] Error retrieving tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error retrieving tokens' },
      { status: 500 },
    );
  }
}
