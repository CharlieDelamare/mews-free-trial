import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBills, closeBillsForEnvironment } from './bill-service';
import { fetchTimezoneFromConfiguration } from './timezone-service';
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

describe('closeBillsForEnvironment', () => {
  it('fetches order items and payment items in batch calls, not per-bill', async () => {
    const openBills = [
      { Id: 'bill-1', AccountId: 'acc-1', State: 'Open' },
      { Id: 'bill-2', AccountId: 'acc-2', State: 'Open' },
      { Id: 'bill-3', AccountId: 'acc-3', State: 'Open' },
    ];

    const fetchMock = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      const body = JSON.parse(opts.body as string);
      const url = _url as string;

      if (url.includes('bills/getAll')) {
        return Promise.resolve({ ok: true, json: async () => ({ Bills: openBills, Cursor: null }) });
      }
      if (url.includes('orderItems/getAll')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            OrderItems: body.BillIds.map((id: string) => ({
              Id: `item-${id}`, BillId: id,
              Amount: { Currency: 'EUR', GrossValue: 100 },
              ConsumedUtc: '2020-01-01T00:00:00Z',
            })),
          }),
        });
      }
      if (url.includes('payments/getAll')) {
        return Promise.resolve({ ok: true, json: async () => ({ Payments: [] }) });
      }
      if (url.includes('payments/addExternal')) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (url.includes('bills/close')) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    global.fetch = fetchMock as unknown as typeof fetch;
    vi.mocked(fetchTimezoneFromConfiguration).mockResolvedValue({ timezone: 'UTC', currency: 'EUR' });

    await closeBillsForEnvironment('access-token');

    const orderItemCalls = fetchMock.mock.calls.filter(([url]) => (url as string).includes('orderItems/getAll'));
    const paymentCalls = fetchMock.mock.calls.filter(([url]) => (url as string).includes('payments/getAll'));

    expect(orderItemCalls).toHaveLength(1);
    expect(paymentCalls).toHaveLength(1);

    const orderCallBody = JSON.parse(orderItemCalls[0][1].body as string);
    expect(orderCallBody.BillIds).toEqual(['bill-1', 'bill-2', 'bill-3']);
  });

  it('skips fetchTimezoneFromConfiguration when currencyOverride is provided', async () => {
    const configSpy = vi.mocked(fetchTimezoneFromConfiguration);
    configSpy.mockClear();

    global.fetch = vi.fn().mockImplementation((_url: string) => {
      const url = _url as string;
      if (url.includes('bills/getAll')) {
        return Promise.resolve({ ok: true, json: async () => ({ Bills: [], Cursor: null }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }) as unknown as typeof fetch;

    await closeBillsForEnvironment('access-token', undefined, 'USD');

    expect(configSpy).not.toHaveBeenCalled();
  });
});
