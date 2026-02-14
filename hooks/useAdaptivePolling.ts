'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CONSECUTIVE_ERROR_THRESHOLD = 3;

interface UseAdaptivePollingOptions {
  /** Async function that fetches data and returns whether active operations exist */
  fetchFn: () => Promise<{ hasActiveOperations: boolean }>;
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
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const result = await fetchFnRef.current();
      hasActiveRef.current = result.hasActiveOperations;
      consecutiveErrorsRef.current = 0;
      setIsPolling(result.hasActiveOperations);
      setLastFetchedAt(new Date());
    } catch (err) {
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
      await doFetch();
      scheduleNext();
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
    };
  }, [enabled, scheduleNext, clearScheduled]);

  // Pause/resume on tab visibility changes
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibility = async () => {
      if (document.hidden) {
        clearScheduled();
      } else if (enabledRef.current) {
        // Tab became visible — fetch immediately to catch up, then resume schedule
        await doFetch();
        scheduleNext();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [doFetch, scheduleNext, clearScheduled]);

  return { isPolling, lastFetchedAt, refresh };
}
