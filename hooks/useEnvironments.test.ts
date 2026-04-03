import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEnvironments } from './useEnvironments';

const mockEnvs = [
  { enterpriseId: 'b', enterpriseName: 'Beta Hotel', propertyName: 'Beta', type: 'trial' as const, createdAt: new Date(), accessTokenId: 2 },
  { enterpriseId: 'a', enterpriseName: 'Alpha Hotel', propertyName: undefined, type: 'manual' as const, createdAt: new Date(), accessTokenId: 1 },
  { enterpriseId: 'c', enterpriseName: 'Gamma Hotel', propertyName: 'A First', type: 'trial' as const, createdAt: new Date(), accessTokenId: 3 },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useEnvironments', () => {
  test('returns empty array and loading=true before fetch resolves', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => new Promise(() => {}), // never resolves
    } as unknown as Response);

    const { result } = renderHook(() => useEnvironments());

    expect(result.current.environments).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  test('returns environments sorted by propertyName || enterpriseName', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ success: true, environments: mockEnvs }),
    } as unknown as Response);

    const { result } = await act(async () => renderHook(() => useEnvironments()));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // 'A First' (Gamma, propertyName), 'Alpha Hotel' (Alpha, no propertyName → enterpriseName), 'Beta' (Beta, propertyName)
    expect(result.current.environments.map(e => e.enterpriseId)).toEqual(['c', 'a', 'b']);
  });

  test('sets loading=false and environments=[] when fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEnvironments());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.environments).toEqual([]);
  });

  test('sets loading=false and environments=[] when API returns success=false', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ success: false }),
    } as unknown as Response);

    const { result } = renderHook(() => useEnvironments());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.environments).toEqual([]);
  });

  test('refetch re-runs the fetch', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ success: true, environments: [] }),
    } as unknown as Response);

    const { result } = renderHook(() => useEnvironments());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
