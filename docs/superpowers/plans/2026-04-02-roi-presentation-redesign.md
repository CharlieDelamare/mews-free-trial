# ROI Presentation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the cinematic presentation mode (brand colours, fullscreen, bigger title hero), add a housekeeping narrative fix, and add an executive summary PDF export option. Module slides keep the full per-lever calculation breakdown — the numbers are the point.

**Architecture:** Extract `getModuleNarrative` into a shared utility (`narratives.ts`) — this fixes the missing housekeeping case and exports an HTML variant used by `ExecSummaryPDFTemplate`. `CinematicSlide` gets title slide and summary colour fixes only; module slides are unchanged. `CinematicOverlay` gets Fullscreen API + width fix. `ExportModal` gains a type toggle; `ROIStage` dispatches to either the existing presentation export or a new `handleExportExecSummary`.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, html2canvas + jsPDF (already used), Lucide React, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/roi-calculator/utils/narratives.ts` | **Create** | Plain-text and HTML narrative generators for all 4 modules |
| `components/roi-calculator/CinematicSlide.tsx` | **Modify** | Title slide redesign, summary colour fixes; import `getModuleNarrative` from utility (fixes housekeeping) |
| `components/roi-calculator/CinematicOverlay.tsx` | **Modify** | Fullscreen API, remove max-w-3xl cap, active dot colour |
| `components/roi-calculator/ExecSummaryPDFTemplate.tsx` | **Create** | Off-screen A4 portrait PDF template |
| `components/roi-calculator/ui/ExportModal.tsx` | **Modify** | Add presentation/summary toggle, update `onExport` prop signature |
| `components/roi-calculator/ROIStage.tsx` | **Modify** | Add `handleExportExecSummary`, wire updated `onExport` |
| `tests/lib/roi-calculator/narratives.test.ts` | **Create** | Unit tests for the narratives utility |

---

## Task 1: Create narratives.ts utility

Extract `getModuleNarrative` from `CinematicSlide.tsx`, add the missing `housekeeping` case, and add `getModuleNarrativeHTML` which builds HTML inline (no regex post-processing).

**Files:**
- Create: `lib/roi-calculator/utils/narratives.ts`
- Create: `tests/lib/roi-calculator/narratives.test.ts`

- [ ] **Step 1: Create the narratives utility**

```typescript
// lib/roi-calculator/utils/narratives.ts

import type { LeverDescriptor, ModuleKey } from '@/lib/roi-calculator/types/calculator';
import type { TranslationDictionary } from '@/lib/roi-calculator/types/translations';

function formatVal(value: number, cs: string): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${cs}${(value / 1_000_000).toFixed(1)}M`;
  return `${cs}${Math.round(value).toLocaleString()}`;
}

function buildPlainHelpers(levers: LeverDescriptor[], cs: string) {
  const active = (key: string) => levers.some((l) => l.key === key && l.resultValue > 0);
  const val = (key: string) => {
    const l = levers.find((lv) => lv.key === key);
    if (!l || l.resultValue <= 0) return '';
    return formatVal(l.resultValue, cs);
  };
  return { active, val };
}

/** Plain text — used by CinematicSlide */
export function getModuleNarrative(
  moduleKey: ModuleKey,
  levers: LeverDescriptor[],
  currencySymbol: string,
  t: TranslationDictionary,
): string {
  const { active, val } = buildPlainHelpers(levers, currencySymbol);
  if (moduleKey === 'guestExperience') return t.narratives.guestExperienceNarrative({ active, val });
  if (moduleKey === 'payment') return t.narratives.paymentNarrative({ active, val });
  if (moduleKey === 'rms') return t.narratives.rmsNarrative({ active, val });
  if (moduleKey === 'housekeeping') return t.narratives.housekeepingNarrative({ active, val });
  return '';
}

/**
 * HTML string with pink <span> highlights — used by ExecSummaryPDFTemplate.
 * Generates HTML directly in template literals; does NOT post-process the plain
 * text string. This avoids currency symbol edge cases (£, $, symbol-after-number
 * locales). No user-controlled input enters these strings.
 */
export function getModuleNarrativeHTML(
  moduleKey: ModuleKey,
  levers: LeverDescriptor[],
  currencySymbol: string,
  t: TranslationDictionary,
): string {
  const active = (key: string) => levers.some((l) => l.key === key && l.resultValue > 0);
  const valHTML = (key: string): string => {
    const l = levers.find((lv) => lv.key === key);
    if (!l || l.resultValue <= 0) return '';
    const formatted = formatVal(l.resultValue, currencySymbol);
    return `<span style="color:#FF83DA;font-weight:700">${formatted}</span>`;
  };

  if (moduleKey === 'guestExperience') {
    const parts: string[] = [];
    parts.push('Mews transforms your front desk from a bottleneck into a seamless guest touchpoint.');
    if (active('checkIn')) {
      parts.push('Digital check-in and check-out free your team to focus on hospitality instead of paperwork.');
    }
    if (active('roomAssignment')) {
      parts.push('Automated room assignment eliminates a daily time sink for your front-desk staff.');
    }
    if (active('upsell')) {
      parts.push(`The guest portal creates ${valHTML('upsell')} in new revenue through personalized upsell offers during the booking journey.`);
    }
    if (active('directBooking')) {
      parts.push(`By driving more direct bookings, you reduce OTA dependency and keep ${valHTML('directBooking')} more per year.`);
    }
    return parts.join(' ');
  }

  if (moduleKey === 'payment') {
    const parts: string[] = [];
    parts.push('Mews Payments eliminates manual payment handling — your finance team spends less time on admin and more on strategic decisions.');
    if (active('tokenization')) {
      parts.push('Secure tokenization automates transaction processing, saving your team hours of repetitive work.');
    }
    if (active('reconciliation')) {
      parts.push(`Automated reconciliation replaces manual matching, recovering ${valHTML('reconciliation')} in labor costs.`);
    }
    if (active('chargeback')) {
      parts.push(`Built-in fraud prevention significantly reduces chargebacks, saving ${valHTML('chargeback')} annually.`);
    }
    if (active('noShow')) {
      parts.push(`Automatic card-on-file guarantees capture ${valHTML('noShow')} in no-show fees you'd otherwise write off.`);
    }
    if (active('multiCurrency')) {
      parts.push('Multi-currency support lets international guests pay in their own currency, removing friction and unlocking incremental revenue.');
    }
    return parts.join(' ');
  }

  if (moduleKey === 'rms') {
    const parts: string[] = [];
    if (active('revenueUplift')) {
      parts.push(`Mews RMS replaces guesswork with AI-powered dynamic pricing that responds to market conditions in real time — a 24/7 revenue optimization engine delivering ${valHTML('revenueUplift')} in additional RevPAR.`);
    }
    if (active('rateAutomation')) {
      parts.push(`Automated distribution across all your rate plans and channels eliminates hours of manual updates, saving ${valHTML('rateAutomation')} in labor costs and letting your team focus on strategy instead of spreadsheets.`);
    }
    return parts.join(' ');
  }

  if (moduleKey === 'housekeeping') {
    const parts: string[] = [];
    parts.push('Mews Housekeeping streamlines every aspect of room operations — from assignment to cleaning updates to maintenance coordination.');
    if (active('hkRoomAssignment')) {
      parts.push(`Automated room assignment eliminates the daily briefing bottleneck, saving ${valHTML('hkRoomAssignment')} in housekeeping labor each year.`);
    }
    if (active('cleaningStatusUpdates')) {
      parts.push('Real-time cleaning status updates replace phone calls and paper checklists, keeping the whole team in sync instantly.');
    }
    if (active('maintenanceCommunication')) {
      parts.push('Digital maintenance reporting means repairs are logged and dispatched in seconds, not minutes.');
    }
    if (active('amenitiesReduction')) {
      parts.push(`Smart amenity management reduces unnecessary replenishment, saving ${valHTML('amenitiesReduction')} in supply costs.`);
    }
    if (active('paperElimination')) {
      parts.push('Going fully digital eliminates paper-based processes — better for your team and better for the planet.');
    }
    return parts.join(' ');
  }

  return '';
}
```

- [ ] **Step 2: Write unit tests for the narratives utility**

```typescript
// tests/lib/roi-calculator/narratives.test.ts

import { describe, it, expect } from 'vitest';
import { getModuleNarrative, getModuleNarrativeHTML } from '@/lib/roi-calculator/utils/narratives';
import { getTranslations } from '@/lib/roi-calculator/translations';
import type { LeverDescriptor } from '@/lib/roi-calculator/types/calculator';

const t = getTranslations('en');

const gxLevers: LeverDescriptor[] = [
  { key: 'upsell', label: 'Upsell', resultValue: 42000, resultType: 'revenueUplift', summary: '' },
  { key: 'directBooking', label: 'Direct', resultValue: 23000, resultType: 'revenueUplift', summary: '' },
  { key: 'checkIn', label: 'Check-in', resultValue: 0, resultType: 'costSaving', summary: '' },
];

describe('getModuleNarrative', () => {
  it('returns a non-empty string for guestExperience with active levers', () => {
    const result = getModuleNarrative('guestExperience', gxLevers, '€', t);
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the formatted upsell value in the narrative', () => {
    const result = getModuleNarrative('guestExperience', gxLevers, '€', t);
    expect(result).toContain('€42,000');
  });

  it('does not mention checkIn when checkIn resultValue is 0', () => {
    const result = getModuleNarrative('guestExperience', gxLevers, '€', t);
    // checkIn has resultValue 0 so its conditional branch should be skipped
    expect(result).not.toContain('check-in and check-out free');
  });

  it('returns a non-empty string for housekeeping', () => {
    const hkLevers: LeverDescriptor[] = [
      { key: 'hkRoomAssignment', label: 'Room assign', resultValue: 15000, resultType: 'costSaving', summary: '' },
      { key: 'amenitiesReduction', label: 'Amenities', resultValue: 0, resultType: 'costSaving', summary: '' },
    ];
    const result = getModuleNarrative('housekeeping', hkLevers, '€', t);
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('€15,000');
  });

  it('returns empty string for unknown module key', () => {
    // @ts-expect-error intentionally invalid key
    const result = getModuleNarrative('unknown', gxLevers, '€', t);
    expect(result).toBe('');
  });
});

describe('getModuleNarrativeHTML', () => {
  it('wraps monetary values in pink span tags', () => {
    const result = getModuleNarrativeHTML('guestExperience', gxLevers, '€', t);
    expect(result).toContain('<span style="color:#FF83DA;font-weight:700">€42,000</span>');
  });

  it('does not wrap non-monetary text in span tags', () => {
    const result = getModuleNarrativeHTML('guestExperience', gxLevers, '€', t);
    // Opening text should be plain
    expect(result).toContain('Mews transforms your front desk');
    // The plain text portion should not be wrapped
    expect(result.startsWith('<span')).toBe(false);
  });

  it('handles housekeeping module', () => {
    const hkLevers: LeverDescriptor[] = [
      { key: 'hkRoomAssignment', label: 'Room assign', resultValue: 8000, resultType: 'costSaving', summary: '' },
    ];
    const result = getModuleNarrativeHTML('housekeeping', hkLevers, '£', t);
    expect(result).toContain('<span style="color:#FF83DA;font-weight:700">£8,000</span>');
  });

  it('plain and HTML variants contain the same logical sentences', () => {
    // Strip HTML tags from the HTML variant; it should contain all the same text
    const htmlResult = getModuleNarrativeHTML('guestExperience', gxLevers, '€', t);
    const stripped = htmlResult.replace(/<[^>]+>/g, '');
    const plainResult = getModuleNarrative('guestExperience', gxLevers, '€', t);
    // Both should open with the same introductory sentence
    expect(stripped.startsWith('Mews transforms')).toBe(true);
    expect(plainResult.startsWith('Mews transforms')).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
npm run test -- tests/lib/roi-calculator/narratives.test.ts
```

Expected: all 8 tests pass.

- [ ] **Step 4: Commit**

```bash
git add lib/roi-calculator/utils/narratives.ts tests/lib/roi-calculator/narratives.test.ts
git commit -m "feat(roi-calc): extract getModuleNarrative utility + HTML variant + housekeeping case"
```

---

## Task 2: Update CinematicSlide.tsx

Two changes: (1) title slide redesign with brand KPI colours and Unicode icon pills, (2) summary slide brand colour tokens. Module slides are **unchanged** — the per-lever calculation breakdown stays exactly as-is. The only module slide touch is swapping the local `getModuleNarrative` definition for the utility import (which fixes the missing housekeeping case).

**Files:**
- Modify: `components/roi-calculator/CinematicSlide.tsx`

- [ ] **Step 1: Replace the title slide JSX**

Open `components/roi-calculator/CinematicSlide.tsx`. Replace the entire `if (props.type === 'title')` block (lines 72–137) and update the import at the top.

First, update the imports — remove `TrendingDown, TrendingUp, Clock` (still needed for the summary slide, so keep them), and add the narratives import:

```typescript
// At the top of CinematicSlide.tsx, replace the existing imports with:
'use client';

import { TrendingDown, TrendingUp, Clock } from 'lucide-react';
import { getModuleNarrative } from '@/lib/roi-calculator/utils/narratives';
import type { LeverDescriptor, ModuleKey, FilteredResults } from '@/lib/roi-calculator/types/calculator';
import type { TranslationDictionary } from '@/lib/roi-calculator/types/translations';
```

Then delete the `getModuleNarrative` function definition (lines 46–69 in the original) — it's now in the utility.

Replace the title slide block:

```tsx
  if (props.type === 'title') {
    const { t } = props;
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-16 animate-fade-in w-full">
        {/* Eyebrow / property context */}
        <p
          className="text-xs font-medium uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {props.propertyContext}
        </p>

        {/* Hotel name */}
        {props.title && (
          <h1 className="text-xl font-semibold text-white mb-6 tracking-tight">{props.title}</h1>
        )}

        {/* Hero number */}
        <div
          className="font-extrabold tracking-tight leading-none text-white"
          style={{ fontSize: 'clamp(5rem, 12vw, 8rem)' }}
        >
          {formatBig(props.totalSavings, props.currencySymbol)}
        </div>

        {/* Subtext */}
        <p
          className="mt-4 text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {t.labels.totalAnnualImpact}
        </p>

        {/* Divider */}
        <div
          className="my-8 w-24"
          style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }}
        />

        {/* KPI row */}
        <div className="flex gap-12 justify-center">
          {/* Cost savings */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
              style={{ background: 'color-mix(in srgb, var(--mews-light-green) 12%, transparent)' }}
            >
              ↓
            </div>
            <span
              className="text-2xl font-extrabold tracking-tight tabular-nums"
              style={{ color: 'var(--mews-light-green)' }}
            >
              {formatBig(props.costSavings, props.currencySymbol)}
            </span>
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {t.labels.costSavings}
            </span>
          </div>

          {/* Revenue uplift */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
              style={{ background: 'color-mix(in srgb, var(--mews-primary-pink) 12%, transparent)' }}
            >
              ↑
            </div>
            <span
              className="text-2xl font-extrabold tracking-tight tabular-nums"
              style={{ color: 'var(--mews-primary-pink)' }}
            >
              {formatBig(props.revenueUplift, props.currencySymbol)}
            </span>
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {t.labels.revenueUplift}
            </span>
          </div>

          {/* Hours reclaimed */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
              style={{ background: 'color-mix(in srgb, var(--mews-orange) 12%, transparent)' }}
            >
              ◷
            </div>
            <span
              className="text-2xl font-extrabold tracking-tight tabular-nums"
              style={{ color: 'var(--mews-orange)' }}
            >
              {Math.round(props.totalTime).toLocaleString()}
            </span>
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {t.labels.hoursReclaimed}
            </span>
          </div>
        </div>
      </div>
    );
  }
```

- [ ] **Step 2: Wire module slide to use the utility import (fixes housekeeping narrative)**

The module slide JSX is **not changed**. The only edit is deleting the local `getModuleNarrative` function (lines 46–69 in the original file) since it is now provided by the utility import added in Step 1. No other changes to the module slide block.

Confirm the module slide block still calls:
```tsx
const narrative = getModuleNarrative(props.moduleKey, props.levers, props.currencySymbol, t);
```
…and still renders the full lever card grid below the narrative paragraph. If anything got accidentally removed, restore it from git:
```bash
git diff components/roi-calculator/CinematicSlide.tsx
```

- [ ] **Step 3: Apply brand colour fixes to the summary slide**

In the summary slide (the final `return` block), replace the three colour-specific Tailwind classes and icon colours:

1. Find `text-emerald-400` (2 occurrences — icon and value) → replace with `style={{ color: 'var(--mews-light-green)' }}` (remove the Tailwind class, add inline style).
2. Find `text-blue-400` (2 occurrences) → replace with `style={{ color: 'var(--mews-primary-pink)' }}`.
3. Find `text-violet-400` (3 occurrences — icon, value, and the hours bar label `text-violet-300`) → replace with `style={{ color: 'var(--mews-orange)' }}`.

The specific lines to change in the summary slide left column (lines ~226–241 in original):

```tsx
          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" style={{ color: 'var(--mews-light-green)' }} />
              <span className="text-base font-bold tabular-nums" style={{ color: 'var(--mews-light-green)' }}>{formatBig(props.filteredResults.costSavings, props.currencySymbol)}</span>
              <span className="text-xs text-gray-500">{t.labels.costSavings}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--mews-primary-pink)' }} />
              <span className="text-base font-bold tabular-nums" style={{ color: 'var(--mews-primary-pink)' }}>{formatBig(props.filteredResults.revenueUplift, props.currencySymbol)}</span>
              <span className="text-xs text-gray-500">{t.labels.revenueUplift}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: 'var(--mews-orange)' }} />
              <span className="text-base font-bold tabular-nums" style={{ color: 'var(--mews-orange)' }}>{Math.round(props.filteredResults.totalTime).toLocaleString()}</span>
              <span className="text-xs text-gray-500">{t.labels.hoursReclaimed}</span>
            </div>
          </div>
```

Also replace `text-violet-300` in the waterfall hours bar label with `style={{ color: 'var(--mews-orange)' }}` (remove the Tailwind class).

- [ ] **Step 4: Verify the app compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: exits 0 with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add components/roi-calculator/CinematicSlide.tsx
git commit -m "feat(roi-calc): redesign cinematic title slide — brand colours, fix housekeeping narrative, summary colour tokens"
```

---

## Task 3: Update CinematicOverlay.tsx

Add Fullscreen API support, remove the `max-w-3xl` content cap, and change the active dot colour to `var(--mews-primary-pink)`.

**Files:**
- Modify: `components/roi-calculator/CinematicOverlay.tsx`

- [ ] **Step 1: Add fullscreen state, toggle handler, and sync effect**

At the top of the file, add `useState` to the React import. Then add inside the component (after the existing `useCallback` declarations):

```tsx
  // Fullscreen state — kept in sync via the fullscreenchange DOM event
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Browser blocked fullscreen (e.g., permissions policy) — overlay continues working normally
    }
  }, []);
```

- [ ] **Step 2: Update the `exit` callback to clean up fullscreen**

Replace the existing `exit` declaration:

```tsx
  // OLD:
  const exit = useCallback(() => dispatch({ type: 'EXIT_CINEMATIC' }), [dispatch]);

  // NEW:
  const exit = useCallback(() => {
    // Exit fullscreen before closing the overlay so the browser doesn't leave
    // a stale fullscreen state. No-op if we're not currently fullscreen.
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    dispatch({ type: 'EXIT_CINEMATIC' });
  }, [dispatch]);
```

- [ ] **Step 3: Add the fullscreen toggle button to the top bar**

Add `Maximize2` and `Minimize2` to the lucide-react import:

```tsx
import { X, ChevronLeft, ChevronRight, Play, Pause, Maximize2, Minimize2 } from 'lucide-react';
```

In the top bar JSX, add the fullscreen button **before** the close button:

```tsx
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-pressed={isFullscreen}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={exit}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
```

- [ ] **Step 4: Remove the max-w-3xl content cap**

Find the slide content wrapper (line ~145):

```tsx
      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center max-w-3xl mx-auto w-full">
```

Remove `max-w-3xl` and add `px-0` (the slides themselves handle their own padding):

```tsx
      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center w-full">
```

- [ ] **Step 5: Change active dot colour**

Find the dot `background` in the dots mapping (line ~177):

```tsx
                background: i === slideIndex ? 'var(--mews-indigo)' : 'color-mix(in srgb, var(--mews-white) 20%, transparent)',
```

Change `var(--mews-indigo)` to `var(--mews-primary-pink)`:

```tsx
                background: i === slideIndex ? 'var(--mews-primary-pink)' : 'color-mix(in srgb, var(--mews-white) 20%, transparent)',
```

- [ ] **Step 6: Verify the app compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add components/roi-calculator/CinematicOverlay.tsx
git commit -m "feat(roi-calc): add Fullscreen API, remove max-w-3xl cap, fix active dot colour"
```

---

## Task 4: Create ExecSummaryPDFTemplate.tsx

New off-screen component rendered as A4 portrait (794 × 1123px). Never shown to the user — PDF-rendering infrastructure only. Uses `getModuleNarrativeHTML` for narrative paragraphs.

**Files:**
- Create: `components/roi-calculator/ExecSummaryPDFTemplate.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/roi-calculator/ExecSummaryPDFTemplate.tsx
// PDF-only rendering component — never shown in the UI.
// Rendered off-screen at 794px width; captured by html2canvas at scale:2.

'use client';

import { getModuleNarrativeHTML } from '@/lib/roi-calculator/utils/narratives';
import type { LeverDescriptor, ModuleKey } from '@/lib/roi-calculator/types/calculator';
import type { TranslationDictionary } from '@/lib/roi-calculator/types/translations';

interface ExecSummaryPDFTemplateProps {
  title: string;
  propertyContext: string;
  date: string;
  totalSavings: number;
  costSavings: number;
  revenueUplift: number;
  totalTime: number;
  currencySymbol: string;
  enabledModuleKeys: ModuleKey[];
  leverDescriptors: Record<ModuleKey, LeverDescriptor[]>;
  t: TranslationDictionary;
}

function fmt(value: number, cs: string): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${cs}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `${cs}${Math.round(value / 1_000)}k`;
  return `${cs}${Math.round(value).toLocaleString()}`;
}

export default function ExecSummaryPDFTemplate({
  title,
  propertyContext,
  date,
  totalSavings,
  costSavings,
  revenueUplift,
  totalTime,
  currencySymbol,
  enabledModuleKeys,
  leverDescriptors,
  t,
}: ExecSummaryPDFTemplateProps) {
  const hotelName = title || 'Your property';
  const formattedTotal = `${currencySymbol}${Math.round(totalSavings).toLocaleString()}`;

  return (
    <div
      style={{
        width: '794px',
        minHeight: '1123px',
        background: '#fff',
        fontFamily: "'Inter', -apple-system, sans-serif",
        color: '#1C1D24',
        overflow: 'hidden',
      }}
    >
      {/* Dark header */}
      <div
        style={{
          background: '#1C1D24',
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#FF83DA', letterSpacing: '-0.5px' }}>
          mews
        </div>
        <div style={{ textAlign: 'right', fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' }}>
          ROI Business Case<br />
          {hotelName} · {date}<br />
          {propertyContext}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '28px 32px' }}>
        {/* Headline */}
        <div
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: '#1C1D24',
            lineHeight: 1.3,
            marginBottom: '20px',
            letterSpacing: '-0.4px',
          }}
        >
          {hotelName} generates{' '}
          <span style={{ color: '#FF83DA' }}>{formattedTotal}/year</span>
          {' '}in total impact with Mews
        </div>

        {/* Two-column layout: narratives + sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '24px' }}>
          {/* Narrative paragraphs — one per enabled module */}
          <div>
            {enabledModuleKeys.map((moduleKey) => {
              const html = getModuleNarrativeHTML(moduleKey, leverDescriptors[moduleKey] ?? [], currencySymbol, t);
              if (!html) return null;
              return (
                <p
                  key={moduleKey}
                  style={{ fontSize: '11px', lineHeight: '1.75', color: '#444', marginBottom: '12px' }}
                  // Safe: html is generated from translation template literals, no user input
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            })}
          </div>

          {/* Sidebar — pink left border, key numbers */}
          <div style={{ borderLeft: '3px solid #FF83DA', paddingLeft: '16px', paddingTop: '2px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: '#1C1D24' }}>
                {fmt(totalSavings, currencySymbol)}
              </div>
              <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginTop: '2px' }}>
                {t.labels.totalAnnualImpact}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#D1F9D6' }}>
                {fmt(costSavings, currencySymbol)}
              </div>
              <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginTop: '2px' }}>
                {t.labels.costSavings}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FF83DA' }}>
                {fmt(revenueUplift, currencySymbol)}
              </div>
              <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginTop: '2px' }}>
                {t.labels.revenueUplift}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FF5303' }}>
                {Math.round(totalTime).toLocaleString()}
              </div>
              <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginTop: '2px' }}>
                {t.labels.hoursReclaimed}
              </div>
            </div>
          </div>
        </div>

        {/* Dark footer bar */}
        <div
          style={{
            background: '#1C1D24',
            borderRadius: '8px',
            padding: '14px 20px',
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)' }}>
              {t.labels.totalAnnualImpact}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#FF83DA' }}>
              {fmt(totalSavings, currencySymbol)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)' }}>
              {t.labels.costSavings}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              {fmt(costSavings, currencySymbol)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)' }}>
              {t.labels.revenueUplift}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              {fmt(revenueUplift, currencySymbol)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)' }}>
              {t.labels.hoursReclaimed}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#FF5303' }}>
              {Math.round(totalTime).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add components/roi-calculator/ExecSummaryPDFTemplate.tsx
git commit -m "feat(roi-calc): add ExecSummaryPDFTemplate — portrait A4 exec summary PDF component"
```

---

## Task 5: Update ExportModal.tsx

Add a `[ Full Presentation ] [ Executive Summary ]` segmented control at the top of the modal. Hide the section checklist when "Executive Summary" is selected. Update `onExport` prop signature from `() => void` to `(type: 'presentation' | 'summary') => void`.

**Files:**
- Modify: `components/roi-calculator/ui/ExportModal.tsx`

- [ ] **Step 1: Update the prop interface and add local state**

Replace the `ExportModalProps` interface and the first line of the component body:

```tsx
// Updated interface — only onExport changes
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  selectedSections: string[];
  onToggleSection: (sectionId: string) => void;
  onExport: (type: 'presentation' | 'summary') => void;  // was () => void
  isExporting: boolean;
  presentationLanguage?: LanguageCode;
}
```

Add `useState` to the React import at the top of the file:

```tsx
import { useState } from 'react';
```

Add local state inside the component, right after the `if (!isOpen) return null;` check:

```tsx
  // eslint-disable-next-line react-hooks/rules-of-hooks — only called when isOpen
  const [exportType, setExportType] = useState<'presentation' | 'summary'>('presentation');
```

> Note: `useState` inside an `if (!isOpen) return null` branch violates the Rules of Hooks. Move the early return **after** all hooks, or restructure slightly. The safest fix is to move the `if (!isOpen) return null` to the very end of the JSX: wrap the modal content in `{isOpen && (...)}`. See Step 2.

- [ ] **Step 2: Restructure the early-return and add the segmented control**

Replace the full component body. The `if (!isOpen) return null` becomes a conditional wrapper in JSX so `useState` is always called unconditionally:

```tsx
export default function ExportModal({
  isOpen,
  onClose,
  sections,
  selectedSections,
  onToggleSection,
  onExport,
  isExporting,
  presentationLanguage,
}: ExportModalProps) {
  const [exportType, setExportType] = useState<'presentation' | 'summary'>('presentation');

  if (!isOpen) return null;

  const t = getTranslations('en');
  const isPresentationMode = exportType === 'presentation';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'color-mix(in srgb, var(--mews-deep-blue) 60%, transparent)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-sm w-full overflow-hidden flex flex-col animate-scale-in-modal"
        style={{
          boxShadow: '0 24px 64px color-mix(in srgb, var(--mews-deep-blue) 25%, transparent), 0 8px 24px color-mix(in srgb, var(--mews-black) 15%, transparent)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 pb-4"
          style={{ borderBottom: '1px solid color-mix(in srgb, var(--mews-charcoal) 6%, transparent)' }}
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t.labels.exportRoiReport}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t.labels.chooseSections}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150"
            style={{ background: 'color-mix(in srgb, var(--mews-charcoal) 5%, transparent)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-charcoal) 10%, transparent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-charcoal) 5%, transparent)';
            }}
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Export type segmented control */}
          <div
            className="flex rounded-xl overflow-hidden"
            style={{ border: '1px solid color-mix(in srgb, var(--mews-charcoal) 10%, transparent)' }}
          >
            <button
              onClick={() => setExportType('presentation')}
              disabled={isExporting}
              className="flex-1 py-2 text-sm font-semibold transition-all duration-150"
              style={{
                background: isPresentationMode ? 'var(--mews-night-black)' : 'transparent',
                color: isPresentationMode ? '#fff' : 'var(--roi-gray-700)',
              }}
            >
              Full Presentation
            </button>
            <button
              onClick={() => setExportType('summary')}
              disabled={isExporting}
              className="flex-1 py-2 text-sm font-semibold transition-all duration-150"
              style={{
                background: !isPresentationMode ? 'var(--mews-night-black)' : 'transparent',
                color: !isPresentationMode ? '#fff' : 'var(--roi-gray-700)',
              }}
            >
              Executive Summary
            </button>
          </div>

          {/* Section checklist — only shown for Full Presentation */}
          {isPresentationMode && (
            <div className="space-y-2">
              {sections.map((section) => {
                const isChecked = selectedSections.includes(section.id);
                return (
                  <label
                    key={section.id}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 group"
                    style={{
                      background: isChecked ? 'color-mix(in srgb, var(--mews-indigo) 7%, transparent)' : 'color-mix(in srgb, var(--mews-charcoal) 2%, transparent)',
                      border: `1px solid ${isChecked ? 'color-mix(in srgb, var(--mews-indigo) 25%, transparent)' : 'color-mix(in srgb, var(--mews-charcoal) 6%, transparent)'}`,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150"
                      style={{
                        background: isChecked
                          ? 'var(--mews-indigo)'
                          : 'color-mix(in srgb, var(--mews-charcoal) 6%, transparent)',
                        border: `2px solid ${isChecked ? 'transparent' : 'color-mix(in srgb, var(--mews-charcoal) 15%, transparent)'}`,
                        boxShadow: isChecked ? '0 2px 8px color-mix(in srgb, var(--mews-indigo) 30%, transparent)' : 'none',
                      }}
                    >
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleSection(section.id)}
                      className="sr-only"
                      disabled={isExporting}
                    />
                    <span className="text-sm font-medium text-gray-800">{section.label}</span>
                  </label>
                );
              })}

              {selectedSections.length === 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3 border border-amber-200">
                  {t.labels.selectAtLeastOne}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-5 pt-4 flex gap-3"
          style={{ borderTop: '1px solid color-mix(in srgb, var(--mews-charcoal) 6%, transparent)' }}
        >
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{
              background: 'color-mix(in srgb, var(--mews-charcoal) 5%, transparent)',
              border: '1px solid color-mix(in srgb, var(--mews-charcoal) 8%, transparent)',
              color: 'var(--roi-gray-700)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-charcoal) 10%, transparent)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--mews-charcoal) 5%, transparent)';
            }}
          >
            {t.labels.cancel}
          </button>
          <button
            onClick={() => onExport(exportType)}
            disabled={(isPresentationMode && selectedSections.length === 0) || isExporting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-150"
            style={{
              background:
                (isPresentationMode && selectedSections.length === 0) || isExporting
                  ? 'var(--roi-neutral-border)'
                  : 'linear-gradient(135deg, var(--mews-night-black) 0%, var(--mews-deep-blue) 100%)',
              boxShadow:
                (isPresentationMode && selectedSections.length === 0) || isExporting
                  ? 'none'
                  : '0 4px 12px color-mix(in srgb, var(--mews-charcoal) 30%, transparent)',
              cursor: (isPresentationMode && selectedSections.length === 0) || isExporting ? 'not-allowed' : 'pointer',
            }}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t.labels.generating}
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                {isPresentationMode ? t.labels.exportPdf : 'Export Summary'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: exits 0. TypeScript will error at the `ROIStage.tsx` call site (next task) until that prop is updated too.

- [ ] **Step 4: Commit**

```bash
git add components/roi-calculator/ui/ExportModal.tsx
git commit -m "feat(roi-calc): add presentation/summary toggle to ExportModal"
```

---

## Task 6: Update ROIStage.tsx

Add `handleExportExecSummary`, import `ExecSummaryPDFTemplate`, and update the `onExport` call to pass the export type.

**Files:**
- Modify: `components/roi-calculator/ROIStage.tsx`

- [ ] **Step 1: Add the ExecSummaryPDFTemplate import**

Add after the existing `PDFTemplate` import:

```tsx
import ExecSummaryPDFTemplate from '@/components/roi-calculator/ExecSummaryPDFTemplate';
```

- [ ] **Step 2: Add handleExportExecSummary**

Add this function directly after the existing `handleExportPDF` function (around line 373):

```tsx
  const handleExportExecSummary = async () => {
    dispatch({ type: 'SET_EXPORTING', value: true });
    try {
      // SSR-safe dynamic imports — same pattern as handleExportPDF
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const t = getTranslations(config.presentationLanguage);
      const date = new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

      // Render the template off-screen at exactly 794px (A4 portrait at 96dpi)
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '794px';
      document.body.appendChild(tempContainer);

      const root = createRoot(tempContainer);
      root.render(
        <ExecSummaryPDFTemplate
          title={config.title}
          propertyContext={propertyContextString}
          date={date}
          totalSavings={filteredResults.totalSavings}
          costSavings={filteredResults.costSavings}
          revenueUplift={filteredResults.revenueUplift}
          totalTime={filteredResults.totalTime}
          currencySymbol={currencySymbol}
          enabledModuleKeys={enabledModuleKeys}
          leverDescriptors={leverDescriptors}
          t={t}
        />,
      );
      // Allow React to commit and fonts/layout to settle
      await new Promise((resolve) => setTimeout(resolve, 300));

      // scale:2 gives a 1588px canvas scaled back to 794px — crisp on high-DPI displays
      const canvas = await html2canvas(tempContainer.firstElementChild as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [794, 1123], hotfixes: ['px_scaling'] });
      pdf.addImage(imgData, 'JPEG', 0, 0, 794, 1123);
      pdf.save(`Mews-ROI-Summary-${new Date().toISOString().split('T')[0]}.pdf`);

      root.unmount();
      document.body.removeChild(tempContainer);
      dispatch({ type: 'CLOSE_EXPORT' });
    } catch (error) {
      console.error('Error generating exec summary:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      dispatch({ type: 'SET_EXPORTING', value: false });
    }
  };
```

- [ ] **Step 3: Update the ExportModal onExport prop**

Find the `<ExportModal` usage in the JSX (around line 569) and change `onExport`:

```tsx
      <ExportModal
        isOpen={ui.isExportModalOpen}
        onClose={() => dispatch({ type: 'SET_FIELD', slice: 'ui', field: 'isExportModalOpen', value: false })}
        sections={exportableSections}
        selectedSections={ui.selectedSections}
        onToggleSection={(id) => dispatch({ type: 'TOGGLE_EXPORT_SECTION', sectionId: id })}
        onExport={(type) => {
          if (type === 'presentation') {
            handleExportPDF();
          } else {
            handleExportExecSummary();
          }
        }}
        isExporting={ui.isExporting}
        presentationLanguage={config.presentationLanguage}
      />
```

- [ ] **Step 4: Verify the full app compiles and all tests pass**

```bash
npm run build 2>&1 | tail -30
npm run test
```

Expected: build exits 0, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/roi-calculator/ROIStage.tsx
git commit -m "feat(roi-calc): add exec summary PDF export — handleExportExecSummary + wire ExportModal"
```

---

## Task 7: Manual verification

Verify the end-to-end flow by running the dev server and exercising each changed area.

**Files:** None (read-only verification)

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open the ROI Calculator in the browser.

- [ ] **Step 2: Verify cinematic presentation mode**

1. Click "Present" (or whatever button triggers `ENTER_CINEMATIC`).
2. **Title slide**: confirm hotel name above hero number, hero is large (`clamp(5rem, 12vw, 8rem)`), three KPI pills show `↓` / `↑` / `◷` in coloured backgrounds, KPI values use `--mews-light-green` / `--mews-primary-pink` / `--mews-orange`.
3. **Navigation dot**: active dot should be pink (`--mews-primary-pink`), not indigo.
4. **Fullscreen button**: click ⛶ (Maximize2 icon) — browser enters fullscreen. Icon changes to Minimize2. Click again — exits fullscreen.
5. **Escape key in fullscreen**: enter fullscreen, press Escape — browser exits fullscreen, then Escape fires again and the overlay closes. Verify overlay is closed and no stale fullscreen state.
6. **Module slide**: navigate to a module slide. Confirm the per-lever calculation cards are still visible (grid is unchanged). Confirm the narrative paragraph above the cards is populated for all 4 modules — including Housekeeping (previously empty due to missing case).
7. **Summary slide**: confirm cost savings is green (`--mews-light-green`), revenue uplift is pink (`--mews-primary-pink`), hours reclaimed is orange (`--mews-orange`).
8. **Content width**: slides should use the full overlay width, not be capped.

- [ ] **Step 3: Verify export modal toggle**

1. Click "Export".
2. Modal opens with `[ Full Presentation ]` selected by default.
3. Section checklist is visible.
4. Click `[ Executive Summary ]` — checklist disappears, export button reads "Export Summary".
5. Click `[ Full Presentation ]` again — checklist reappears.

- [ ] **Step 4: Test full presentation export**

1. Select "Full Presentation", keep at least one section checked.
2. Click "Export PDF".
3. PDF downloads. Open it — verify it's a landscape multi-slide PDF.

- [ ] **Step 5: Test executive summary export**

1. Select "Executive Summary".
2. Click "Export Summary".
3. PDF downloads named `Mews-ROI-Summary-YYYY-MM-DD.pdf`.
4. Open the PDF — verify portrait A4, dark header with "mews" logo, headline with hotel name + pink total, two-column narrative + sidebar, dark footer bar.
5. Verify monetary values in narrative text appear in pink.

- [ ] **Step 6: Final commit if any fixes were needed**

```bash
git add -p  # stage only the fix
git commit -m "fix(roi-calc): [describe any fix from manual verification]"
```

If no fixes needed, skip this step.
