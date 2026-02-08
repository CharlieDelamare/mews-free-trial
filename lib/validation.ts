/**
 * Input validation helpers for API routes
 */

/**
 * Validate an email address format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  // Simple but effective email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate a string value: non-empty, within max length, no control characters
 */
export function isValidString(value: unknown, maxLength: number = 500): boolean {
  if (typeof value !== 'string') return false;
  if (value.trim().length === 0) return false;
  if (value.length > maxLength) return false;
  // Reject control characters (except newline/tab)
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value)) return false;
  return true;
}

/**
 * Validate a Salesforce Account ID format (starts with "001", 15 or 18 chars)
 */
export function isValidSalesforceId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  return /^001[a-zA-Z0-9]{12,15}$/.test(trimmed);
}

/**
 * Sanitize a string by trimming whitespace
 */
export function sanitizeString(value: string): string {
  return value.trim();
}
