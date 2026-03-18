# ROI Wizard Product Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a product selection UI to the identity screen of the ROI Calculator wizard so that sales reps choose which Mews products apply before proceeding, and the intake step only shows questions relevant to the selected products.

**Architecture:** `PresentationWizard` holds `selectedModules: EnabledModules` in local state, defaulting to all three enabled. Product selection cards are added to the identity screen. `getPriorityInputs` gains an optional `enabledModules` param that filters out intake groups for disabled modules. On submission, `selectedModules` is merged into the serialized calculator state so the saved presentation opens with the correct modules enabled.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, React hooks, Tailwind CSS, Vitest

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `lib/roi-calculator/utils/priorityInputs.ts` | Modify | Add `GROUP_MODULE_FILTER` constant; add optional `enabledModules` param to `getPriorityInputs`; filter returned inputs |
| `tests/lib/roi-calculator/priorityInputs.test.ts` | Create | Tests for the new filtering behaviour |
| `components/roi-calculator/PresentationWizard.tsx` | Modify | Add `selectedModules` state; render product cards on identity screen; pass `selectedModules` to `getPriorityInputs`; suppress `hasExistingRMS` when RMS deselected; merge into state on submission |

---

## Task 1: Filter `getPriorityInputs` by enabled modules

**Files:**
- Modify: `lib/roi-calculator/utils/priorityInputs.ts`
- Create: `tests/lib/roi-calculator/priorityInputs.test.ts`

### Background

`getPriorityInputs` currently returns all ~18 priority inputs regardless of which products the prospect will use. Intake groups map to modules as follows:

| Group | Module |
|-------|--------|
| `property` | always shown |
| `operations` | `guestExperience` |
| `revenue` | `guestExperience` |
| `payments` | `payment` |
| `rms` | `rms` |

We add a `GROUP_MODULE_FILTER` constant encoding this mapping, then filter the returned array when `enabledModules` is provided.

---

- [ ] **Step 1.1: Write the failing tests**

Create `tests/lib/roi-calculator/priorityInputs.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getPriorityInputs } from '@/lib/roi-calculator/utils/priorityInputs';
import type { EnabledModules } from '@/lib/roi-calculator/types/calculator';

const ALL: EnabledModules = { guestExperience: true, payment: true, rms: true };

describe('getPriorityInputs', () => {
  it('returns all inputs when enabledModules is not provided (backward-compat)', () => {
    const inputs = getPriorityInputs('£', 'United Kingdom', 'City Hotel');
    const groups = new Set(inputs.map((i) => i.group));
    expect(groups).toContain('property');
    expect(groups).toContain('operations');
    expect(groups).toContain('revenue');
    expect(groups).toContain('payments');
    expect(groups).toContain('rms');
  });

  it('returns all inputs when all modules enabled', () => {
    const inputs = getPriorityInputs('£', 'United Kingdom', 'City Hotel', ALL);
    const groups = new Set(inputs.map((i) => i.group));
    expect(groups).toContain('property');
    expect(groups).toContain('operations');
    expect(groups).toContain('revenue');
    expect(groups).toContain('payments');
    expect(groups).toContain('rms');
  });

  it('excludes operations and revenue groups when guestExperience is disabled', () => {
    const inputs = getPriorityInputs('£', 'United Kingdom', 'City Hotel', {
      ...ALL,
      guestExperience: false,
    });
    const groups = inputs.map((i) => i.group);
    expect(groups).not.toContain('operations');
    expect(groups).not.toContain('revenue');
    expect(groups).toContain('property');
    expect(groups).toContain('payments');
    expect(groups).toContain('rms');
  });

  it('excludes payments group when payment is disabled', () => {
    const inputs = getPriorityInputs('£', 'United Kingdom', 'City Hotel', {
      ...ALL,
      payment: false,
    });
    const groups = inputs.map((i) => i.group);
    expect(groups).not.toContain('payments');
    expect(groups).toContain('property');
    expect(groups).toContain('operations');
    expect(groups).toContain('rms');
  });

  it('excludes rms group when rms is disabled', () => {
    const inputs = getPriorityInputs('£', 'United Kingdom', 'City Hotel', {
      ...ALL,
      rms: false,
    });
    const groups = inputs.map((i) => i.group);
    expect(groups).not.toContain('rms');
    expect(groups).toContain('property');
    expect(groups).toContain('operations');
    expect(groups).toContain('payments');
  });

  it('returns only property group when all modules disabled', () => {
    const inputs = getPriorityInputs('£', 'United Kingdom', 'City Hotel', {
      guestExperience: false,
      payment: false,
      rms: false,
    });
    const groups = new Set(inputs.map((i) => i.group));
    expect(groups).toEqual(new Set(['property']));
  });
});
```

- [ ] **Step 1.2: Run the tests and confirm they fail**

```bash
npm run test tests/lib/roi-calculator/priorityInputs.test.ts
```

Expected: all tests fail because `getPriorityInputs` does not yet accept a fourth argument.

- [ ] **Step 1.3: Implement the filtering in `getPriorityInputs`**

Open `lib/roi-calculator/utils/priorityInputs.ts`. Make two changes:

**a) Add the import** at the top of the file (after the existing `PriorityInput` import):

```ts
import type { EnabledModules, ModuleKey } from '@/lib/roi-calculator/types/calculator';
```

**b) Add the `GROUP_MODULE_FILTER` constant** immediately above the `getPriorityInputs` function.

Note: `PriorityInput.group` is typed as `'property' | 'operations' | 'revenue' | 'payments' | 'rms'` (a union, not `string`). Using that union as the key type gives TypeScript exhaustiveness checking — if a new group is added to the union without being added here, the build will error.

```ts
type InputGroup = 'property' | 'operations' | 'revenue' | 'payments' | 'rms';

const GROUP_MODULE_FILTER: Record<InputGroup, ModuleKey | 'all'> = {
  property:   'all',
  operations: 'guestExperience',
  revenue:    'guestExperience',
  payments:   'payment',
  rms:        'rms',
};
```

**c) Update the function signature** (add optional fourth param):

```ts
export function getPriorityInputs(
  currencySymbol: string,
  country: string,
  hotelType: string,
  enabledModules?: EnabledModules,
): PriorityInput[] {
```

**d) Add filter at the end of the function**, replacing the final `return inputs;`:

```ts
  if (!enabledModules) return inputs;

  return inputs.filter((input) => {
    const module = GROUP_MODULE_FILTER[input.group];
    if (!module || module === 'all') return true;
    return enabledModules[module];
  });
```

The complete tail of the function should look like:

```ts
  // (existing inputs.push(...) for rms group stays as-is)

  if (!enabledModules) return inputs;

  return inputs.filter((input) => {
    const module = GROUP_MODULE_FILTER[input.group];
    if (!module || module === 'all') return true;
    return enabledModules[module];
  });
}
```

- [ ] **Step 1.4: Run the tests and confirm they pass**

```bash
npm run test tests/lib/roi-calculator/priorityInputs.test.ts
```

Expected: all 5 tests pass.

- [ ] **Step 1.5: Run the full test suite to confirm no regressions**

```bash
npm run test
```

Expected: all existing tests still pass.

- [ ] **Step 1.6: Commit**

```bash
git add lib/roi-calculator/utils/priorityInputs.ts tests/lib/roi-calculator/priorityInputs.test.ts
git commit -m "feat: filter priority inputs by enabled modules"
```

---

## Task 2: Add product selection cards to the identity screen

**Files:**
- Modify: `components/roi-calculator/PresentationWizard.tsx`

### Background

The identity screen currently has three form fields (hotel name, Salesforce ID, your name) and a Continue button. We add:
- `selectedModules` local state (all three enabled by default)
- A "Products" section with three toggle cards below the form fields
- A validation guard: Continue is disabled and an error hint shown if nothing is selected

The card list is driven by `MODULE_KEYS` (exported from `hooks/useROICalculator.ts`), so adding a new product in the future only requires extending `ModuleKey`/`EnabledModules`/`MODULE_META` — no changes to this component.

**Note on test coverage:** The codebase has no existing component tests using React Testing Library or jsdom, and setting that up is out of scope. The interactive card behaviour and button guard are instead covered by the Manual Verification Checklist at the end of this plan.

---

- [ ] **Step 2.1: Update imports in `PresentationWizard.tsx`**

Add to the existing lucide import line:

```ts
import { ArrowRight, Users, CreditCard, BarChart3 } from 'lucide-react';
```

Add new imports after the existing hook/util imports:

```ts
import type { ReactNode } from 'react';
import { MODULE_KEYS, MODULE_META } from '@/hooks/useROICalculator';
import type { EnabledModules } from '@/lib/roi-calculator/types/calculator';
```

- [ ] **Step 2.2: Add `selectedModules` state and derived value**

Inside the `PresentationWizard` component, after the existing `useState` declarations, add:

```ts
const [selectedModules, setSelectedModules] = useState<EnabledModules>({
  guestExperience: true,
  payment: true,
  rms: true,
});

const hasSelectedModule = Object.values(selectedModules).some(Boolean);
```

- [ ] **Step 2.3: Add the module icons map**

Inside the component, after `hasSelectedModule`, add:

```ts
const MODULE_ICONS: Record<string, ReactNode> = {
  guestExperience: <Users className="w-5 h-5" />,
  payment: <CreditCard className="w-5 h-5" />,
  rms: <BarChart3 className="w-5 h-5" />,
};
```

- [ ] **Step 2.4: Add products section to the identity form**

In the identity screen JSX (`if (step === 'identity') { return (...) }`), insert the following **between** the "Your name" field block and the Continue button:

```tsx
<div>
  <label
    className="block text-sm font-medium text-[--mews-night-black] mb-3"
    style={{ fontFamily: 'var(--font-body)' }}
  >
    Products <span className="text-[--mews-coral]">*</span>
  </label>
  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
    {MODULE_KEYS.map((key) => {
      const meta = MODULE_META[key];
      const selected = selectedModules[key];
      return (
        <button
          key={key}
          type="button"
          onClick={() =>
            setSelectedModules((prev) => ({ ...prev, [key]: !prev[key] }))
          }
          className={`flex flex-col gap-1 p-4 rounded-xl border text-left transition-colors ${
            selected
              ? 'border-[--mews-indigo] bg-[--mews-light-indigo]'
              : 'border-[--mews-night-black]/15 bg-white hover:border-[--mews-night-black]/30'
          }`}
        >
          <span
            className={selected ? 'text-[--mews-indigo]' : 'text-[--mews-night-black]/40'}
          >
            {MODULE_ICONS[key]}
          </span>
          <span
            className="text-sm font-medium text-[--mews-night-black]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {meta.label}
          </span>
          <span
            className="text-xs text-[--mews-night-black]/50 leading-tight"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {meta.description}
          </span>
        </button>
      );
    })}
  </div>
  {!hasSelectedModule && (
    <p
      className="mt-1.5 text-sm text-[--mews-coral]"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      Select at least one product to continue
    </p>
  )}
</div>
```

- [ ] **Step 2.5: Guard the Continue button and form submission**

Update the Continue button's `disabled` prop:

```tsx
disabled={isSubmitting || !hasSelectedModule}
```

Update `handleIdentitySubmit` to also guard against no selection (belt-and-suspenders — the button is already disabled, but this prevents keyboard/accessibility bypasses):

```ts
function handleIdentitySubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!name.trim()) {
    setNameError('Hotel or group name is required');
    return;
  }
  if (!hasSelectedModule) return;
  setNameError('');
  setStep('intake');
}
```

- [ ] **Step 2.6: Verify the build compiles cleanly**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 2.7: Commit**

```bash
git add components/roi-calculator/PresentationWizard.tsx
git commit -m "feat: add product selection cards to ROI wizard identity screen"
```

---

## Task 3: Wire intake filtering, suppress hasExistingRMS, persist selection

**Files:**
- Modify: `components/roi-calculator/PresentationWizard.tsx`

### Background

Three remaining wires to connect:
1. Pass `selectedModules` into `getPriorityInputs` so the intake step only shows relevant questions.
2. Suppress the `hasExistingRMS` question in `ProspectIntake` when the user has already deselected RMS — passing it as false + no-op avoids a confusing question.
3. Merge `selectedModules` into the serialized state before saving so the presentation opens with the correct modules enabled.

---

- [ ] **Step 3.1: Pass `selectedModules` into `getPriorityInputs`**

In `PresentationWizard`, find the existing `useMemo` for `priorityInputs`:

```ts
// BEFORE
const priorityInputs = useMemo(
  () => getPriorityInputs(currencySymbol, config.country, config.hotelType),
  [currencySymbol, config.country, config.hotelType],
);
```

Replace it with:

```ts
// AFTER
const priorityInputs = useMemo(
  () => getPriorityInputs(currencySymbol, config.country, config.hotelType, selectedModules),
  [currencySymbol, config.country, config.hotelType, selectedModules],
);
```

- [ ] **Step 3.2: Suppress `hasExistingRMS` when RMS is deselected**

In the `<ProspectIntake ... />` JSX, find these two props:

```tsx
// BEFORE
hasExistingRMS={state.rms.hasExistingRMS}
onHasExistingRMSChange={(value) =>
  dispatch({ type: 'SET_FIELD', slice: 'rms', field: 'hasExistingRMS', value })
}
```

Replace with:

```tsx
// AFTER
hasExistingRMS={selectedModules.rms ? state.rms.hasExistingRMS : false}
onHasExistingRMSChange={
  selectedModules.rms
    ? (value) => dispatch({ type: 'SET_FIELD', slice: 'rms', field: 'hasExistingRMS', value })
    : () => {}
}
```

- [ ] **Step 3.3: Merge `selectedModules` into state on submission**

Replace the entire `handleIntakeComplete` function body with the version below. The key change: `stateToSave` is constructed before the `fetch` call, merging `selectedModules` into `ui.enabledModules`, and `serializeState(stateToSave)` is used instead of `serializeState(state)`.

Full updated `handleIntakeComplete`:

```ts
async function handleIntakeComplete() {
  setIsSubmitting(true);
  setSubmitError('');
  try {
    const stateToSave = {
      ...state,
      ui: { ...state.ui, enabledModules: selectedModules },
    };
    const res = await fetch('/api/roi-presentations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        salesforceAccountId: salesforceAccountId.trim() || undefined,
        createdBy: createdBy.trim() || undefined,
        state: serializeState(stateToSave),
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
```

- [ ] **Step 3.4: Verify the build compiles cleanly**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3.5: Run the full test suite**

```bash
npm run test
```

Expected: all tests pass (the new `priorityInputs` tests from Task 1 plus all pre-existing tests).

- [ ] **Step 3.6: Commit**

```bash
git add components/roi-calculator/PresentationWizard.tsx
git commit -m "feat: wire product selection into intake filtering and persistence"
```

---

## Manual Verification Checklist

After all tasks are complete, verify the following in the browser (`npm run dev` → `http://localhost:3000/roi-calculator/new`):

- [ ] All three product cards render on the identity screen
- [ ] Clicking a selected card deselects it; clicking again re-selects it
- [ ] With all three deselected the Continue button is disabled and the error hint is visible
- [ ] With at least one selected the Continue button is enabled
- [ ] Selecting only "Payments & Billing" → intake shows only property + payments questions (no check-in times, no RMS fields)
- [ ] Selecting only "RMS" → intake shows only property + rms questions
- [ ] Selecting only "Guest Experience" → intake shows only property + operations + revenue questions; no "Do you already have an RMS?" question
- [ ] Selecting all three → intake shows all questions (same as current behaviour)
- [ ] After completing the wizard, the saved presentation opens with only the selected modules shown in the ROI stage
