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
      'https://hooks.zapier.com/test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  test('includes messageType, status, and timestamp in payload', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true });

    await sendZapierNotification('environment_ready', {
      status: 'success',
      propertyName: 'Test Hotel',
    });

    const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(callBody.messageType).toBe('environment_ready');
    expect(callBody.status).toBe('success');
    expect(callBody.timestamp).toBeDefined();
    expect(callBody.propertyName).toBe('Test Hotel');
  });

  test('includes formatted slackMessage in payload', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true });

    await sendZapierNotification('environment_ready', {
      status: 'success',
      propertyName: 'My Hotel',
      customerName: 'John Doe',
    });

    const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(callBody.slackMessage).toBeDefined();
    expect(callBody.slackMessage).toContain('My Hotel');
    expect(callBody.slackMessage).toContain('John Doe');
  });

  test('skips notification when ZAPIER_WEBHOOK_URL is not set', async () => {
    const originalUrl = process.env.ZAPIER_WEBHOOK_URL;
    delete process.env.ZAPIER_WEBHOOK_URL;

    await sendZapierNotification('environment_ready', {
      status: 'success',
    });

    expect(global.fetch).not.toHaveBeenCalled();

    // Restore
    process.env.ZAPIER_WEBHOOK_URL = originalUrl;
  });

  test('does not throw when webhook request fails', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    // Should not throw
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

  describe('message type formatting', () => {
    test('formats trial_generation_failure message', async () => {
      (global.fetch as any).mockResolvedValue({ ok: true });

      await sendZapierNotification('trial_generation_failure', {
        status: 'failure',
        propertyName: 'Failed Hotel',
        firstName: 'Jane',
        lastName: 'Smith',
        customerEmail: 'jane@example.com',
        error: 'API timeout',
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.slackMessage).toContain('Trial Sandbox Generation Failed');
      expect(callBody.slackMessage).toContain('Failed Hotel');
      expect(callBody.slackMessage).toContain('Jane');
      expect(callBody.slackMessage).toContain('API timeout');
    });

    test('includes signInUrl in environment_ready message when provided', async () => {
      (global.fetch as any).mockResolvedValue({ ok: true });

      await sendZapierNotification('environment_ready', {
        status: 'success',
        propertyName: 'Test Hotel',
        customerName: 'John Doe',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'john@example.com',
        loginPassword: 'Sample123',
        signInUrl: 'https://app.mews-demo.com/signin/abc123',
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.slackMessage).toContain('Sign-in URL (passwordless)');
      expect(callBody.slackMessage).toContain('signin/abc123');
    });

    test('omits signInUrl from environment_ready message when not provided', async () => {
      (global.fetch as any).mockResolvedValue({ ok: true });

      await sendZapierNotification('environment_ready', {
        status: 'success',
        propertyName: 'Test Hotel',
        customerName: 'John Doe',
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.slackMessage).not.toContain('Sign-in URL');
    });

    test('formats access_token_no_match message', async () => {
      (global.fetch as any).mockResolvedValue({ ok: true });

      await sendZapierNotification('access_token_no_match', {
        status: 'info',
        enterpriseId: 'ent-1',
        enterpriseName: 'Unknown Hotel',
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.slackMessage).toContain('No Matching Log Found');
      expect(callBody.slackMessage).toContain('Unknown Hotel');
    });

    test('formats manual_environment_configured message', async () => {
      (global.fetch as any).mockResolvedValue({ ok: true });

      await sendZapierNotification('manual_environment_configured', {
        status: 'success',
        propertyName: 'Manual Hotel',
        customerName: 'John Doe',
        reservationsCanceled: 15,
        customerCreated: true,
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.slackMessage).toContain('Manual Sandbox Configured');
      expect(callBody.slackMessage).toContain('Manual Hotel');
      expect(callBody.slackMessage).toContain('15');
    });

    test('formats manual_environment_added message', async () => {
      (global.fetch as any).mockResolvedValue({ ok: true });

      await sendZapierNotification('manual_environment_added', {
        status: 'info',
        enterpriseName: 'Added Hotel',
        enterpriseId: 'ent-1',
        reservationsCanceled: 3,
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.slackMessage).toContain('Manual Sandbox Added');
      expect(callBody.slackMessage).toContain('Added Hotel');
    });

    test('formats reservation_created message', async () => {
      (global.fetch as any).mockResolvedValue({ ok: true });

      await sendZapierNotification('reservation_created', {
        status: 'success',
        firstName: 'Alice',
        lastName: 'Wonder',
        customerEmail: 'alice@example.com',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
        confirmationNumber: 'CONF-123',
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.slackMessage).toContain('Reservation Created');
      expect(callBody.slackMessage).toContain('Alice');
      expect(callBody.slackMessage).toContain('CONF-123');
    });

    test('formats unknown message types with generic template', async () => {
      (global.fetch as any).mockResolvedValue({ ok: true });

      await sendZapierNotification('custom_event_type', {
        status: 'success',
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.slackMessage).toContain('custom_event_type');
      expect(callBody.slackMessage).toContain('success');
    });
  });
});
