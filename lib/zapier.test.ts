import { describe, test, expect, vi, beforeEach } from 'vitest';
import { sendZapierNotification } from './zapier';

describe('sendZapierNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi.fn();
  });

  test('sends POST request to configured webhook URL', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true });

    await sendZapierNotification('environment_ready', {
      status: 'success',
      propertyName: 'Test Hotel',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/triggers/test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  test('includes messageType, status, timestamp, and data fields in payload', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true });

    await sendZapierNotification('environment_ready', {
      status: 'success',
      propertyName: 'Test Hotel',
      requestorEmail: 'rep@mews.com',
    });

    const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(callBody.messageType).toBe('environment_ready');
    expect(callBody.status).toBe('success');
    expect(callBody.timestamp).toBeDefined();
    expect(callBody.propertyName).toBe('Test Hotel');
    expect(callBody.requestorEmail).toBe('rep@mews.com');
  });

  test('skips notification when SLACK_WEBHOOK_URL is not set', async () => {
    const originalUrl = process.env.SLACK_WEBHOOK_URL;
    delete process.env.SLACK_WEBHOOK_URL;

    await sendZapierNotification('environment_ready', {
      status: 'success',
    });

    expect(global.fetch).not.toHaveBeenCalled();

    // Restore
    process.env.SLACK_WEBHOOK_URL = originalUrl;
  });

  test('does not throw when webhook request fails', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      sendZapierNotification('environment_ready', { status: 'success' })
    ).resolves.toBeUndefined();
  });

  test('does not throw when fetch itself throws', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    await expect(
      sendZapierNotification('environment_ready', { status: 'success' })
    ).resolves.toBeUndefined();
  });

  test('defaults status to info when not provided', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true });

    await sendZapierNotification('some_event', {});

    const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(callBody.status).toBe('info');
  });

  test('passes all data fields through to payload', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true });

    await sendZapierNotification('environment_ready', {
      status: 'success',
      propertyName: 'My Hotel',
      enterpriseId: 'ent-123',
      loginEmail: 'guest@hotel.com',
      loginPassword: 'Sample123',
      signInUrl: 'https://app.mews-demo.com/signin/abc',
    });

    const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(callBody.propertyName).toBe('My Hotel');
    expect(callBody.enterpriseId).toBe('ent-123');
    expect(callBody.loginEmail).toBe('guest@hotel.com');
    expect(callBody.loginPassword).toBe('Sample123');
    expect(callBody.signInUrl).toBe('https://app.mews-demo.com/signin/abc');
  });
});
