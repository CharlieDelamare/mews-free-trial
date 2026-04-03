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

  it('treats absent Cursor field (undefined) as end of pagination', async () => {
    const emptyPage = { ok: true, json: async () => ({ Bills: [] }) }; // no Cursor key — end of pagination
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ Bills: [{ Id: 'bill-1', AccountId: 'acc-1' }] }) }) // first window, no Cursor key
      .mockResolvedValue(emptyPage); // subsequent windows return empty (multi-window loop)

    global.fetch = fetchMock as unknown as typeof fetch;

    const { bills } = await getBills('access-token', 'Open');

    expect(bills).toHaveLength(1);
    // First window produces one call (no cursor → no second page); subsequent windows each produce one call.
    // Crucially, the first window must NOT have triggered a second fetch — verified by bills length == 1.
    const firstWindowBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(firstWindowBody.Limitation.Cursor).toBeUndefined(); // no cursor on first request
  });
});
