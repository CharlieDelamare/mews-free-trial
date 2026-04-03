import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Set auth env vars before test file imports resolve.
process.env.AZURE_AD_CLIENT_ID ??= 'test-azure-client-id';
process.env.AZURE_AD_CLIENT_SECRET ??= 'test-azure-client-secret';
process.env.AZURE_AD_TENANT_ID ??= 'test-azure-tenant-id';
process.env.NEXTAUTH_SECRET ??= 'test-nextauth-secret';
process.env.ADMIN_EMAILS ??= 'charlie.delamare@mews.com';
process.env.WEBHOOK_SECRET ??= 'test-webhook-secret';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
beforeAll(() => {
  process.env.MEWS_SAMPLE_TOKEN = 'test-sample-token';
  process.env.MEWS_CLIENT_TOKEN = 'test-client-token';
  process.env.MEWS_ACCESS_TOKEN = 'test-access-token';
  process.env.MEWS_API_URL = 'https://api.mews-test.com';
  process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/triggers/test';
  process.env.mews_free_trial_PRISMA_DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.mews_free_trial_POSTGRES_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.LITEAPI_API_KEY = 'test-liteapi-key';
  process.env.SERPAPI_API_KEY = 'test-serpapi-key';
});
