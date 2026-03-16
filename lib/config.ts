/**
 * Centralized configuration for Mews API access
 *
 * Reads MEWS_CLIENT_TOKEN from environment variables.
 * Throws if not set.
 */

/**
 * Get the Mews client token from environment variables.
 * Throws if the environment variable is not set.
 */
export function getMewsClientToken(): string {
  const token = process.env.MEWS_CLIENT_TOKEN;
  if (!token) {
    throw new Error('MEWS_CLIENT_TOKEN environment variable is required');
  }
  return token;
}

/**
 * Get the Mews API base URL from environment variables.
 * Defaults to the demo environment URL.
 */
export function getMewsApiUrl(): string {
  return process.env.MEWS_API_URL || 'https://api.mews-demo.com';
}
