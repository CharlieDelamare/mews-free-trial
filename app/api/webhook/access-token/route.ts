import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const TOKENS_FILE = path.join(process.cwd(), 'data', 'access-tokens.json');

interface AccessTokenPayload {
  accessToken: string;
  enterpriseId?: string;
  clientToken?: string;
  [key: string]: any;
}

interface StoredToken {
  accessToken: string;
  enterpriseId?: string;
  clientToken?: string;
  receivedAt: string;
  metadata?: Record<string, any>;
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
    const payload: AccessTokenPayload = await request.json();

    // Validate that we have an access token
    if (!payload.accessToken) {
      return NextResponse.json(
        { error: 'Missing accessToken in webhook payload' },
        { status: 400 }
      );
    }

    // Load existing tokens
    const tokens = await loadTokens();

    // Create new token entry
    const newToken: StoredToken = {
      accessToken: payload.accessToken,
      enterpriseId: payload.enterpriseId,
      clientToken: payload.clientToken,
      receivedAt: new Date().toISOString(),
      metadata: Object.keys(payload)
        .filter(key => !['accessToken', 'enterpriseId', 'clientToken'].includes(key))
        .reduce((acc, key) => ({ ...acc, [key]: payload[key] }), {})
    };

    // Add to tokens array
    tokens.push(newToken);

    // Save to file
    await saveTokens(tokens);

    console.log('[Webhook] Access token received and stored:', {
      enterpriseId: newToken.enterpriseId,
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
                    text: `*Enterprise ID:*\n${newToken.enterpriseId || 'N/A'}`
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
