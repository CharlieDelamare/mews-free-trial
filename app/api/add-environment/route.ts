import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findEnvironmentLogByEnterpriseId, updateEnvironmentLog } from '@/lib/logger';
import { fetchReservations, cancelReservation } from '@/lib/reservations';
import { sendZapierNotification } from '@/lib/zapier';
import { createSampleCustomers } from '@/lib/customer-service';
import { fetchTimezoneFromConfiguration } from '@/lib/timezone-service';

// Hardcoded configuration for Mews demo environment
const MEWS_CLIENT_TOKEN = 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';

interface ConfigurationRequest {
  ClientToken: string;
  AccessToken: string;
  Client: string;
}

interface ConfigurationResponse {
  NowUtc: string;
  Enterprise: {
    Id: string;
    Name: string;
    [key: string]: any;
  };
  Service?: {
    Id: string;
    Name: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Parse a full name string into first and last name components
 */
function parseCustomerName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return { firstName: 'Guest', lastName: 'User' };
  }

  const parts = trimmed.split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  return { firstName, lastName };
}

/**
 * POST /api/add-environment
 * Manually add an environment by providing an access token
 */
export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Access token is required' },
        { status: 400 }
      );
    }

    // Validate database connection early
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      console.error('[ADD-ENVIRONMENT] Database connection failed:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection error. Please ensure DATABASE_URL is configured.',
          details: process.env.NODE_ENV === 'development' ? (dbError as Error).message : undefined
        },
        { status: 500 }
      );
    }

    console.log('[ADD-ENVIRONMENT] Validating access token with Mews Configuration API...');

    // Call Mews Configuration API to validate token and get enterprise details
    const mewsApiUrl = process.env.MEWS_API_URL || 'https://api.mews.com';
    const configUrl = `${mewsApiUrl}/api/connector/v1/configuration/get`;

    const configRequest: ConfigurationRequest = {
      ClientToken: MEWS_CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Mews Sandbox Manager'
    };

    const configResponse = await fetch(configUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(configRequest)
    });

    if (!configResponse.ok) {
      const errorText = await configResponse.text();
      console.error('[ADD-ENVIRONMENT] Configuration API error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Invalid access token or configuration error' },
        { status: 400 }
      );
    }

    const configData: ConfigurationResponse = await configResponse.json();

    console.log('[ADD-ENVIRONMENT] Configuration data received:', {
      enterpriseId: configData.Enterprise.Id,
      enterpriseName: configData.Enterprise.Name,
      serviceId: configData.Service?.Id,
      serviceName: configData.Service?.Name
    });

    // Fetch timezone for this enterprise
    console.log('[ADD-ENVIRONMENT] Fetching timezone...');
    const timezoneConfig = await fetchTimezoneFromConfiguration(MEWS_CLIENT_TOKEN, accessToken);
    console.log(`[ADD-ENVIRONMENT] Timezone: ${timezoneConfig.timezone}`);

    // Check if this access token already exists
    const existingToken = await prisma.accessToken.findFirst({
      where: {
        accessToken: accessToken
      }
    });

    if (existingToken) {
      console.log('[ADD-ENVIRONMENT] Access token already exists in database');
      return NextResponse.json(
        { success: false, error: 'This access token has already been added' },
        { status: 409 }
      );
    }

    // Store the access token and enterprise data
    const newToken = await prisma.accessToken.create({
      data: {
        accessToken: accessToken,
        enterpriseId: configData.Enterprise.Id,
        enterpriseName: configData.Enterprise.Name,
        serviceId: configData.Service?.Id || null,
        serviceName: configData.Service?.Name || null,
        integrationId: null,
        integrationName: null,
        createdUtc: configData.NowUtc,
        isEnabled: true,
        action: 'manual-addition'
      }
    });

    console.log('[ADD-ENVIRONMENT] Access token stored successfully:', {
      id: newToken.id,
      enterpriseId: newToken.enterpriseId,
      enterpriseName: newToken.enterpriseName
    });

    // Step 1: Cancel all existing reservations
    console.log('[ADD-ENVIRONMENT] Canceling existing reservations...');
    let canceledCount = 0;
    try {
      const { reservations, error: fetchError } = await fetchReservations({
        accessToken: accessToken,
        serviceId: configData.Service?.Id,
        states: ['Confirmed', 'Started']
      });

      if (fetchError) {
        console.error('[ADD-ENVIRONMENT] Failed to fetch reservations:', fetchError);
        // Continue - non-blocking, but logged
      }

      if (reservations.length > 0) {
        console.log(`[ADD-ENVIRONMENT] Found ${reservations.length} reservations to cancel`);
        for (const reservation of reservations) {
          const result = await cancelReservation({
            accessToken: accessToken,
            reservationId: reservation.Id,
            postCancellationFee: false,
            sendEmail: false,
            notes: 'Auto-canceled on manual environment addition'
          });
          if (result.success) canceledCount++;
        }
        console.log(`[ADD-ENVIRONMENT] ✅ Canceled ${canceledCount} reservations`);
      } else {
        console.log('[ADD-ENVIRONMENT] No reservations to cancel');
      }
    } catch (error) {
      console.error('[ADD-ENVIRONMENT] ⚠️  Failed to cancel reservations:', error);
      // Continue - non-blocking
    }

    // Step 2: Find matching EnvironmentLog and create customer
    // Find matching EnvironmentLog and update status
    console.log('[ADD-ENVIRONMENT] Looking for matching EnvironmentLog...');
    const log = await findEnvironmentLogByEnterpriseId(configData.Enterprise.Id);
    let customerCreated = false;

    if (log) {
      console.log('[ADD-ENVIRONMENT] ✅ Found log:', log.id);

      // Create customer from log data
      try {
        const { firstName, lastName } = parseCustomerName(log.customerName);
        console.log('[ADD-ENVIRONMENT] Creating customer:', firstName, lastName);

        const customerResponse = await fetch(`${mewsApiUrl}/api/connector/v1/customers/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ClientToken: MEWS_CLIENT_TOKEN,
            AccessToken: accessToken,
            Client: 'Mews Sandbox Manager',
            FirstName: firstName,
            LastName: lastName,
            Email: log.customerEmail
          })
        });

        const customerData = await customerResponse.json();

        if (customerResponse.ok && customerData.Id) {
          console.log('[ADD-ENVIRONMENT] ✅ Customer created:', customerData.Id);
          customerCreated = true;
        } else {
          console.warn('[ADD-ENVIRONMENT] ⚠️  Customer creation failed:', customerData.Message);
          // Customer might already exist - continue
        }
      } catch (error) {
        console.error('[ADD-ENVIRONMENT] ⚠️  Error creating customer:', error);
        // Continue - non-blocking
      }

      // Update log status to completed and store timezone
      try {
        await updateEnvironmentLog(configData.Enterprise.Id, {
          status: 'completed',
          timezone: timezoneConfig.timezone
        });
        console.log('[ADD-ENVIRONMENT] ✅ Log status updated to completed');
        console.log(`[ADD-ENVIRONMENT] ✅ Timezone stored: ${timezoneConfig.timezone}`);
      } catch (error) {
        console.error('[ADD-ENVIRONMENT] ⚠️  Failed to update log:', error);
      }
    } else {
      console.log('[ADD-ENVIRONMENT] ⚠️  No matching log found');
    }

    // Step 3: Create 100 sample customers in the background
    console.log('[ADD-ENVIRONMENT] Starting sample customer creation for enterprise:', configData.Enterprise.Id);
    createSampleCustomers(accessToken, configData.Enterprise.Id, newToken.id)
      .then(result => {
        console.log('[ADD-ENVIRONMENT] ✅ Customer creation completed:', {
          enterpriseId: configData.Enterprise.Id,
          totalCustomers: result.totalCustomers,
          successCount: result.successCount,
          failureCount: result.failureCount
        });
      })
      .catch(error => {
        console.error('[ADD-ENVIRONMENT] ❌ Customer creation failed:', error);
      });

    // Step 4: Send Zapier notification
    try {
      if (log) {
        // Full environment configuration notification
        await sendZapierNotification('manual_environment_configured', {
          status: 'success',
          propertyName: log.propertyName,
          customerName: log.customerName,
          customerEmail: log.customerEmail,
          requestorEmail: log.requestorEmail || undefined,
          loginUrl: log.loginUrl,
          loginEmail: log.loginEmail,
          loginPassword: log.loginPassword,
          enterpriseId: configData.Enterprise.Id,
          enterpriseName: configData.Enterprise.Name,
          reservationsCanceled: canceledCount,
          customerCreated: customerCreated,
          logUpdated: true
        });
      } else {
        // Access token added without matching log
        await sendZapierNotification('manual_environment_added', {
          status: 'info',
          action: 'manual-addition',
          enterpriseName: configData.Enterprise.Name,
          enterpriseId: configData.Enterprise.Id,
          reservationsCanceled: canceledCount,
          logFound: false
        });
      }
    } catch (error) {
      console.error('[ADD-ENVIRONMENT] Failed to send Zapier notification:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Sandbox added successfully and configured',
      data: {
        id: newToken.id,
        enterpriseId: newToken.enterpriseId,
        enterpriseName: newToken.enterpriseName,
        serviceId: newToken.serviceId,
        serviceName: newToken.serviceName,
        receivedAt: newToken.receivedAt
      },
      operations: {
        sampleCustomersCreating: true,
        logFound: !!log,
        logUpdated: !!log
      }
    });

  } catch (error) {
    console.error('[ADD-ENVIRONMENT] Error:', error);

    // Provide specific error message based on error type
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      if (error.message.includes('database') || error.message.includes('prisma')) {
        errorMessage = 'Database connection error. Please check server configuration.';
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = 'Failed to connect to Mews API. Please try again.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
