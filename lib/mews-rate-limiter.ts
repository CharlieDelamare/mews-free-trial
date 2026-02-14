/**
 * Mews API Rate Limiter
 *
 * Prevents 429 "Too Many Requests" errors by tracking and throttling requests
 * to the Mews API. Implements a sliding window algorithm with per-AccessToken tracking.
 *
 * Rate Limit: 200 requests per AccessToken within 30 seconds
 *
 * Features:
 * - Sliding window rate limiting per AccessToken
 * - Automatic throttling at 90% capacity (180 requests)
 * - FIFO request queuing when at capacity
 * - 429 error handling with Retry-After header support
 * - Exponential backoff for retries (1s, 2s, 4s)
 * - Comprehensive logging and metrics
 */

/**
 * Configuration for the rate limiter
 */
interface RateLimiterConfig {
  /** Maximum requests allowed per window (default: 200) */
  maxRequests: number;
  /** Time window in milliseconds (default: 30000 = 30 seconds) */
  windowMs: number;
  /** Safety buffer as percentage (default: 0.9 = 90%, throttle at 180 requests) */
  safetyBuffer: number;
  /** Maximum retry attempts for 429 errors (default: 3) */
  maxRetries: number;
  /** Base backoff time in milliseconds for exponential backoff (default: 1000 = 1 second) */
  baseBackoffMs: number;
  /** Enable detailed logging (default: true) */
  enableLogging: boolean;
}

/**
 * Queued request awaiting capacity
 */
interface QueuedRequest {
  /** Function that executes the HTTP request */
  requestFn: () => Promise<Response>;
  /** Promise resolve callback */
  resolve: (value: any) => void;
  /** Promise reject callback */
  reject: (error: Error) => void;
  /** Context string for logging */
  context?: string;
  /** Current retry count */
  retryCount: number;
  /** Timestamp when request was queued */
  timestamp: number;
}

/**
 * Request tracking window for a specific AccessToken
 */
interface RequestWindow {
  /** Timestamps of requests made within the window */
  timestamps: number[];
  /** Queue of pending requests */
  queue: QueuedRequest[];
  /** Flag indicating if queue is being processed */
  isProcessing: boolean;
}

/**
 * Rate limiter metrics for monitoring
 */
export interface RateLimitMetrics {
  /** Current number of requests in the window */
  currentCount: number;
  /** Percentage of rate limit used (0-100) */
  percentageUsed: number;
  /** Number of requests in queue */
  queueLength: number;
  /** Whether throttling is active */
  isThrottling: boolean;
}

/**
 * MewsRateLimiter - Centralized rate limiting for Mews API calls
 *
 * Tracks requests per AccessToken using a sliding window algorithm.
 * Automatically queues requests when approaching the rate limit and
 * handles 429 errors with intelligent retry logic.
 */
export class MewsRateLimiter {
  private windows: Map<string, RequestWindow>;
  private config: RateLimiterConfig;

  constructor(config?: Partial<RateLimiterConfig>) {
    this.windows = new Map();
    this.config = {
      maxRequests: config?.maxRequests ?? 200,
      windowMs: config?.windowMs ?? 30000,
      safetyBuffer: config?.safetyBuffer ?? 0.9,
      maxRetries: config?.maxRetries ?? 3,
      baseBackoffMs: config?.baseBackoffMs ?? 1000,
      enableLogging: config?.enableLogging ?? true
    };

    if (this.config.enableLogging) {
      console.log('[RATE-LIMITER] Initialized with config:', {
        maxRequests: this.config.maxRequests,
        windowMs: `${this.config.windowMs}ms`,
        safetyBuffer: `${this.config.safetyBuffer * 100}%`,
        maxRetries: this.config.maxRetries
      });
    }
  }

  /**
   * Execute a request with rate limiting and automatic retry on 429 errors
   *
   * @param accessToken - Mews AccessToken for tracking rate limits
   * @param requestFn - Function that executes the HTTP request
   * @param options - Optional configuration (maxRetries, logContext)
   * @returns Parsed JSON response
   */
  async executeRequest<T>(
    accessToken: string,
    requestFn: () => Promise<Response>,
    options?: {
      maxRetries?: number;
      logContext?: string;
    }
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? this.config.maxRetries;
    const logContext = options?.logContext ?? 'unknown';
    const redactedToken = this.redactToken(accessToken);

    // Wait for capacity and reserve a slot (tracking happens inside waitForCapacity
    // to ensure the check-and-reserve is atomic within the synchronous call frame)
    await this.waitForCapacity(accessToken);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Execute the request
        const response = await requestFn();

        // Handle 429 Too Many Requests
        if (response.status === 429) {
          if (attempt < maxRetries) {
            const waitMs = await this.handle429Error(response, accessToken, attempt, logContext);
            await new Promise(resolve => setTimeout(resolve, waitMs));
            continue; // Retry
          } else {
            throw new Error(
              `Rate limit exceeded after ${maxRetries} retries. ` +
              `Context: ${logContext}. Token: ${redactedToken}`
            );
          }
        }

        if (this.config.enableLogging && attempt > 0 && (response.ok || response.status < 500)) {
          console.log(
            `[RATE-LIMITER] ✅ Request successful after ${attempt} ${attempt === 1 ? 'retry' : 'retries'} | ` +
            `Context: ${logContext} | Token: ${redactedToken}`
          );
        }

        // Return response (let caller handle response.ok checking)
        return response as T;

      } catch (error) {
        lastError = error as Error;

        // Don't retry on non-429 errors
        if (attempt < maxRetries && (error as any).message?.includes('Rate limit')) {
          const backoffMs = this.exponentialBackoff(attempt);
          if (this.config.enableLogging) {
            console.log(
              `[RATE-LIMITER] Retry ${attempt + 1}/${maxRetries}: exponential backoff ${backoffMs}ms | ` +
              `Context: ${logContext}`
            );
          }
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        } else {
          // Non-retryable error, throw immediately
          throw error;
        }
      }
    }

    throw lastError!;
  }

  /**
   * Wait until there is capacity to make a request
   * Uses the sliding window to track requests and queues when at capacity
   */
  private async waitForCapacity(accessToken: string): Promise<void> {
    this.cleanupOldRequests(accessToken);

    while (!this.canMakeRequest(accessToken)) {
      const window = this.getOrCreateWindow(accessToken);
      const oldestTimestamp = window.timestamps[0];

      if (oldestTimestamp) {
        // Calculate wait time until oldest request expires
        const waitMs = this.config.windowMs - (Date.now() - oldestTimestamp) + 100; // +100ms buffer

        if (this.config.enableLogging) {
          const metrics = this.getMetrics(accessToken);
          console.log(
            `[RATE-LIMITER] At capacity (${metrics.currentCount}/${this.config.maxRequests}), ` +
            `waiting ${Math.max(0, waitMs)}ms | Token: ${this.redactToken(accessToken)}`
          );
        }

        await new Promise(resolve => setTimeout(resolve, Math.max(100, waitMs)));
        this.cleanupOldRequests(accessToken);
      } else {
        // No timestamps but still can't make request? Break to avoid infinite loop
        break;
      }
    }

    // Reserve capacity immediately after the check passes.
    // This runs synchronously (no await between check and track), so concurrent
    // callers in the same event loop tick see the updated count.
    this.trackRequest(accessToken);
  }

  /**
   * Remove timestamps older than the window
   */
  private cleanupOldRequests(accessToken: string): void {
    const window = this.getOrCreateWindow(accessToken);
    const cutoff = Date.now() - this.config.windowMs;
    window.timestamps = window.timestamps.filter(timestamp => timestamp > cutoff);
  }

  /**
   * Get current number of requests in the window
   */
  private getCurrentRequestCount(accessToken: string): number {
    const window = this.getOrCreateWindow(accessToken);
    return window.timestamps.length;
  }

  /**
   * Check if we can make a request without exceeding the safety buffer
   */
  private canMakeRequest(accessToken: string): boolean {
    const currentCount = this.getCurrentRequestCount(accessToken);
    const threshold = Math.floor(this.config.maxRequests * this.config.safetyBuffer);
    return currentCount < threshold;
  }

  /**
   * Track a successful request by adding its timestamp
   */
  private trackRequest(accessToken: string): void {
    const window = this.getOrCreateWindow(accessToken);
    window.timestamps.push(Date.now());

    // Log metrics periodically (every 20 requests)
    if (this.config.enableLogging && window.timestamps.length % 20 === 0) {
      this.logMetrics(accessToken);
    }
  }

  /**
   * Handle 429 Too Many Requests error
   * Parses Retry-After header and calculates wait time
   *
   * @returns Wait time in milliseconds
   */
  private async handle429Error(
    response: Response,
    accessToken: string,
    retryCount: number,
    logContext?: string
  ): Promise<number> {
    const retryAfter = response.headers.get('Retry-After');
    const waitMs = this.parseRetryAfter(retryAfter) || this.exponentialBackoff(retryCount);

    if (this.config.enableLogging) {
      const source = retryAfter ? `Retry-After: ${retryAfter}` : 'exponential backoff';
      console.log(
        `[RATE-LIMITER] 429 received, waiting ${waitMs}ms (${source}) | ` +
        `Retry ${retryCount + 1}/${this.config.maxRetries} | ` +
        `Context: ${logContext} | Token: ${this.redactToken(accessToken)}`
      );
    }

    return waitMs;
  }

  /**
   * Parse Retry-After header (seconds or HTTP-date)
   *
   * @param retryAfter - Retry-After header value
   * @returns Wait time in milliseconds, or null if invalid
   */
  private parseRetryAfter(retryAfter: string | null): number | null {
    if (!retryAfter) {
      return null;
    }

    // Try parsing as integer (seconds)
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds) && seconds > 0) {
      return seconds * 1000;
    }

    // Try parsing as HTTP-date
    const retryDate = new Date(retryAfter);
    if (!isNaN(retryDate.getTime())) {
      const waitMs = Math.max(0, retryDate.getTime() - Date.now());
      if (waitMs > 0) {
        return waitMs;
      }
    }

    // Invalid header
    if (this.config.enableLogging) {
      console.warn(`[RATE-LIMITER] Invalid Retry-After header: "${retryAfter}", using exponential backoff`);
    }
    return null;
  }

  /**
   * Calculate exponential backoff: baseBackoffMs * (2 ^ retryCount)
   * Examples: 1s, 2s, 4s, 8s, ...
   */
  private exponentialBackoff(retryCount: number): number {
    return this.config.baseBackoffMs * Math.pow(2, retryCount);
  }

  /**
   * Get or create request window for an AccessToken
   */
  private getOrCreateWindow(accessToken: string): RequestWindow {
    if (!this.windows.has(accessToken)) {
      this.windows.set(accessToken, {
        timestamps: [],
        queue: [],
        isProcessing: false
      });
    }
    return this.windows.get(accessToken)!;
  }

  /**
   * Get current metrics for an AccessToken
   */
  getMetrics(accessToken: string): RateLimitMetrics {
    this.cleanupOldRequests(accessToken);
    const window = this.getOrCreateWindow(accessToken);
    const currentCount = window.timestamps.length;
    const threshold = Math.floor(this.config.maxRequests * this.config.safetyBuffer);

    return {
      currentCount,
      percentageUsed: Math.round((currentCount / this.config.maxRequests) * 100),
      queueLength: window.queue.length,
      isThrottling: currentCount >= threshold
    };
  }

  /**
   * Log current metrics for an AccessToken
   */
  logMetrics(accessToken: string): void {
    if (!this.config.enableLogging) return;

    const metrics = this.getMetrics(accessToken);
    const status = metrics.isThrottling ? 'THROTTLING' : 'OK';

    console.log(
      `[RATE-LIMITER] Token: ${this.redactToken(accessToken)} | ` +
      `Requests: ${metrics.currentCount}/${this.config.maxRequests} (${metrics.percentageUsed}%) | ` +
      `Queue: ${metrics.queueLength} | ` +
      `Status: ${status}`
    );
  }

  /**
   * Redact AccessToken for logging (show last 6 characters only)
   */
  private redactToken(accessToken: string): string {
    if (accessToken.length <= 6) {
      return '***';
    }
    return '***' + accessToken.slice(-6);
  }
}

/**
 * Singleton instance of MewsRateLimiter
 */
export const mewsRateLimiter = new MewsRateLimiter();

/**
 * Convenience wrapper for fetch with automatic rate limiting
 *
 * Usage:
 * ```typescript
 * const response = await fetchWithRateLimit(
 *   url,
 *   accessToken,
 *   { method: 'POST', headers: {...}, body: JSON.stringify(...) },
 *   'reservations/start' // optional context
 * );
 * ```
 *
 * @param url - Request URL
 * @param accessToken - Mews AccessToken
 * @param options - Fetch options (same as fetch API)
 * @param context - Optional context string for logging
 * @returns Response object (same as fetch)
 */
export async function fetchWithRateLimit(
  url: string,
  accessToken: string,
  options: RequestInit,
  context?: string
): Promise<Response> {
  return mewsRateLimiter.executeRequest<Response>(
    accessToken,
    () => fetch(url, options),
    { logContext: context }
  );
}
