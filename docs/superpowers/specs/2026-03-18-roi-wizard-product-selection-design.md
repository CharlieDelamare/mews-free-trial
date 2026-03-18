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

**Product selection is immutable once the user advances to the intake step.** The wizard has no back navigation from intake to identity, so `selectedModules` cannot be changed mid-intake. `useConfidence` state is therefore always consistent with the filtered `priorityInputs`.

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
  revenue:    'guestExperience',  // deliberate simplification: all three revenue fields (currentDirectBookingPercent, averageCommission, currentCheckInPercentage) are guestExperience slice. Note: currentCheckInPercentage is validationOnly — no special handling needed in the filter.
  payments:   'payment',
  rms:        'rms',
};
```

When `enabledModules` is provided, the returned array is filtered to exclude inputs whose group maps to a disabled module. The `property` group is always included. `staffHourlyWage` is in the `property` group and is always shown — it is used in both Guest Experience (check-in savings) and Payment (reconciliation) calculations, so this is correct.

**`hasExistingRMS` question:** This question is passed as separate props to `ProspectIntake` (not as a `priorityInput`), and is currently always shown. When `selectedModules.rms === false`, `PresentationWizard` must pass `hasExistingRMS={false}` and a no-op `onHasExistingRMSChange` to suppress the question. This prevents confusing the sales rep with an RMS question when they have already deselected RMS.

**Confidence scoring:** Filtering inputs to selected-module fields means the confidence score is computed only over those fields. A payment-only run will produce a score based on ~6 fields rather than ~12. This is accepted — the score still reflects how well the rep has populated the relevant fields. This is not addressed further in this PR.

**`useConfidence` and country/hotelType changes mid-intake:** `country` and `hotelType` are editable during intake, which already triggers `priorityInputs` to regenerate via `useMemo`. This pre-existing behaviour is not introduced or changed by this spec and is explicitly out of scope.

**Callsite in `PresentationWizard`:**
```ts
const priorityInputs = useMemo(
  () => getPriorityInputs(currencySymbol, config.country, config.hotelType, selectedModules),
  [currencySymbol, config.country, config.hotelType, selectedModules],
);
```

`ProspectIntake` receives `priorityInputs` as a prop and requires no changes beyond the `hasExistingRMS` suppression above.

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

The saved presentation opens with exactly the selected modules enabled. The `activePreset` field in the serialized state will not be updated here. On load, `detectPreset` computes the correct preset label from `enabledModules` — for a combination that matches a known preset (e.g. `payment`-only), it shows that preset name; for a non-matching combination (e.g. GE + RMS), it returns `'custom'`. Both are correct and expected — no stale or misleading label is shown.

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
