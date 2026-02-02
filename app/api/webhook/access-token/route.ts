import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findEnvironmentLogByEnterpriseId, findEnvironmentLogByPropertyName, updateEnvironmentLog, updateEnvironmentLogById } from '@/lib/logger';
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


/**
 * POST /api/webhook/access-token
 * Receives access token from hotel creation webhook
 */
export async function POST(request: NextRequest) {
  try {
    const payload: MewsWebhookPayload = await request.json();

    console.log('[WEBHOOK] ========================================');
    console.log('[WEBHOOK] Received webhook at:', new Date().toISOString());
    console.log('[WEBHOOK] Full payload:', JSON.stringify(payload, null, 2));
    console.log('[WEBHOOK] Action:', payload.Action);
    console.log('[WEBHOOK] Enterprise ID:', payload.Data?.Enterprise?.Id);
    console.log('[WEBHOOK] Enterprise Name:', payload.Data?.Enterprise?.Name);
    console.log('[WEBHOOK] Access Token (first 20 chars):', payload.Data?.AccessToken?.substring(0, 20) + '...');
    console.log('[WEBHOOK] ========================================');

    // Validate payload structure
    if (!payload.Data || !payload.Data.AccessToken) {
      console.error('[WEBHOOK] ❌ Validation failed: Missing AccessToken');
      return NextResponse.json(
        { error: 'Missing AccessToken in webhook payload' },
        { status: 400 }
      );
    }

    if (!payload.Data.Enterprise || !payload.Data.Enterprise.Id) {
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
        accessToken: payload.Data.AccessToken,
        enterpriseId: payload.Data.Enterprise.Id,
        enterpriseName: payload.Data.Enterprise.Name,
        serviceId: payload.Data.Service?.Id,
        serviceName: payload.Data.Service?.Name,
        integrationId: payload.Data.Integration?.Id,
        integrationName: payload.Data.Integration?.Name,
        createdUtc: payload.Data.CreatedUtc,
        isEnabled: payload.Data.IsEnabled,
        action: payload.Action
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
    console.log('[WEBHOOK] Looking for matching EnvironmentLog with enterprise ID:', newToken.enterpriseId);
    const log = await findEnvironmentLogByEnterpriseId(newToken.enterpriseId);

    if (log) {
      console.log('[WEBHOOK] ✅ Found matching log:', {
        logId: log.id,
        propertyName: log.propertyName,
        currentStatus: log.status,
        customerEmail: log.customerEmail
      });
      console.log('[WEBHOOK] Updating log status to completed...');

      // Update log status to completed
      await updateEnvironmentLog(newToken.enterpriseId, {
        status: 'completed'
      });

      console.log('[WEBHOOK] ✅ Log status updated to completed');

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
      } catch (error) {
        console.error('[WEBHOOK] Failed to send Zapier notification:', error);
      }
    } else {
      console.error('[WEBHOOK] ❌ No matching log found by enterprise ID:', newToken.enterpriseId);
      console.log('[WEBHOOK] Attempting fallback matching by property name...');

      // Fallback: Call Configuration API to get enterprise name, then match by property name
      try {
        const mewsApiUrl = process.env.MEWS_API_URL || 'https://api.mews.com';
        console.log('[WEBHOOK] Calling Configuration API to get enterprise details...');

        const configResponse = await fetch(
          `${mewsApiUrl}/api/connector/v1/configuration/get`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ClientToken: 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0',
              AccessToken: newToken.accessToken,
              Client: 'MewsFreeTrialApp'
            }),
            signal: AbortSignal.timeout(10000) // 10 second timeout
          }
        );

        if (!configResponse.ok) {
          throw new Error(`Configuration API returned ${configResponse.status}: ${configResponse.statusText}`);
        }

        const configData = await configResponse.json();
        const enterpriseName = configData.Enterprise?.Name;

        if (!enterpriseName) {
          throw new Error('Enterprise.Name not found in Configuration API response');
        }

        console.log('[WEBHOOK] ✅ Got enterprise name from Configuration API:', enterpriseName);
        console.log('[WEBHOOK] Attempting to match by property name...');

        // Try matching by property name
        const logByName = await findEnvironmentLogByPropertyName(enterpriseName);

        if (logByName) {
          console.log('[WEBHOOK] ✅ Matched by property name fallback!');
          console.log('[WEBHOOK] Log ID:', logByName.id);
          console.log('[WEBHOOK] Backfilling enterprise ID and updating status...');

          // Backfill the enterprise ID and update status to completed
          await updateEnvironmentLogById(logByName.id, {
            enterpriseId: newToken.enterpriseId,
            status: 'completed'
          });

          console.log('[WEBHOOK] ✅ Log updated with correct enterpriseId and completed status');

          // Continue normal flow - create sample customers
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

          // Send environment_ready notification with login details
          try {
            await sendZapierNotification('environment_ready', {
              status: 'success',
              propertyName: logByName.propertyName,
              customerName: logByName.customerName,
              customerEmail: logByName.customerEmail,
              requestorEmail: logByName.requestorEmail || undefined,
              loginUrl: logByName.loginUrl,
              loginEmail: logByName.loginEmail,
              loginPassword: logByName.loginPassword,
              enterpriseId: newToken.enterpriseId,
              enterpriseName: newToken.enterpriseName,
              receivedAt: newToken.receivedAt.toISOString(),
              tokenId: newToken.id,
              matchedByFallback: true
            });
            console.log('[WEBHOOK] ✅ Zapier notification sent (environment_ready)');
          } catch (error) {
            console.error('[WEBHOOK] Failed to send Zapier notification:', error);
          }

        } else {
          // No match by property name either
          console.error('[WEBHOOK] ❌ No match found by property name:', enterpriseName);
          console.error('[WEBHOOK] Checked for logs with status=building');

          // Debug: Show recent logs
          const allLogs = await prisma.environmentLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 5
          });
          console.error('[WEBHOOK] Recent logs in database:', allLogs.map(l => ({
            id: l.id,
            enterpriseId: l.enterpriseId,
            propertyName: l.propertyName,
            status: l.status,
            timestamp: l.timestamp
          })));

          // Send notification for manual intervention
          try {
            await sendZapierNotification('access_token_no_match', {
              status: 'info',
              action: newToken.action,
              enterpriseName: newToken.enterpriseName,
              enterpriseId: newToken.enterpriseId,
              receivedAt: newToken.receivedAt.toISOString(),
              tokenId: newToken.id,
              fallbackAttempted: true,
              configApiName: enterpriseName
            });
            console.log('[WEBHOOK] ✅ Zapier notification sent (access_token_no_match)');
          } catch (error) {
            console.error('[WEBHOOK] Failed to send Zapier notification:', error);
          }
        }

      } catch (configError) {
        // Configuration API failed
        console.error('[WEBHOOK] ❌ Configuration API fallback failed:', configError);
        console.error('[WEBHOOK] Error details:', {
          name: (configError as Error).name,
          message: (configError as Error).message
        });

        // Send special notification for API failure
        try {
          await sendZapierNotification('webhook_matching_failed', {
            status: 'failure',
            enterpriseId: newToken.enterpriseId,
            enterpriseName: newToken.enterpriseName,
            error: 'Failed to call Configuration API for fallback matching',
            errorDetails: (configError as Error).message,
            tokenId: newToken.id,
            receivedAt: newToken.receivedAt.toISOString()
          });
          console.log('[WEBHOOK] ✅ Zapier notification sent (webhook_matching_failed)');
        } catch (zapierError) {
          console.error('[WEBHOOK] Failed to send Zapier notification:', zapierError);
        }
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
