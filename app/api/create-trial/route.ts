import { NextRequest, NextResponse } from 'next/server';
import {
  getPreferredLanguage,
  getLegalEnvironmentCode,
  getCurrency,
  getPricingEnvironment
} from '@/lib/codes';

const MEWS_API_URL = 'https://app.mews-demo.com/api/general/v1/enterprises/addSample';

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

    const accessToken = process.env.MEWS_ACCESS_TOKEN;
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

    // Call Mews API
    const response = await fetch(MEWS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiBody)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Mews API error:', result);
      
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

    // Send Slack success notification
    await sendSlackNotification({
      success: true,
      propertyName,
      firstName,
      lastName,
      requestorEmail,
      customerEmail
    });

    return NextResponse.json({
      success: true,
      message: 'Trial created successfully! Check your email for login details.',
      propertyName,
      loginUrl: 'https://app.mews-demo.com',
      loginEmail: customerEmail,
      defaultPassword: 'Sample123'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Slack notification helper
async function sendSlackNotification(data: {
  success: boolean;
  propertyName: string;
  firstName: string;
  lastName: string;
  requestorEmail: string;
  customerEmail: string;
  error?: unknown;
}) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) {
    console.log('Slack webhook not configured, skipping notification');
    return;
  }

  const message = data.success
    ? `New trial generated! \nProperty name: ${data.propertyName} \nContact: ${data.lastName}, ${data.firstName} \nRequested by: ${data.requestorEmail} \nLogin details: https://app.mews-demo.com, login: ${data.customerEmail}, password: Sample123`
    : `New trial generation *failed*! \nProperty name: ${data.propertyName} \nContact: ${data.lastName}, ${data.firstName} \nRequested by: ${data.requestorEmail} \nError: ${JSON.stringify(data.error)}`;

  try {
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
  } catch (err) {
    console.error('Failed to send Slack notification:', err);
  }
}
