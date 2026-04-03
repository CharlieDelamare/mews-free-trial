import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBills } from './bill-service';
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.mock('./api-call-logger', () => ({ loggedFetch: vi.fn() }));
vi.mock('./timezone-service', () => ({ fetchTimezoneFromConfiguration: vi.fn().mockResolvedValue({ timezone: 'UTC', currency: 'EUR' }) }));
vi.mock('@/lib/config', () => ({ getMewsClientToken: () => 'test-client-token', getMewsApiUrl: () => 'https://api.mews-demo.com' }));

describe('getBills', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('follows Cursor token to fetch all pages', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ Bills: [{ Id: 'bill-1', AccountId: 'acc-1' }], Cursor: 'cursor-abc' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ Bills: [{ Id: 'bill-2', AccountId: 'acc-2' }], Cursor: null }) });
    global.fetch = fetchMock as unknown as typeof fetch;
    const { bills } = await getBills('access-token', 'Open');
    expect(bills).toHaveLength(2);
    expect(bills.map(b => b.Id)).toEqual(['bill-1', 'bill-2']);
    const body2 = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(body2.Limitation.Cursor).toBe('cursor-abc');
  });
});
