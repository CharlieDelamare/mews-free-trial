/**
 * Unit tests for Mews API Rate Limiter
 *
 * Tests the core rate limiting functionality including:
 * - Sliding window algorithm
 * - 429 error handling with Retry-After
 * - Exponential backoff
 * - Request queuing and throttling
 * - Metrics tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MewsRateLimiter, fetchWithRateLimit } from '@/lib/mews-rate-limiter';

// Mock fetch globally
global.fetch = vi.fn();

describe('MewsRateLimiter', () => {
  let rateLimiter: MewsRateLimiter;
  const testToken = 'test-access-token-123';

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Create fresh rate limiter with test config
    rateLimiter = new MewsRateLimiter({
      maxRequests: 10,
      windowMs: 1000, // 1 second for faster tests
      safetyBuffer: 0.8, // Throttle at 8 requests
      maxRetries: 3,
      baseBackoffMs: 100,
      enableLogging: false // Disable logging in tests
    });
  });

  describe('Basic Rate Limiting', () => {
    it('allows requests under the safety buffer', async () => {
      // Mock successful responses
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });

      // Make 7 requests (under 8 threshold)
      const promises = [];
      for (let i = 0; i < 7; i++) {
        promises.push(
          rateLimiter.executeRequest(
            testToken,
            () => fetch('https://api.test.com/endpoint'),
            { logContext: `request-${i}` }
          )
        );
      }

      await Promise.all(promises);

      // All requests should complete without throttling
      expect(global.fetch).toHaveBeenCalledTimes(7);
    });

    it('throttles requests at safety buffer', async () => {
      // Mock successful responses
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });

      // Make 9 requests (over 8 threshold, should throttle)
      const promises = [];
      for (let i = 0; i < 9; i++) {
        promises.push(
          rateLimiter.executeRequest(
            testToken,
            () => fetch('https://api.test.com/endpoint'),
            { logContext: `request-${i}` }
          )
        );
      }

      // Flush microtasks to let the first 8 requests complete (without advancing
      // timers, which would also release the 9th request's waitForCapacity delay)
      await vi.advanceTimersByTimeAsync(0);

      // Should have made 8 requests, 9th waiting
      expect(global.fetch).toHaveBeenCalledTimes(8);

      // Advance time past the window so the 9th request's timer fires
      await vi.advanceTimersByTimeAsync(1100);

      // Now 9th request should complete
      await Promise.all(promises);
      expect(global.fetch).toHaveBeenCalledTimes(9);
    });
  });

  describe('429 Error Handling', () => {
    it('handles 429 with Retry-After header (seconds)', async () => {
      let callCount = 0;

      // First call returns 429, second call succeeds
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            headers: new Map([['Retry-After', '2']]), // 2 seconds
            json: async () => ({ Message: 'Too many requests' })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        });
      });

      const promise = rateLimiter.executeRequest(
        testToken,
        () => fetch('https://api.test.com/endpoint'),
        { logContext: 'test-429' }
      );

      // Advance time to handle retry
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;
      expect(result).toBeDefined();
      expect(callCount).toBe(2);
    });

    it('handles 429 with Retry-After header (HTTP-date)', async () => {
      let callCount = 0;
      const futureDate = new Date(Date.now() + 3000).toUTCString();

      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            headers: new Map([['Retry-After', futureDate]]),
            json: async () => ({ Message: 'Too many requests' })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        });
      });

      const promise = rateLimiter.executeRequest(
        testToken,
        () => fetch('https://api.test.com/endpoint'),
        { logContext: 'test-429-date' }
      );

      await vi.advanceTimersByTimeAsync(3000);

      const result = await promise;
      expect(result).toBeDefined();
      expect(callCount).toBe(2);
    });

    it('uses exponential backoff without Retry-After header', async () => {
      let callCount = 0;

      // First two calls return 429, third succeeds
      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.resolve({
            ok: false,
            status: 429,
            headers: new Map(),
            json: async () => ({ Message: 'Too many requests' })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        });
      });

      const promise = rateLimiter.executeRequest(
        testToken,
        () => fetch('https://api.test.com/endpoint'),
        { logContext: 'test-exponential' }
      );

      // First retry: 100ms (baseBackoffMs * 2^0)
      await vi.advanceTimersByTimeAsync(100);

      // Second retry: 200ms (baseBackoffMs * 2^1)
      await vi.advanceTimersByTimeAsync(200);

      const result = await promise;
      expect(result).toBeDefined();
      expect(callCount).toBe(3);
    });

    it('throws error after max retries exceeded', async () => {
      // All calls return 429
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Map(),
        json: async () => ({ Message: 'Too many requests' })
      });

      const promise = rateLimiter.executeRequest(
        testToken,
        () => fetch('https://api.test.com/endpoint'),
        { logContext: 'test-max-retries', maxRetries: 2 }
      );

      // Prevent unhandled rejection warning (rejection is still tested below)
      promise.catch(() => {});

      // Advance through all retries
      for (let i = 0; i < 5; i++) {
        await vi.advanceTimersByTimeAsync(1000);
      }

      await expect(promise).rejects.toThrow(/Rate limit exceeded after 2 retries/);
    });
  });

  describe('Sliding Window Algorithm', () => {
    it('cleans up old timestamps after window expires', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.executeRequest(
          testToken,
          () => fetch('https://api.test.com/endpoint')
        );
      }

      // Check metrics - should have 5 requests
      let metrics = rateLimiter.getMetrics(testToken);
      expect(metrics.currentCount).toBe(5);

      // Advance time beyond window (1000ms)
      vi.advanceTimersByTime(1100);

      // Check metrics again - old requests should be cleaned up
      metrics = rateLimiter.getMetrics(testToken);
      expect(metrics.currentCount).toBe(0);
    });

    it('maintains correct count within window', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });

      // Make requests at different times
      await rateLimiter.executeRequest(testToken, () => fetch('https://api.test.com/endpoint'));
      expect(rateLimiter.getMetrics(testToken).currentCount).toBe(1);

      vi.advanceTimersByTime(500);
      await rateLimiter.executeRequest(testToken, () => fetch('https://api.test.com/endpoint'));
      expect(rateLimiter.getMetrics(testToken).currentCount).toBe(2);

      // Advance past first request
      vi.advanceTimersByTime(600);
      expect(rateLimiter.getMetrics(testToken).currentCount).toBe(1);
    });
  });

  describe('Per-AccessToken Tracking', () => {
    it('tracks metrics separately per AccessToken', async () => {
      const token1 = 'token-1';
      const token2 = 'token-2';

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });

      // Make requests with different tokens
      await rateLimiter.executeRequest(token1, () => fetch('https://api.test.com/endpoint'));
      await rateLimiter.executeRequest(token1, () => fetch('https://api.test.com/endpoint'));
      await rateLimiter.executeRequest(token2, () => fetch('https://api.test.com/endpoint'));

      // Check metrics for each token
      expect(rateLimiter.getMetrics(token1).currentCount).toBe(2);
      expect(rateLimiter.getMetrics(token2).currentCount).toBe(1);
    });

    it('does not interfere between different tokens', async () => {
      const token1 = 'token-1';
      const token2 = 'token-2';

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });

      // Fill up token1 to capacity
      for (let i = 0; i < 8; i++) {
        await rateLimiter.executeRequest(token1, () => fetch('https://api.test.com/endpoint'));
      }

      // token2 should still be able to make requests
      await rateLimiter.executeRequest(token2, () => fetch('https://api.test.com/endpoint'));

      expect(rateLimiter.getMetrics(token1).currentCount).toBe(8);
      expect(rateLimiter.getMetrics(token2).currentCount).toBe(1);
    });
  });

  describe('Metrics', () => {
    it('returns correct metrics', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });

      // Initial state
      let metrics = rateLimiter.getMetrics(testToken);
      expect(metrics.currentCount).toBe(0);
      expect(metrics.percentageUsed).toBe(0);
      expect(metrics.isThrottling).toBe(false);

      // Make some requests
      for (let i = 0; i < 5; i++) {
        await rateLimiter.executeRequest(testToken, () => fetch('https://api.test.com/endpoint'));
      }

      metrics = rateLimiter.getMetrics(testToken);
      expect(metrics.currentCount).toBe(5);
      expect(metrics.percentageUsed).toBe(50); // 5/10 * 100
      expect(metrics.isThrottling).toBe(false);

      // Make more requests to trigger throttling (8+ = 80%)
      for (let i = 0; i < 3; i++) {
        await rateLimiter.executeRequest(testToken, () => fetch('https://api.test.com/endpoint'));
      }

      metrics = rateLimiter.getMetrics(testToken);
      expect(metrics.currentCount).toBe(8);
      expect(metrics.percentageUsed).toBe(80);
      expect(metrics.isThrottling).toBe(true); // >= 8 triggers throttling
    });
  });

  describe('fetchWithRateLimit Wrapper', () => {
    it('wraps fetch calls with rate limiting', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' })
      });

      const response = await fetchWithRateLimit(
        'https://api.test.com/endpoint',
        testToken,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        },
        'test-endpoint'
      );

      expect(response).toBeDefined();
      expect((response as any).ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/endpoint',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('handles invalid Retry-After header gracefully', async () => {
      let callCount = 0;

      (global.fetch as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            headers: new Map([['Retry-After', 'invalid-value']]),
            json: async () => ({ Message: 'Too many requests' })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        });
      });

      const promise = rateLimiter.executeRequest(
        testToken,
        () => fetch('https://api.test.com/endpoint')
      );

      // Should fall back to exponential backoff (100ms)
      await vi.advanceTimersByTimeAsync(100);

      const result = await promise;
      expect(result).toBeDefined();
      expect(callCount).toBe(2);
    });

    it('propagates non-429 errors immediately', async () => {
      const networkError = new Error('Network error');
      (global.fetch as any).mockRejectedValue(networkError);

      await expect(
        rateLimiter.executeRequest(
          testToken,
          () => fetch('https://api.test.com/endpoint')
        )
      ).rejects.toThrow('Network error');

      // Should not retry on network errors
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
