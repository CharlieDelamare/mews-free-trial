/**
 * Admin email management
 *
 * Admin users get special treatment:
 * - Can create 1-day trial sandboxes
 * - Skip Salesforce Account ID validation
 * - Auto-populated test data
 *
 * Configured via ADMIN_EMAILS env var (comma-separated).
 * Falls back to hardcoded defaults if not set.
 */

const DEFAULT_ADMIN_EMAILS = [
  'charlie.delamare@gmail.com',
  'charlie.delamare@mews.com',
];

/**
 * Get the list of admin emails from env var or defaults
 * Supports both server-side (ADMIN_EMAILS) and client-side (NEXT_PUBLIC_ADMIN_EMAILS)
 */
function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  if (envEmails) {
    return envEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  }
  return DEFAULT_ADMIN_EMAILS;
}

/**
 * Check if an email address belongs to an admin user
 */
export function isAdminEmail(email: string): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}
