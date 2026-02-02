import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findEnvironmentLogByEnterpriseId, updateEnvironmentLog } from '@/lib/logger';
import { createSampleCustomers } from '@/lib/customer-service';

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

    console.log('[ADD-ENVIRONMENT] Validating access token with Mews Configuration API...');

    // Call Mews Configuration API to validate token and get enterprise details
    const mewsApiUrl = process.env.MEWS_API_URL || 'https://api.mews.com';
    const configUrl = `${mewsApiUrl}/api/connector/v1/configuration/get`;

    const configRequest: ConfigurationRequest = {
      ClientToken: MEWS_CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Mews Free Trial App v1.0'
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

    // Find matching EnvironmentLog and update status
    console.log('[ADD-ENVIRONMENT] Looking for matching EnvironmentLog...');
    const log = await findEnvironmentLogByEnterpriseId(configData.Enterprise.Id);

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
            Client: 'Mews Free Trial App v1.0',
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

      // Update log status to completed
      try {
        await updateEnvironmentLog(configData.Enterprise.Id, { status: 'completed' });
        console.log('[ADD-ENVIRONMENT] ✅ Log status updated to completed');
      } catch (error) {
        console.error('[ADD-ENVIRONMENT] ⚠️  Failed to update log:', error);
      }
    } else {
      console.log('[ADD-ENVIRONMENT] ⚠️  No matching log found');
    }

    // Create 100 sample customers in the background
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

    // Step 3: Send Slack notification
    if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID) {
      console.log('[ADD-ENVIRONMENT] Sending Slack notification...');
      try {
        const blocks = log
          ? [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: '✅ Manual Environment Added & Configured!',
                  emoji: true
                }
              },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*Property Name:*\n${log.propertyName}` },
                  { type: 'mrkdwn', text: `*Contact:*\n${log.customerName}` },
                  { type: 'mrkdwn', text: `*Requested By:*\n${log.requestorEmail || 'N/A'}` },
                  { type: 'mrkdwn', text: `*Customer Email:*\n${log.customerEmail}` }
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
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Operations:*\n• ✅ 100 sample customers being created\n• ✅ Log status updated to completed`
                }
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `Enterprise ID: ${configData.Enterprise.Id} | Added At: ${new Date().toLocaleString()}`
                  }
                ]
              }
            ]
          : [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: '🔑 Access Token Added Manually'
                }
              },
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*Action:*\nmanual-addition` },
                  { type: 'mrkdwn', text: `*Enterprise:*\n${configData.Enterprise.Name}` },
                  { type: 'mrkdwn', text: `*Enterprise ID:*\n${configData.Enterprise.Id}` },
                  { type: 'mrkdwn', text: `*Received At:*\n${new Date().toLocaleString()}` }
                ]
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Operations:*\n• ✅ 100 sample customers being created\n• ⚠️ No matching EnvironmentLog found`
                }
              }
            ];

        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
          },
          body: JSON.stringify({
            channel: process.env.SLACK_CHANNEL_ID,
            blocks
          })
        });
        console.log('[ADD-ENVIRONMENT] ✅ Slack notification sent');
      } catch (error) {
        console.error('[ADD-ENVIRONMENT] ⚠️  Failed to send Slack notification:', error);
      }
    } else {
      console.log('[ADD-ENVIRONMENT] ⚠️  Slack not configured, skipping notification');
    }

    return NextResponse.json({
      success: true,
      message: 'Environment added successfully and configured',
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
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
