# ROI Calculator Dashboard & Persistence Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the ROI Calculator from a stateless page into a persistent multi-presentation tool with a dashboard, a creation wizard, and per-presentation calculator pages.

**Architecture:** Add a `RoiPresentation` Prisma model storing calculator state as JSON plus extracted metadata columns. A new `/roi-calculator` dashboard lists all presentations; `/roi-calculator/new` is a full-page wizard; `/roi-calculator/[id]` is the per-presentation calculator with auto-save. Existing `ROIStage` and `useROICalculator` are extended minimally — no rewrite.

**Tech Stack:** Next.js 14 App Router · TypeScript strict · Prisma + PostgreSQL · Tailwind CSS · Vitest + vitest-mock-extended

---

## File Map

**New files:**
- `lib/roi-calculator/utils/persistence.ts` — serialize/deserialize state, extract metadata
- `tests/lib/roi-calculator/persistence.test.ts` — unit tests for persistence utils
- `app/api/roi-presentations/route.ts` — GET (list) + POST (create)
- `app/api/roi-presentations/[id]/route.ts` — GET (load) + PATCH (auto-save)
- `tests/lib/roi-presentations/route.test.ts` — API route tests
- `components/roi-calculator/PresentationWizard.tsx` — Step 1 identity form + ProspectIntake orchestration
- `app/roi-calculator/new/page.tsx` — wizard page (thin wrapper around PresentationWizard)
- `app/roi-calculator/[id]/page.tsx` — calculator page (server component, fetches + passes initialState)

**Modified files:**
- `prisma/schema.prisma` — add `RoiPresentation` model
- `hooks/useROICalculator.ts` — export `defaultCalculatorState`; accept optional `savedState` param
- `components/roi-calculator/ROIStage.tsx` — accept `presentationId` + `initialState` props; add auto-save + save indicator

**Replaced file:**
- `app/roi-calculator/page.tsx` — becomes the dashboard (server component; previous calculator content is superseded by the `[id]` page)

---

## Task 1: Persistence utility

**Files:**
- Create: `lib/roi-calculator/utils/persistence.ts`
- Create: `tests/lib/roi-calculator/persistence.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/roi-calculator/persistence.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  serializeState,
  deserializeState,
  extractMetadata,
} from '@/lib/roi-calculator/utils/persistence';
import type { CalculatorState } from '@/lib/roi-calculator/types/calculator';

const minimalState: CalculatorState = {
  config: {
    title: '',
    country: 'United Kingdom',
    usState: '',
    currencySymbol: '£',
    hotelType: 'City Hotel',
    isInitialLoad: false,
    presentationLanguage: 'en',
  },
  ui: {
    isExportModalOpen: false,
    selectedSections: [],
    isExporting: false,
    enabledModules: { guestExperience: true, payment: true, rms: true },
    activeDetailModule: null,
    activePreset: 'full',
    cinematicMode: true,        // ephemeral — must be stripped
    cinematicSlideIndex: 3,     // ephemeral — must be stripped
    cinematicAutoAdvance: false,
    propertyEditOpen: true,     // ephemeral — must be stripped
    expandedLever: null,
    editingLever: null,
  },
  sharedVariables: {
    numberOfRooms: 80,
    averageDailyRate: 120,
    occupancyRate: 75,
    avgLengthOfStay: 2,
    reservationsPerMonth: 900,
    monthlyRevenue: 216000,
    staffHourlyWage: 18,
  },
  guestExperience: {
    reservationsPerMonth: 900,
    averageStaffWage: 18,
    averageDailyRate: 120,
    checkInTime: 6,
    checkOutTime: 1.5,
    mewsCheckInTime: 1,
    mewsCheckOutTime: 0.5,
    roomAssignmentTime: 2,
    currentCheckInPercentage: 10,
    onlineCheckInPercentage: 30,
    revenueUplift: 12,
    currentDirectBookingPercent: 30,
    directBookingIncrease: 40,
    averageCommission: 15,
  },
  payment: {
    transactionsPerMonth: 900,
    secondsPerTransaction: 55,
    processingWage: 14,
    chargebackRate: 0.4,
    mewsChargebackRate: 0.15,
    chargebackVolume: 40,
    chargebackCostPerMonth: 1800,
    reconciliationTimeDaily: 2,
    mewsReconciliationTimeDaily: 0.5,
    reconciliationWage: 14,
    monthlyRevenue: 216000,
    noShowRate: 2,
    noShowWithoutFee: 50,
    foreignCurrencyPercent: 25,
    multiCurrencyAdoption: 30,
    revenueShare: 1,
  },
  rms: {
    hotelRevPAR: 90,
    numberOfRooms: 80,
    numberOfRatePlans: 5,
    rateUpdateFrequency: 'Daily',
    rateChangesPerWeek: 7,
    numberOfChannels: 4,
    avgTimeToUpdateRate: 5,
    hasRevenueManager: false,
    hasExistingRMS: false,
    estimatedRevenueUplift: 10.5,
  },
};

describe('serializeState', () => {
  it('strips the ui slice', () => {
    const result = serializeState(minimalState);
    expect(result).not.toHaveProperty('ui');
  });

  it('preserves all non-ui slices', () => {
    const result = serializeState(minimalState);
    expect(result.config.country).toBe('United Kingdom');
    expect(result.sharedVariables.numberOfRooms).toBe(80);
    expect(result.guestExperience.checkInTime).toBe(6);
    expect(result.payment.chargebackRate).toBe(0.4);
    expect(result.rms.numberOfRooms).toBe(80);
  });
});

describe('deserializeState', () => {
  it('returns null for null input', () => {
    expect(deserializeState(null)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(deserializeState('invalid')).toBeNull();
    expect(deserializeState(42)).toBeNull();
  });

  it('restores a valid serialized state', () => {
    const serialized = serializeState(minimalState);
    const restored = deserializeState(serialized);
    expect(restored).not.toBeNull();
    expect(restored!.config.country).toBe('United Kingdom');
    expect(restored!.sharedVariables.numberOfRooms).toBe(80);
  });

  it('fills missing fields with defaults when state is partial', () => {
    const partial = { config: { country: 'France' } };
    const restored = deserializeState(partial);
    expect(restored).not.toBeNull();
    // Should have all required fields filled from defaults
    expect(restored!.sharedVariables).toBeDefined();
    expect(restored!.guestExperience).toBeDefined();
    expect(restored!.payment).toBeDefined();
    expect(restored!.rms).toBeDefined();
    // Preserved value
    expect(restored!.config.country).toBe('France');
  });

  it('does not include ui in restored state', () => {
    const restored = deserializeState(serializeState(minimalState));
    expect(restored).not.toHaveProperty('ui');
  });
});

describe('extractMetadata', () => {
  it('extracts country, hotelType, numberOfRooms from state', () => {
    const serialized = serializeState(minimalState);
    const meta = extractMetadata(serialized);
    expect(meta.country).toBe('United Kingdom');
    expect(meta.hotelType).toBe('City Hotel');
    expect(meta.numberOfRooms).toBe(80);
  });

  it('returns a non-negative totalAnnualSavings', () => {
    const serialized = serializeState(minimalState);
    const meta = extractMetadata(serialized);
    expect(meta.totalAnnualSavings).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test tests/lib/roi-calculator/persistence.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Export `defaultCalculatorState` from `hooks/useROICalculator.ts`**

At line 73, change `const initialState` to `export const defaultCalculatorState` (keep the same object). Update all references inside the file from `initialState` to `defaultCalculatorState`.

Also add the savedState parameter to the hook signature (full implementation in Task 4 — here just export the constant):

```typescript
// Change line 73:
export const defaultCalculatorState: CalculatorState = {
  // ... same object as before
};

// Change line 387:
const [state, dispatch] = useReducer(reducer, defaultCalculatorState);
```

- [ ] **Step 4: Implement `lib/roi-calculator/utils/persistence.ts`**

```typescript
import type { CalculatorState } from '@/lib/roi-calculator/types/calculator';
import { calcAll } from '@/lib/roi-calculator/utils/calculations';
import { defaultCalculatorState } from '@/hooks/useROICalculator';

export type PersistedState = Omit<CalculatorState, 'ui'>;

export interface PresentationMetadata {
  country: string;
  hotelType: string;
  numberOfRooms: number;
  totalAnnualSavings: number;
}

/** Strip the ephemeral ui slice before storing in the DB. */
export function serializeState(state: CalculatorState): PersistedState {
  const { ui: _ui, ...rest } = state;
  return rest;
}

/**
 * Restore a persisted state blob, merging each slice with defaults
 * to handle any new fields added since the state was saved.
 * Returns null for unparseable or non-object input.
 */
export function deserializeState(json: unknown): PersistedState | null {
  try {
    if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
    const stored = json as Record<string, unknown>;
    const d = defaultCalculatorState;
    return {
      config: { ...d.config, ...(stored.config as object ?? {}) },
      sharedVariables: { ...d.sharedVariables, ...(stored.sharedVariables as object ?? {}) },
      guestExperience: { ...d.guestExperience, ...(stored.guestExperience as object ?? {}) },
      payment: { ...d.payment, ...(stored.payment as object ?? {}) },
      rms: { ...d.rms, ...(stored.rms as object ?? {}) },
    };
  } catch (err) {
    console.error('[ROI] Failed to deserialize state:', err);
    return null;
  }
}

/** Extract dashboard metadata columns from a persisted state + run calculations. */
export function extractMetadata(state: PersistedState): PresentationMetadata {
  const results = calcAll(
    state.sharedVariables,
    state.guestExperience,
    state.payment,
    state.rms,
  );
  return {
    country: state.config.country,
    hotelType: state.config.hotelType,
    numberOfRooms: state.sharedVariables.numberOfRooms,
    totalAnnualSavings: results.totalAnnualSavings,
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test tests/lib/roi-calculator/persistence.test.ts
```

Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add lib/roi-calculator/utils/persistence.ts tests/lib/roi-calculator/persistence.test.ts hooks/useROICalculator.ts
git commit -m "feat: add ROI presentation persistence utilities"
```

---

## Task 2: Prisma schema + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the `RoiPresentation` model to `prisma/schema.prisma`**

Add this model at the end of the file:

```prisma
model RoiPresentation {
  id                  String   @id @default(uuid())
  name                String
  salesforceAccountId String?
  country             String
  hotelType           String
  numberOfRooms       Int      @default(0)
  totalAnnualSavings  Float    @default(0)
  createdBy           String?
  stateJson           Json
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([createdAt])
  @@index([createdBy])
}
```

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add_roi_presentation
```

Expected: Migration file created in `prisma/migrations/`, Prisma Client regenerated.

- [ ] **Step 3: Verify build compiles**

```bash
npm run build
```

Expected: Build succeeds (or at least Prisma types are valid — full build may fail until all new pages exist, which is fine at this step).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add RoiPresentation model to Prisma schema"
```

---

## Task 3: API routes

**Files:**
- Create: `app/api/roi-presentations/route.ts`
- Create: `app/api/roi-presentations/[id]/route.ts`
- Create: `tests/lib/roi-presentations/route.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/roi-presentations/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { prismaMock } from '@/tests/mocks/prisma';

// These imports will fail until we create the route files — that's expected
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
  stateJson: { config: { country: 'Germany', hotelType: 'City Hotel', isInitialLoad: false, title: '', usState: '', currencySymbol: '€', presentationLanguage: 'en' }, sharedVariables: { numberOfRooms: 80, averageDailyRate: 100, occupancyRate: 75, avgLengthOfStay: 2, reservationsPerMonth: 900, monthlyRevenue: 180000, staffHourlyWage: 18 }, guestExperience: { reservationsPerMonth: 900, averageStaffWage: 18, averageDailyRate: 100, checkInTime: 5, checkOutTime: 1, mewsCheckInTime: 1, mewsCheckOutTime: 0.5, roomAssignmentTime: 2, currentCheckInPercentage: 10, onlineCheckInPercentage: 30, revenueUplift: 12, currentDirectBookingPercent: 30, directBookingIncrease: 40, averageCommission: 15 }, payment: { transactionsPerMonth: 900, secondsPerTransaction: 55, processingWage: 14, chargebackRate: 0.4, mewsChargebackRate: 0.15, chargebackVolume: 40, chargebackCostPerMonth: 1800, reconciliationTimeDaily: 2, mewsReconciliationTimeDaily: 0.5, reconciliationWage: 14, monthlyRevenue: 180000, noShowRate: 2, noShowWithoutFee: 50, foreignCurrencyPercent: 25, multiCurrencyAdoption: 30, revenueShare: 1 }, rms: { hotelRevPAR: 75, numberOfRooms: 80, numberOfRatePlans: 5, rateUpdateFrequency: 'Daily', rateChangesPerWeek: 7, numberOfChannels: 4, avgTimeToUpdateRate: 5, hasRevenueManager: false, hasExistingRMS: false, estimatedRevenueUplift: 10.5 } },
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test tests/lib/roi-presentations/route.test.ts
```

Expected: FAIL (modules not found)

- [ ] **Step 3: Implement `app/api/roi-presentations/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractMetadata, serializeState } from '@/lib/roi-calculator/utils/persistence';
import type { CalculatorState } from '@/lib/roi-calculator/types/calculator';

export async function GET() {
  const presentations = await prisma.roiPresentation.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      country: true,
      hotelType: true,
      numberOfRooms: true,
      totalAnnualSavings: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ success: true, presentations });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, salesforceAccountId, createdBy, state } = body as {
    name?: string;
    salesforceAccountId?: string;
    createdBy?: string;
    state?: CalculatorState;
  };

  if (!name?.trim()) {
    return NextResponse.json({ success: false, error: 'name is required' }, { status: 400 });
  }
  if (!state) {
    return NextResponse.json({ success: false, error: 'state is required' }, { status: 400 });
  }

  const persisted = serializeState(state);
  const meta = extractMetadata(persisted);

  const presentation = await prisma.roiPresentation.create({
    data: {
      name: name.trim(),
      salesforceAccountId: salesforceAccountId?.trim() || null,
      createdBy: createdBy?.trim() || null,
      stateJson: persisted as object,
      ...meta,
    },
  });

  return NextResponse.json({ success: true, id: presentation.id });
}
```

- [ ] **Step 4: Implement `app/api/roi-presentations/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractMetadata, serializeState } from '@/lib/roi-calculator/utils/persistence';
import type { CalculatorState } from '@/lib/roi-calculator/types/calculator';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const presentation = await prisma.roiPresentation.findUnique({ where: { id } });
  if (!presentation) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, presentation });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { state } = await req.json() as { state: CalculatorState };

  const persisted = serializeState(state);
  const meta = extractMetadata(persisted);

  await prisma.roiPresentation.update({
    where: { id },
    data: {
      stateJson: persisted as object,
      ...meta,
    },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test tests/lib/roi-presentations/route.test.ts
```

Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/roi-presentations/ tests/lib/roi-presentations/
git commit -m "feat: add ROI presentation API routes (list, create, load, auto-save)"
```

---

## Task 4: Extend `useROICalculator` with `savedState` support

**Files:**
- Modify: `hooks/useROICalculator.ts`

**Context:** The hook uses `useReducer` with a module-level `defaultCalculatorState` constant. When the user edits `country`, `hotelType`, or `usState`, a `useEffect` fires `APPLY_DEFAULTS` — but only when `config.isInitialLoad === false`. On first render, the effect skips defaults and sets `isInitialLoad: false`. When restoring from persistence, we set `isInitialLoad: true` in the initial state so the first effect run skips defaults, preserving saved lever values.

- [ ] **Step 1: Update the hook signature and initializer**

In `hooks/useROICalculator.ts`, change the function signature and the `useReducer` call:

```typescript
// Change:
export function useROICalculator() {
  const [state, dispatch] = useReducer(reducer, defaultCalculatorState);

// To:
export function useROICalculator(savedState?: Omit<CalculatorState, 'ui'>) {
  const startState: CalculatorState = savedState
    ? {
        ...savedState,
        config: { ...savedState.config, isInitialLoad: true },
        ui: defaultCalculatorState.ui,
      }
    : defaultCalculatorState;

  const [state, dispatch] = useReducer(reducer, startState);
```

No other changes to the hook are needed. The existing `isInitialLoad` mechanism already handles the smart-defaults suppression correctly.

- [ ] **Step 2: Verify the existing tests still pass**

```bash
npm run test
```

Expected: All existing tests PASS (this is a backward-compatible change — `savedState` defaults to `undefined`).

- [ ] **Step 3: Commit**

```bash
git add hooks/useROICalculator.ts
git commit -m "feat: useROICalculator accepts optional savedState for persistence hydration"
```

---

## Task 5: Extend `ROIStage` with auto-save + initialState prop

**Files:**
- Modify: `components/roi-calculator/ROIStage.tsx`

**Context:** `ROIStage` is currently a single client component with no props. We add two optional props: `presentationId` (triggers auto-save when set) and `initialState` (passed to `useROICalculator`). Auto-save is a `useEffect` watching the full state, debounced 1.5s.

- [ ] **Step 1: Add props interface and update the function signature**

At the top of `components/roi-calculator/ROIStage.tsx`, add imports and the props interface:

```typescript
import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
// (useRef is already imported or add it — needed for debounce)

import { serializeState } from '@/lib/roi-calculator/utils/persistence';
import type { CalculatorState } from '@/lib/roi-calculator/types/calculator';

interface ROIStageProps {
  presentationId?: string;
  initialState?: Omit<CalculatorState, 'ui'>;
}
```

Change the function signature:

```typescript
// Change:
export default function ROIStage() {

// To:
export default function ROIStage({ presentationId, initialState }: ROIStageProps = {}) {
```

- [ ] **Step 2: Pass `initialState` to `useROICalculator`**

```typescript
// Change:
  const {
    state,
    // ...
  } = useROICalculator();

// To:
  const {
    state,
    // ...
  } = useROICalculator(initialState);
```

- [ ] **Step 3: Add save status state and auto-save effect**

After the existing hook calls, add:

```typescript
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!presentationId) return;
    // Skip the very first render — state hasn't changed yet
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/roi-presentations/${presentationId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: serializeState(state) }),
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
        console.error('[ROI] Auto-save failed');
      }
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [state, presentationId]);
```

- [ ] **Step 4: Add the save indicator to the UI**

Find the `PropertyContextLine` render in ROIStage (near the top of the JSX, around the property context area) and add the save indicator alongside it:

```tsx
{presentationId && saveStatus !== 'idle' && (
  <span className="text-xs text-[--mews-night-black]/50 ml-2">
    {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
  </span>
)}
```

Place this inside the same flex container as `PropertyContextLine` so it appears inline with the property summary line.

- [ ] **Step 5: Run the full test suite**

```bash
npm run test
```

Expected: All PASS (ROIStage has no unit tests to break; existing hook tests still pass).

- [ ] **Step 6: Commit**

```bash
git add components/roi-calculator/ROIStage.tsx
git commit -m "feat: ROIStage accepts presentationId/initialState props; adds debounced auto-save"
```

---

## Task 6: Wizard component + page

**Files:**
- Create: `components/roi-calculator/PresentationWizard.tsx`
- Create: `app/roi-calculator/new/page.tsx`

**Context:** The wizard is a full-page client component. Step 1 collects name/SF account/creator name. Steps 2–N render `ProspectIntake` with `isOpen={true}`, wired with the same two hooks (`useROICalculator`, `useConfidence`) that `ROIStage` uses today.

- [ ] **Step 1: Create `components/roi-calculator/PresentationWizard.tsx`**

```tsx
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import ProspectIntake from '@/components/roi-calculator/ProspectIntake';
import { useROICalculator } from '@/hooks/useROICalculator';
import { useConfidence } from '@/hooks/useConfidence';
import { getPriorityInputs } from '@/lib/roi-calculator/utils/priorityInputs';
import { buildInitialConfidenceMap } from '@/lib/roi-calculator/utils/confidenceScoring';
import { serializeState } from '@/lib/roi-calculator/utils/persistence';
import type { IntakeMode } from '@/lib/roi-calculator/types/confidence';

export default function PresentationWizard() {
  const router = useRouter();
  const [step, setStep] = useState<'identity' | 'intake'>('identity');
  const [name, setName] = useState('');
  const [salesforceAccountId, setSalesforceAccountId] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [nameError, setNameError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { state, dispatch, results } = useROICalculator();
  const { config, ui } = state;
  const { currencySymbol } = config;

  const priorityInputs = useMemo(
    () => getPriorityInputs(currencySymbol, config.country, config.hotelType),
    [currencySymbol, config.country, config.hotelType],
  );

  const {
    confidenceState,
    confidenceDispatch,
    score,
    getFieldStatus,
    getBenchmarkValue,
    confirmField,
    adjustField,
    markUnknown,
  } = useConfidence({
    priorityInputs,
    initialConfidenceMap: buildInitialConfidenceMap(priorityInputs),
    getSliceValue: (slice: string, field: string) => {
      const s = state as Record<string, Record<string, number>>;
      return s[slice]?.[field] ?? 0;
    },
  });

  function handleIdentitySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Hotel or group name is required');
      return;
    }
    setNameError('');
    setStep('intake');
  }

  async function handleIntakeComplete() {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/roi-presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          salesforceAccountId: salesforceAccountId.trim() || undefined,
          createdBy: createdBy.trim() || undefined,
          state: serializeState(state),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Unknown error');
      router.push(`/roi-calculator/${data.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
      setIsSubmitting(false);
    }
  }

  if (step === 'identity') {
    return (
      <div className="min-h-screen bg-[--mews-linen] flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <h1 className="text-3xl font-bold text-[--mews-night-black] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Build Your Business Case
          </h1>
          <p className="text-[--mews-night-black]/60 mb-8" style={{ fontFamily: 'var(--font-body)' }}>
            Let&apos;s start with a few details about this presentation.
          </p>

          <form onSubmit={handleIdentitySubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[--mews-night-black] mb-1.5" style={{ fontFamily: 'var(--font-body)' }}>
                Hotel or group name <span className="text-[--mews-coral]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Grand Berlin"
                className="w-full px-4 py-3 rounded-xl border border-[--mews-night-black]/15 bg-white text-[--mews-night-black] placeholder:text-[--mews-night-black]/30 focus:outline-none focus:ring-2 focus:ring-[--mews-indigo]"
                style={{ fontFamily: 'var(--font-body)' }}
                autoFocus
              />
              {nameError && <p className="mt-1.5 text-sm text-[--mews-coral]">{nameError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[--mews-night-black] mb-1.5" style={{ fontFamily: 'var(--font-body)' }}>
                Salesforce Account Number <span className="text-[--mews-night-black]/40 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={salesforceAccountId}
                onChange={(e) => setSalesforceAccountId(e.target.value)}
                placeholder="e.g. 0012000001AbCdE"
                className="w-full px-4 py-3 rounded-xl border border-[--mews-night-black]/15 bg-white text-[--mews-night-black] placeholder:text-[--mews-night-black]/30 focus:outline-none focus:ring-2 focus:ring-[--mews-indigo]"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[--mews-night-black] mb-1.5" style={{ fontFamily: 'var(--font-body)' }}>
                Your name <span className="text-[--mews-night-black]/40 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder="e.g. Charlie"
                className="w-full px-4 py-3 rounded-xl border border-[--mews-night-black]/15 bg-white text-[--mews-night-black] placeholder:text-[--mews-night-black]/30 focus:outline-none focus:ring-2 focus:ring-[--mews-indigo]"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[--mews-night-black] text-white font-medium hover:bg-[--mews-deep-blue] transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {submitError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[--mews-coral] text-white px-4 py-2 rounded-lg text-sm">
          {submitError}
        </div>
      )}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-white/70 flex items-center justify-center">
          <p className="text-[--mews-night-black]/60 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
            Saving your presentation…
          </p>
        </div>
      )}
      <ProspectIntake
        isOpen={true}
        onClose={() => {}} // no-op: no modal to close on a full page
        onComplete={handleIntakeComplete}
        intakeMode={ui.activePreset === 'custom' ? 'fast' : 'fast'}
        onModeChange={(mode: IntakeMode) =>
          dispatch({ type: 'SET_FIELD', slice: 'ui', field: 'activePreset', value: mode })
        }
        priorityInputs={priorityInputs}
        getValue={(slice, field) => {
          const s = state as Record<string, Record<string, number>>;
          return s[slice]?.[field] ?? 0;
        }}
        onValueChange={(slice, field, value) =>
          dispatch({ type: 'SET_FIELD', slice, field, value })
        }
        getFieldStatus={getFieldStatus}
        getBenchmarkValue={getBenchmarkValue}
        onConfirmField={confirmField}
        onAdjustField={adjustField}
        onMarkUnknown={markUnknown}
        score={score}
        country={config.country}
        usState={config.usState}
        hotelType={config.hotelType}
        onCountryChange={(v) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'country', value: v })}
        onUSStateChange={(v) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'usState', value: v })}
        onHotelTypeChange={(v) => dispatch({ type: 'SET_FIELD', slice: 'config', field: 'hotelType', value: v })}
        currencySymbol={currencySymbol}
        hasExistingRMS={state.rms.hasExistingRMS}
        onHasExistingRMSChange={(value) =>
          dispatch({ type: 'SET_FIELD', slice: 'rms', field: 'hasExistingRMS', value })
        }
      />
    </>
  );
}
```

- [ ] **Step 2: Create `app/roi-calculator/new/page.tsx`**

```tsx
import PresentationWizard from '@/components/roi-calculator/PresentationWizard';

export const metadata = { title: 'New Business Case — Mews ROI' };

export default function NewPresentationPage() {
  return <PresentationWizard />;
}
```

- [ ] **Step 3: Verify the page renders without errors**

```bash
npm run dev
```

Navigate to `http://localhost:3000/roi-calculator/new`. Verify Step 1 form appears, name validation works, and the Continue button advances to the intake wizard.

- [ ] **Step 4: Commit**

```bash
git add components/roi-calculator/PresentationWizard.tsx app/roi-calculator/new/page.tsx
git commit -m "feat: add business case creation wizard (/roi-calculator/new)"
```

---

## Task 7: Calculator page (`/roi-calculator/[id]`)

**Files:**
- Create: `app/roi-calculator/[id]/page.tsx`

- [ ] **Step 1: Create `app/roi-calculator/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { deserializeState } from '@/lib/roi-calculator/utils/persistence';
import ROIStage from '@/components/roi-calculator/ROIStage';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const presentation = await prisma.roiPresentation.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: presentation ? `${presentation.name} — Mews ROI` : 'ROI Calculator' };
}

export default async function PresentationPage({ params }: Props) {
  const { id } = await params;

  const presentation = await prisma.roiPresentation.findUnique({ where: { id } });
  if (!presentation) notFound();

  const initialState = deserializeState(presentation.stateJson) ?? undefined;

  return <ROIStage presentationId={id} initialState={initialState} />;
}
```

- [ ] **Step 2: Verify the page loads a saved presentation**

With the dev server running, complete a wizard creation and verify you are redirected to `/roi-calculator/[id]` and the calculator loads with the state you entered.

- [ ] **Step 3: Commit**

```bash
git add app/roi-calculator/[id]/page.tsx
git commit -m "feat: add per-presentation calculator page (/roi-calculator/[id])"
```

---

## Task 8: Dashboard page (`/roi-calculator`)

**Files:**
- Modify: `app/roi-calculator/page.tsx` (replaces existing calculator content)

**Context:** The current `app/roi-calculator/page.tsx` renders `ROIStage` directly. Replace it entirely with a server component dashboard. The calculator is now only accessible via `/roi-calculator/[id]`.

- [ ] **Step 1: Replace `app/roi-calculator/page.tsx` with the dashboard**

```tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDistanceToNow } from 'date-fns';
import { Plus, ArrowRight, TrendingUp } from 'lucide-react';

export const metadata = { title: 'Business Case Presentations — Mews ROI' };

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}k`;
  return `$${Math.round(amount)}`;
}

export default async function ROICalculatorDashboard() {
  const presentations = await prisma.roiPresentation.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      country: true,
      hotelType: true,
      numberOfRooms: true,
      totalAnnualSavings: true,
      updatedAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-[--mews-linen] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-3xl font-bold text-[--mews-night-black]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Business Case Presentations
            </h1>
            <p
              className="text-[--mews-night-black]/50 mt-1"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {presentations.length === 0
                ? 'No presentations yet'
                : `${presentations.length} presentation${presentations.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <Link
            href="/roi-calculator/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[--mews-night-black] text-white text-sm font-medium hover:bg-[--mews-deep-blue] transition-colors"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <Plus className="w-4 h-4" /> Create New
          </Link>
        </div>

        {/* Empty state */}
        {presentations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[--mews-blue] flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-[--mews-night-black]" />
            </div>
            <h2
              className="text-xl font-semibold text-[--mews-night-black] mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              No presentations yet
            </h2>
            <p
              className="text-[--mews-night-black]/50 mb-6 max-w-sm"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Build a tailored business case for a prospect in minutes.
            </p>
            <Link
              href="/roi-calculator/new"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[--mews-night-black] text-white text-sm font-medium hover:bg-[--mews-deep-blue] transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <Plus className="w-4 h-4" /> Create your first presentation
            </Link>
          </div>
        )}

        {/* Presentations table */}
        {presentations.length > 0 && (
          <div className="rounded-2xl border border-[--mews-night-black]/10 bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[--mews-night-black]/8">
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-[--mews-night-black]/50 uppercase tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>Name</th>
                  <th className="text-left px-6 py-3.5 text-xs font-medium text-[--mews-night-black]/50 uppercase tracking-wide hidden sm:table-cell" style={{ fontFamily: 'var(--font-body)' }}>Type · Country</th>
                  <th className="text-right px-6 py-3.5 text-xs font-medium text-[--mews-night-black]/50 uppercase tracking-wide hidden md:table-cell" style={{ fontFamily: 'var(--font-body)' }}>Rooms</th>
                  <th className="text-right px-6 py-3.5 text-xs font-medium text-[--mews-night-black]/50 uppercase tracking-wide" style={{ fontFamily: 'var(--font-body)' }}>Annual Savings</th>
                  <th className="text-right px-6 py-3.5 text-xs font-medium text-[--mews-night-black]/50 uppercase tracking-wide hidden lg:table-cell" style={{ fontFamily: 'var(--font-body)' }}>Updated</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {presentations.map((p) => (
                  <tr key={p.id} className="border-b border-[--mews-night-black]/6 last:border-0 hover:bg-[--mews-linen]/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-[--mews-night-black] text-sm" style={{ fontFamily: 'var(--font-body)' }}>{p.name}</span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-[--mews-night-black]/60" style={{ fontFamily: 'var(--font-body)' }}>
                        {p.hotelType} · {p.country}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right hidden md:table-cell">
                      <span className="text-sm text-[--mews-night-black]/60" style={{ fontFamily: 'var(--font-body)' }}>{p.numberOfRooms}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-[--mews-night-black]" style={{ fontFamily: 'var(--font-data-small)' }}>
                        {p.totalAnnualSavings > 0 ? formatCurrency(p.totalAnnualSavings) : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right hidden lg:table-cell">
                      <span className="text-sm text-[--mews-night-black]/40" style={{ fontFamily: 'var(--font-body)' }}>
                        {formatDistanceToNow(p.updatedAt, { addSuffix: true })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/roi-calculator/${p.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[--mews-night-black]/15 text-xs font-medium text-[--mews-night-black] hover:bg-[--mews-night-black] hover:text-white hover:border-[--mews-night-black] transition-colors"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the dashboard renders**

```bash
npm run dev
```

Navigate to `http://localhost:3000/roi-calculator`. Verify the dashboard appears with the "Create New" button, and any previously created presentations are listed with "View" buttons.

- [ ] **Step 3: Run the full test suite**

```bash
npm run test
```

Expected: All PASS

- [ ] **Step 4: Run a production build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add app/roi-calculator/page.tsx
git commit -m "feat: ROI Calculator dashboard — list presentations with View/Create New"
```

---

## End-to-end verification checklist

After completing all tasks, manually verify:

- [ ] `/roi-calculator` → dashboard renders (empty state when no presentations exist)
- [ ] Clicking "Create New" → navigates to `/roi-calculator/new`
- [ ] Step 1 form validates name (required), accepts SF account + your name as optional
- [ ] Clicking "Continue" → ProspectIntake wizard opens full-page
- [ ] Completing wizard → POST fires, redirects to `/roi-calculator/[id]`
- [ ] Calculator loads with the data entered in the wizard
- [ ] Changing a lever value → "Saving…" indicator appears, then "Saved"
- [ ] Refreshing `/roi-calculator/[id]` → saved values are preserved (auto-save worked)
- [ ] Navigating back to `/roi-calculator` → new presentation appears in the list with correct name, hotel type, rooms, and savings figure
- [ ] Clicking "View" → loads the calculator for that presentation
- [ ] Navigating to `/roi-calculator/invalid-id` → Next.js 404 page

---

## Notes for the implementer

**ProspectIntake `intakeMode` prop:** The prop is typed as `IntakeMode` (from `lib/roi-calculator/types/confidence.ts`). In the wizard, pass `'fast'` as the default. The `onModeChange` handler should update `ui.activePreset` but this is cosmetic — the important thing is the hook is satisfied.

**`useConfidence` hook signature:** Check `hooks/useConfidence.ts` for the exact parameter names — the plan uses `{ priorityInputs, initialConfidenceMap, getSliceValue }` but verify these match the actual hook interface before wiring.

**CSS variable references:** The dashboard uses `--mews-linen`, `--mews-night-black`, `--mews-deep-blue`, `--mews-blue`, `--mews-indigo`, `--mews-coral` — all defined in `app/globals.css`. No new CSS variables are needed.

**`date-fns`:** Already in `package.json` — no install needed. Use named import: `import { formatDistanceToNow } from 'date-fns'`.
