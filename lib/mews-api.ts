/**
 * Mews API request construction helpers
 *
 * Centralizes the common patterns for building Mews API requests:
 * - ClientToken / AccessToken / Client fields
 * - API endpoint URL construction
 */

import { getMewsClientToken, getMewsApiUrl } from './config';

const CLIENT_NAME = 'Mews Sandbox Manager';

/**
 * Build the standard authentication fields for a Mews Connector API request.
 */
export function buildMewsAuth(accessToken: string) {
  return {
    ClientToken: getMewsClientToken(),
    AccessToken: accessToken,
    Client: CLIENT_NAME,
  };
}

/**
 * Build a full Mews API endpoint URL from a path.
 * @param path - e.g. "connector/v1/customers/add"
 */
export function mewsEndpoint(path: string): string {
  const base = getMewsApiUrl();
  // Ensure no double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}/api/${cleanPath}`;
}
