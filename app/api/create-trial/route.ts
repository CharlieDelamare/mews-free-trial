import { NextRequest, NextResponse } from 'next/server';
import {
  getPreferredLanguage,
  getLegalEnvironmentCode,
  getCurrency,
  getPricingEnvironment,
  languageOptions,
  countryOptions
} from '@/lib/codes';
import { createEnvironmentLog, updateUnifiedLog } from '@/lib/unified-logger';
import { convertDaysToISO8601 } from '@/lib/duration';
import { prisma } from '@/lib/prisma';
import { sendZapierNotification } from '@/lib/zapier';

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
  durationDays: number;
  salesforceAccountId?: string;
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
      propertyType,
      durationDays,
      salesforceAccountId
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !customerEmail || !propertyName || !propertyCountry) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for Charlie user exception (needs to be before duration validation)
    const isCharlie = requestorEmail === 'charlie.delamare@gmail.com' ||
                      requestorEmail === 'charlie.delamare@mews.com';

    // Validate duration (context-aware for Charlie)
    const validDurations = isCharlie ? [1, 7, 30, 60] : [7, 30, 60];
    if (!validDurations.includes(durationDays)) {
      return NextResponse.json(
        {
          success: false,
          error: isCharlie
            ? 'Invalid duration. Must be 1, 7, 30, or 60 days'
            : 'Invalid duration. Must be 7, 30, or 60 days'
        },
        { status: 400 }
      );
    }

    // Validate language and country codes
    if (preferredLanguage && !languageOptions.includes(preferredLanguage)) {
      console.error('[CREATE-TRIAL] Invalid preferred language:', preferredLanguage);
      return NextResponse.json(
        {
          success: false,
          error: `Invalid preferred language: "${preferredLanguage}". Please select from the dropdown.`
        },
        { status: 400 }
      );
    }

    if (!countryOptions.includes(propertyCountry)) {
      console.error('[CREATE-TRIAL] Invalid property country:', propertyCountry);
      return NextResponse.json(
        {
          success: false,
          error: `Invalid property country: "${propertyCountry}". Please select from the dropdown.`
        },
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

    // Validate database connection early
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      console.error('[CREATE-TRIAL] Database connection failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection unavailable. Please try again later.'
        },
        { status: 503 }
      );
    }

    // Duplicate prevention: Check if Salesforce Account ID already has an environment
    // Skip check for Charlie users (internal testing) and if no Salesforce ID provided
    if (!isCharlie && salesforceAccountId) {
      console.log('[CREATE-TRIAL] Checking for existing environment with Salesforce Account ID:', salesforceAccountId);

      try {
        const existingEnv = await prisma.unifiedLog.findFirst({
          where: {
            logType: 'environment',
            salesforceAccountId,
            status: {
              in: ['building', 'processing', 'completed']
            }
          },
          orderBy: { timestamp: 'desc' },
          select: {
            id: true,
            propertyName: true,
            customerEmail: true,
            status: true,
            timestamp: true,
            enterpriseId: true
          }
        });

        if (existingEnv) {
          console.log('[CREATE-TRIAL] Found existing environment:', existingEnv.id);

          return NextResponse.json(
            {
              success: false,
              error: 'An environment already exists for this Salesforce Account ID',
              existingEnvironment: {
                propertyName: existingEnv.propertyName,
                customerEmail: existingEnv.customerEmail,
                status: existingEnv.status,
                createdAt: existingEnv.timestamp,
                enterpriseId: existingEnv.enterpriseId
              },
              suggestion: 'Please view the existing environment in the Environment Logs or contact support if this is incorrect.'
            },
            { status: 409 }
          );
        }

        console.log('[CREATE-TRIAL] No existing environment found, proceeding with creation');
      } catch (duplicateCheckError) {
        console.error('[CREATE-TRIAL] Error checking for duplicates:', duplicateCheckError);
        // Fail open: don't block creation if duplicate check fails
      }
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
      Occupancy: 0,
      Lifetime: convertDaysToISO8601(durationDays),
      User: { Email: customerEmail },
      Users: [{ Email: 'trial@mews.li' }],
    };

    // Add property type specific configuration
    let roomCount: number | undefined;
    let dormCount: number | undefined;
    let apartmentCount: number | undefined;
    let bedCount: number | undefined;

    if (propertyType === 'hostel') {
      Object.assign(apiBody, {
        CategoryCount: 4,
        FloorCount: 4,
        FloorRoomCount: 5,
        FloorDormCount: 2,
        DormBedCount: 4,
      });
      // Calculate room counts for hostel
      roomCount = 4 * 5; // FloorCount × FloorRoomCount = 20
      dormCount = 4 * 2; // FloorCount × FloorDormCount = 8
      bedCount = 4; // DormBedCount
    } else if (propertyType === 'apartments') {
      Object.assign(apiBody, {
        CategoryCount: 4,
        FloorCount: 4,
        FloorRoomCount: 0,
        FloorApartmentCount: 5,
        FloorDormCount: 0,
        DormBedCount: 0,
      });
      // Calculate apartment count
      apartmentCount = 4 * 5; // FloorCount × FloorApartmentCount = 20
    } else {
      // Default hotel configuration
      Object.assign(apiBody, {
        CategoryCount: 4,
        FloorCount: 4,
        FloorRoomCount: 5,
        FloorDormCount: 0,
        DormBedCount: 0,
      });
      // Calculate room count for hotel
      roomCount = 4 * 5; // FloorCount × FloorRoomCount = 20
    }

    // Add tax precision for Gross pricing
    if (pricingEnvironment === 'Gross') {
      apiBody.TaxPrecision = 2;
    }

    console.log('[CREATE-TRIAL] Creating sample enterprise:', {
      propertyName,
      propertyType,
      country: propertyCountry,
      durationDays
    });

    // Create log entry immediately with "building" status
    let log;
    try {
      log = await createEnvironmentLog({
        propertyName,
        customerName: `${firstName} ${lastName}`,
        customerEmail,
        propertyCountry,
        propertyType,
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: customerEmail,
        loginPassword: 'Sample123',
        status: 'building',
        requestorEmail,
        durationDays,
        roomCount,
        dormCount,
        apartmentCount,
        bedCount,
        salesforceAccountId,
        // timezone will be updated later from webhook via configuration/get API
      });
      console.log('[CREATE-TRIAL] Log created with building status:', log.id);
    } catch (dbError) {
      console.error('[CREATE-TRIAL] Failed to save environment log:', (dbError as Error).message);

      return NextResponse.json(
        {
          success: false,
          error: 'Database error: Failed to create trial log. Please contact support if this persists.',
          details: process.env.NODE_ENV === 'development' ? (dbError as Error).message : undefined
        },
        { status: 500 }
      );
    }

    // Call Mews API
    const response = await fetch(MEWS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiBody)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[CREATE-TRIAL] Mews API error:', result);

      // Update log to failure status
      try {
        await updateUnifiedLog(log.id, {
          status: 'failed',
          errorMessage: JSON.stringify(result)
        });
      } catch (dbError) {
        console.error('[CREATE-TRIAL] Database error - failed to update log to failure status:', dbError);
        // Don't fail the request here - we already have the Mews API error to report
      }

      // Send Zapier failure notification
      try {
        await sendZapierNotification('trial_generation_failure', {
          status: 'failure',
          propertyName,
          firstName,
          lastName,
          customerName: `${firstName} ${lastName}`,
          requestorEmail,
          customerEmail,
          error: 'Failed to create trial environment',
          errorDetails: JSON.stringify(result)
        });
      } catch (error) {
        console.error('[CREATE-TRIAL] Failed to send Zapier notification:', error);
      }

      return NextResponse.json(
        { success: false, error: 'Failed to create trial', details: result },
        { status: 500 }
      );
    }

    // Note: The Mews API may not reliably return an enterpriseId in the response.
    // The webhook will backfill the correct enterpriseId when it arrives.
    console.log('[CREATE-TRIAL] ✅ Trial creation initiated successfully');

    // Return immediately - Slack notification will be sent when access token webhook is received
    return NextResponse.json({
      success: true,
      message: 'Trial environment is being created. You will receive the login details shortly.',
      propertyName,
      status: 'building'
    });

  } catch (error) {
    console.error('[CREATE-TRIAL] Unexpected error:', (error as Error).message);

    // Determine error type and provide specific message
    let errorMessage = 'Internal server error';
    let errorDetails: string | undefined;

    if (error instanceof SyntaxError) {
      errorMessage = 'Invalid request format';
      errorDetails = process.env.NODE_ENV === 'development' ? error.message : undefined;
    } else if ((error as any).code === 'ECONNREFUSED' || (error as any).code === 'ETIMEDOUT') {
      errorMessage = 'Network error: Unable to reach external services';
      errorDetails = process.env.NODE_ENV === 'development' ? (error as Error).message : undefined;
    } else if ((error as Error).message?.includes('fetch')) {
      errorMessage = 'Failed to communicate with Mews API';
      errorDetails = process.env.NODE_ENV === 'development' ? (error as Error).message : undefined;
    } else if ((error as Error).message?.includes('prisma') || (error as Error).message?.includes('database')) {
      errorMessage = 'Database error: Unable to process request';
      errorDetails = process.env.NODE_ENV === 'development' ? (error as Error).message : undefined;
    } else {
      errorMessage = 'An unexpected error occurred';
      errorDetails = process.env.NODE_ENV === 'development' ? (error as Error).message : undefined;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}

