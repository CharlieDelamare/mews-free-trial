import { describe, test, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

// Mock the logger module
const mockReadEnvironmentLogs = vi.fn();

vi.mock('@/lib/logger', () => ({
  readEnvironmentLogs: () => mockReadEnvironmentLogs(),
}));

describe('GET /api/logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('returns success with logs array', async () => {
    const mockLogs = [
      {
        id: '1',
        timestamp: new Date('2024-01-03'),
        propertyName: 'Test Hotel 1',
        customerName: 'Customer 1',
        customerEmail: 'customer1@example.com',
        propertyCountry: 'United Kingdom',
        propertyType: 'hotel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'customer1@example.com',
        loginPassword: 'Sample123',
        status: 'success' as const,
        errorMessage: null,
      },
      {
        id: '2',
        timestamp: new Date('2024-01-02'),
        propertyName: 'Test Hotel 2',
        customerName: 'Customer 2',
        customerEmail: 'customer2@example.com',
        propertyCountry: 'Germany',
        propertyType: 'hostel',
        loginUrl: 'https://app.mews-demo.com',
        loginEmail: 'customer2@example.com',
        loginPassword: 'Sample123',
        status: 'failure' as const,
        errorMessage: 'API error',
      },
    ];

    mockReadEnvironmentLogs.mockResolvedValue(mockLogs);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.logs).toHaveLength(2);
    expect(data.logs[0].propertyName).toBe('Test Hotel 1');
    expect(data.logs[0].status).toBe('success');
    expect(data.logs[1].propertyName).toBe('Test Hotel 2');
    expect(data.logs[1].status).toBe('failure');
  });

  test('returns success with empty logs array when no logs exist', async () => {
    mockReadEnvironmentLogs.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      logs: [],
    });
  });

  test('returns 500 error when readEnvironmentLogs throws', async () => {
    const error = new Error('Database connection failed');
    mockReadEnvironmentLogs.mockRejectedValue(error);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Failed to fetch logs',
    });
    expect(console.error).toHaveBeenCalledWith('Failed to fetch logs:', error);
  });

  test('handles unexpected errors gracefully', async () => {
    mockReadEnvironmentLogs.mockRejectedValue(new Error('Unexpected error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to fetch logs');
  });

  test('returns proper content-type header', async () => {
    mockReadEnvironmentLogs.mockResolvedValue([]);

    const response = await GET();

    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
