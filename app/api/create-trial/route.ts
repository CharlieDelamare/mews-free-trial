import { NextRequest, NextResponse } from 'next/server';
import {
  getPreferredLanguage,
  getLegalEnvironmentCode,
  getCurrency,
  getPricingEnvironment
} from '@/lib/codes';
import { saveEnvironmentLog, updateEnvironmentLogById } from '@/lib/logger';

const MEWS_API_URL = 'https://app.mews-demo.com/api/general/v1/enterprises/addSample';
const SLACK_API_URL = 'https://slack.com/api/chat.postMessage';

interface TrialRequest {
  requestorEmail: string;
  firstName: string;
  lastName: string;
  customerEmail: string;
  preferredLanguage: string;
  propertyName: string;
  propertyCountry: string;
  propertyType: 'hotel' | 'hostel' | 'apartments';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: TrialRequest = await request.json();
    
    const {
      requestorEmail,
      firstName,
      lastName,
      customerEmail,
      preferredLanguage,
      propertyName,
      propertyCountry,
      propertyType
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !customerEmail || !propertyName || !propertyCountry) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const accessToken = process.env.MEWS_SAMPLE_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Transform form data using codes
    const languageCode = getPreferredLanguage(preferredLanguage);
    const legalEnvironmentCode = getLegalEnvironmentCode(propertyCountry);
    const currencyCode = getCurrency(propertyCountry);
    const pricingEnvironment = getPricingEnvironment(propertyCountry);

    // Build the API request body
    const apiBody: Record<string, unknown> = {
      Client: 'Free Trial Generator',
      AccessToken: accessToken,
      LanguageCode: languageCode,
      CultureCode: languageCode,
      Name: propertyName,
      LegalEnvironmentCode: legalEnvironmentCode,
      CurrencyCode: currencyCode,
      Pricing: pricingEnvironment,
      StartOffset: 2,
      EndOffset: 4,
      AutomaticCheckIn: true,
      AutomaticCheckOut: true,
      Occupancy: 0.5,
      Lifetime: 'P0Y0M45DT0H0M0S', // 45 days trial
      User: { Email: customerEmail },
      Users: [{ Email: 'trial@mews.li' }],
    };

    // Add property type specific configuration
    if (propertyType === 'hostel') {
      Object.assign(apiBody, {
        CategoryCount: 4,
        FloorCount: 4,
        FloorRoomCount: 5,
        FloorDormCount: 2,
        DormBedCount: 4,
      });
    } else if (propertyType === 'apartments') {
      Object.assign(apiBody, {
        CategoryCount: 4,
        FloorCount: 4,
        FloorRoomCount: 0,
        FloorApartmentCount: 5,
        FloorDormCount: 0,
        DormBedCount: 0,
      });
    } else {
      // Default hotel configuration
      Object.assign(apiBody, {
        CategoryCount: 4,
        FloorCount: 4,
        FloorRoomCount: 5,
        FloorDormCount: 0,
        DormBedCount: 0,
      });
    }

    // Add tax precision for Gross pricing
    if (pricingEnvironment === 'Gross') {
      apiBody.TaxPrecision = 2;
    }

    console.log('Creating sample enterprise:', propertyName);

    // Create log entry immediately with "building" status
    const log = await saveEnvironmentLog({
      propertyName,
      customerName: `${firstName} ${lastName}`,
      customerEmail,
      propertyCountry,
      propertyType,
      loginUrl: 'https://app.mews-demo.com',
      loginEmail: customerEmail,
      loginPassword: 'Sample123',
      status: 'building',
      requestorEmail
    });

    console.log('Log created with building status:', log.id);

    // Call Mews API
    const response = await fetch(MEWS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiBody)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Mews API error:', result);

      // Update log to failure status
      await updateEnvironmentLogById(log.id, {
        status: 'failure',
        errorMessage: JSON.stringify(result)
      });

      // Send Slack failure notification
      await sendSlackNotification({
        success: false,
        propertyName,
        firstName,
        lastName,
        requestorEmail,
        customerEmail,
        error: result
      });

      return NextResponse.json(
        { success: false, error: 'Failed to create trial', details: result },
        { status: 500 }
      );
    }

    // Extract enterprise ID from the response
    // The Mews API response structure may vary, so we check multiple possible locations
    const enterpriseId = result.EnterpriseId || result.Enterprise?.Id || result.Id;

    if (enterpriseId) {
      console.log('Enterprise created with ID:', enterpriseId);

      // Update the log with the enterprise ID
      await updateEnvironmentLogById(log.id, {
        enterpriseId
      });
    } else {
      console.warn('Could not extract enterprise ID from response:', result);
    }

    // Return immediately - Slack notification will be sent when access token webhook is received
    return NextResponse.json({
      success: true,
      message: 'Trial environment is being created. You will receive the login details shortly.',
      propertyName,
      status: 'building'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Slack API notification helper
async function sendSlackNotification(data: {
  success: boolean;
  propertyName: string;
  firstName: string;
  lastName: string;
  requestorEmail: string;
  customerEmail: string;
  error?: unknown;
}) {
  const slackBotToken = process.env.SLACK_BOT_TOKEN;
  const slackChannelId = process.env.SLACK_CHANNEL_ID;

  if (!slackBotToken || !slackChannelId) {
    console.log('Slack API not configured, skipping notification');
    return;
  }

  // Build Block Kit message for richer formatting
  const blocks = data.success
    ? [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '✅ New Trial Generated!',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Property Name:*\n${data.propertyName}`
            },
            {
              type: 'mrkdwn',
              text: `*Contact:*\n${data.firstName} ${data.lastName}`
            },
            {
              type: 'mrkdwn',
              text: `*Requested By:*\n${data.requestorEmail}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer Email:*\n${data.customerEmail}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Login Details:*\n• URL: https://app.mews-demo.com\n• Email: ${data.customerEmail}\n• Password: \`Sample123\``
          }
        }
      ]
    : [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '❌ Trial Generation Failed!',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Property Name:*\n${data.propertyName}`
            },
            {
              type: 'mrkdwn',
              text: `*Contact:*\n${data.firstName} ${data.lastName}`
            },
            {
              type: 'mrkdwn',
              text: `*Requested By:*\n${data.requestorEmail}`
            },
            {
              type: 'mrkdwn',
              text: `*Customer Email:*\n${data.customerEmail}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Error Details:*\n\`\`\`${JSON.stringify(data.error, null, 2)}\`\`\``
          }
        }
      ];

  const fallbackText = data.success
    ? `New trial generated for ${data.propertyName}`
    : `Trial generation failed for ${data.propertyName}`;

  try {
    const response = await fetch(SLACK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${slackBotToken}`
      },
      body: JSON.stringify({
        channel: slackChannelId,
        text: fallbackText,
        blocks: blocks
      })
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Slack API error:', result.error);
    }
  } catch (err) {
    console.error('Failed to send Slack notification:', err);
  }
}
