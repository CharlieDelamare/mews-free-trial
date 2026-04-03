# Tech Debt Phase 1 — Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the four highest-priority, lowest-effort tech debt items identified in the April 2026 audit: duplicated environment-fetching logic across 7 pages, raw `console.log` pollution in `mews-data-service.ts`, stale Vitest version note in `testing.md`, and a misplaced build dependency in `package.json`.

**Architecture:** Extract a shared `useEnvironments` hook that 7 pages can import instead of each implementing their own `fetchEnvironments`. Replace the ~50 raw `console.log`/`console.error` calls in `mews-data-service.ts` with `forceLog`/`forceError` from the existing `lib/force-log.ts` utility. Fix two trivial doc/config issues.

**Tech Stack:** Next.js 14 App Router · TypeScript strict · Vitest 4 + `@testing-library/react` + `happy-dom` · `renderHook` from `@testing-library/react`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| **Create** | `hooks/useEnvironments.ts` | Single shared hook: fetch, sort, loading state, error handling |
| **Create** | `hooks/useEnvironments.test.ts` | Tests for the hook: success, error, sort order, loading states |
| **Modify** | `app/fill/page.tsx` | Replace inline `fetchEnvironments` + state with `useEnvironments` |
| **Modify** | `app/reset/page.tsx` | Same |
| **Modify** | `app/close-bills/page.tsx` | Same |
| **Modify** | `app/extend/page.tsx` | Same |
| **Modify** | `app/save/page.tsx` | Same |
| **Modify** | `app/add-bi/page.tsx` | Same |
| **Modify** | `app/control-centre/page.tsx` | Same (also preserves localStorage restore logic) |
| **Modify** | `lib/mews-data-service.ts` | Swap `console.log` → `forceLog`, `console.error` → `forceError` |
| **Modify** | `docs/claude/testing.md` | Update Vitest version note from v3 to v4 |
| **Modify** | `package.json` | Move `@rollup/rollup-linux-x64-gnu` to `devDependencies` |

---

## Task 1: Write the `useEnvironments` hook (TDD)

**Files:**
- Create: `hooks/useEnvironments.ts`
- Create: `hooks/useEnvironments.test.ts`

### Background

The `Environment` type is defined inline in every page with the same shape. The hook returns this type plus loading state, and exposes a `refetch` function (some pages call `fetchEnvironments()` again after a mutation).

The `/api/environments/list` endpoint returns `{ success: boolean, environments: Environment[] }`.

The sort order is alphabetical by `propertyName || enterpriseName` (case-insensitive).

- [ ] **Step 1.1: Write the failing tests**

Create `hooks/useEnvironments.test.ts`:

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEnvironments } from './useEnvironments';

const mockEnvs = [
  { enterpriseId: 'b', enterpriseName: 'Beta Hotel', propertyName: 'Beta', type: 'trial' as const, createdAt: new Date(), accessTokenId: 2 },
  { enterpriseId: 'a', enterpriseName: 'Alpha Hotel', propertyName: undefined, type: 'manual' as const, createdAt: new Date(), accessTokenId: 1 },
  { enterpriseId: 'c', enterpriseName: 'Gamma Hotel', propertyName: 'A First', type: 'trial' as const, createdAt: new Date(), accessTokenId: 3 },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useEnvironments', () => {
  test('returns empty array and loading=true before fetch resolves', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => new Promise(() => {}), // never resolves
    } as unknown as Response);

    const { result } = renderHook(() => useEnvironments());

    expect(result.current.environments).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  test('returns environments sorted by propertyName || enterpriseName', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ success: true, environments: mockEnvs }),
    } as unknown as Response);

    const { result } = await act(async () => renderHook(() => useEnvironments()));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // 'A First' (Gamma, propertyName), 'Alpha Hotel' (Alpha, no propertyName → enterpriseName), 'Beta' (Beta, propertyName)
    expect(result.current.environments.map(e => e.enterpriseId)).toEqual(['c', 'a', 'b']);
  });

  test('sets loading=false and environments=[] when fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEnvironments());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.environments).toEqual([]);
  });

  test('sets loading=false and environments=[] when API returns success=false', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ success: false }),
    } as unknown as Response);

    const { result } = renderHook(() => useEnvironments());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.environments).toEqual([]);
  });

  test('refetch re-runs the fetch', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ success: true, environments: [] }),
    } as unknown as Response);

    const { result } = renderHook(() => useEnvironments());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 1.2: Run the test to verify it fails**

```bash
cd /path/to/repo && npm run test -- hooks/useEnvironments.test.ts
```

Expected: FAIL — `Cannot find module './useEnvironments'`

- [ ] **Step 1.3: Implement the hook**

Create `hooks/useEnvironments.ts`:

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Environment {
  enterpriseId: string;
  enterpriseName: string;
  propertyName?: string;
  type: 'trial' | 'manual';
  status?: string;
  customerEmail?: string;
  createdAt: Date;
  accessTokenId: number;
}

interface UseEnvironmentsResult {
  environments: Environment[];
  loading: boolean;
  refetch: () => void;
}

function sortEnvironments(envs: Environment[]): Environment[] {
  return [...envs].sort((a, b) => {
    const nameA = (a.propertyName || a.enterpriseName || '').toLowerCase();
    const nameB = (b.propertyName || b.enterpriseName || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

export function useEnvironments(): UseEnvironmentsResult {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEnvironments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/environments/list');
      const data = await response.json();
      if (data.success) {
        setEnvironments(sortEnvironments(data.environments || []));
      }
    } catch {
      // fetch failed — leave environments empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  return { environments, loading, refetch: fetchEnvironments };
}
```

- [ ] **Step 1.4: Run the tests to verify they pass**

```bash
npm run test -- hooks/useEnvironments.test.ts
```

Expected: all 5 tests PASS

- [ ] **Step 1.5: Commit**

```bash
git add hooks/useEnvironments.ts hooks/useEnvironments.test.ts
git commit -m "feat: extract useEnvironments hook from duplicate page logic"
```

---

## Task 2: Migrate `app/fill/page.tsx`

**Files:**
- Modify: `app/fill/page.tsx`

- [ ] **Step 2.1: Replace the inline `Environment` interface, state, and `fetchEnvironments` with the hook**

In `app/fill/page.tsx`:

1. Remove the `interface Environment { ... }` block (lines 8–17).
2. Replace the `import { useState, useEffect, useRef }` with `import { useState, useEffect, useRef }` (keep existing, just remove the `useEffect` call for environments if it becomes unused — but keep the one for `fetchServicesForEnvironment`).
3. Add the import: `import { useEnvironments } from '@/hooks/useEnvironments';`
4. Remove the two state declarations:
   ```typescript
   // DELETE these two lines:
   const [environments, setEnvironments] = useState<Environment[]>([]);
   const [environmentsLoading, setEnvironmentsLoading] = useState(false);
   ```
5. Remove the `useEffect(() => { fetchEnvironments(); }, []);` block.
6. Remove the entire `fetchEnvironments` function (lines 66–84).
7. Add after the router declaration:
   ```typescript
   const { environments, loading: environmentsLoading, refetch: fetchEnvironments } = useEnvironments();
   ```

The rest of the file — `fetchServicesForEnvironment`, form state, JSX — stays exactly as-is. The manual-add section calls `fetchEnvironments()` after a successful token store; this still works because `refetch` is exposed as `fetchEnvironments`.

- [ ] **Step 2.2: Verify the build still passes**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors. Look for `✓ Compiled successfully` or similar.

- [ ] **Step 2.3: Commit**

```bash
git add app/fill/page.tsx
git commit -m "refactor(fill): use shared useEnvironments hook"
```

---

## Task 3: Migrate `app/reset/page.tsx`

**Files:**
- Modify: `app/reset/page.tsx`

- [ ] **Step 3.1: Apply the same hook migration**

In `app/reset/page.tsx`:

1. Remove `interface Environment { ... }`.
2. Add import: `import { useEnvironments } from '@/hooks/useEnvironments';`
3. Remove:
   ```typescript
   const [environments, setEnvironments] = useState<Environment[]>([]);
   const [environmentsLoading, setEnvironmentsLoading] = useState(false);
   ```
4. Remove the `useEffect(() => { fetchEnvironments(); }, []);` block.
5. Remove the `fetchEnvironments` async function.
6. Add after the router/state declarations:
   ```typescript
   const { environments, loading: environmentsLoading, refetch: fetchEnvironments } = useEnvironments();
   ```

The manual-add section calls `fetchEnvironments()` after a token is stored — this continues to work via `refetch`.

- [ ] **Step 3.2: Check imports — remove unused `useState`/`useEffect` if now unnecessary**

`reset/page.tsx` uses `useCallback` (for `handleDialogClose`) and `useRef` (dialog) — keep those. It uses `useState` for other page state — keep that. Remove `useEffect` only if the only `useEffect` it had was for `fetchEnvironments`. Check: there's also a `useEffect` for dialog show/hide, so keep `useEffect`.

- [ ] **Step 3.3: Verify the build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 3.4: Commit**

```bash
git add app/reset/page.tsx
git commit -m "refactor(reset): use shared useEnvironments hook"
```

---

## Task 4: Migrate `app/close-bills/page.tsx`

**Files:**
- Modify: `app/close-bills/page.tsx`

- [ ] **Step 4.1: Apply the hook migration**

In `app/close-bills/page.tsx`:

1. Remove `interface Environment { ... }`.
2. Add import: `import { useEnvironments } from '@/hooks/useEnvironments';`
3. Remove:
   ```typescript
   const [environments, setEnvironments] = useState<Environment[]>([]);
   const [environmentsLoading, setEnvironmentsLoading] = useState(false);
   ```
4. Remove the initial `useEffect(() => { fetchEnvironments(); }, []);`.
5. Remove the `fetchEnvironments` function.
6. Add:
   ```typescript
   const { environments, loading: environmentsLoading, refetch: fetchEnvironments } = useEnvironments();
   ```

- [ ] **Step 4.2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 4.3: Commit**

```bash
git add app/close-bills/page.tsx
git commit -m "refactor(close-bills): use shared useEnvironments hook"
```

---

## Task 5: Migrate `app/extend/page.tsx`

**Files:**
- Modify: `app/extend/page.tsx`

- [ ] **Step 5.1: Apply the hook migration**

In `app/extend/page.tsx`:

1. Remove `interface Environment { ... }`.
2. Add import: `import { useEnvironments } from '@/hooks/useEnvironments';`
3. Remove:
   ```typescript
   const [environments, setEnvironments] = useState<Environment[]>([]);
   const [environmentsLoading, setEnvironmentsLoading] = useState(false);
   ```
4. Remove the `useEffect(() => { fetchEnvironments(); }, []);`.
5. Remove the `fetchEnvironments` function.
6. Add:
   ```typescript
   const { environments, loading: environmentsLoading } = useEnvironments();
   ```

Note: `extend/page.tsx` does NOT call `fetchEnvironments()` after mutations (it navigates away on success). So `refetch` is not needed here — don't destructure it.

- [ ] **Step 5.2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 5.3: Commit**

```bash
git add app/extend/page.tsx
git commit -m "refactor(extend): use shared useEnvironments hook"
```

---

## Task 6: Migrate `app/save/page.tsx`

**Files:**
- Modify: `app/save/page.tsx`

- [ ] **Step 6.1: Apply the hook migration**

In `app/save/page.tsx`:

1. Remove `interface Environment { ... }`.
2. Add import: `import { useEnvironments } from '@/hooks/useEnvironments';`
3. Remove:
   ```typescript
   const [environments, setEnvironments] = useState<Environment[]>([]);
   const [environmentsLoading, setEnvironmentsLoading] = useState(false);
   ```
4. Remove the `useEffect(() => { fetchEnvironments(); }, []);`.
5. Remove the `fetchEnvironments` function.
6. Add:
   ```typescript
   const { environments, loading: environmentsLoading } = useEnvironments();
   ```

`save/page.tsx` navigates away on success — `refetch` not needed.

- [ ] **Step 6.2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 6.3: Commit**

```bash
git add app/save/page.tsx
git commit -m "refactor(save): use shared useEnvironments hook"
```

---

## Task 7: Migrate `app/add-bi/page.tsx`

**Files:**
- Modify: `app/add-bi/page.tsx`

- [ ] **Step 7.1: Apply the hook migration**

`add-bi/page.tsx` uses `useCallback` to wrap its `fetchEnvironments` (slightly different pattern). Replace it:

1. Remove `interface Environment { ... }`.
2. Add import: `import { useEnvironments } from '@/hooks/useEnvironments';`
3. Remove:
   ```typescript
   const [environments, setEnvironments] = useState<Environment[]>([]);
   const [loading, setLoading] = useState(false);
   ```
4. Remove the `fetchEnvironments = useCallback(async () => { ... }, [])` declaration.
5. Remove the `useEffect(() => { fetchEnvironments(); }, [fetchEnvironments]);`.
6. Add at the top of the component:
   ```typescript
   const { environments, loading, refetch: fetchEnvironments } = useEnvironments();
   ```

The manual-add section calls `fetchEnvironments()` after storing a token — `refetch` covers this.

- [ ] **Step 7.2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 7.3: Commit**

```bash
git add app/add-bi/page.tsx
git commit -m "refactor(add-bi): use shared useEnvironments hook"
```

---

## Task 8: Migrate `app/control-centre/page.tsx`

**Files:**
- Modify: `app/control-centre/page.tsx`

This page has a special case: after loading, it restores a previously selected environment from `localStorage`. The hook doesn't handle this — the page keeps that logic.

- [ ] **Step 8.1: Apply the hook migration with localStorage restore preserved**

In `app/control-centre/page.tsx`:

1. Remove `interface Environment { ... }` (lines 14–19 — the slim version with only 3 fields).
2. Add imports:
   ```typescript
   import { useEnvironments, type Environment } from '@/hooks/useEnvironments';
   ```
3. Remove:
   ```typescript
   const [environments, setEnvironments] = useState<Environment[]>([]);
   const [environmentsLoading, setEnvironmentsLoading] = useState(false);
   ```
4. Remove the `useEffect(() => { fetchEnvironments(); }, []);`.
5. Remove the `STORAGE_KEY` constant and the `fetchEnvironments` function.
6. Add after the other state declarations:
   ```typescript
   const STORAGE_KEY = 'controlCentre.enterpriseId';
   const { environments, loading: environmentsLoading, refetch: fetchEnvironments } = useEnvironments();
   ```
7. Add a new `useEffect` to restore localStorage selection when environments load:
   ```typescript
   useEffect(() => {
     if (environments.length === 0) return;
     const saved = localStorage.getItem(STORAGE_KEY);
     if (saved && environments.some(e => e.enterpriseId === saved)) {
       setSelectedEnterpriseId(saved);
     }
   }, [environments]);
   ```

The manual-add section calls `fetchEnvironments()` after storing a token — still works via `refetch`.

- [ ] **Step 8.2: Verify build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 8.3: Commit**

```bash
git add app/control-centre/page.tsx
git commit -m "refactor(control-centre): use shared useEnvironments hook"
```

---

## Task 9: Fix logging in `lib/mews-data-service.ts`

**Files:**
- Modify: `lib/mews-data-service.ts`

### Background

`mews-data-service.ts` uses raw `console.log` and `console.error` throughout (~50 calls). The codebase already has `lib/force-log.ts` which exports `forceLog(prefix, msg, data?)` and `forceError(prefix, msg, error?)`. These write to stderr (unbuffered) so logs appear immediately in Vercel's runtime, unlike buffered stdout.

The `force-log.ts` convenience exports (`log.customers`, etc.) are domain-specific (customers, reservations, etc.). For `mews-data-service.ts` we call `forceLog` and `forceError` directly with the existing `[MEWS-DATA]` / `[RATE-UPDATE]` prefixes — this matches the pattern used in the rest of the codebase.

- [ ] **Step 9.1: Add the import**

At the top of `lib/mews-data-service.ts`, add:

```typescript
import { forceLog, forceError } from '@/lib/force-log';
```

- [ ] **Step 9.2: Replace all `console.log(...)` calls**

Every `console.log(...)` call in this file uses a string that starts with `'[MEWS-DATA]...'` or `'[RATE-UPDATE]...'`. The `forceLog` signature is `forceLog(prefix, message, data?)`.

The conversion pattern is:

```typescript
// Before:
console.log('[MEWS-DATA] Found 5 bookable service(s)');
console.log('[MEWS-DATA] ✅ Fetch complete:', { service: serviceId, rates: rateMap.length });

// After:
forceLog('[MEWS-DATA]', 'Found 5 bookable service(s)');
forceLog('[MEWS-DATA]', '✅ Fetch complete:', { service: serviceId, rates: rateMap.length });
```

For template-literal calls:

```typescript
// Before:
console.log(`[MEWS-DATA] Using provided service ID: ${serviceId}`);

// After:
forceLog('[MEWS-DATA]', `Using provided service ID: ${serviceId}`);
```

For calls that pass an object as the second arg (e.g. `console.log('[MEWS-DATA] Result:', { ... })`):

```typescript
// Before:
console.log('[MEWS-DATA] Resource counts per category:');
console.log(`[MEWS-DATA]   - ${rc.name} (${rc.type}): ${rc.resourceCount} resources`);

// After:
forceLog('[MEWS-DATA]', 'Resource counts per category:');
forceLog('[MEWS-DATA]', `  - ${rc.name} (${rc.type}): ${rc.resourceCount} resources`);
```

Apply this pattern to ALL `console.log` calls in the file. The prefix is whatever bracket prefix the existing log line uses (`[MEWS-DATA]` or `[RATE-UPDATE]`).

- [ ] **Step 9.3: Replace all `console.error(...)` calls**

```typescript
// Before:
console.error('[MEWS-DATA] ❌ Failed to fetch Mews data:', error);
console.error(`[MEWS-DATA] No active/enabled rates found`);

// After:
forceError('[MEWS-DATA]', '❌ Failed to fetch Mews data:', error);
forceError('[MEWS-DATA]', 'No active/enabled rates found');
```

For `console.warn`:

```typescript
// Before:
console.warn(`[MEWS-DATA] ⚠️  Voucher code ${voucherCode.Value} has no rate assignments`);

// After:
forceLog('[MEWS-DATA]', `⚠️  Voucher code ${voucherCode.Value} has no rate assignments`);
```

(`forceLog` is appropriate for warnings in this codebase — there's no `forceWarn` export.)

- [ ] **Step 9.4: Verify no `console.*` calls remain**

```bash
grep -n "console\." lib/mews-data-service.ts
```

Expected: no output.

- [ ] **Step 9.5: Verify the build**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 9.6: Commit**

```bash
git add lib/mews-data-service.ts
git commit -m "fix(logging): replace console.log with forceLog in mews-data-service"
```

---

## Task 10: Fix stale Vitest version note and misplaced dependency

**Files:**
- Modify: `docs/claude/testing.md`
- Modify: `package.json`

- [ ] **Step 10.1: Update `testing.md`**

In `docs/claude/testing.md`, line 5 currently reads:

```
- **Runner**: Vitest (v3) with happy-dom — pinned to v3, do not upgrade to v4
```

Change it to:

```
- **Runner**: Vitest (v4) with happy-dom
```

- [ ] **Step 10.2: Move `@rollup/rollup-linux-x64-gnu` to `devDependencies`**

In `package.json`, move the `@rollup/rollup-linux-x64-gnu` entry from the `dependencies` object to the `devDependencies` object. The version stays the same (`^4.57.1`).

Before (in `dependencies`):
```json
"@rollup/rollup-linux-x64-gnu": "^4.57.1",
```

After (in `devDependencies`):
```json
"@rollup/rollup-linux-x64-gnu": "^4.57.1",
```

- [ ] **Step 10.3: Verify the build still works**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 10.4: Commit**

```bash
git add docs/claude/testing.md package.json
git commit -m "chore: fix stale vitest version note and move rollup to devDeps"
```

---

## Task 11: Run the full test suite

- [ ] **Step 11.1: Run all tests**

```bash
npm run test 2>&1 | tail -30
```

Expected: all existing tests pass. The new `useEnvironments` tests pass. No regressions.

- [ ] **Step 11.2: Check that coverage thresholds still pass**

```bash
npm run test:coverage 2>&1 | tail -20
```

Expected: statements ≥ 30%, branches ≥ 25%, functions ≥ 25%, lines ≥ 30% (thresholds from `vitest.config.ts`).

---

## Self-Review

### Spec coverage check

| Audit item | Covered by task |
|------------|----------------|
| `fetchEnvironments` duplicated in 7 pages | Tasks 1–8 |
| `mews-data-service.ts` raw console.log | Task 9 |
| Stale `testing.md` Vitest v3 note | Task 10 |
| `@rollup/rollup-linux-x64-gnu` in wrong dep section | Task 10 |

All four Phase 1 items covered. ✓

### Placeholder scan

No TBD, TODO, or "implement later" in this plan. ✓

### Type consistency

`useEnvironments` returns `{ environments: Environment[], loading: boolean, refetch: () => void }`.

- Tasks 2–7 destructure `environments`, `loading: environmentsLoading`, and optionally `refetch: fetchEnvironments`. ✓
- Task 8 uses all three plus adds a separate `useEffect` for localStorage. ✓
- The `Environment` type is exported from `hooks/useEnvironments.ts` and re-imported in Task 8 via `import { useEnvironments, type Environment }`. ✓
- `control-centre/page.tsx` had a narrower local `Environment` (only 3 fields). Importing the full type from the hook is safe — the page only accesses `enterpriseId`, `enterpriseName`, and `propertyName`, all of which exist on the full type. ✓
