# ROI Calculator Dashboard & Persistence — Design Spec

**Date:** 2026-03-17
**Status:** Approved

---

## Overview

Transform the ROI Calculator from a stateless single page into a persistent, multi-presentation tool. Sales reps can create named business case presentations, return to them, and pick up where they left off. A new dashboard lists all presentations; a wizard guides creation; the existing calculator becomes the per-presentation editor.

---

## 1. Database Schema

New model: `RoiPresentation`

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

- `name` — hotel or group name entered in the wizard (required, trimmed, min 1 char)
- `salesforceAccountId` — optional SF account number; stored but not shown on dashboard
- `country`, `hotelType` — extracted from calculator state on each save; used for dashboard display without JSON parsing
- `numberOfRooms` — extracted from `state.sharedVariables.numberOfRooms`; defaults to 0 at creation, populated on first auto-save
- `totalAnnualSavings` — computed result extracted from state on each save; defaults to 0 at creation time, recomputed on first auto-save
- `createdBy` — nullable; populated from user input in Step 1; ready for future auth-based filtering
- `stateJson` — the calculator state **excluding the `ui` slice** (see §6); source of truth for calculator hydration
- US state (optional) is stored inside `stateJson.config.usState`, not as a top-level column

Migration name: `add_roi_presentation`

---

## 2. Routes

| Route | File | Purpose |
|---|---|---|
| `/roi-calculator` | `app/roi-calculator/page.tsx` | Dashboard (replaces current calculator page) |
| `/roi-calculator/new` | `app/roi-calculator/new/page.tsx` | Wizard — stepped intake |
| `/roi-calculator/[id]` | `app/roi-calculator/[id]/page.tsx` | Per-presentation calculator |

**Breaking change:** `/roi-calculator` previously rendered the calculator directly. Existing bookmarks now land on the dashboard. No redirect needed — the dashboard is a valid landing page with a clear path to the calculator.

---

## 3. API Routes

All routes follow the project convention: `NextResponse.json({ success: boolean; error?: string; ...data })`.

| Endpoint | Method | Purpose | Response |
|---|---|---|---|
| `/api/roi-presentations` | GET | List all presentations (no pagination in v1) | `{ success, presentations: RoiPresentation[] }` |
| `/api/roi-presentations` | POST | Create on wizard completion | `{ success, id: string }` |
| `/api/roi-presentations/[id]` | GET | Load single presentation | `{ success, presentation: RoiPresentation }` |
| `/api/roi-presentations/[id]` | PATCH | Auto-save state changes | `{ success }` |

---

## 4. Wizard (`/roi-calculator/new`)

Full-page client component. Manages local state for Step 1 identity fields. Uses the same two hooks as `ROIStage` for calculator state: `useROICalculator()` (no saved state, starts with defaults) and `useConfidence()` wired identically to `ROIStage`.

### Hook initialization

The wizard instantiates `useROICalculator()` and `useConfidence()` at mount with defaults — the same initialization order as the current `ROIStage`. Property config (country, hotelType, usState) lives inside `ProspectIntake` and is wired through `onCountryChange`, `onHotelTypeChange`, `onUSStateChange` callbacks exactly as today. `priorityInputs` and the confidence map update reactively as those values change. No special initialization handling is needed.

### Steps

**Step 1 — Identity** *(new; rendered as a full-page form panel before ProspectIntake)*
- "Hotel or group name" — required text input; trimmed; min 1 char validated client-side before advancing
- "Salesforce Account Number" — optional text input
- "Your name" — optional text input (stored as `createdBy`)

**Steps 2–N — ProspectIntake** *(existing component)*
- After Step 1 is submitted, the wizard renders `<ProspectIntake isOpen={true} onClose={noop} onComplete={handleComplete} ...allHookProps />` passing all props from the two hooks, identical to `ROIStage`
- ProspectIntake handles property context (country, US state, hotel type) and all priority input groups internally
- `onComplete` fires when the user finishes the final step
- `onClose` is a no-op (there is nothing to close to on a full page)
- `numberOfRooms` IS collected inside ProspectIntake via the "Property Basics" priority input group

### Completion

On `onComplete` from ProspectIntake:
1. Capture current `state` from `useROICalculator` at that moment
2. POST `/api/roi-presentations` with `{ name, salesforceAccountId, createdBy, state: capturedState }`
3. Server extracts `country`, `hotelType`, `numberOfRooms`, `totalAnnualSavings` from the state; strips `ui` slice; stores remaining state as `stateJson`
4. On success: `router.push('/roi-calculator/[returned-id]')`
5. On failure: show inline error message; keep all wizard state; allow retry

---

## 5. Dashboard (`/roi-calculator`)

**Architecture:** Server component. Renders once per request. Data is fresh on each page load; stale-on-tab is acceptable in v1.

**Header:** "Business Case Presentations" title + "Create New" button (top right) → navigates to `/roi-calculator/new`

**Presentations table columns:**
| Column | Source |
|---|---|
| Name | `name` |
| Hotel Type + Country | `hotelType`, `country` |
| Rooms | `numberOfRooms` |
| Total Annual Savings | `totalAnnualSavings` formatted as currency |
| Last Updated | `updatedAt` relative timestamp |
| Action | "View" button → `/roi-calculator/[id]` |

**Sort:** `createdAt DESC` (newest first). No pagination in v1.

**Empty state:** Centered prompt with "Create your first presentation" button → `/roi-calculator/new`.

---

## 6. Calculator Page (`/roi-calculator/[id]`)

**Architecture:** Server component fetches by ID via Prisma. If ID not found: `notFound()`. Passes `presentation.stateJson` as `initialState` prop to `ROIStage`.

### ROIStage changes required

- Accept new optional props: `presentationId?: string` and `initialState?: Omit<CalculatorState, 'ui'>`
- When `initialState` is provided, construct the full initial reducer state as: `{ ...initialState, config: { ...initialState.config, isInitialLoad: true }, ui: defaultUiState }`
  - Setting `isInitialLoad: true` ensures the smart-defaults `useEffect` fires once (first render), skips `APPLY_DEFAULTS`, and clears the flag — preserving all saved lever values. Without this, saved values would be overwritten by benchmark defaults on load.
- `useROICalculator` hook accepts a new optional parameter `savedState?: Omit<CalculatorState, 'ui'>` used as the `useReducer` initial value (with `ui` and `isInitialLoad` overrides applied as above)

### stateJson — what is stored and restored

- **On save (POST and PATCH):** strip the `ui` slice entirely before writing `stateJson`. The `ui` slice contains ephemeral display state (`cinematicMode`, modal open flags, expanded levers) that should not be restored — reopening a saved presentation always starts with a clean UI state.
- **On restore (GET `/[id]`):** `stateJson` contains `config`, `sharedVariables`, `guestExperience`, `payment`, `rms`. Merge each top-level slice with its default value (`Object.assign({}, defaultSlice, savedSlice)`) to fill in any fields added since the state was saved. A console warning is emitted if a top-level key is missing entirely.

### Auto-save

- `useEffect` in `ROIStage` watches the full calculator state; debounced 1.5 seconds
- Only fires when `presentationId` prop is present (no-op for any stateless rendering)
- PATCH `/api/roi-presentations/[id]` with state (ui stripped) + recomputed metadata columns
- Response: `{ success: true }` — client ignores body
- Save indicator: small "Saved" / "Saving…" text near the header (no toast)
- Silent failure: logged to console; no UI disruption
- **Data loss window:** changes made within the 1.5s debounce window before navigation are lost. Acceptable in v1. No `beforeunload` handler.
- **Concurrent tabs:** last-write-wins. Acceptable in v1; no optimistic lock.

**No other changes** to the calculator experience: all levers, presentation mode, PDF export, and module toggles work exactly as today.

---

## 7. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| DB storage | Metadata columns + JSON blob | Dashboard display without JSON parsing; full state restore from blob |
| Save strategy | Auto-save (debounced 1.5s) | No friction for the user |
| Dashboard fetch | Server component | No real-time requirement; simpler than SWR |
| Auth readiness | `createdBy` stored now, not filtered | No schema migration needed when auth ships |
| Wizard structure | Step 1 inline form → ProspectIntake with `isOpen=true` | Minimal new code; reuses existing component and hook wiring |
| 404 handling | `notFound()` | Standard Next.js App Router pattern |
| Concurrent writes | Last-write-wins | Acceptable for v1 single-user-per-presentation usage |
| `ui` slice | Stripped before save | Ephemeral display state should not be restored |
| Smart-defaults on restore | `isInitialLoad: true` override | Prevents benchmark defaults from overwriting saved lever values |
| Partial state restore | Deep merge per slice with defaults | Forward-compatible with new fields added to the state shape |

---

## 8. Out of Scope (v1)

- Delete / duplicate presentation actions
- Per-user filtering (requires auth)
- Presentation sharing / collaboration
- Dashboard search / sort / pagination
- `beforeunload` save-on-navigate
- Optimistic concurrency control
- `stateJson` schema versioning
