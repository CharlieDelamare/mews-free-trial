# Design System Compliance Audit Report

**Last audited**: 2026-03-01
**Design system reference**: `.claude/rules/design-system.md`
**Brand intensity**: Low (internal tool — neutral palette dominant, minimal highlights)

---

## Overall Status: COMPLIANT

The codebase follows the Mews Design System rules correctly. All previously identified violations (~400+) have been remediated.

---

## Compliance Summary

| Area | Status | Implementation |
|------|--------|----------------|
| CSS variables | PASS | All `--mews-*` colors + `--neutral-*` scale defined in `app/globals.css` |
| Tailwind theme | PASS | `gray` overridden with neutral scale; semantic palettes (primary/success/info/warning/error) in `tailwind.config.js` |
| Typography | PASS | Inter loaded via `next/font/google` in `app/layout.tsx`. Inter is the sole web font. |
| No raw Tailwind colors | PASS | Zero instances of `bg-blue-*`, `bg-red-*`, `bg-green-*`, etc. All migrated to semantic tokens. |
| No gradients | PASS | Zero gradient classes. Design system prohibits gradients on lozenges. |
| Semantic buttons | PASS | `primary-600` (actions), `error-600` (destructive), `success-600` (positive), `warning-600` (caution) |
| Page backgrounds | PASS | All pages use `bg-mews-linen` |
| Cards | PASS | `bg-white` on linen background — correct editorial contrast pattern |
| Backdrops | PASS | `bg-gray-900/50` maps to `--neutral-900` = `--mews-night-black` at 50% opacity |
| Focus rings | PASS | Consistent `focus:ring-primary-500` across all inputs |
| Lozenge shapes | PASS | `rounded-full` (badges), `rounded-xl` (cards), `rounded-lg` (inputs) |
| ARIA attributes | PASS | Navbar, SearchableSelect, Toast properly labeled |
| Keyboard navigation | PASS | Arrow keys, Escape, Tab support in custom components |
| Dialog styling | PASS | Uses `color-mix(in srgb, var(--mews-night-black) 50%, transparent)` |
| Highlight colors | PASS | Coral/indigo used sparingly for semantic states only |
| StatusBadge | PASS | Uses semantic tokens: `info-*` (building), `warning-*` (processing), `success-*` (completed), `error-*` (failed) |
| Toast | PASS | Uses `success-600`, `error-600`, `gray-800` (maps to `--neutral-800`) |
| Pagination | PASS | Active page uses `primary-600`; inactive uses gray neutral scale |
| CopyButton | PASS | Uses `primary-600`/`primary-700`/`primary-50` |

---

## Accepted Exceptions

### SVG chevron hex in data URIs
**Files**: `components/SearchableSelect.tsx`, `app/create/page.tsx`, `app/fill/page.tsx`

Inline SVG data URIs use `fill='%2374757D'` (URL-encoded `#74757D` = `--neutral-500`). CSS variables cannot be used inside SVG data URIs. Each instance has a comment documenting the design system mapping:
```
/* Chevron color matches --neutral-500 (#74757D) from design system */
```

### Monospace font in API call logs
**File**: `components/ApiCallLogs.tsx`

`font-mono` is used for JSON/code display in the developer-facing API call log viewer. The design system does not address code display contexts, and monospace is standard practice for structured data.

### Email template inline styles
**File**: `lib/email-service.ts`

HTML email templates require inline styles because email clients don't support CSS variables. All hex values correctly map to design system tokens (linen, night-black, neutral-700, etc.).

---

## Design Token Architecture

### Color Flow
```
globals.css (:root CSS vars)
  → tailwind.config.js (theme.extend.colors maps to CSS vars)
    → Components (use Tailwind classes like bg-primary-600, text-gray-700)
```

### Gray Scale
Tailwind `gray-*` classes are overridden to use the Night Black-derived neutral scale:
- `gray-50` → `--neutral-50` (#F5F5F6)
- `gray-500` → `--neutral-500` (#74757D)
- `gray-900` → `--neutral-900` (#1C1D24 = Night Black)

### Semantic Palettes
| Palette | Base | Usage |
|---------|------|-------|
| Primary | Indigo-based | Actions, links, active states, focus rings |
| Success | Green-based | Completed states, positive actions |
| Info | Blue-based | Building/informational states |
| Warning | Yellow-based | Processing/caution states |
| Error | Coral-based | Failed states, destructive actions |
