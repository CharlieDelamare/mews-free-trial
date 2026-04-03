import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    apiCallLog: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

describe('ApiCallLogBuffer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('drain() resolves after all in-flight writes complete', async () => {
    vi.resetModules();
    const { flushApiCallLogs, loggedFetch } = await import('../../lib/api-call-logger');

    // Simulate an error response so loggedFetch adds an entry to the buffer
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      clone: () => ({ text: async () => 'Server Error' }),
    } as unknown as Response);

    // loggedFetch logs errors only — trigger one
    await loggedFetch(
      'https://api.mews-demo.com/api/connector/v1/test',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
      { unifiedLogId: 'log-1', group: 'customers', endpoint: 'test' }
    ).catch(() => {});

    // drain() must resolve without hanging
    await expect(flushApiCallLogs()).resolves.toBeUndefined();
  });

  it('drain() resolves immediately when buffer is empty', async () => {
    vi.resetModules();
    const { flushApiCallLogs } = await import('../../lib/api-call-logger');
    await expect(flushApiCallLogs()).resolves.toBeUndefined();
  });
});
