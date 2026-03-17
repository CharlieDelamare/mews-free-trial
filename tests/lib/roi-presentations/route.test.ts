import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/tests/mocks/prisma';

import { GET as listPresentations, POST as createPresentation } from '@/app/api/roi-presentations/route';
import { GET as getPresentation, PATCH as patchPresentation } from '@/app/api/roi-presentations/[id]/route';

const mockPresentation = {
  id: 'test-uuid-123',
  name: 'Grand Hotel Berlin',
  salesforceAccountId: 'SF001',
  country: 'Germany',
  hotelType: 'City Hotel',
  numberOfRooms: 80,
  totalAnnualSavings: 150000,
  createdBy: 'Charlie',
  stateJson: {
    config: { country: 'Germany', hotelType: 'City Hotel', isInitialLoad: false, title: '', usState: '', currencySymbol: '€', presentationLanguage: 'en' },
    sharedVariables: { numberOfRooms: 80, averageDailyRate: 100, occupancyRate: 75, avgLengthOfStay: 2, reservationsPerMonth: 900, monthlyRevenue: 180000, staffHourlyWage: 18 },
    guestExperience: { reservationsPerMonth: 900, averageStaffWage: 18, averageDailyRate: 100, checkInTime: 5, checkOutTime: 1, mewsCheckInTime: 1, mewsCheckOutTime: 0.5, roomAssignmentTime: 2, currentCheckInPercentage: 10, onlineCheckInPercentage: 30, revenueUplift: 12, currentDirectBookingPercent: 30, directBookingIncrease: 40, averageCommission: 15 },
    payment: { transactionsPerMonth: 900, secondsPerTransaction: 55, processingWage: 14, chargebackRate: 0.4, mewsChargebackRate: 0.15, chargebackVolume: 40, chargebackCostPerMonth: 1800, reconciliationTimeDaily: 2, mewsReconciliationTimeDaily: 0.5, reconciliationWage: 14, monthlyRevenue: 180000, noShowRate: 2, noShowWithoutFee: 50, foreignCurrencyPercent: 25, multiCurrencyAdoption: 30, revenueShare: 1 },
    rms: { hotelRevPAR: 75, numberOfRooms: 80, numberOfRatePlans: 5, rateUpdateFrequency: 'Daily', rateChangesPerWeek: 7, numberOfChannels: 4, avgTimeToUpdateRate: 5, hasRevenueManager: false, hasExistingRMS: false, estimatedRevenueUplift: 10.5 },
  },
  createdAt: new Date('2026-03-17'),
  updatedAt: new Date('2026-03-17'),
};

describe('GET /api/roi-presentations', () => {
  it('returns list of presentations', async () => {
    prismaMock.roiPresentation.findMany.mockResolvedValue([mockPresentation]);
    const req = new NextRequest('http://localhost/api/roi-presentations');
    const res = await listPresentations(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.presentations).toHaveLength(1);
    expect(body.presentations[0].name).toBe('Grand Hotel Berlin');
  });
});

describe('POST /api/roi-presentations', () => {
  it('creates a presentation and returns its id', async () => {
    prismaMock.roiPresentation.create.mockResolvedValue(mockPresentation);
    const req = new NextRequest('http://localhost/api/roi-presentations', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Grand Hotel Berlin',
        salesforceAccountId: 'SF001',
        createdBy: 'Charlie',
        state: mockPresentation.stateJson,
      }),
    });
    const res = await createPresentation(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.id).toBe('test-uuid-123');
  });

  it('returns 400 when name is missing', async () => {
    const req = new NextRequest('http://localhost/api/roi-presentations', {
      method: 'POST',
      body: JSON.stringify({ state: mockPresentation.stateJson }),
    });
    const res = await createPresentation(req);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/roi-presentations/[id]', () => {
  it('returns the presentation for a valid id', async () => {
    prismaMock.roiPresentation.findUnique.mockResolvedValue(mockPresentation);
    const req = new NextRequest('http://localhost/api/roi-presentations/test-uuid-123');
    const res = await getPresentation(req, { params: Promise.resolve({ id: 'test-uuid-123' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.presentation.id).toBe('test-uuid-123');
  });

  it('returns 404 for unknown id', async () => {
    prismaMock.roiPresentation.findUnique.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/roi-presentations/unknown');
    const res = await getPresentation(req, { params: Promise.resolve({ id: 'unknown' }) });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/roi-presentations/[id]', () => {
  it('updates stateJson and metadata and returns success', async () => {
    prismaMock.roiPresentation.update.mockResolvedValue(mockPresentation);
    const req = new NextRequest('http://localhost/api/roi-presentations/test-uuid-123', {
      method: 'PATCH',
      body: JSON.stringify({ state: mockPresentation.stateJson }),
    });
    const res = await patchPresentation(req, { params: Promise.resolve({ id: 'test-uuid-123' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prismaMock.roiPresentation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'test-uuid-123' },
        data: expect.objectContaining({ stateJson: expect.any(Object) }),
      }),
    );
  });
});
