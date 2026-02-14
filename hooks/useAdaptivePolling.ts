'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CONSECUTIVE_ERROR_THRESHOLD = 3;

interface UseAdaptivePollingOptions {
  /** Async function that fetches data and returns whether active operations exist */
  fetchFn: (signal?: AbortSignal) => Promise<{ hasActiveOperations: boolean }>;
  /** Polling interval when active operations are in progress (ms) */
  fastIntervalMs?: number;
  /** Polling interval when all operations are idle (ms) */
  idleIntervalMs?: number;
  /** Whether polling is enabled (e.g., set to true after initial load) */
  enabled?: boolean;
}

interface UseAdaptivePollingReturn {
  /** True when polling at the fast interval (active operations detected) */
  isPolling: boolean;
  /** Timestamp of the last successful fetch */
  lastFetchedAt: Date | null;
  /** Trigger an immediate fetch and reset the polling schedule */
  refresh: () => void;
}

export function useAdaptivePolling({
  fetchFn,
  fastIntervalMs = 5000,
  idleIntervalMs = 60000,
  enabled = true,
}: UseAdaptivePollingOptions): UseAdaptivePollingReturn {
  const [isPolling, setIsPolling] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const hasActiveRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const enabledRef = useRef(enabled);
  const fetchFnRef = useRef(fetchFn);
  const isHandlingVisibilityRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep refs in sync with latest props
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const clearScheduled = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const doFetch = useCallback(async () => {
    if (isFetchingRef.current) return false;
    isFetchingRef.current = true;

    // Abort any previous in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await fetchFnRef.current(controller.signal);
      if (controller.signal.aborted) return false;
      hasActiveRef.current = result.hasActiveOperations;
      consecutiveErrorsRef.current = 0;
      setIsPolling(result.hasActiveOperations);
      setLastFetchedAt(new Date());
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return false;
      console.error('Adaptive polling fetch failed:', err);
      consecutiveErrorsRef.current += 1;
      // Assume active on error to avoid missing updates, unless too many consecutive errors
      if (consecutiveErrorsRef.current < CONSECUTIVE_ERROR_THRESHOLD) {
        hasActiveRef.current = true;
        setIsPolling(true);
      } else {
        hasActiveRef.current = false;
        setIsPolling(false);
      }
      return true;
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const scheduleNext = useCallback(() => {
    clearScheduled();

    if (!enabledRef.current) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    const delay = hasActiveRef.current ? fastIntervalMs : idleIntervalMs;
    timeoutRef.current = setTimeout(async () => {
      const didFetch = await doFetch();
      // Always reschedule: either immediately after successful fetch,
      // or with a small retry delay if fetch was skipped due to another in progress
      if (didFetch) {
        scheduleNext();
      } else {
        // A fetch is already in progress, retry scheduling soon
        // Use a separate timer that will schedule the next polling cycle
        const retryTimer = setTimeout(() => {
          scheduleNext();
        }, 50);
        timeoutRef.current = retryTimer;
      }
    }, delay);
  }, [fastIntervalMs, idleIntervalMs, doFetch, clearScheduled]);

  const refresh = useCallback(async () => {
    clearScheduled();
    await doFetch();
    scheduleNext();
  }, [doFetch, scheduleNext, clearScheduled]);

  // Start polling when enabled
  useEffect(() => {
    if (!enabled) {
      clearScheduled();
      return;
    }

    // Schedule first poll (initial data load is handled by the page itself)
    scheduleNext();

    return () => {
      clearScheduled();
      abortControllerRef.current?.abort();
    };
  }, [enabled, scheduleNext, clearScheduled]);

  // Pause/resume on tab visibility changes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibility = () => {
      // Prevent concurrent executions of the visibility handler
      if (isHandlingVisibilityRef.current) return;

      if (document.hidden) {
        clearScheduled();
        abortControllerRef.current?.abort();
      } else if (enabledRef.current) {
        // Tab became visible — fetch immediately to catch up, then resume schedule
        isHandlingVisibilityRef.current = true;

        (async () => {
          try {
            await doFetch();
            scheduleNext();
          } finally {
            isHandlingVisibilityRef.current = false;
          }
        })();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [doFetch, scheduleNext, clearScheduled]);

  return { isPolling, lastFetchedAt, refresh };
}
