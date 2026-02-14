import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdaptivePolling } from './useAdaptivePolling';

describe('useAdaptivePolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('does not poll when disabled', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ hasActiveOperations: false });

    renderHook(() =>
      useAdaptivePolling({ fetchFn, enabled: false })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120000);
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  test('first poll fires at idle interval, then switches to fast when active', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ hasActiveOperations: true });

    renderHook(() =>
      useAdaptivePolling({
        fetchFn,
        fastIntervalMs: 5000,
        idleIntervalMs: 60000,
        enabled: true,
      })
    );

    // Initial state has no active knowledge, so first poll is at idle interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetchFn).not.toHaveBeenCalled();

    // First poll fires at idle interval (60s)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(55000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Now hasActive is true, so next poll is at fast interval (5s)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);

    // Continues at fast interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  test('polls at idle interval when no active operations', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ hasActiveOperations: false });

    renderHook(() =>
      useAdaptivePolling({
        fetchFn,
        fastIntervalMs: 5000,
        idleIntervalMs: 20000,
        enabled: true,
      })
    );

    // First poll at idle interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Still idle, so next poll at idle interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  test('sets isPolling based on hasActiveOperations response', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ hasActiveOperations: true });

    const { result } = renderHook(() =>
      useAdaptivePolling({
        fetchFn,
        fastIntervalMs: 5000,
        idleIntervalMs: 10000,
        enabled: true,
      })
    );

    expect(result.current.isPolling).toBe(false);

    // Trigger first poll
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(result.current.isPolling).toBe(true);

    // Switch to returning no active operations
    fetchFn.mockResolvedValue({ hasActiveOperations: false });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(result.current.isPolling).toBe(false);
  });

  test('refresh() triggers an immediate fetch', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ hasActiveOperations: false });

    const { result } = renderHook(() =>
      useAdaptivePolling({
        fetchFn,
        idleIntervalMs: 60000,
        enabled: true,
      })
    );

    expect(fetchFn).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.refresh();
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  test('updates lastFetchedAt after successful fetch', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ hasActiveOperations: false });

    const { result } = renderHook(() =>
      useAdaptivePolling({
        fetchFn,
        idleIntervalMs: 60000,
        enabled: true,
      })
    );

    expect(result.current.lastFetchedAt).toBeNull();

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.lastFetchedAt).toBeInstanceOf(Date);
  });

  test('backs off to idle interval after consecutive errors', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useAdaptivePolling({
        fetchFn,
        fastIntervalMs: 5000,
        idleIntervalMs: 20000,
        enabled: true,
      })
    );

    // First poll at idle interval (initial state)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    // After first error, assumes active → next poll at fast interval
    expect(result.current.isPolling).toBe(true);

    // Second error at fast interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(result.current.isPolling).toBe(true);

    // Third error at fast interval → backs off
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(result.current.isPolling).toBe(false);
  });

  test('cleans up timeout on unmount', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ hasActiveOperations: true });

    const { unmount } = renderHook(() =>
      useAdaptivePolling({
        fetchFn,
        fastIntervalMs: 5000,
        enabled: true,
      })
    );

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120000);
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
