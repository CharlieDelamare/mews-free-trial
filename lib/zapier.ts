/**
 * Zapier webhook notification utility
 * Sends structured notifications to Zapier for formatting and delivery to Slack
 */

export interface ZapierNotificationData {
  messageType: string;
  status: 'success' | 'failure' | 'info';
  timestamp: string;
  slackMessage?: string;
  propertyName?: string;
  enterpriseId?: string;
  enterpriseName?: string;
  propertyCountry?: string;
  propertyType?: string;
  customerName?: string;
  customerEmail?: string;
  firstName?: string;
  lastName?: string;
  loginUrl?: string;
  loginEmail?: string;
  loginPassword?: string;
  requestorEmail?: string;
  reservationsCanceled?: number;
  customerCreated?: boolean;
  logFound?: boolean;
  logUpdated?: boolean;
  error?: string;
  errorDetails?: string;
  action?: string;
  receivedAt?: string;
  tokenId?: number;
  phone?: string;
  companyName?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  reservationId?: string;
  confirmationNumber?: string;
  [key: string]: any;
}

/**
 * Helper function to truncate long text
 */
function truncate(text: string, maxLength: number = 500): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format trial generation failure message
 */
function formatTrialGenerationFailure(data: Partial<ZapierNotificationData>): string {
  return `:x: *Trial Sandbox Generation Failed*

Failed to create trial sandbox for *${data.propertyName || 'Unknown Property'}*

*Customer:* ${data.firstName || ''} ${data.lastName || ''}
*Email:* ${data.customerEmail || 'N/A'}
*Requestor:* ${data.requestorEmail || 'N/A'}

*Error:* ${truncate(data.error || 'Unknown error', 300)}

_Please review the error details and try again or contact support if the issue persists._`;
}

/**
 * Format environment ready message
 */
function formatEnvironmentReady(data: Partial<ZapierNotificationData>): string {
  return `:white_check_mark: *Trial Sandbox Ready!*

*${data.propertyName || 'Property'}* is now live and ready for *${data.customerName || 'customer'}*

*Login Credentials:*
• URL: <${data.loginUrl || 'https://app.mews-demo.com'}|${data.loginUrl || 'https://app.mews-demo.com'}>
• Email: \`${data.loginEmail || 'N/A'}\`
• Password: \`${data.loginPassword || 'N/A'}\`

*Enterprise Details:*
• Enterprise ID: ${data.enterpriseId || 'N/A'}
• Enterprise Name: ${data.enterpriseName || 'N/A'}

*Requestor:* ${data.requestorEmail || 'N/A'}`;
}

/**
 * Format access token no match message
 */
function formatAccessTokenNoMatch(data: Partial<ZapierNotificationData>): string {
  return `:warning: *Access Token Received - No Matching Log Found*

Received access token for enterprise *${data.enterpriseName || 'Unknown'}* but couldn't find a matching sandbox log.

*Details:*
• Enterprise ID: \`${data.enterpriseId || 'N/A'}\`
• Action: ${data.action || 'N/A'}
• Token ID: ${data.tokenId || 'N/A'}
• Received: ${data.receivedAt || 'N/A'}

_This may indicate a manually created sandbox or a webhook timing issue. The token has been stored for future use._`;
}

/**
 * Format manual environment configured message
 */
function formatManualEnvironmentConfigured(data: Partial<ZapierNotificationData>): string {
  return `:gear: *Manual Sandbox Configured Successfully*

Sandbox *${data.propertyName || 'Property'}* has been manually added and fully configured for *${data.customerName || 'customer'}*

*Login Credentials:*
• URL: <${data.loginUrl || 'https://app.mews-demo.com'}|${data.loginUrl || 'https://app.mews-demo.com'}>
• Email: \`${data.loginEmail || 'N/A'}\`
• Password: \`${data.loginPassword || 'N/A'}\`

*Operations Completed:*
• :wastebasket: Reservations canceled: ${data.reservationsCanceled || 0}
• :bust_in_silhouette: Customer created: ${data.customerCreated ? 'Yes' : 'No'}
• :white_check_mark: Log status updated to completed
• :busts_in_silhouette: 100 sample customers: Creating in background...

*Enterprise Details:*
• Enterprise ID: ${data.enterpriseId || 'N/A'}
• Enterprise Name: ${data.enterpriseName || 'N/A'}

*Requestor:* ${data.requestorEmail || 'N/A'}`;
}

/**
 * Format manual environment added message
 */
function formatManualEnvironmentAdded(data: Partial<ZapierNotificationData>): string {
  return `:information_source: *Manual Sandbox Added*

Sandbox *${data.enterpriseName || 'Unknown'}* has been manually added to the system.

*Details:*
• Enterprise ID: \`${data.enterpriseId || 'N/A'}\`
• :wastebasket: Reservations canceled: ${data.reservationsCanceled || 0}
• Action: ${data.action || 'N/A'}

:warning: _No matching sandbox log found. This sandbox was likely created outside the trial generator or via a direct Mews integration._`;
}

/**
 * Format reservation created message
 */
function formatReservationCreated(data: Partial<ZapierNotificationData>): string {
  return `:calendar: *Reservation Created*

New reservation created for *${data.firstName || ''} ${data.lastName || ''}*

*Contact Information:*
• Email: ${data.customerEmail || 'N/A'}
• Phone: ${data.phone || 'Not provided'}
• Company: ${data.companyName || 'Not provided'}

*Reservation Details:*
• Check-in: ${data.startDate || 'N/A'}
• Check-out: ${data.endDate || 'N/A'}
• Confirmation #: \`${data.confirmationNumber || 'N/A'}\`
• Reservation ID: \`${data.reservationId || 'N/A'}\`

*Notes:* ${data.notes || 'None'}`;
}

/**
 * Format generic message for unknown types
 */
function formatGenericMessage(messageType: string, data: Partial<ZapierNotificationData>): string {
  const statusEmoji = data.status === 'success' ? ':white_check_mark:' :
                      data.status === 'failure' ? ':x:' :
                      ':information_source:';

  return `${statusEmoji} *Notification: ${messageType}*

Status: ${data.status || 'info'}
Timestamp: ${data.timestamp || new Date().toISOString()}`;
}

/**
 * Generate a formatted Slack message based on message type
 * @param messageType - Type of notification
 * @param data - Notification data
 * @returns Formatted Slack markdown message
 */
function generateSlackMessage(
  messageType: string,
  data: Partial<ZapierNotificationData>
): string {
  try {
    switch (messageType) {
      case 'trial_generation_failure':
        return formatTrialGenerationFailure(data);

      case 'environment_ready':
        return formatEnvironmentReady(data);

      case 'access_token_no_match':
        return formatAccessTokenNoMatch(data);

      case 'manual_environment_configured':
        return formatManualEnvironmentConfigured(data);

      case 'manual_environment_added':
        return formatManualEnvironmentAdded(data);

      case 'reservation_created':
        return formatReservationCreated(data);

      default:
        return formatGenericMessage(messageType, data);
    }
  } catch (error) {
    console.error('[ZAPIER] Failed to generate Slack message:', error);
    // Fallback to basic message if generation fails
    return formatGenericMessage(messageType, data);
  }
}

/**
 * Sends a notification to the configured Zapier webhook
 * @param messageType - Type of message for routing in Zapier
 * @param data - Notification data payload
 */
export async function sendZapierNotification(
  messageType: string,
  data: Partial<ZapierNotificationData>
): Promise<void> {
  const webhookUrl = process.env.ZAPIER_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('[ZAPIER] Webhook URL not configured, skipping notification');
    return;
  }

  // Generate formatted Slack message
  const slackMessage = generateSlackMessage(messageType, data);

  const payload: ZapierNotificationData = {
    messageType,
    status: data.status || 'info',
    timestamp: new Date().toISOString(),
    slackMessage,
    ...data
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('[ZAPIER] Webhook request failed:', {
        status: response.status,
        statusText: response.statusText
      });
    } else {
      console.log('[ZAPIER] Notification sent successfully:', messageType);
    }
  } catch (error) {
    console.error('[ZAPIER] Failed to send notification:', error);
    // Don't throw - notification failures should not break main flow
  }
}
