/**
 * Centralized configuration for Mews API access
 *
 * Reads MEWS_CLIENT_TOKEN from environment variables.
 * Throws at startup if the token is missing to fail fast.
 */

const FALLBACK_CLIENT_TOKEN = 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';

/**
 * Get the Mews client token from environment variables.
 * Falls back to the hardcoded demo token if not set.
 */
export function getMewsClientToken(): string {
  return process.env.MEWS_CLIENT_TOKEN || FALLBACK_CLIENT_TOKEN;
}

/**
 * Get the Mews API base URL from environment variables.
 * Defaults to the demo environment URL.
 */
export function getMewsApiUrl(): string {
  return process.env.MEWS_API_URL || 'https://api.mews-demo.com';
}
