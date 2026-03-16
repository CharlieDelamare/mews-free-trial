# ROI Calculator Merge — Design Spec

**Date:** 2026-03-16
**Project:** mews-free-trial (Mews Sandbox Manager)
**Source:** ROI-Calculator-V2

---

## Overview

Port the standalone ROI Calculator V2 (Vite/React SPA) into the mews-free-trial Next.js app as a new page at `/roi-calculator`. All existing features are preserved. Styling is fully migrated to the Mews design system used by mews-free-trial.

---

## Goals

- All ROI Calculator features available at `/roi-calculator` within the Sandbox Manager
- Page uses the Mews design system (colours, typography, spacing) — no dark theme remnants
- Accessible from the navbar under a new "Tools" section
- No new backend routes required (calculator is entirely client-side)

---

## File Structure

```
app/roi-calculator/
  page.tsx                         # Next.js page — thin 'use client' wrapper over ROIStage

components/roi-calculator/
  ROIStage.tsx
  ActionDock.tsx
  CinematicOverlay.tsx
  CinematicSlide.tsx
  DataComparisonSection.tsx
  ErrorBoundary.tsx
  HeroNumber.tsx
  ModulePillsBar.tsx
  ModuleStoryPanel.tsx
  NavigationSidebar.tsx
  PDFTemplate.tsx
  PropertyContextLine.tsx
  PropertyEditPopover.tsx
  ProspectIntake.tsx
  StickyROIBar.tsx
  WaterfallChart.tsx
  sections/
    CheckInPortalSection.tsx
    DirectBookingSection.tsx
    DiscoverySection.tsx
    GuestExperienceSection.tsx
    HotelConfigSection.tsx
    PaymentSection.tsx
    RMSSection.tsx
    RoomAssignmentSection.tsx
    SharedVariablesSection.tsx
    TotalSavings.tsx
    UpsellSection.tsx
  ui/
    CollapsibleSection.tsx
    ConfidenceBadge.tsx
    ConfidenceBar.tsx
    ContributionChart.tsx
    Explanation.tsx
    ExportModal.tsx
    LeverCard.tsx
    ModuleCard.tsx
    ModulePill.tsx
    PresetSelector.tsx
    ResultCard.tsx
    Slider.tsx
    SmartField.tsx

hooks/
  useROICalculator.ts              # Added alongside existing hooks
  useConfidence.ts

lib/roi-calculator/
  utils/
    calculations.ts
    confidenceScoring.ts
    hotelDefaults.ts
    leverDescriptors.ts
    priorityInputs.ts
    timeFormat.ts
  data/
    countryBenchmarks.ts
    usStateBenchmarks.ts
  translations/
    index.ts
    en.ts  fr.ts  cs.ts  da.ts  de.ts
    es.ts  fi.ts  it.ts  nl.ts  no.ts
    pt.ts  sv.ts
  types/
    calculator.ts
    confidence.ts
    translations.ts
```

Pure logic files (`lib/roi-calculator/`) require no `'use client'` directive. All component and hook files receive `'use client'` at the top since they use React hooks and browser APIs.

---

## Dependencies

Add to `mews-free-trial/package.json`:

```json
"html2canvas": "^1.4.1",
"jspdf": "^2.5.1",
"lucide-react": "^0.344.0"
```

Add `lucide-react` to `optimizePackageImports` in `next.config.js` (it's heavily used across ported components):

```js
optimizePackageImports: ['react', 'react-dom', 'date-fns', 'date-fns-tz', 'lucide-react'],
```

**SSR safety — dynamic imports for `html2canvas` and `jspdf`:** These packages access browser globals (`window`, `document`) at module evaluation time and will cause Next.js build failures if imported statically. In `ROIStage.tsx`, replace the static imports at the top of the file with inline dynamic imports inside the PDF export handler:

```ts
// Instead of: import html2canvas from 'html2canvas'; import { jsPDF } from 'jspdf';
const html2canvas = (await import('html2canvas')).default;
const { jsPDF } = await import('jspdf');
```

---

## CSS Integration

Merge into `app/globals.css`:

**Keep from ROI Calculator `index.css`:**
- Scrollbar utilities: `.scrollbar-hide`, `.scrollbar-thin`
- Animation keyframes: `slideUp`, `sectionReveal`, `shimmer` (see conflict note below)
- Stagger delay helpers: `.stagger-1`, `.stagger-2`, `.stagger-3`
- Range slider thumb styles (updated to use Mews indigo)
- `.card` base style
- `.tabular-nums`
- `.animate-slide-up`, `.section-content`

**Discard:**
- `hero-gradient` (dark-theme background)
- `.glass`, `.glass-navy`, `.glass-dark` (glassmorphism — not used after retheme)
- `gradient-text`, `gradient-text-teal` (teal gradient — not used after retheme)
- `--color-navy`, `--color-teal` CSS variables (replaced inline with Mews tokens)
- `fadeIn` keyframe and `.animate-fade-in` — **conflict**: `tailwind.config.js` already defines `fadeIn` (with `translateY(8px)`) and exposes it as the `animate-fade-in` Tailwind class. Use the existing Tailwind definition throughout ported components instead.

---

## Theming

Systematic token swap applied across all ported component files:

| ROI Calculator value | Mews replacement |
|---|---|
| `#2D2C37` / `--color-navy` | `var(--mews-night-black)` (#1C1D24) |
| `#6BA3B0` / `--color-teal` | `var(--mews-indigo)` (#B3B2FB) |
| `hero-gradient` container bg | `bg-[var(--mews-linen)]` |
| Dark overlays / cinematic bg | `var(--mews-deep-blue)` (#172135) |
| Card borders | `var(--neutral-100)` / `var(--neutral-200)` |
| Slider thumb border/shadow | `var(--mews-indigo)` |
| Warning/alert accents | `var(--mews-coral)` (#FF5A65) |
| Primary action accents | `var(--mews-indigo)` (#B3B2FB) |
| Success states | `var(--mews-green)` (#E6F5F0) |

Typography: Inter is already loaded in mews-free-trial via `next/font` and mapped to all `--font-*` variables. No font changes required.

---

## Navbar

`app/navbar.tsx` — add a `toolLinks` array and a new "Tools" section in the sidebar, between Operations and Logs:

```
Sandboxes    → Create, Extend, Save
Operations   → Reset, Fill, Close Bills
Tools        → ROI Calculator        ← new
─────────────────────────────────────
Logs
```

---

## Import Paths

All ported files use relative imports (e.g. `'../types/calculator'`, `'../../utils/calculations'`). These must be rewritten to absolute `@/` paths during the port:

| Original relative path | New absolute path |
|---|---|
| `../types/calculator` | `@/lib/roi-calculator/types/calculator` |
| `../utils/calculations` | `@/lib/roi-calculator/utils/calculations` |
| `../hooks/useROICalculator` | `@/hooks/useROICalculator` |
| `../translations` | `@/lib/roi-calculator/translations` |
| `./ui/ExportModal` | `@/components/roi-calculator/ui/ExportModal` |
| *(etc.)* | *(follow the same pattern)* |

---

## Routing

`app/roi-calculator/page.tsx`:

```tsx
'use client';
import ROIStage from '@/components/roi-calculator/ROIStage';

export default function ROICalculatorPage() {
  return (
    <div className="min-h-screen bg-[var(--mews-linen)]">
      <ROIStage />
    </div>
  );
}
```

No new API routes. All calculation, state, PDF export, and cinematic presentation logic runs client-side.

---

## Out of Scope

- No data persistence (calculator state is not saved to the database)
- No authentication gating (accessible to anyone who can reach the app)
- No server-side rendering of calculator state
