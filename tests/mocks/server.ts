/**
 * MSW (Mock Service Worker) server for test environment
 *
 * This server intercepts HTTP requests during tests and returns
 * mock responses defined in handlers.ts.
 *
 * Usage in tests:
 *   import { server } from '../tests/mocks/server';
 *
 *   // Override a handler for a specific test:
 *   server.use(
 *     http.post('https://api.mews-test.com/api/connector/v1/services/getAll', () => {
 *       return HttpResponse.json({ Services: [] });
 *     })
 *   );
 *
 * The server is automatically started/stopped via tests/setup.ts.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
