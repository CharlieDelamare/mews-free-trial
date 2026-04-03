# Testing

## Stack

- **Runner**: Vitest (v4) with happy-dom
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
| `lib/control-centre/csv-parser.test.ts` | CSV import parsing |
| `lib/control-centre/ibe-service.test.ts` | IBE booking simulation |
| `lib/customer-generator.test.ts` | Dynamic customer generation |
| `lib/customer-service.test.ts` | Batch customer creation |
| `lib/duration.test.ts` | Duration utilities |
| `lib/mews-data-service.test.ts` | Data fetching |
| `lib/research/inference.test.ts` | AI property summary inference |
| `lib/research/liteapi.test.ts` | LiteAPI hotel pricing |
| `lib/research/serpapi.test.ts` | SerpApi competitor search |
| `lib/reservation-service.test.ts` | Reservation creation |
| `lib/unified-logger.test.ts` | Unified logging |
| `lib/validation.test.ts` | Input validation |
| `lib/zapier.test.ts` | Webhook notifications |
| `tests/lib/mews-rate-limiter.test.ts` | Rate limiting |
| `tests/lib/roi-calculator/calculations.test.ts` | ROI savings calculations |
| `tests/lib/roi-calculator/confidenceScoring.test.ts` | Confidence scoring |
| `tests/lib/roi-calculator/narratives.test.ts` | Narrative generation |
| `tests/lib/roi-calculator/persistence.test.ts` | ROI presentation persistence |
| `tests/lib/roi-calculator/priorityInputs.test.ts` | Priority input detection |
| `tests/lib/roi-presentations/route.test.ts` | ROI presentations API |

## Patterns

- API route tests: MSW mocks external Mews API calls
- Prisma: mocked with `vitest-mock-extended`
- Prefer integration tests over unit tests
- Coverage goals: 80%+ unit, 70%+ integration
