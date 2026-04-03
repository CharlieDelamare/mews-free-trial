/**
 * Admin email management
 *
 * Admin users get special treatment:
 * - Can create 1-day trial sandboxes
 * - Skip Salesforce Account ID validation
 *
 * Configured via ADMIN_EMAILS env var (comma-separated, required).
 */

export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  if (!envEmails) {
    throw new Error('ADMIN_EMAILS environment variable is required but not set');
  }
  return envEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}
