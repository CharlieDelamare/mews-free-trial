/**
 * Timezone Service - Fetches enterprise timezone from Mews API
 *
 * Provides a shared utility for fetching timezone configuration from Mews.
 * Used by webhook, reset, and manual environment addition flows.
 */

const MEWS_API_URL = process.env.MEWS_API_URL || 'https://api.mews-demo.com';

export interface TimezoneConfig {
  timezone: string;
  currency?: string;
  nowUtc?: string;
  error?: string;
}

/**
 * Fetch timezone from Mews configuration API
 * Falls back to 'UTC' if fetch fails (graceful degradation)
 *
 * @param clientToken - Mews client token
 * @param accessToken - Enterprise-specific access token
 * @returns Timezone configuration with fallback to UTC
 */
export async function fetchTimezoneFromConfiguration(
  clientToken: string,
  accessToken: string
): Promise<TimezoneConfig> {
  try {
    const response = await fetch(`${MEWS_API_URL}/api/connector/v1/configuration/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: clientToken,
        AccessToken: accessToken,
        Client: 'Mews Sandbox Manager'
      })
    });

    if (!response.ok) {
      throw new Error(`Configuration API failed: ${response.status}`);
    }

    const data = await response.json();
    const timezone = data.Enterprise?.TimeZoneIdentifier;

    // Find the default currency from the Currencies array
    const defaultCurrency = data.Enterprise?.Currencies?.find(
      (c: { IsDefault: boolean; Currency: string }) => c.IsDefault
    );
    const currency = defaultCurrency?.Currency;

    if (!timezone) {
      console.warn('[TIMEZONE-SERVICE] TimeZoneIdentifier not found at Enterprise.TimeZoneIdentifier, using UTC');
      return {
        timezone: 'UTC',
        currency,
        nowUtc: data.NowUtc
      };
    }

    console.log(`[TIMEZONE-SERVICE] Successfully fetched timezone: ${timezone}, currency: ${currency || 'N/A'}`);
    return {
      timezone,
      currency,
      nowUtc: data.NowUtc
    };

  } catch (error) {
    console.error('[TIMEZONE-SERVICE] Failed to fetch timezone:', error);
    console.warn('[TIMEZONE-SERVICE] Falling back to UTC timezone');
    return {
      timezone: 'UTC',
      error: error instanceof Error ? error.message : 'Unknown error fetching configuration'
    };
  }
}
