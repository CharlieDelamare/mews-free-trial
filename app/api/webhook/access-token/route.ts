import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findEnvironmentLogByPropertyName, updateEnvironmentLogById } from '@/lib/logger';
import { createSampleCustomers } from '@/lib/customer-service';
import { sendZapierNotification } from '@/lib/zapier';

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
  console.log('[WEBHOOK] ========================================');
  console.log('[WEBHOOK] Handling IntegrationDeleted at:', new Date().toISOString());
  console.log('[WEBHOOK] Integration ID:', payload.Data.Integration.Id);
  console.log('[WEBHOOK] Integration Name:', payload.Data.Integration.Name);
  console.log('[WEBHOOK] Deleted UTC:', payload.Data.DeletedUtc);
  console.log('[WEBHOOK] ========================================');

  const integrationId = payload.Data.Integration.Id;
  const integrationName = payload.Data.Integration.Name;
  const deletedUtc = payload.Data.DeletedUtc;

  try {
    // Find all AccessToken records with this integrationId
    console.log('[WEBHOOK] Searching for AccessTokens with integrationId:', integrationId);

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

    console.log(`[WEBHOOK] Found ${matchingTokens.length} enabled token(s) for integration ${integrationId}`);

    if (matchingTokens.length === 0) {
      console.log('[WEBHOOK] ⚠️  No enabled tokens found for this integration');
      console.log('[WEBHOOK] This may indicate:');
      console.log('[WEBHOOK]   - Integration was already disabled');
      console.log('[WEBHOOK]   - Integration was deleted before any tokens were created');
      console.log('[WEBHOOK]   - Integration ID mismatch');

      return NextResponse.json({
        success: true,
        message: 'Integration deleted event received, but no enabled tokens found',
        integrationId,
        tokensDisabled: 0
      });
    }

    // Log details about tokens that will be disabled
    console.log('[WEBHOOK] Tokens to be disabled:');
    matchingTokens.forEach(token => {
      console.log(`[WEBHOOK]   - Token ID ${token.id}: ${token.enterpriseName} (Enterprise: ${token.enterpriseId})`);
    });

    // Soft delete: set isEnabled = false for all matching tokens
    console.log('[WEBHOOK] Disabling tokens...');
    const updateResult = await prisma.accessToken.updateMany({
      where: {
        integrationId,
        isEnabled: true
      },
      data: {
        isEnabled: false
      }
    });

    console.log(`[WEBHOOK] ✅ Successfully disabled ${updateResult.count} token(s)`);

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

    console.log('[WEBHOOK] ========================================');
    console.log('[WEBHOOK] Received webhook at:', new Date().toISOString());
    console.log('[WEBHOOK] Full payload:', JSON.stringify(payload, null, 2));
    console.log('[WEBHOOK] Action:', payload.Action);
    console.log('[WEBHOOK] ========================================');

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
    console.log('[WEBHOOK] Enterprise ID:', createdPayload.Data?.Enterprise?.Id);
    console.log('[WEBHOOK] Enterprise Name:', createdPayload.Data?.Enterprise?.Name);
    console.log('[WEBHOOK] Access Token (first 20 chars):', createdPayload.Data?.AccessToken?.substring(0, 20) + '...');

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

    console.log('[WEBHOOK] ✅ Payload validation passed');

    // Create new token entry in database
    console.log('[WEBHOOK] Saving access token to database...');
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

    console.log('[WEBHOOK] Looking for matching EnvironmentLog with property name:', enterpriseName);
    const log = await findEnvironmentLogByPropertyName(enterpriseName);

    if (log) {
      console.log('[WEBHOOK] ✅ Found matching log:', {
        logId: log.id,
        propertyName: log.propertyName,
        currentStatus: log.status,
        customerEmail: log.customerEmail
      });
      console.log('[WEBHOOK] Updating log with enterpriseId and status...');

      // Backfill enterpriseId and update status to completed
      await updateEnvironmentLogById(log.id, {
        enterpriseId: newToken.enterpriseId,
        status: 'completed'
      });

      console.log('[WEBHOOK] ✅ Log updated with enterpriseId and completed status');

      // Create sample customers in the background
      console.log('[WEBHOOK] Starting sample customer creation for enterprise:', newToken.enterpriseId);
      createSampleCustomers(newToken.accessToken, newToken.enterpriseId, newToken.id)
        .then(result => {
          console.log('[WEBHOOK] ✅ Customer creation completed:', {
            enterpriseId: newToken.enterpriseId,
            totalCustomers: result.totalCustomers,
            successCount: result.successCount,
            failureCount: result.failureCount
          });
        })
        .catch(error => {
          console.error('[WEBHOOK] ❌ Customer creation failed:', error);
        });

      // Send Zapier notification with login details
      try {
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
          tokenId: newToken.id
        });
        console.log('[WEBHOOK] ✅ Zapier notification sent');
      } catch (error) {
        console.error('[WEBHOOK] Failed to send Zapier notification:', error);
      }
    } else {
      // No matching log found - this token doesn't match any pending environment
      console.error('[WEBHOOK] ❌ No matching log found for property name:', enterpriseName);
      console.error('[WEBHOOK] Enterprise ID:', newToken.enterpriseId);
      console.error('[WEBHOOK] This may indicate a manual environment creation or timing issue');

      // Debug: Show recent logs
      const allLogs = await prisma.environmentLog.findMany({
        where: { status: 'building' },
        orderBy: { timestamp: 'desc' },
        take: 5
      });
      console.error('[WEBHOOK] Recent "building" logs in database:', allLogs.map(l => ({
        id: l.id,
        propertyName: l.propertyName,
        status: l.status,
        timestamp: l.timestamp
      })));

      // Send notification for unmatched token
      try {
        await sendZapierNotification('access_token_no_match', {
          enterpriseId: newToken.enterpriseId,
          enterpriseName: newToken.enterpriseName,
          accessToken: newToken.accessToken.substring(0, 20) + '...',
          receivedAt: newToken.receivedAt.toISOString(),
          tokenId: newToken.id
        });
        console.log('[WEBHOOK] ✅ Zapier notification sent for unmatched token');
      } catch (error) {
        console.error('[WEBHOOK] Failed to send Zapier notification for unmatched token:', error);
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
