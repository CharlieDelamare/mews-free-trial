/**
 * Zapier webhook notification utility
 * Sends structured notifications to Zapier for formatting and delivery to Slack
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
  [key: string]: any;
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
