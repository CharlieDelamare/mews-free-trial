/**
 * Slack Workflow webhook notification utility
 * Sends structured data to a Slack Workflow webhook trigger
 */

export interface ZapierNotificationData {
  messageType: string;
  status: 'success' | 'failure' | 'info';
  timestamp: string;
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
  signInUrl?: string;
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
 * Sends a notification to the configured Slack Workflow webhook
 * @param messageType - Type of message for routing in the Slack Workflow
 * @param data - Notification data payload
 */
export async function sendZapierNotification(
  messageType: string,
  data: Partial<ZapierNotificationData>
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('[SLACK] Webhook URL not configured, skipping notification');
    return;
  }

  const payload: ZapierNotificationData = {
    messageType,
    status: data.status || 'info',
    timestamp: new Date().toISOString(),
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
      console.error('[SLACK] Webhook request failed:', {
        status: response.status,
        statusText: response.statusText
      });
    } else {
      console.log('[SLACK] Notification sent successfully:', messageType);
    }
  } catch (error) {
    console.error('[SLACK] Failed to send notification:', error);
    // Don't throw - notification failures should not break main flow
  }
}
