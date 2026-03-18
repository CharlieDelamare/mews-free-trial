# ROI Calculator — Wizard Product Selection

**Date:** 2026-03-18
**Status:** Approved

## Overview

Add a product selection UI to the first step of the ROI Calculator wizard so that sales reps choose which Mews products are relevant to the prospect before proceeding. Only intake questions for the selected products are shown in the intake step. The final presentation is saved with only the selected modules enabled.

## Problem

The wizard currently runs intake questions for all three products (Guest Experience, Payments & Billing, RMS) regardless of whether the prospect will use them all. As new products are added, this will become increasingly unwieldy.

## Approach

Approach A — local wizard state, filter at intake time.

`PresentationWizard` holds `selectedModules: EnabledModules` locally. Product cards are rendered on the identity screen. `getPriorityInputs` is updated to accept `enabledModules` and filters out irrelevant intake groups. On submission, `selectedModules` is merged into the state before serialization.

## Design

### 1. Identity Screen — Product Selection Cards

**Location:** Below existing form fields (hotel name, Salesforce ID, your name), above the Continue button.

**UI:** A labeled "Products" section containing three toggle cards — one per module. Each card displays:
- Icon (reused from `ProspectIntake.tsx`)
- Label and description from `MODULE_META`
- Selected state: `border-[--mews-indigo] bg-[--mews-light-indigo]`
- Unselected state: current neutral border style

**State:** `PresentationWizard` adds:
```ts
const [selectedModules, setSelectedModules] = useState<EnabledModules>({
  guestExperience: true,
  payment: true,
  rms: true,
});
```
All three default to selected (preserves current behaviour).

**Validation:** Continue button is disabled with a "Select at least one product" hint when all three are false.

**Extensibility:** Adding a new product only requires adding a key to `ModuleKey`, `EnabledModules`, and `MODULE_META` — the card list renders from `MODULE_KEYS`.

### 2. Intake Filtering

**Change to `getPriorityInputs`:** Add an optional fourth parameter:
```ts
export function getPriorityInputs(
  currencySymbol: string,
  country: string,
  hotelType: string,
  enabledModules?: EnabledModules,
): PriorityInput[]
```

**Group-to-module mapping** (defined as a constant in `priorityInputs.ts`):
```ts
const GROUP_MODULE_FILTER: Record<string, ModuleKey | 'all'> = {
  property:   'all',           // always shown
  operations: 'guestExperience',
  revenue:    'guestExperience',
  payments:   'payment',
  rms:        'rms',
};
```

When `enabledModules` is provided, the returned array is filtered to exclude inputs whose group maps to a disabled module. The `property` group is always included.

**Callsite in `PresentationWizard`:**
```ts
const priorityInputs = useMemo(
  () => getPriorityInputs(currencySymbol, config.country, config.hotelType, selectedModules),
  [currencySymbol, config.country, config.hotelType, selectedModules],
);
```

`ProspectIntake` receives `priorityInputs` as a prop and requires no changes.

### 3. Persisting Selection on Submission

In `handleIntakeComplete`, merge `selectedModules` into state before serializing:
```ts
const stateToSave = {
  ...state,
  ui: { ...state.ui, enabledModules: selectedModules },
};
// ...
state: serializeState(stateToSave),
```

The saved presentation opens with exactly the selected modules enabled. The `activePreset` field may not perfectly reflect the selection but is cosmetic — it controls which preset button is highlighted and self-corrects on first module interaction.

**No changes required to:** API routes, database schema, or `serializeState`.

## Files Changed

| File | Change |
|------|--------|
| `components/roi-calculator/PresentationWizard.tsx` | Add `selectedModules` state; render product selection cards on identity screen; pass `selectedModules` to `getPriorityInputs`; merge into state on submission |
| `lib/roi-calculator/utils/priorityInputs.ts` | Add `GROUP_MODULE_FILTER` constant; add optional `enabledModules` param to `getPriorityInputs`; filter inputs before returning |

## Out of Scope

- Changes to `ProspectIntake.tsx`
- Changes to API routes or database schema
- Changes to the ROI results stage
- Adding new products (structure supports it; no new products in this PR)
