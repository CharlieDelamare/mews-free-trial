import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
beforeAll(() => {
  process.env.MEWS_SAMPLE_TOKEN = 'test-sample-token';
  process.env.MEWS_CLIENT_TOKEN = 'test-client-token';
  process.env.MEWS_ACCESS_TOKEN = 'test-access-token';
  process.env.MEWS_BOOKABLE_SERVICE_ID = 'test-service-id';
  process.env.MEWS_RATE_ID = 'test-rate-id';
  process.env.MEWS_RESOURCE_CATEGORY_ID = 'test-category-id';
  process.env.MEWS_API_URL = 'https://api.mews-test.com';
  process.env.SLACK_BOT_TOKEN = 'test-slack-token';
  process.env.SLACK_CHANNEL_ID = 'test-channel-id';
  process.env.ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.DATABASE_DIRECT_URL = 'postgresql://test:test@localhost:5432/test';
});
