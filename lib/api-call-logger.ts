/**
 * API Call Logger
 *
 * Provides utilities for logging individual Mews API calls to the database.
 * Each call is stored in the ApiCallLog table, linked to a UnifiedLog entry.
 *
 * Features:
 * - Automatic token redaction (ClientToken, AccessToken)
 * - Response body truncation (max 10KB)
 * - Batched database writes (fire-and-forget)
 * - Drop-in replacement for fetch() via loggedFetch()
 * - Composition with existing rate limiter via fetchWithRateLimitAndLog()
 */

import { prisma } from './prisma';
import { mewsRateLimiter } from './mews-rate-limiter';

// === Types ===

export type ApiCallGroup =
  | 'initial'
  | 'setup'
  | 'customers'
  | 'reservations'
  | 'state_transitions'
  | 'tasks'
  | 'bills';

export interface ApiCallLogContext {
  unifiedLogId: string;
  group: ApiCallGroup;
  endpoint?: string;
  metadata?: Record<string, unknown>;
}

interface ApiCallLogEntry {
  unifiedLogId: string;
  endpoint: string;
  method: string;
  url: string;
  group: string;
  statusCode: number | null;
  durationMs: number;
  success: boolean;
  requestBody: string | null;
  responseBody: string | null;
  errorMessage: string | null;
  metadata?: Record<string, unknown> | null;
}

// === Constants ===

const SENSITIVE_KEYS = new Set(['ClientToken', 'AccessToken', 'Token', 'client_token', 'access_token']);
const MAX_BODY_SIZE = 10 * 1024; // 10KB
const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 2000;

// === Token Redaction ===

/**
 * Recursively redact sensitive fields from an object.
 * Replaces values of keys matching SENSITIVE_KEYS with '[REDACTED]'.
 */
export function redactSensitiveFields(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveFields(item));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSensitiveFields(value);
      }
    }
    return result;
  }

  return obj;
}

// === Body Truncation ===

/**
 * Truncate a string to a maximum number of bytes.
 * Appends a truncation notice if the string exceeds the limit.
 */
export function truncateBody(text: string, maxBytes: number = MAX_BODY_SIZE): string {
  if (text.length <= maxBytes) return text;
  return text.slice(0, maxBytes) + '\n... [TRUNCATED]';
}

// === Endpoint Extraction ===

/**
 * Extract a short endpoint name from a full Mews API URL.
 * e.g., "https://api.mews-demo.com/api/connector/v1/customers/add" -> "customers/add"
 */
export function extractEndpoint(url: string): string {
  const match = url.match(/\/api\/(?:connector|general)\/v1\/(.+)/);
  return match ? match[1] : url;
}

// === Batched Database Writer ===

class ApiCallLogBuffer {
  private buffer: ApiCallLogEntry[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  add(entry: ApiCallLogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length >= BATCH_SIZE) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS);
    }
  }

  flush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const entries = this.buffer.splice(0);
    if (entries.length === 0) return;

    // Fire-and-forget database write
    prisma.apiCallLog
      .createMany({
        data: entries.map(e => ({
          unifiedLogId: e.unifiedLogId,
          endpoint: e.endpoint,
          method: e.method,
          url: e.url,
          group: e.group,
          statusCode: e.statusCode,
          durationMs: e.durationMs,
          success: e.success,
          requestBody: e.requestBody,
          responseBody: e.responseBody,
          errorMessage: e.errorMessage,
          metadata: e.metadata ?? undefined,
        })),
      })
      .catch(err => {
        console.error(`[API-CALL-LOG] Failed to persist ${entries.length} log entries:`, err.message);
      });
  }
}

/** Singleton buffer instance */
const logBuffer = new ApiCallLogBuffer();

// === Core Logging Functions ===

/**
 * Prepare a redacted request body string from fetch options.
 */
function prepareRequestBody(options: RequestInit): string | null {
  if (!options.body || typeof options.body !== 'string') return null;

  try {
    const parsed = JSON.parse(options.body);
    const redacted = redactSensitiveFields(parsed);
    return truncateBody(JSON.stringify(redacted));
  } catch {
    return '[non-JSON body]';
  }
}

/**
 * Drop-in replacement for fetch() that logs the API call to the database.
 *
 * Usage:
 * ```typescript
 * const response = await loggedFetch(url, fetchOptions, {
 *   unifiedLogId: logId,
 *   group: 'setup',
 *   endpoint: 'services/getAll', // optional, auto-detected from URL
 * });
 * ```
 */
export async function loggedFetch(
  url: string,
  options: RequestInit,
  logContext: ApiCallLogContext
): Promise<Response> {
  const startTime = Date.now();
  const endpoint = logContext.endpoint || extractEndpoint(url);
  const redactedRequestBody = prepareRequestBody(options);

  try {
    const response = await fetch(url, options);
    const durationMs = Date.now() - startTime;

    // Clone response to read body without consuming original
    let responseBodyStr: string | null = null;
    try {
      const cloned = response.clone();
      const text = await cloned.text();
      responseBodyStr = truncateBody(text);
    } catch {
      responseBodyStr = '[failed to read response body]';
    }

    logBuffer.add({
      unifiedLogId: logContext.unifiedLogId,
      endpoint,
      method: options.method || 'GET',
      url,
      group: logContext.group,
      statusCode: response.status,
      durationMs,
      success: response.ok,
      requestBody: redactedRequestBody,
      responseBody: responseBodyStr,
      errorMessage: response.ok ? null : `HTTP ${response.status}`,
      metadata: logContext.metadata || null,
    });

    return response;
  } catch (error) {
    const durationMs = Date.now() - startTime;

    logBuffer.add({
      unifiedLogId: logContext.unifiedLogId,
      endpoint,
      method: options.method || 'GET',
      url,
      group: logContext.group,
      statusCode: null,
      durationMs,
      success: false,
      requestBody: redactedRequestBody,
      responseBody: null,
      errorMessage: error instanceof Error ? error.message : String(error),
      metadata: logContext.metadata || null,
    });

    throw error;
  }
}

/**
 * Wrapper that composes rate limiting with API call logging.
 * Use this instead of fetchWithRateLimit() when you have a logId.
 *
 * Usage:
 * ```typescript
 * const response = await fetchWithRateLimitAndLog(url, accessToken, fetchOptions, 'customers/add', {
 *   unifiedLogId: logId,
 *   group: 'customers',
 *   metadata: { customerEmail: 'test@example.com' },
 * });
 * ```
 */
export async function fetchWithRateLimitAndLog(
  url: string,
  accessToken: string,
  options: RequestInit,
  context: string,
  logContext: ApiCallLogContext
): Promise<Response> {
  return mewsRateLimiter.executeRequest<Response>(
    accessToken,
    () =>
      loggedFetch(url, options, {
        ...logContext,
        endpoint: logContext.endpoint || context,
      }),
    { logContext: context }
  );
}

/**
 * Force flush the log buffer. Call this before the process exits
 * or when the background work completes to ensure all entries are persisted.
 */
export function flushApiCallLogs(): void {
  logBuffer.flush();
}
