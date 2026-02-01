# Testing Guide

This document describes the testing infrastructure for the Mews Free Trial Generator application.

## Overview

The application uses **Vitest** as the testing framework, with the following supporting libraries:

- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom matchers for DOM testing
- **happy-dom** - Fast DOM implementation for Node.js
- **vitest-mock-extended** - Advanced mocking utilities for TypeScript
- **msw** - Mock Service Worker for API mocking (future use)

## Running Tests

### Run all tests once
```bash
npm test
```

### Run tests in watch mode (recommended for development)
```bash
npm run test:watch
```

### Run tests with UI interface
```bash
npm run test:ui
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

Tests are co-located with their source files using the `.test.ts` or `.test.tsx` extension:

```
lib/
  codes.ts
  codes.test.ts          ✓ 23 tests
  logger.ts
  logger.test.ts         ✓ 11 tests

app/api/
  create-trial/
    route.ts
    route.test.ts        ✓ 25+ tests
  logs/
    route.ts
    route.test.ts        ✓ 5 tests
```

## Current Test Coverage

### ✅ Priority 1: Critical Business Logic (COMPLETE)

#### `lib/codes.ts` - Configuration Helper Functions
- ✓ Language code mappings (26 languages)
- ✓ Legal environment codes (102 countries)
- ✓ Currency mappings
- ✓ Pricing environment logic (Gross vs Net)
- ✓ Default value fallbacks
- ✓ Data structure validation

**Coverage:** 23 tests | **Lines:** ~100% | **Effort:** Low

#### `lib/logger.ts` - Database Logging
- ✓ Success log creation
- ✓ Failure log with error messages
- ✓ Log retrieval with ordering
- ✓ Error handling and graceful degradation
- ✓ Console error logging

**Coverage:** 11 tests | **Lines:** ~95% | **Effort:** Low-Medium

#### `app/api/create-trial/route.ts` - Trial Creation Endpoint
- ✓ Input validation (all required fields)
- ✓ Property type configurations (hotel/hostel/apartments)
- ✓ Pricing environment handling (Gross/Net)
- ✓ Mews API integration (mocked)
- ✓ Slack notifications (mocked)
- ✓ Database logging integration
- ✓ Error handling and responses

**Coverage:** 25+ tests | **Lines:** ~90% | **Effort:** Medium-High

#### `app/api/logs/route.ts` - Logs Retrieval
- ✓ Successful log retrieval
- ✓ Empty logs handling
- ✓ Error handling
- ✓ Response format validation

**Coverage:** 5 tests | **Lines:** ~100% | **Effort:** Low

---

## Test Configuration

### Environment Variables

Test environment variables are automatically configured in `tests/setup.ts`:

```typescript
MEWS_SAMPLE_TOKEN=test-sample-token
MEWS_CLIENT_TOKEN=test-client-token
MEWS_ACCESS_TOKEN=test-access-token
SLACK_BOT_TOKEN=test-slack-token
SLACK_CHANNEL_ID=test-channel-id
// ... etc
```

### Vitest Config (`vitest.config.ts`)

```typescript
{
  environment: 'happy-dom',        // Fast DOM for testing
  globals: true,                   // No need to import describe/test/expect
  setupFiles: ['./tests/setup.ts'] // Global test setup
}
```

## Writing Tests

### Example: Testing a Utility Function

```typescript
import { describe, test, expect } from 'vitest';
import { getCurrency } from './codes';

describe('getCurrency', () => {
  test('returns EUR for Germany', () => {
    expect(getCurrency('Germany')).toBe('EUR');
  });

  test('returns default GBP for unknown country', () => {
    expect(getCurrency('Unknown')).toBe('GBP');
  });
});
```

### Example: Testing an API Route with Mocks

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

// Mock dependencies
const mockSaveLog = vi.fn();
global.fetch = vi.fn();

vi.mock('@/lib/logger', () => ({
  saveEnvironmentLog: (...args) => mockSaveLog(...args),
}));

describe('POST /api/logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('saves log on success', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const request = createMockRequest({ /* data */ });
    await POST(request);

    expect(mockSaveLog).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success' })
    );
  });
});
```

## Mocking Strategy

### Prisma Database

Prisma is mocked using `vitest-mock-extended`:

```typescript
import { vi } from 'vitest';

const mockCreate = vi.fn();
const mockFindMany = vi.fn();

vi.mock('./prisma', () => ({
  prisma: {
    environmentLog: {
      create: (...args) => mockCreate(...args),
      findMany: (...args) => mockFindMany(...args),
    },
  },
}));
```

### External APIs (Fetch)

External HTTP calls are mocked using `global.fetch`:

```typescript
global.fetch = vi.fn();

(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ result: 'data' }),
});
```

### Future: MSW for API Mocking

For more realistic API mocking in integration tests, you can use MSW (already installed):

```typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.post('https://api.mews.com/endpoint', () => {
    return HttpResponse.json({ success: true });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the function does, not how it does it
   - Test public APIs, not internal details

2. **Use Descriptive Test Names**
   - Good: `test('returns 400 when email is missing')`
   - Bad: `test('validation works')`

3. **Arrange-Act-Assert Pattern**
   ```typescript
   test('creates trial successfully', () => {
     // Arrange
     const request = createMockRequest({ ... });

     // Act
     const response = await POST(request);

     // Assert
     expect(response.status).toBe(200);
   });
   ```

4. **Clear Mocks Between Tests**
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

5. **Test Edge Cases**
   - Empty strings
   - Null values
   - Missing fields
   - Invalid data
   - Network errors

## Next Steps

### Priority 2: Secondary API Endpoints

- [ ] `app/api/create-reservation/route.ts` - Reservation creation (10-12 tests)
- [ ] `app/api/webhook/access-token/route.ts` - Webhook receiver (12-14 tests)

### Priority 3: Frontend Components

- [ ] `app/page.tsx` - Trial request form (10-12 tests)
- [ ] `app/logs/page.tsx` - Logs viewer page (7-9 tests)

### Priority 4: Infrastructure

- [ ] Prisma schema validation tests
- [ ] End-to-end tests with Playwright
- [ ] CI/CD integration with GitHub Actions

## Troubleshooting

### Tests fail with "Cannot find module"

Make sure TypeScript paths are configured correctly:

```typescript
// vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './'),
  },
}
```

### Prisma mock not working

Ensure you're importing from the mocked module:

```typescript
import { prisma } from '@/lib/prisma'; // Not from '@prisma/client'
```

### Tests are slow

1. Use `happy-dom` instead of `jsdom` (already configured)
2. Avoid real database connections - use mocks
3. Run tests in parallel (Vitest does this by default)

## CI/CD Integration

Add this to your GitHub Actions workflow:

```yaml
- name: Run tests
  run: npm test

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

## Coverage Goals

- **Unit Tests:** 80%+ line coverage
- **Integration Tests:** 70%+ line coverage
- **Critical Paths:** 90%+ line coverage

Current coverage can be viewed by running:

```bash
npm run test:coverage
```

Then open `coverage/index.html` in your browser.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)
- [Vitest Mock Extended](https://github.com/marchaos/vitest-mock-extended)

---

**Happy Testing! 🧪**
