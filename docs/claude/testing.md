# Testing

## Stack

- **Runner**: Vitest (v3) with happy-dom — pinned to v3, do not upgrade to v4
- **React**: `@testing-library/react` + `@testing-library/jest-dom`
- **API mocking**: MSW (Mock Service Worker)
- **Prisma mocking**: `vitest-mock-extended`
- **Config**: `vitest.config.ts` / **Setup**: `tests/setup.ts` (global env vars)

## Commands

```bash
npm run test           # run once
npm run test:watch     # watch mode
npm run test:ui        # browser UI
npm run test:coverage  # coverage report
```

## Test Files

| File | What it covers |
|------|----------------|
| `app/api/create-trial/route.test.ts` | Trial creation (25+ tests) |
| `app/api/logs/route.test.ts` | Logs endpoint |
| `app/api/reservations/cancel-all/route.test.ts` | Cancel reservations |
| `app/api/webhook/access-token/route.test.ts` | Webhook handling |
| `hooks/useAdaptivePolling.test.ts` | Adaptive polling |
| `lib/codes.test.ts` | Country/language mappings (23 tests) |
| `lib/customer-generator.test.ts` | Dynamic customer generation |
| `lib/customer-service.test.ts` | Batch customer creation |
| `lib/duration.test.ts` | Duration utilities |
| `lib/mews-data-service.test.ts` | Data fetching |
| `lib/reservation-service.test.ts` | Reservation creation |
| `lib/unified-logger.test.ts` | Unified logging |
| `lib/validation.test.ts` | Input validation |
| `lib/zapier.test.ts` | Webhook notifications |
| `tests/lib/mews-rate-limiter.test.ts` | Rate limiting |

## Patterns

- API route tests: MSW mocks external Mews API calls
- Prisma: mocked with `vitest-mock-extended`
- Prefer integration tests over unit tests
- Coverage goals: 80%+ unit, 70%+ integration
