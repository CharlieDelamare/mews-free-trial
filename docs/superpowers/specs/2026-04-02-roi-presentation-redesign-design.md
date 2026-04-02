# ROI Calculator — Presentation Mode Redesign & Executive Summary Export

**Date:** 2026-04-02
**Status:** Approved
**Scope:** `components/roi-calculator/CinematicOverlay.tsx`, `CinematicSlide.tsx`, `ui/ExportModal.tsx`, `ROIStage.tsx` (export handler), new `ExecSummaryPDFTemplate.tsx`

---

## Problem

The ROI Calculator's presentation (cinematic) mode has three issues:

1. **Off-brand colours** — KPI stats use generic Tailwind colours (`emerald-400`, `blue-400`, `violet-400`) that don't match the Mews design system.
2. **Wasted screen space** — slide content is capped at `max-w-3xl` even though the overlay fills the full viewport.
3. **Information overload** — module slides show every lever in a card grid, which is visually busy and distracts from the headline number during a live presentation.

The export also only produces the full presentation deck. Sales reps need a concise 1-page executive summary to leave behind after a meeting.

---

## Decisions Made

| Question | Decision |
|---|---|
| Slide layout | Big & focused — one bold statement per slide, giant typography |
| KPI colours | Brand palette: `--mews-light-green` (cost savings), `--mews-primary-pink` (revenue uplift), `--mews-orange` (hours reclaimed) |
| Module slide detail | Narrative only — remove lever cards entirely, show headline number + 2–3 sentence narrative paragraph |
| Screen space | Remove `max-w-3xl` content cap; add Fullscreen API so browser chrome is hidden during presentations |
| Exec summary format | Story-first — narrative paragraphs on the left, key numbers in a pink-bordered right sidebar |

---

## Design

### 1. Presentation Mode — `CinematicOverlay.tsx`

**Fullscreen API:**
- The overlay already uses `fixed inset-0`, which fills the viewport but not the full screen (browser chrome remains visible).
- Add a fullscreen toggle button in the top bar (⛶ icon, next to the existing close button).
- On click: call `document.documentElement.requestFullscreen()`.
- Listen to `fullscreenchange` events to keep the button icon in sync.
- Fullscreen is optional — if the browser blocks it, the overlay still works as before.
- **Escape key coordination:** When in fullscreen, the browser intercepts Escape to exit fullscreen before the keydown handler fires. The existing `exit()` callback (which dispatches `EXIT_CINEMATIC`) must also call `document.exitFullscreen()` if `document.fullscreenElement` is set — so clicking the X button or pressing Escape after fullscreen exit both clean up correctly. Keyboard Escape triggers: browser exits fullscreen first, then keydown fires `EXIT_CINEMATIC` (which calls exitFullscreen if still needed, no-op otherwise).

**Content width:**
- Remove the `max-w-3xl` cap on the `div` wrapping `renderSlide()`. Replace with generous horizontal padding (`px-16` or equivalent) so content breathes without being artificially constrained.

**Navigation dot colour:**
- Replace `var(--mews-indigo)` on the active dot with `var(--mews-primary-pink)`.

---

### 2. Presentation Mode — `CinematicSlide.tsx`

#### Title slide

- Hotel name rendered above the hero number in a medium-weight line.
- Hero number: `clamp(5rem, 12vw, 8rem)`, `font-weight: 800`, colour: `#fff`.
- "Total annual impact with Mews" subtext below, uppercase, spaced, low-opacity.
- Three KPI stats below a subtle divider, each with a rounded icon background and a bold value:
  - Cost savings → `var(--mews-light-green)` (`#D1F9D6`)
  - Revenue uplift → `var(--mews-primary-pink)` (`#FF83DA`)
  - Hours reclaimed → `var(--mews-orange)` (`#FF5303`)
- Remove the current `TrendingDown`/`TrendingUp`/`Clock` Lucide icons — replace with simple directional characters or small inline SVG arrows inside the icon background pill.

#### Module slide

- Remove the lever cards grid entirely (`levers.map(...)` block).
- Layout: left-aligned (not centred), wide content area.
- Module chip (coloured dot + module name) at top.
- Hero number: `clamp(4rem, 10vw, 7rem)`, `font-weight: 800`, colour: `#fff`.
- "Annual impact" label below, uppercase, low-opacity.
- Narrative paragraph: `font-size: 1rem`, `line-height: 1.75`, `color: rgba(255,255,255,0.5)`. Rendered as plain text — no pink highlighting on the cinematic slide (the white-on-dark contrast already makes values readable).
- The narrative is already computed by `getModuleNarrative()` — no new logic needed.
- The housekeeping module has no narrative function currently; show a single-line fallback: key lever values listed inline.

#### Summary slide

- Keep existing structure (left total + KPIs, right waterfall bars).
- Apply brand colour fixes: replace `emerald-400` → `--mews-light-green`, `blue-400` → `--mews-primary-pink`, `violet-400` → `--mews-orange` on values and bars.

---

### 3. Export Modal — `ui/ExportModal.tsx`

Add a two-option selector at the top of the modal:

```
[ Full Presentation ]  [ Executive Summary ]
```

- Implemented as a segmented control / tab toggle (two buttons, one active at a time).
- Default selection: **Full Presentation** (preserves existing behaviour).
- When **Executive Summary** is selected, the section checklist is hidden (exec summary always includes all enabled modules).
- The export button label changes: "Export PDF" vs "Export Summary".
- The `onExport` prop is split into `onExportPresentation` and `onExportSummary`, or a single `onExport(type: 'presentation' | 'summary')` — implementation detail for the plan.

---

### 4. Executive Summary — `ExecSummaryPDFTemplate.tsx`

A new component rendered into a hidden DOM node and captured with `html2canvas`, mirroring the pattern in `handleExportPDF`.

**Format:** Portrait A4 (595 × 842pt / 794 × 1123px at 96dpi). Single page.

**Layout:**

```
┌─────────────────────────────────────────────┐
│  mews [logo]            ROI Business Case   │  ← Dark header (#1C1D24)
│                         Hotel · Date        │
├─────────────────────────────────────────────┤
│  "The Grand Berlin saves €486k/year         │  ← Bold headline
│   with Mews"                                │
│                                             │
│  [Narrative paragraphs]   │ €486k ←──────  │  ← Two-col: narrative + sidebar
│  One per module.          │ Total impact   │
│  Key figures in pink.     │ €312k          │  ← Sidebar has 3px pink left border
│                           │ Cost savings   │
│                           │ €174k          │
│                           │ Revenue uplift │
│                           │ 1,840          │
│                           │ Hours reclaimed│
│                                             │
│  ┌──────────────────────────────────────┐   │  ← Dark footer bar
│  │ €486k total  €312k savings  €174k ↑  │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Narrative generation:**
- The `narratives.ts` utility exports two functions:
  - `getModuleNarrative(moduleKey, levers, cs, t): string` — plain text, used by `CinematicSlide`.
  - `getModuleNarrativeHTML(moduleKey, levers, cs, t): string` — HTML string with `<span style="color:#FF83DA;font-weight:700">` wrapping monetary values, used by `ExecSummaryPDFTemplate` via `dangerouslySetInnerHTML`. The HTML content is constructed from template literals with no user-controlled input so XSS is not a concern.
- One paragraph per enabled module. Housekeeping uses a fallback sentence listing the top two savings figures.
- The `ExecSummaryPDFTemplate` renders narrative paragraphs using `dangerouslySetInnerHTML={{ __html: getModuleNarrativeHTML(...) }}`.

**Headline sentence:**
- `"{title} saves {totalSavings} per year with Mews"` where `{totalSavings}` is formatted and coloured pink.
- If `title` is empty, use `"Your property"`.

**PDF generation (`handleExportExecSummary` in `ROIStage.tsx`):**
- Same `html2canvas` + `jsPDF` pattern as `handleExportPDF`.
- `jsPDF` in portrait mode: `new jsPDF({ orientation: 'portrait', unit: 'px', format: [794, 1123] })`.
- Single page — no slide iteration loop.
- Filename: `Mews-ROI-Summary-{date}.pdf`.

---

### 5. Shared Utility — `lib/roi-calculator/utils/narratives.ts`

Extract `getModuleNarrative()` from `CinematicSlide.tsx` into this new file. Export two variants:

```ts
// Plain text — used by CinematicSlide
export function getModuleNarrative(
  moduleKey: ModuleKey,
  levers: LeverDescriptor[],
  currencySymbol: string,
  t: TranslationDictionary,
): string

// HTML string with pink <span> highlights — used by ExecSummaryPDFTemplate
export function getModuleNarrativeHTML(
  moduleKey: ModuleKey,
  levers: LeverDescriptor[],
  currencySymbol: string,
  t: TranslationDictionary,
): string
```

`getModuleNarrativeHTML` is implemented by calling `getModuleNarrative` and applying a regex replace to wrap currency values (e.g. `€42k`, `€312,000`) in the pink span. No user input touches these strings.

---

## Files Changed

| File | Change |
|---|---|
| `components/roi-calculator/CinematicOverlay.tsx` | Fullscreen API, remove content width cap, active dot colour |
| `components/roi-calculator/CinematicSlide.tsx` | Title slide redesign, module slide narrative-only, brand colour tokens, extract narrative fn |
| `components/roi-calculator/ui/ExportModal.tsx` | Add presentation/summary toggle |
| `components/roi-calculator/ROIStage.tsx` | Add `handleExportExecSummary`, pass export type to modal |
| `components/roi-calculator/ExecSummaryPDFTemplate.tsx` | New component |
| `lib/roi-calculator/utils/narratives.ts` | New utility — extracted from CinematicSlide |

---

## Out of Scope

- Summary slide layout changes (colour fixes only)
- Housekeeping narrative (fallback text is sufficient)
- Multi-language support for exec summary (export in presentation language is a future enhancement)
- Any changes to the data input forms, ROI calculations, or confidence scoring
