import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const TOKENS_FILE = path.join(process.cwd(), 'data', 'access-tokens.json');

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

interface StoredToken {
  accessToken: string;
  enterpriseId: string;
  enterpriseName: string;
  serviceId?: string;
  serviceName?: string;
  integrationId?: string;
  integrationName?: string;
  createdUtc: string;
  receivedAt: string;
  isEnabled: boolean;
  action: string;
}

/**
 * Ensure the data directory exists
 */
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

/**
 * Load existing tokens from file
 */
async function loadTokens(): Promise<StoredToken[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(TOKENS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet or is invalid, return empty array
    return [];
  }
}

/**
 * Save tokens to file
 */
async function saveTokens(tokens: StoredToken[]): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf-8');
}

/**
 * POST /api/webhook/access-token
 * Receives access token from hotel creation webhook
 */
export async function POST(request: NextRequest) {
  try {
    const payload: MewsWebhookPayload = await request.json();

    // Validate payload structure
    if (!payload.Data || !payload.Data.AccessToken) {
      return NextResponse.json(
        { error: 'Missing AccessToken in webhook payload' },
        { status: 400 }
      );
    }

    if (!payload.Data.Enterprise || !payload.Data.Enterprise.Id) {
      return NextResponse.json(
        { error: 'Missing Enterprise data in webhook payload' },
        { status: 400 }
      );
    }

    // Load existing tokens
    const tokens = await loadTokens();

    // Create new token entry
    const newToken: StoredToken = {
      accessToken: payload.Data.AccessToken,
      enterpriseId: payload.Data.Enterprise.Id,
      enterpriseName: payload.Data.Enterprise.Name,
      serviceId: payload.Data.Service?.Id,
      serviceName: payload.Data.Service?.Name,
      integrationId: payload.Data.Integration?.Id,
      integrationName: payload.Data.Integration?.Name,
      createdUtc: payload.Data.CreatedUtc,
      receivedAt: new Date().toISOString(),
      isEnabled: payload.Data.IsEnabled,
      action: payload.Action
    };

    // Add to tokens array
    tokens.push(newToken);

    // Save to file
    await saveTokens(tokens);

    console.log('[Webhook] Access token received and stored:', {
      action: newToken.action,
      enterpriseId: newToken.enterpriseId,
      enterpriseName: newToken.enterpriseName,
      receivedAt: newToken.receivedAt
    });

    // Send Slack notification if configured
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
                  text: '🔑 Access Token Received'
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
                    text: `*Service:*\n${newToken.serviceName || 'N/A'}`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Integration:*\n${newToken.integrationName || 'N/A'}`
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
        // Don't fail the webhook if Slack notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Access token received and stored',
      tokenId: tokens.length - 1
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
    const tokens = await loadTokens();

    // Optional: filter by enterpriseId from query params
    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get('enterpriseId');

    if (enterpriseId) {
      const filtered = tokens.filter(t => t.enterpriseId === enterpriseId);
      return NextResponse.json({ tokens: filtered, count: filtered.length });
    }

    return NextResponse.json({ tokens, count: tokens.length });

  } catch (error) {
    console.error('[Webhook] Error retrieving tokens:', error);
    return NextResponse.json(
      { error: 'Internal server error retrieving tokens' },
      { status: 500 }
    );
  }
}
