/**
 * MSW (Mock Service Worker) request handlers for Mews API
 *
 * These handlers provide realistic mock responses for all Mews API endpoints
 * used in the application. They can be used in tests to avoid mocking global.fetch
 * directly, providing more realistic HTTP simulation.
 *
 * Usage:
 *   import { handlers } from '../tests/mocks/handlers';
 *   import { server } from '../tests/mocks/server';
 *   // server.use(...handlers) is already called in setup
 */

import { http, HttpResponse } from 'msw';

const MEWS_API_BASE = 'https://api.mews-test.com';
const MEWS_APP_BASE = 'https://app.mews-demo.com';

// Default enterprise data
const defaultEnterprise = {
  Id: 'ent-test-1',
  Name: 'Test Hotel',
  TimeZoneIdentifier: 'Europe/London',
  DefaultLanguageCode: 'en-GB',
  Currencies: [{ IsDefault: true, Currency: 'GBP' }],
};

export const handlers = [
  // Configuration endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/configuration/get`, () => {
    return HttpResponse.json({
      NowUtc: new Date().toISOString(),
      Enterprise: defaultEnterprise,
    });
  }),

  // Services endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/services/getAll`, () => {
    return HttpResponse.json({
      Services: [
        {
          Id: 'svc-test-1',
          Name: 'Accommodation',
          Ordering: 1,
          Data: { Discriminator: 'Bookable' },
        },
      ],
    });
  }),

  // Rates endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/rates/getAll`, () => {
    return HttpResponse.json({
      Rates: [
        {
          Id: 'rate-test-1',
          Name: 'Best Price',
          Type: 'Public',
          IsPublic: true,
          IsActive: true,
          IsEnabled: true,
        },
      ],
    });
  }),

  // Resource categories endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/resourceCategories/getAll`, () => {
    return HttpResponse.json({
      ResourceCategories: [
        {
          Id: 'cat-test-1',
          Names: { 'en-US': 'Standard Room' },
          Type: 'Room',
        },
      ],
    });
  }),

  // Resource category assignments endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/resourceCategoryAssignments/getAll`, () => {
    return HttpResponse.json({
      ResourceCategoryAssignments: [
        {
          Id: 'assign-1',
          ResourceId: 'res-1',
          CategoryId: 'cat-test-1',
          IsActive: true,
          CreatedUtc: '2024-01-01T00:00:00Z',
          UpdatedUtc: '2024-01-01T00:00:00Z',
        },
      ],
    });
  }),

  // Age categories endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/ageCategories/getAll`, () => {
    return HttpResponse.json({
      AgeCategories: [
        { Id: 'age-adult', Name: 'Adult', Classification: 'Adult' },
        { Id: 'age-child', Name: 'Child', Classification: 'Child' },
      ],
    });
  }),

  // Vouchers endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/vouchers/getAll`, () => {
    return HttpResponse.json({
      Vouchers: [],
      VoucherAssignments: [],
      VoucherCodes: [],
    });
  }),

  // Voucher codes endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/voucherCodes/getAll`, () => {
    return HttpResponse.json({
      VoucherCodes: [],
    });
  }),

  // Customer creation endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/customers/add`, () => {
    return HttpResponse.json({
      Id: `cust-${Math.random().toString(36).substr(2, 9)}`,
      FirstName: 'Test',
      LastName: 'Customer',
    });
  }),

  // Reservations add endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/reservations/add`, () => {
    return HttpResponse.json({
      Reservations: [
        {
          Reservation: {
            Id: `res-${Math.random().toString(36).substr(2, 9)}`,
          },
        },
      ],
    });
  }),

  // Reservations getAll endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/reservations/getAll`, () => {
    return HttpResponse.json({
      Reservations: [],
    });
  }),

  // Reservations getAll (versioned) endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/reservations/getAll/2023-06-06`, () => {
    return HttpResponse.json({
      Reservations: [],
    });
  }),

  // Reservation cancel endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/reservations/cancel`, () => {
    return HttpResponse.json({});
  }),

  // Reservation start endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/reservations/start`, () => {
    return HttpResponse.json({});
  }),

  // Reservation process endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/reservations/process`, () => {
    return HttpResponse.json({});
  }),

  // Rate price update endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/rates/updatePrice`, () => {
    return HttpResponse.json({});
  }),

  // Resource update endpoint
  http.post(`${MEWS_API_BASE}/api/connector/v1/resources/update`, () => {
    return HttpResponse.json({});
  }),

  // Enterprise addSample endpoint
  http.post(`${MEWS_APP_BASE}/api/general/v1/enterprises/addSample`, () => {
    return HttpResponse.json({
      success: true,
    });
  }),

  // Zapier webhook endpoint (catch-all for any test Zapier URL)
  http.post('https://hooks.zapier.com/*', () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];
