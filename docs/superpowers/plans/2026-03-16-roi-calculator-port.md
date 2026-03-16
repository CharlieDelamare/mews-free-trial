# ROI Calculator Port — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port all ROI Calculator V2 source files into mews-free-trial as a new `/roi-calculator` page, fully rethemed to the Mews design system.

**Architecture:** Copy all ROI Calculator React components, hooks, and logic into an isolated `components/roi-calculator/` subtree with `'use client'` directives. Pure logic (types, utils, data, translations) lives in `lib/roi-calculator/`. All relative imports are rewritten to `@/` absolute paths. Styling is migrated from the ROI Calculator's navy/teal dark theme to Mews design tokens using the reference table below.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Vitest + happy-dom, html2canvas, jspdf, lucide-react

---

## Theming Reference

Use this table for every file you port. Find the old value, swap it for the Mews token or Tailwind class:

| Old value | Replace with |
|---|---|
| `#2D2C37` / `--color-navy` | `var(--mews-night-black)` or `text-mews-night-black` / `bg-mews-night-black` |
| `#6BA3B0` / `--color-teal` / `#8fb8c2` | `var(--mews-indigo)` or `text-mews-indigo` / `bg-mews-indigo` |
| `rgba(107,163,176,...)` (teal alpha) | `rgba(179,178,251,...)` (indigo alpha) |
| `rgba(45,44,55,...)` (navy alpha) | `rgba(28,29,36,...)` (night-black alpha) |
| `bg-gray-900` / `bg-gray-800` / dark bg | `bg-mews-deep-blue` or `bg-mews-night-black` |
| `hero-gradient` class | `bg-mews-linen` |
| `.glass-navy` / `.glass-dark` | `bg-mews-deep-blue/90 backdrop-blur-md border border-white/10` |
| `.glass` | `bg-white/80 backdrop-blur-md border border-white/50` |
| `.gradient-text` / `.gradient-text-teal` | `text-mews-indigo` |
| `accent-color: #6BA3B0` | `accent-color: var(--mews-indigo)` |
| `border-blue-300` / `ring-blue-100` (focus) | `border-primary-300` / `ring-primary-100` |
| `text-blue-*` | `text-primary-*` |
| `bg-blue-*` | `bg-primary-*` |
| Module color `#3b82f6` (blue/GX) | `var(--mews-indigo)` |
| Module color `#10b981` (green/payment) | `var(--mews-green)` — text use `text-success-500` |
| Module color `#8b5cf6` (purple/RMS) | `var(--mews-coral)` |
| `.animate-fade-in` from ROI CSS | Use Tailwind `animate-fade-in` (already defined in tailwind.config.js) |

---

## File Map

**Create:**
```
lib/roi-calculator/types/calculator.ts
lib/roi-calculator/types/confidence.ts
lib/roi-calculator/types/translations.ts
lib/roi-calculator/utils/calculations.ts
lib/roi-calculator/utils/confidenceScoring.ts
lib/roi-calculator/utils/hotelDefaults.ts
lib/roi-calculator/utils/leverDescriptors.ts
lib/roi-calculator/utils/priorityInputs.ts
lib/roi-calculator/utils/timeFormat.ts
lib/roi-calculator/data/countryBenchmarks.ts
lib/roi-calculator/data/usStateBenchmarks.ts
lib/roi-calculator/translations/index.ts
lib/roi-calculator/translations/en.ts  cs.ts  da.ts  de.ts  es.ts
lib/roi-calculator/translations/fi.ts  fr.ts  it.ts  nl.ts  no.ts  pt.ts  sv.ts
hooks/useROICalculator.ts
hooks/useConfidence.ts
components/roi-calculator/ui/CollapsibleSection.tsx
components/roi-calculator/ui/ConfidenceBadge.tsx
components/roi-calculator/ui/ConfidenceBar.tsx
components/roi-calculator/ui/ContributionChart.tsx
components/roi-calculator/ui/Explanation.tsx
components/roi-calculator/ui/ExportModal.tsx
components/roi-calculator/ui/LeverCard.tsx
components/roi-calculator/ui/ModuleCard.tsx
components/roi-calculator/ui/ModulePill.tsx
components/roi-calculator/ui/PresetSelector.tsx
components/roi-calculator/ui/ResultCard.tsx
components/roi-calculator/ui/Slider.tsx
components/roi-calculator/ui/SmartField.tsx
components/roi-calculator/sections/CheckInPortalSection.tsx
components/roi-calculator/sections/DirectBookingSection.tsx
components/roi-calculator/sections/DiscoverySection.tsx
components/roi-calculator/sections/GuestExperienceSection.tsx
components/roi-calculator/sections/HotelConfigSection.tsx
components/roi-calculator/sections/PaymentSection.tsx
components/roi-calculator/sections/RMSSection.tsx
components/roi-calculator/sections/RoomAssignmentSection.tsx
components/roi-calculator/sections/SharedVariablesSection.tsx
components/roi-calculator/sections/TotalSavings.tsx
components/roi-calculator/sections/UpsellSection.tsx
components/roi-calculator/ActionDock.tsx
components/roi-calculator/CinematicOverlay.tsx
components/roi-calculator/CinematicSlide.tsx
components/roi-calculator/DataComparisonSection.tsx
components/roi-calculator/ErrorBoundary.tsx
components/roi-calculator/HeroNumber.tsx
components/roi-calculator/ModulePillsBar.tsx
components/roi-calculator/ModuleStoryPanel.tsx
components/roi-calculator/NavigationSidebar.tsx
components/roi-calculator/PDFTemplate.tsx
components/roi-calculator/PropertyContextLine.tsx
components/roi-calculator/PropertyEditPopover.tsx
components/roi-calculator/ProspectIntake.tsx
components/roi-calculator/StickyROIBar.tsx
components/roi-calculator/WaterfallChart.tsx
components/roi-calculator/ROIStage.tsx
app/roi-calculator/page.tsx
tests/lib/roi-calculator/calculations.test.ts
tests/lib/roi-calculator/confidenceScoring.test.ts
```

**Modify:**
```
package.json                   — add html2canvas, jspdf, lucide-react
next.config.js                 — add lucide-react to optimizePackageImports
app/globals.css                — merge ROI Calculator CSS utilities
app/navbar.tsx                 — add Tools section with ROI Calculator link
```

---

## Chunk 1: Foundation — Dependencies, CSS, Types, Data, Translations

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`
- Modify: `next.config.js`

- [ ] **Step 1: Install packages**

```bash
cd /Users/charlie.delamare/projects/mews-free-trial
npm install html2canvas jspdf lucide-react
```

Expected: packages added to `node_modules/` and `package.json` dependencies updated.

- [ ] **Step 2: Add lucide-react to optimizePackageImports in next.config.js**

Open `next.config.js`, find the `optimizePackageImports` array and add `'lucide-react'`:

```js
optimizePackageImports: ['react', 'react-dom', 'date-fns', 'date-fns-tz', 'lucide-react'],
```

- [ ] **Step 3: Verify build still starts**

```bash
npm run dev
```

Expected: dev server starts without errors. Kill with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json next.config.js
git commit -m "feat: add html2canvas, jspdf, lucide-react dependencies"
```

---

### Task 2: Merge CSS utilities into globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Append the following utilities to the end of `app/globals.css`**

```css
/* ── ROI Calculator utilities ──────────────────────────────────────── */

/* Scrollbar */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-thin::-webkit-scrollbar { width: 4px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(28, 29, 36, 0.2);
  border-radius: 99px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(28, 29, 36, 0.35);
}

/* Range slider — Mews indigo thumb
   NOTE: These styles are intentionally global and will apply to all
   <input type="range"> elements in the app. If a future page needs
   different slider styling, scope it with a wrapper class. */
input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  border-radius: 99px;
  outline: none;
  cursor: pointer;
}
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid var(--mews-indigo);
  box-shadow: 0 2px 8px rgba(179,178,251,0.25), 0 0 0 3px rgba(179,178,251,0.08);
  cursor: pointer;
  transition: transform 300ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 200ms ease;
}
input[type='range']::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(179,178,251,0.35), 0 0 0 5px rgba(179,178,251,0.12);
}
input[type='range']::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid var(--mews-indigo);
  box-shadow: 0 2px 8px rgba(179,178,251,0.25), 0 0 0 3px rgba(179,178,251,0.08);
  cursor: pointer;
}
input[type='checkbox'] { accent-color: var(--mews-indigo); }

/* Animation */
.animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
.section-content { animation: sectionReveal 0.3s cubic-bezier(0.4,0,0.2,1) forwards; }
.shimmer-bg {
  background: linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.6) 50%,rgba(255,255,255,0) 100%);
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes sectionReveal {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes shimmer {
  from { background-position: -200% 0; }
  to { background-position: 200% 0; }
}
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }

/* Card */
.roi-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(28,29,36,0.06);
  border: 1px solid rgba(28,29,36,0.08);
  transition: box-shadow 200ms ease, transform 200ms ease;
}
.roi-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(28,29,36,0.10);
}

/* Misc */
.tabular-nums { font-variant-numeric: tabular-nums; }
```

> **Note:** The ROI Calculator source uses `.card` class — rename to `.roi-card` throughout ported components to avoid conflicts with any existing `.card` styles.

- [ ] **Step 2: Verify the dev server still starts**

```bash
npm run dev
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add ROI calculator CSS utilities to globals"
```

---

### Task 3: Port type definitions

**Files:**
- Create: `lib/roi-calculator/types/calculator.ts`
- Create: `lib/roi-calculator/types/confidence.ts`
- Create: `lib/roi-calculator/types/translations.ts`

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p lib/roi-calculator/types
mkdir -p lib/roi-calculator/utils
mkdir -p lib/roi-calculator/data
mkdir -p lib/roi-calculator/translations
```

- [ ] **Step 2: Copy each type file**

Copy the three files verbatim from `ROI-Calculator-V2/src/types/`:
- `calculator.ts` → `lib/roi-calculator/types/calculator.ts`
- `confidence.ts` → `lib/roi-calculator/types/confidence.ts`
- `translations.ts` → `lib/roi-calculator/types/translations.ts`

These files contain only TypeScript interfaces and type aliases — no imports to rewrite, no `'use client'` needed.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors in the new files.

- [ ] **Step 4: Commit**

```bash
git add lib/roi-calculator/types/
git commit -m "feat: port ROI calculator type definitions"
```

---

### Task 4: Port data files and translations

**Files:**
- Create: `lib/roi-calculator/data/countryBenchmarks.ts`
- Create: `lib/roi-calculator/data/usStateBenchmarks.ts`
- Create: `lib/roi-calculator/translations/index.ts`
- Create: `lib/roi-calculator/translations/en.ts` (+ 12 other language files)

- [ ] **Step 1: Copy data files verbatim**

```bash
ROI=../ROI-Calculator-V2
cp $ROI/src/data/countryBenchmarks.ts lib/roi-calculator/data/
cp $ROI/src/data/usStateBenchmarks.ts lib/roi-calculator/data/
```

No imports to rewrite. No `'use client'`.

- [ ] **Step 2: Copy all 13 translation files**

```bash
ROI=../ROI-Calculator-V2
cp $ROI/src/translations/en.ts lib/roi-calculator/translations/
cp $ROI/src/translations/cs.ts lib/roi-calculator/translations/
cp $ROI/src/translations/da.ts lib/roi-calculator/translations/
cp $ROI/src/translations/de.ts lib/roi-calculator/translations/
cp $ROI/src/translations/es.ts lib/roi-calculator/translations/
cp $ROI/src/translations/fi.ts lib/roi-calculator/translations/
cp $ROI/src/translations/fr.ts lib/roi-calculator/translations/
cp $ROI/src/translations/it.ts lib/roi-calculator/translations/
cp $ROI/src/translations/nl.ts lib/roi-calculator/translations/
cp $ROI/src/translations/no.ts lib/roi-calculator/translations/
cp $ROI/src/translations/pt.ts lib/roi-calculator/translations/
cp $ROI/src/translations/sv.ts lib/roi-calculator/translations/
```

- [ ] **Step 3: Copy and rewrite translations/index.ts**

```bash
cp ../ROI-Calculator-V2/src/translations/index.ts lib/roi-calculator/translations/index.ts
```

Each language file is imported with a relative path like `'./en'` — these already work since they're in the same directory. No rewrite needed. Check that the type import at the top references the correct path:

```ts
import type { TranslationDictionary } from '../types/translations';
```

This relative path is correct relative to `lib/roi-calculator/translations/`. ✓

- [ ] **Step 4: Update the type import in each language file if needed**

Each language file (`en.ts`, `fr.ts`, etc.) imports:
```ts
import type { TranslationDictionary } from '../types/translations';
```
This resolves correctly from `lib/roi-calculator/translations/` to `lib/roi-calculator/types/translations`. ✓ No changes needed.

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
git add lib/roi-calculator/data/ lib/roi-calculator/translations/
git commit -m "feat: port ROI calculator data files and translations"
```

---

### Task 5: Port utility functions + write unit tests

**Files:**
- Create: `lib/roi-calculator/utils/timeFormat.ts`
- Create: `lib/roi-calculator/utils/calculations.ts`
- Create: `lib/roi-calculator/utils/confidenceScoring.ts`
- Create: `lib/roi-calculator/utils/hotelDefaults.ts`
- Create: `lib/roi-calculator/utils/leverDescriptors.ts`
- Create: `lib/roi-calculator/utils/priorityInputs.ts`
- Create: `tests/lib/roi-calculator/calculations.test.ts`
- Create: `tests/lib/roi-calculator/confidenceScoring.test.ts`

- [ ] **Step 1: Create test directory and write the failing tests**

```bash
mkdir -p tests/lib/roi-calculator
```

Create `tests/lib/roi-calculator/calculations.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  calcGuestExperience,
  calcPayment,
  calcRMS,
  calcAll,
} from '@/lib/roi-calculator/utils/calculations';
import type { SharedVariables, GuestExperienceInputs, PaymentInputs, RMSInputs } from '@/lib/roi-calculator/types/calculator';

const shared: SharedVariables = {
  numberOfRooms: 100,
  averageDailyRate: 150,
  occupancyRate: 70,
  avgLengthOfStay: 2,
  reservationsPerMonth: 1050,
  monthlyRevenue: 315000,
  staffHourlyWage: 20,
};

const gx: GuestExperienceInputs = {
  reservationsPerMonth: 1050,
  averageStaffWage: 20,
  averageDailyRate: 150,
  checkInTime: 5,
  checkOutTime: 3,
  mewsCheckInTime: 1,
  mewsCheckOutTime: 0.5,
  roomAssignmentTime: 2,
  currentCheckInPercentage: 80,
  onlineCheckInPercentage: 30,
  revenueUplift: 5,
  currentDirectBookingPercent: 40,
  directBookingIncrease: 10,
  averageCommission: 15,
};

describe('calcGuestExperience', () => {
  it('returns positive totalSavings for valid inputs', () => {
    const result = calcGuestExperience(gx, shared);
    expect(result.totalSavings).toBeGreaterThan(0);
    expect(result.totalTime).toBeGreaterThan(0);
  });

  it('calculates checkIn time saved correctly', () => {
    const result = calcGuestExperience(gx, shared);
    // (1050 * 12 * (5 - 1)) / 60 = 840 hours
    expect(result.checkInSavings.annualCheckInTimeSaved).toBe(840);
  });
});

const payment: PaymentInputs = {
  transactionsPerMonth: 1050,
  secondsPerTransaction: 120,
  processingWage: 20,
  chargebackRate: 1,
  mewsChargebackRate: 0.1,
  chargebackVolume: 100000,
  chargebackCostPerMonth: 500,
  reconciliationTimeDaily: 60,
  mewsReconciliationTimeDaily: 5,
  reconciliationWage: 20,
  monthlyRevenue: 315000,
  noShowRate: 5,
  noShowWithoutFee: 50,
  foreignCurrencyPercent: 10,
  multiCurrencyAdoption: 20,
  revenueShare: 1,
};

describe('calcPayment', () => {
  it('returns positive totalSavings for valid inputs', () => {
    const result = calcPayment(payment, shared);
    expect(result.totalSavings).toBeGreaterThan(0);
  });

  it('calculates tokenization time saved correctly', () => {
    const result = calcPayment(payment, shared);
    // (1050 * 120 * 12) / 3600 = 420 hours
    expect(result.tokenizationTimeSaved).toBe(420);
  });
});

const rms: RMSInputs = {
  hotelRevPAR: 105,
  numberOfRooms: 100,
  numberOfRatePlans: 5,
  rateUpdateFrequency: 'Daily',
  rateChangesPerWeek: 7,
  numberOfChannels: 5,
  avgTimeToUpdateRate: 10,
  hasRevenueManager: false,
  hasExistingRMS: false,
  estimatedRevenueUplift: 5,
};

describe('calcRMS', () => {
  it('returns positive annualRevenueGain for valid inputs', () => {
    const result = calcRMS(rms, shared);
    expect(result.annualRevenueGain).toBeGreaterThan(0);
  });
});

describe('calcAll', () => {
  it('sums totalAnnualSavings from all three modules', () => {
    // Call calcAll with correct argument order: (shared, gx, payment, rms)
    const result = calcAll(shared, gx, payment, rms);
    // Independently compute module totals to verify the sum
    const gxSavings = calcGuestExperience(gx, shared).totalSavings;
    const paymentSavings = calcPayment(payment, shared).totalSavings;
    const rmsSavings = calcRMS(rms, shared).totalSavings;
    expect(result.totalAnnualSavings).toBe(gxSavings + paymentSavings + rmsSavings);
  });
});
```

- [ ] **Step 2: Run tests — they should fail**

```bash
npx vitest run tests/lib/roi-calculator/calculations.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/roi-calculator/utils/calculations'`

- [ ] **Step 3: Copy utility files, updating imports**

```bash
ROI=../ROI-Calculator-V2
cp $ROI/src/utils/timeFormat.ts lib/roi-calculator/utils/
cp $ROI/src/utils/calculations.ts lib/roi-calculator/utils/
cp $ROI/src/utils/confidenceScoring.ts lib/roi-calculator/utils/
cp $ROI/src/utils/hotelDefaults.ts lib/roi-calculator/utils/
cp $ROI/src/utils/leverDescriptors.ts lib/roi-calculator/utils/
cp $ROI/src/utils/priorityInputs.ts lib/roi-calculator/utils/
```

Then rewrite imports in each file as follows:

**`timeFormat.ts`** — no imports, copy verbatim.

**`calculations.ts`** — update the type import at the top:
```ts
// Old:
import type { ... } from '../types/calculator';
// New:
import type { ... } from '@/lib/roi-calculator/types/calculator';
```

**`confidenceScoring.ts`** — update imports:
```ts
// Old:
import type { ... } from '../types/confidence';
import type { ... } from '../types/calculator';
import { ... } from './hotelDefaults';
// New:
import type { ... } from '@/lib/roi-calculator/types/confidence';
import type { ... } from '@/lib/roi-calculator/types/calculator';
import { ... } from '@/lib/roi-calculator/utils/hotelDefaults';
```

**`hotelDefaults.ts`** — update imports:
```ts
// Old:
import { countryBenchmarks } from '../data/countryBenchmarks';
import { usStateBenchmarks } from '../data/usStateBenchmarks';
// New:
import { countryBenchmarks } from '@/lib/roi-calculator/data/countryBenchmarks';
import { usStateBenchmarks } from '@/lib/roi-calculator/data/usStateBenchmarks';
```

**`leverDescriptors.ts`** — update imports:
```ts
// Old:
import { formatMinutes } from './timeFormat';
import type { ... } from '../types/calculator';
// New:
import { formatMinutes } from '@/lib/roi-calculator/utils/timeFormat';
import type { ... } from '@/lib/roi-calculator/types/calculator';
```

**`priorityInputs.ts`** — update imports:
```ts
// Old:
import type { ... } from '../types/confidence';
import { ... } from './hotelDefaults';
// New:
import type { ... } from '@/lib/roi-calculator/types/confidence';
import { ... } from '@/lib/roi-calculator/utils/hotelDefaults';
```

- [ ] **Step 4: Run tests — they should pass**

```bash
npx vitest run tests/lib/roi-calculator/calculations.test.ts
```

Expected: PASS — all 5 test cases green.

- [ ] **Step 5: Write confidence scoring tests**

Create `tests/lib/roi-calculator/confidenceScoring.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeConfidenceScore, buildInitialConfidenceMap } from '@/lib/roi-calculator/utils/confidenceScoring';
import type { ConfidenceMap } from '@/lib/roi-calculator/types/confidence';

describe('computeConfidenceScore', () => {
  it('returns directional score when map is empty', () => {
    const result = computeConfidenceScore({} as ConfidenceMap);
    expect(result.level).toBe('directional');
    expect(result.percentage).toBeGreaterThanOrEqual(0);
  });

  it('returns non-negative percentage', () => {
    const result = computeConfidenceScore({} as ConfidenceMap);
    expect(result.percentage).toBeGreaterThanOrEqual(0);
    expect(result.percentage).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 6: Run all tests**

```bash
npx vitest run tests/lib/roi-calculator/
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add lib/roi-calculator/utils/ tests/lib/roi-calculator/
git commit -m "feat: port ROI calculator utilities with unit tests"
```

---

## Chunk 2: Hooks

### Task 6: Port useROICalculator

**Files:**
- Create: `hooks/useROICalculator.ts`

- [ ] **Step 1: Copy `ROI-Calculator-V2/src/hooks/useROICalculator.ts` to `hooks/useROICalculator.ts`**

- [ ] **Step 2: Rewrite all imports to `@/` paths**

```ts
// Old → New
'../types/calculator'         → '@/lib/roi-calculator/types/calculator'
'../utils/calculations'       → '@/lib/roi-calculator/utils/calculations'
'../utils/hotelDefaults'      → '@/lib/roi-calculator/utils/hotelDefaults'
'../utils/leverDescriptors'   → '@/lib/roi-calculator/utils/leverDescriptors'
```

No `'use client'` needed — hooks are imported by client components which already have the directive.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -E "hooks/useROICalculator" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add hooks/useROICalculator.ts
git commit -m "feat: port useROICalculator hook"
```

---

### Task 7: Port useConfidence

**Files:**
- Create: `hooks/useConfidence.ts`

- [ ] **Step 1: Copy `ROI-Calculator-V2/src/hooks/useConfidence.ts` to `hooks/useConfidence.ts`**

- [ ] **Step 2: Rewrite all imports**

```ts
// Old → New
'../types/confidence'           → '@/lib/roi-calculator/types/confidence'
'../types/calculator'           → '@/lib/roi-calculator/types/calculator'
'../utils/confidenceScoring'    → '@/lib/roi-calculator/utils/confidenceScoring'
'../utils/priorityInputs'       → '@/lib/roi-calculator/utils/priorityInputs'
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -E "hooks/useConfidence" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add hooks/useConfidence.ts
git commit -m "feat: port useConfidence hook"
```

---

## Chunk 3: UI Primitive Components

For each component in this chunk: (1) add `'use client'` as the first line, (2) rewrite imports to `@/` paths, (3) apply theming swaps from the reference table at the top of this doc.

### Task 8: Port UI primitives (Slider, SmartField, CollapsibleSection, Explanation)

**Files:**
- Create: `components/roi-calculator/ui/Slider.tsx`
- Create: `components/roi-calculator/ui/SmartField.tsx`
- Create: `components/roi-calculator/ui/CollapsibleSection.tsx`
- Create: `components/roi-calculator/ui/Explanation.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p components/roi-calculator/ui
mkdir -p components/roi-calculator/sections
```

- [ ] **Step 2: Port each file**

For each file, copy from `ROI-Calculator-V2/src/components/ui/[name].tsx`, then:
1. Add `'use client';` as line 1
2. Rewrite imports (see pattern below)
3. Apply theming swaps

Import rewrite pattern for ui components:
```ts
// Old → New
'../../types/calculator'   → '@/lib/roi-calculator/types/calculator'
'../../types/confidence'   → '@/lib/roi-calculator/types/confidence'
'../../utils/...'          → '@/lib/roi-calculator/utils/...'
'../ui/...'                → '@/components/roi-calculator/ui/...'
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep -E "components/roi-calculator/ui/(Slider|SmartField|CollapsibleSection|Explanation)" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/roi-calculator/ui/
git commit -m "feat: port ROI calculator base UI primitives"
```

---

### Task 9: Port remaining UI components

**Files:**
- Create: `components/roi-calculator/ui/ConfidenceBadge.tsx`
- Create: `components/roi-calculator/ui/ConfidenceBar.tsx`
- Create: `components/roi-calculator/ui/ContributionChart.tsx`
- Create: `components/roi-calculator/ui/ExportModal.tsx`
- Create: `components/roi-calculator/ui/LeverCard.tsx`
- Create: `components/roi-calculator/ui/ModuleCard.tsx`
- Create: `components/roi-calculator/ui/ModulePill.tsx`
- Create: `components/roi-calculator/ui/PresetSelector.tsx`
- Create: `components/roi-calculator/ui/ResultCard.tsx`

- [ ] **Step 1: Port each file** (same process as Task 8: `'use client'`, rewrite imports, apply theming)

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "components/roi-calculator/ui" | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/roi-calculator/ui/
git commit -m "feat: port remaining ROI calculator UI components"
```

---

## Chunk 4: Section Components

### Task 10: Port all section components

**Files:**
- Create: `components/roi-calculator/sections/SharedVariablesSection.tsx`
- Create: `components/roi-calculator/sections/HotelConfigSection.tsx`
- Create: `components/roi-calculator/sections/GuestExperienceSection.tsx`
- Create: `components/roi-calculator/sections/CheckInPortalSection.tsx`
- Create: `components/roi-calculator/sections/RoomAssignmentSection.tsx`
- Create: `components/roi-calculator/sections/DirectBookingSection.tsx`
- Create: `components/roi-calculator/sections/UpsellSection.tsx`
- Create: `components/roi-calculator/sections/PaymentSection.tsx`
- Create: `components/roi-calculator/sections/RMSSection.tsx`
- Create: `components/roi-calculator/sections/TotalSavings.tsx`
- Create: `components/roi-calculator/sections/DiscoverySection.tsx`

For each file, copy from `ROI-Calculator-V2/src/components/sections/[name].tsx`, then:
1. Add `'use client';` as line 1
2. Rewrite imports

Import rewrite pattern for section components:
```ts
// Old → New
'../../types/calculator'    → '@/lib/roi-calculator/types/calculator'
'../../utils/...'           → '@/lib/roi-calculator/utils/...'
'../ui/[Name]'              → '@/components/roi-calculator/ui/[Name]'
```

3. Apply theming swaps from the reference table.

- [ ] **Step 1: Port all 11 section files** following the pattern above.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "components/roi-calculator/sections" | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/roi-calculator/sections/
git commit -m "feat: port ROI calculator section components"
```

---

## Chunk 5: Core Components, Page & Navbar

### Task 11: Port supporting top-level components

Port these components from `ROI-Calculator-V2/src/components/` (add `'use client'`, rewrite imports, apply theming):

**Files:**
- Create: `components/roi-calculator/ErrorBoundary.tsx`
- Create: `components/roi-calculator/PropertyContextLine.tsx`
- Create: `components/roi-calculator/HeroNumber.tsx`
- Create: `components/roi-calculator/ModulePillsBar.tsx`
- Create: `components/roi-calculator/WaterfallChart.tsx`
- Create: `components/roi-calculator/StickyROIBar.tsx`
- Create: `components/roi-calculator/NavigationSidebar.tsx`
- Create: `components/roi-calculator/DataComparisonSection.tsx`
- Create: `components/roi-calculator/PropertyEditPopover.tsx`
- Create: `components/roi-calculator/ActionDock.tsx`
- Create: `components/roi-calculator/CinematicSlide.tsx`
- Create: `components/roi-calculator/CinematicOverlay.tsx`
- Create: `components/roi-calculator/PDFTemplate.tsx`
- Create: `components/roi-calculator/ModuleStoryPanel.tsx`
- Create: `components/roi-calculator/ProspectIntake.tsx`

Import rewrite pattern for top-level components:
```ts
// Old → New
'../types/calculator'        → '@/lib/roi-calculator/types/calculator'
'../types/confidence'        → '@/lib/roi-calculator/types/confidence'
'../utils/...'               → '@/lib/roi-calculator/utils/...'
'../hooks/useROICalculator'  → '@/hooks/useROICalculator'
'../hooks/useConfidence'     → '@/hooks/useConfidence'
'../translations'            → '@/lib/roi-calculator/translations'
'./ui/[Name]'                → '@/components/roi-calculator/ui/[Name]'
'./sections/[Name]'          → '@/components/roi-calculator/sections/[Name]'
'./[Name]'                   → '@/components/roi-calculator/[Name]'
```

- [ ] **Step 1: Port all 15 files** following the pattern above with `'use client'`, import rewrites, and theming.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "components/roi-calculator/" | grep -v "sections\|/ui/" | head -30
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/roi-calculator/
git commit -m "feat: port ROI calculator supporting components"
```

---

### Task 12: Port ROIStage (main orchestrator) with SSR-safe PDF exports

**Files:**
- Create: `components/roi-calculator/ROIStage.tsx`

This is the most complex file. Follow the same pattern as other components, with one critical difference: replace the static `html2canvas` and `jspdf` imports with dynamic imports inside the PDF export handler.

- [ ] **Step 1: Copy `ROI-Calculator-V2/src/components/ROIStage.tsx` to `components/roi-calculator/ROIStage.tsx`**

- [ ] **Step 2: Add `'use client';` as line 1**

- [ ] **Step 3: Remove the static imports at the top of the file**

Delete these lines:
```ts
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
```

- [ ] **Step 4: Add dynamic imports inside `handleExportPDF`**

Find the `handleExportPDF` function. At the very start of the `try` block, add:

```ts
const html2canvas = (await import('html2canvas')).default;
const { jsPDF } = await import('jspdf');
```

- [ ] **Step 5: Rewrite all remaining imports**

```ts
// Old → New
'../hooks/useROICalculator'   → '@/hooks/useROICalculator'
'../hooks/useConfidence'      → '@/hooks/useConfidence'
'../utils/confidenceScoring'  → '@/lib/roi-calculator/utils/confidenceScoring'
'../utils/hotelDefaults'      → '@/lib/roi-calculator/utils/hotelDefaults'
'../translations'             → '@/lib/roi-calculator/translations'
'../types/calculator'         → '@/lib/roi-calculator/types/calculator'
'../types/confidence'         → '@/lib/roi-calculator/types/confidence'
'./PropertyContextLine'       → '@/components/roi-calculator/PropertyContextLine'
'./HeroNumber'                → '@/components/roi-calculator/HeroNumber'
'./ModulePillsBar'            → '@/components/roi-calculator/ModulePillsBar'
'./WaterfallChart'            → '@/components/roi-calculator/WaterfallChart'
'./ModuleStoryPanel'          → '@/components/roi-calculator/ModuleStoryPanel'
'./ActionDock'                → '@/components/roi-calculator/ActionDock'
'./CinematicOverlay'          → '@/components/roi-calculator/CinematicOverlay'
'./ProspectIntake'            → '@/components/roi-calculator/ProspectIntake'
'./DataComparisonSection'     → '@/components/roi-calculator/DataComparisonSection'
'./sections/DiscoverySection' → '@/components/roi-calculator/sections/DiscoverySection'
'./ui/ExportModal'            → '@/components/roi-calculator/ui/ExportModal'
'./PDFTemplate'               → '@/components/roi-calculator/PDFTemplate'
```

- [ ] **Step 6: Apply theming** — `hero-gradient` → remove (page wrapper handles background), module colors per reference table.

- [ ] **Step 7: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "ROIStage" | head -20
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add components/roi-calculator/ROIStage.tsx
git commit -m "feat: port ROIStage with SSR-safe dynamic pdf imports"
```

---

### Task 13: Create the page and wire up the navbar

**Files:**
- Create: `app/roi-calculator/page.tsx`
- Modify: `app/navbar.tsx`

- [ ] **Step 1: Create `app/roi-calculator/page.tsx`**

```tsx
'use client';

import ROIStage from '@/components/roi-calculator/ROIStage';

export default function ROICalculatorPage() {
  return (
    <div className="min-h-screen bg-mews-linen">
      <ROIStage />
    </div>
  );
}
```

- [ ] **Step 2: Update `app/navbar.tsx`**

Open `app/navbar.tsx`. Find the `operationLinks` array. After it, add a `toolLinks` array:

```ts
const toolLinks = [
  { href: '/roi-calculator', label: 'ROI Calculator' },
];
```

In the sidebar nav JSX, find the Operations section block and add a Tools section after it:

```tsx
<div className="mt-4">
  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-1">Tools</p>
  <div className="space-y-1">
    {toolLinks.map(({ href, label }) => (
      <Link key={href} href={href} onClick={close} className={linkClasses(href)}>
        {label}
      </Link>
    ))}
  </div>
</div>
```

- [ ] **Step 3: Run a full typecheck**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Start dev server and manually verify**

```bash
npm run dev
```

Open `http://localhost:3000/roi-calculator` in a browser. Verify:
- [ ] Page renders without crashing
- [ ] Mews linen background is applied (no dark hero gradient)
- [ ] Country/hotel type selectors work
- [ ] Module pills display and toggle
- [ ] Waterfall chart renders
- [ ] "ROI Calculator" link appears in the navbar sidebar under a "Tools" heading
- [ ] Cinematic presentation mode opens
- [ ] PDF export modal opens and a PDF can be generated

- [ ] **Step 5: Commit**

```bash
git add app/roi-calculator/ app/navbar.tsx
git commit -m "feat: add /roi-calculator page and navbar Tools section"
```

---

### Task 14: Final verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: all existing tests pass, new calculation tests pass.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: build completes without errors. Any `'use client'` boundary warnings are acceptable; errors are not.

- [ ] **Step 3: Fix any build errors** — if `html2canvas` or `jspdf` cause build errors, verify the dynamic import pattern in `ROIStage.tsx` is correct (imports are inside an `async` function body, not at module top level).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete ROI calculator port into mews-free-trial"
```
