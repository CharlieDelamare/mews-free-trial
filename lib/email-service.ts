/**
 * Email notification service using Resend
 * Sends sandbox login credentials to customers and requestors
 */

import { Resend } from 'resend';

interface SandboxReadyEmailParams {
  customerEmail: string;
  customerName: string;
  requestorEmail?: string;
  propertyName: string;
  loginUrl: string;
  loginEmail: string;
  loginPassword: string;
  signInUrl?: string;
  durationDays?: number;
}

function buildSandboxReadyHtml(params: SandboxReadyEmailParams): string {
  const durationText = params.durationDays
    ? `Your trial sandbox is valid for <strong>${params.durationDays} days</strong>.`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#2563eb;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;">Your Mews Sandbox is Ready</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                Hi ${params.customerName},
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Your demo sandbox <strong>${params.propertyName}</strong> has been set up and is ready to explore. ${durationText}
              </p>
              <!-- Credentials Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#111827;">Login Credentials</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                      <tr>
                        <td style="padding:4px 0;color:#6b7280;font-size:13px;width:80px;">URL</td>
                        <td style="padding:4px 0;">
                          <a href="${params.loginUrl}" style="color:#2563eb;font-size:13px;text-decoration:none;">${params.loginUrl}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#6b7280;font-size:13px;">Email</td>
                        <td style="padding:4px 0;color:#111827;font-size:13px;font-family:monospace;">${params.loginEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#6b7280;font-size:13px;">Password</td>
                        <td style="padding:4px 0;color:#111827;font-size:13px;font-family:monospace;">${params.loginPassword}</td>
                      </tr>${params.signInUrl ? `
                      <tr>
                        <td style="padding:4px 0;color:#6b7280;font-size:13px;">Sign-in</td>
                        <td style="padding:4px 0;">
                          <a href="${params.signInUrl}" style="color:#2563eb;font-size:13px;text-decoration:none;">Sign in without password</a>
                        </td>
                      </tr>` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <a href="${params.signInUrl || params.loginUrl}" style="display:inline-block;padding:12px 32px;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">
                      Log In to Your Sandbox
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;text-align:center;">
                This is an automated message from the Mews Sandbox Manager.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send sandbox ready email to customer and requestor
 * Non-blocking: logs errors but does not throw (same pattern as Zapier notifications)
 */
export async function sendSandboxReadyEmail(params: SandboxReadyEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log('[EMAIL] Resend API key not configured, skipping email notification');
    return;
  }

  const resend = new Resend(apiKey);

  // Build recipient list: always include customer, add requestor if provided and different
  const recipients: string[] = [params.customerEmail];
  if (params.requestorEmail && params.requestorEmail !== params.customerEmail) {
    recipients.push(params.requestorEmail);
  }

  try {
    const { error } = await resend.emails.send({
      from: 'Mews Sandbox <onboarding@resend.dev>',
      to: recipients,
      subject: `Your Mews Sandbox "${params.propertyName}" is Ready`,
      html: buildSandboxReadyHtml(params),
    });

    if (error) {
      console.error('[EMAIL] Failed to send sandbox ready email:', error);
    } else {
      console.log('[EMAIL] Sandbox ready email sent to:', recipients.join(', '));
    }
  } catch (error) {
    console.error('[EMAIL] Error sending sandbox ready email:', (error as Error).message);
  }
}
