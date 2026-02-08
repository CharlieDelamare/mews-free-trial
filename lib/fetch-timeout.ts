/**
 * Fetch with timeout using AbortController
 *
 * Wraps the native fetch() with an automatic timeout.
 * If the request doesn't complete within the specified timeout,
 * the request is aborted and an error is thrown.
 */

const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds for Mews API calls

/**
 * Fetch with an automatic timeout.
 *
 * @param url - Request URL
 * @param options - Standard fetch RequestInit options
 * @param timeoutMs - Timeout in milliseconds (default: 30s)
 * @returns Response from fetch
 * @throws Error if the request times out or fails
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
