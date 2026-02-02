import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findEnvironmentLogByEnterpriseId, updateEnvironmentLog } from '@/lib/logger';
import { createSampleCustomers } from '@/lib/customer-service';

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

      // Send Slack notification with login details
      if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID) {
        console.log('[WEBHOOK] Sending Slack notification...');
        try {
          await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
            },
            body: JSON.stringify({
              channel: process.env.SLACK_CHANNEL_ID,
              blocks: [
                {
                  type: 'header',
                  text: {
                    type: 'plain_text',
                    text: '✅ New Trial Environment Ready!',
                    emoji: true
                  }
                },
                {
                  type: 'section',
                  fields: [
                    {
                      type: 'mrkdwn',
                      text: `*Property Name:*\n${log.propertyName}`
                    },
                    {
                      type: 'mrkdwn',
                      text: `*Contact:*\n${log.customerName}`
                    },
                    {
                      type: 'mrkdwn',
                      text: `*Requested By:*\n${log.requestorEmail || 'N/A'}`
                    },
                    {
                      type: 'mrkdwn',
                      text: `*Customer Email:*\n${log.customerEmail}`
                    }
                  ]
                },
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*Login Details:*\n• URL: ${log.loginUrl}\n• Email: ${log.loginEmail}\n• Password: \`${log.loginPassword}\``
                  }
                },
                {
                  type: 'context',
                  elements: [
                    {
                      type: 'mrkdwn',
                      text: `Enterprise ID: ${newToken.enterpriseId} | Access Token Received: ${new Date(newToken.receivedAt).toLocaleString()}`
                    }
                  ]
                }
              ]
            })
          });
          console.log('[WEBHOOK] ✅ Slack notification sent successfully');
        } catch (slackError) {
          console.error('[WEBHOOK] ❌ Failed to send Slack notification:', slackError);
          // Don't fail the webhook if Slack notification fails
        }
      } else {
        console.log('[WEBHOOK] ⚠️  Slack not configured, skipping notification');
      }
    } else {
      console.error('[WEBHOOK] ❌ No matching log found for enterprise ID:', newToken.enterpriseId);
      console.error('[WEBHOOK] This means the enterprise was created but we cannot find the EnvironmentLog entry');
      console.error('[WEBHOOK] Checking all logs in database...');

      // Try to find any logs to help debug
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

      // Still send a basic Slack notification for tracking
      if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID) {
        try {
          await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
            },
            body: JSON.stringify({
              channel: process.env.SLACK_CHANNEL_ID,
              blocks: [
                {
                  type: 'header',
                  text: {
                    type: 'plain_text',
                    text: '🔑 Access Token Received (No Log Match)'
                  }
                },
                {
                  type: 'section',
                  fields: [
                    {
                      type: 'mrkdwn',
                      text: `*Action:*\n${newToken.action}`
                    },
                    {
                      type: 'mrkdwn',
                      text: `*Enterprise:*\n${newToken.enterpriseName}`
                    },
                    {
                      type: 'mrkdwn',
                      text: `*Enterprise ID:*\n${newToken.enterpriseId}`
                    },
                    {
                      type: 'mrkdwn',
                      text: `*Received At:*\n${new Date(newToken.receivedAt).toLocaleString()}`
                    }
                  ]
                }
              ]
            })
          });
        } catch (slackError) {
          console.error('[Webhook] Failed to send Slack notification:', slackError);
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
