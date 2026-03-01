# Design System Compliance Audit Report

## Context

Audit of every frontend file against the Mews Design System rules defined in `.claude/rules/design-system.md`. This app is an internal tool (Low brand intensity), meaning the neutral palette should be dominant with minimal highlights.

---

## CRITICAL: Missing Foundation (Root Cause)

These 3 files must be fixed first — without them, no component can reference design tokens.

- [ ] **`app/globals.css`** — No `:root` block with `--mews-*` color variables or `--font-*` typography variables defined
- [ ] **`tailwind.config.js`** — No `theme.extend.colors` mapping to Mews palette; no `fontFamily` entries for Axiforma/Inter
- [ ] **`app/layout.tsx`** — No font loading (no `next/font` imports, no `<link>` tags for Axiforma or Inter)

---

## File-by-File Violation Checklist

### `app/globals.css`

- [ ] **Line 12:** `rgba(0, 0, 0, 0.5)` — hardcoded color in `dialog::backdrop`. Should use `--mews-night-black` with opacity

### `app/layout.tsx`

- [ ] **Lines 1-26:** No font loading mechanism — app renders in browser default sans-serif instead of Axiforma/Inter

### `app/navbar.tsx`

- [ ] **Line 45:** `text-blue-600 bg-blue-50` (active link) — should use `--mews-indigo`/`--mews-light-indigo`
- [ ] **Line 46:** `text-gray-700 hover:text-blue-600 hover:bg-gray-50` (inactive link)
- [ ] **Line 52:** `bg-white border-b border-gray-200` (nav bar) — should use `--mews-white` or `--mews-linen`
- [ ] **Line 59:** `text-gray-600 hover:text-gray-900 hover:bg-gray-100` (menu button)
- [ ] **Line 65:** `text-gray-900` (title text) — should use `--mews-night-black`
- [ ] **Line 74:** `bg-black/50` (backdrop) — should use `--mews-night-black` with opacity
- [ ] **Line 83:** `bg-white` (sidebar)
- [ ] **Line 89:** `border-b border-gray-200`
- [ ] **Line 90:** `text-gray-900`
- [ ] **Line 95:** `text-gray-600 hover:text-gray-900 hover:bg-gray-100`
- [ ] **Lines 106, 117:** `text-gray-400` (section labels)
- [ ] **Line 128:** `border-t border-gray-200`

### `components/Toast.tsx`

- [ ] **Line 44:** `bg-green-600 text-white` (success) — should use semantic green token
- [ ] **Line 45:** `bg-red-600 text-white` (error) — should use `--mews-coral` or semantic red
- [ ] **Line 46:** `bg-gray-800 text-white` (info) — should use `--mews-deep-blue` or `--mews-night-black`

### `components/SearchableSelect.tsx`

- [ ] **Line 130:** `border-gray-300`, `focus:ring-blue-500`, `focus:border-transparent`
- [ ] **Line 156:** `text-gray-500` (placeholder style)
- [ ] **Line 158:** **Hardcoded hex** `fill='%236b7280'` (URL-encoded `#6b7280`) in inline SVG chevron
- [ ] **Line 165:** `bg-white border border-gray-300` (dropdown)
- [ ] **Line 169:** `text-gray-500` ("No matches")
- [ ] **Line 178:** `bg-blue-500 text-white` (highlighted option) — should use `--mews-indigo`
- [ ] **Line 180:** `bg-blue-50` (selected option) — should use `--mews-light-indigo`
- [ ] **Line 181:** `text-gray-900 hover:bg-gray-100`

### `components/StatusBadge.tsx`

- [ ] **Line 4:** `bg-blue-200 text-blue-800` (building) — should use Blue=info semantic
- [ ] **Lines 5-6:** `bg-yellow-200 text-yellow-800` (processing) — yellow not in Mews palette; use Orange=warning
- [ ] **Line 7:** `bg-green-200 text-green-800` (completed) — should use `--mews-green` semantic
- [ ] **Lines 8-9:** `bg-red-200 text-red-800` (failed) — should use `--mews-coral` or Red=error semantic
- [ ] **Line 23:** `bg-blue-50 border-blue-200` (card style)
- [ ] **Lines 24-25:** `bg-yellow-50 border-yellow-200`
- [ ] **Line 26:** `bg-green-50 border-green-200`
- [ ] **Lines 27-28:** `bg-red-50 border-red-200`

### `components/CopyButton.tsx`

- [ ] **Line 23:** `text-blue-600 hover:text-blue-700 hover:bg-blue-50` — should use `--mews-indigo`

### `components/Pagination.tsx`

- [ ] **Line 18:** `border-t border-gray-200`
- [ ] **Line 19:** `text-gray-600`
- [ ] **Line 26:** `text-gray-700 bg-white border-gray-300 hover:bg-gray-50`
- [ ] **Line 39:** `text-gray-500` (ellipsis)
- [ ] **Line 52:** `bg-blue-600 text-white` (active page) — should use `--mews-indigo`
- [ ] **Line 53:** `text-gray-700 bg-white border-gray-300 hover:bg-gray-50`
- [ ] **Line 64:** `text-gray-700 bg-white border-gray-300 hover:bg-gray-50`

### `components/ApiCallLogs.tsx`

- [ ] **Line 30:** `bg-green-500` (success status dot)
- [ ] **Line 32:** `bg-red-500`, `bg-red-400` (error status dot)
- [ ] **Line 34:** `bg-yellow-500` (redirect status dot)
- [ ] **Lines 90-91:** `font-mono`, `bg-gray-100`, `hover:bg-gray-50`
- [ ] **Line 92:** `bg-red-50 hover:bg-red-100` (failed request row)
- [ ] **Line 94:** `text-gray-400` (timestamp)
- [ ] **Line 96:** `text-gray-700` (endpoint)
- [ ] **Line 99:** `text-red-600`, `text-gray-500` (status code)
- [ ] **Line 104:** `text-gray-400` (duration)
- [ ] **Line 107:** `text-gray-300` (chevron)
- [ ] **Line 111:** `bg-gray-900 text-gray-100` (detail pane) — should use `--mews-night-black`
- [ ] **Lines 113-114:** `text-gray-400`, `border-gray-400`
- [ ] **Line 119:** `text-gray-500` (URL)
- [ ] **Line 121:** `text-gray-400` (label)
- [ ] **Line 124:** `text-green-300` (request body)
- [ ] **Line 129:** `text-gray-400` (label)
- [ ] **Line 134:** `text-blue-300`, `text-red-300` (response body)
- [ ] **Line 141:** `text-red-400 border-gray-700` (error)
- [ ] **Line 147:** `text-gray-500`
- [ ] **Line 215:** `border-gray-200`
- [ ] **Line 218:** `text-gray-600 hover:text-gray-800`
- [ ] **Lines 220, 223:** `text-gray-400`
- [ ] **Lines 232-233:** `text-gray-500`, `border-gray-500`
- [ ] **Line 239:** `text-red-600`
- [ ] **Line 243:** `text-gray-400`
- [ ] **Line 250:** `text-green-600`
- [ ] **Line 252:** `text-red-600`
- [ ] **Line 254:** `text-gray-400`
- [ ] **Lines 264, 281:** `bg-gray-800 text-white` / `bg-gray-100 text-gray-600 hover:bg-gray-200` (tabs)
- [ ] **Line 292:** `border-gray-200`, `bg-white`
- [ ] **Lines 306-307:** `text-gray-400`, `border-gray-400`
- [ ] **Lines 90, 111:** **Non-brand font** `font-mono` (may be acceptable for code/JSON display)

### `app/create/page.tsx`

- [ ] **Line 27:** **Hardcoded hex** `fill='%236b7280'` (URL-encoded `#6b7280`) in inline SVG chevron
- [ ] **Line 29:** `border-gray-300`, `focus:ring-blue-500` (shared select classes)
- [ ] **Line 86:** **Gradient violation** `bg-gradient-to-b from-blue-50 to-white` — lozenge rule: NEVER apply as gradient
- [ ] **Line 89:** `text-gray-900` (heading)
- [ ] **Line 90:** `text-gray-600` (description)
- [ ] **Line 93:** `bg-white` (card) — should use `--mews-linen` or `--mews-white`
- [ ] **Lines 96, 112, 127, 145, 165, 183, 198, 216, 234, 256:** `text-gray-700` (form labels)
- [ ] **Lines 105, 123, 138, 159, 192, 267:** `border-gray-300 focus:ring-blue-500` (input fields)
- [ ] **Lines 114, 129, 147, 236:** `text-gray-500` (helper text)
- [ ] **Line 245:** `disabled:bg-gray-100`
- [ ] **Line 274:** `bg-blue-600 text-white hover:bg-blue-700` (submit button) — should use `--mews-indigo`

### `app/logs/page.tsx`

- [ ] **Line 17:** `bg-blue-100 text-blue-800` (environment badge)
- [ ] **Line 19:** `bg-purple-100 text-purple-800` (reset badge) — purple not in Mews palette
- [ ] **Line 21:** `bg-orange-100 text-orange-800` (filler badge) — orange not in palette
- [ ] **Line 23:** `bg-amber-100 text-amber-800` (close bills badge) — amber not in palette
- [ ] **Line 111:** **Gradient violation** `bg-gradient-to-b from-blue-50 to-white`
- [ ] **Line 113:** `bg-white` (card)
- [ ] **Line 115:** `text-gray-800` (heading)
- [ ] **Lines 118, 157:** `text-blue-600`
- [ ] **Lines 120-121:** `bg-blue-400`, `bg-blue-500` (polling dot)
- [ ] **Line 127:** **Accessibility** `text-xs text-gray-400` on white — `#9CA3AF` on `#FFF` = ~2.9:1 (fails WCAG AA 4.5:1)
- [ ] **Line 133:** `text-gray-700 bg-white border-gray-300 hover:bg-gray-50` (refresh btn)
- [ ] **Line 143:** `border-blue-600` (spinner)
- [ ] **Line 144:** `text-gray-600`
- [ ] **Lines 149-150:** `bg-red-50 border-red-200`, `text-red-800` (error box)
- [ ] **Line 155:** `text-gray-500`
- [ ] **Lines 181-182:** `text-gray-800`, `text-gray-600`
- [ ] **Line 184:** **Accessibility** `text-xs text-gray-500` — borderline 4.6:1 contrast
- [ ] **Lines 217-218:** `border-gray-200`, `text-gray-700`
- [ ] **Lines 226, 235:** `text-yellow-600`
- [ ] **Line 244:** `text-gray-500`
- [ ] **Line 246:** **Non-brand font** `font-mono`
- [ ] **Line 255:** `text-orange-600 hover:text-orange-700`
- [ ] **Lines 261-262:** `bg-orange-50`, `text-orange-800`, `text-gray-700`
- [ ] **Line 267:** `text-gray-500`
- [ ] **Line 281:** `text-red-600`
- [ ] **Lines 292-293:** `text-blue-700`/`text-yellow-700`, `border-blue-700`/`border-yellow-700`
- [ ] **Lines 314-315, 353-354, 398-399, 446-447:** `text-gray-800`, `bg-white`, `text-gray-700` (error detail blocks — repeated across EnvironmentContent, ResetContent, DemoFillerContent, CloseBillsContent)
- [ ] **Lines 330, 335, 369, 374, 417, 420:** `text-gray-600`, `text-gray-800`, `text-red-600`, `text-red-800`
- [ ] **Lines 344, 389, 437:** `text-yellow-700`, `border-yellow-700` (processing spinner)

### `app/reset/page.tsx`

- [ ] **Line 137:** **Gradient violation** `bg-gradient-to-b from-blue-50 to-white`
- [ ] **Line 140:** `text-gray-900`
- [ ] **Line 141:** `text-gray-600`
- [ ] **Line 144:** `bg-white`
- [ ] **Line 148:** `text-gray-700`
- [ ] **Line 154:** `text-gray-400 hover:text-gray-600`
- [ ] **Line 163:** `border-gray-300 bg-gray-50 text-gray-500`
- [ ] **Lines 180, 184:** `text-gray-500`
- [ ] **Line 195:** `bg-gray-400` (disabled button)
- [ ] **Line 196:** `bg-red-600 text-white hover:bg-red-700` (destructive) — should use `--mews-coral`
- [ ] **Line 202:** **Accessibility** `text-xs text-gray-500` on white
- [ ] **Line 211:** `bg-black bg-opacity-50` — should use `--mews-night-black`
- [ ] **Lines 212, 213:** `bg-white`, `text-gray-900`
- [ ] **Line 216:** `text-gray-500`
- [ ] **Lines 221, 229:** `text-gray-700`, `border-gray-300 focus:ring-blue-500`
- [ ] **Line 233:** `text-green-600`, `text-red-600`
- [ ] **Lines 241, 250-253:** `bg-gray-200 text-gray-700`, `bg-gray-300 text-gray-500`, `bg-gray-700 text-white`
- [ ] **Line 270:** `backdrop:bg-black/50`
- [ ] **Lines 272, 275, 278, 283:** `text-gray-900`, `text-gray-700`, `text-gray-600`, `text-red-600`
- [ ] **Lines 289, 295:** `bg-gray-200 text-gray-700`, `bg-red-600 text-white`

### `app/extend/page.tsx`

- [ ] **Line 126:** **Gradient violation** `bg-gradient-to-b from-blue-50 to-white`
- [ ] **Line 129:** `text-gray-900`
- [ ] **Line 130:** `text-gray-600`
- [ ] **Line 133:** `bg-white`
- [ ] **Line 136:** `text-gray-700`
- [ ] **Line 140:** `border-gray-300 bg-gray-50 text-gray-500`
- [ ] **Line 160:** `text-gray-500`
- [ ] **Line 180:** `border-gray-300 focus:ring-green-500` — green not the right token
- [ ] **Line 182:** `text-gray-500`
- [ ] **Line 193:** `bg-gray-400` (disabled)
- [ ] **Line 194:** `bg-green-600 text-white hover:bg-green-700` — should use `--mews-green` semantic
- [ ] **Lines 204-205:** `bg-green-50 text-green-800 border-green-200` / `bg-red-50 text-red-800 border-red-200`
- [ ] **Line 211:** **Accessibility** `text-xs text-gray-500` on white
- [ ] **Line 223:** `backdrop:bg-black/50`
- [ ] **Line 225:** `text-gray-900`
- [ ] **Line 228:** `text-gray-700`
- [ ] **Line 236:** `bg-gray-200 text-gray-700`
- [ ] **Line 242:** `bg-green-600 text-white hover:bg-green-700`

### `app/save/page.tsx`

- [ ] **Line 114:** **Gradient violation** `bg-gradient-to-b from-blue-50 to-white`
- [ ] **Line 117:** `text-gray-900`
- [ ] **Line 118:** `text-gray-600`
- [ ] **Line 121:** `bg-white`
- [ ] **Line 124:** `text-gray-700`
- [ ] **Line 128:** `border-gray-300 bg-gray-50 text-gray-500`
- [ ] **Line 148:** `text-gray-500`
- [ ] **Line 155:** `bg-amber-50 border-amber-200 text-amber-800` — amber not in Mews palette
- [ ] **Line 165:** `bg-gray-400` (disabled)
- [ ] **Line 166:** `bg-indigo-600 text-white hover:bg-indigo-700` — raw Tailwind, not `--mews-indigo`
- [ ] **Lines 176-177:** `bg-green-50 text-green-800 border-green-200` / `bg-red-50 text-red-800 border-red-200`
- [ ] **Line 183:** **Accessibility** `text-xs text-gray-500` on white
- [ ] **Line 195:** `backdrop:bg-black/50`
- [ ] **Line 197:** `text-gray-900`
- [ ] **Lines 200, 204:** `text-gray-700`, `text-gray-500`
- [ ] **Line 210:** `bg-gray-200 text-gray-700`
- [ ] **Line 216:** `bg-indigo-600 text-white hover:bg-indigo-700`

### `app/fill/page.tsx`

- [ ] **Line 58:** **Hardcoded hex** `fill='%236b7280'` (URL-encoded `#6b7280`) in inline SVG chevron
- [ ] **Line 60:** `border-gray-300`, `focus:ring-blue-500` (shared select classes)
- [ ] **Line 186:** **Gradient violation** `bg-gradient-to-b from-blue-50 to-white`
- [ ] **Line 189:** `text-gray-900`
- [ ] **Line 190:** `text-gray-600`
- [ ] **Line 193:** `bg-white`
- [ ] **Line 197:** `text-gray-700`
- [ ] **Line 203:** `text-gray-400 hover:text-gray-600`
- [ ] **Line 212:** `border-gray-300 bg-gray-50 text-gray-500`
- [ ] **Line 234:** `border-gray-300 focus:ring-blue-500`
- [ ] **Lines 238, 242:** `text-gray-500`
- [ ] **Lines 249, 289, 307, 325:** `text-gray-700` (labels)
- [ ] **Line 253:** `border-gray-300 bg-gray-50 text-gray-500`
- [ ] **Line 259:** `bg-gray-100 text-gray-400`
- [ ] **Line 281:** `text-red-500`
- [ ] **Lines 300, 318, 337:** `border-gray-300 focus:ring-blue-500` (form inputs)
- [ ] **Line 339:** `text-gray-500`
- [ ] **Line 350:** `bg-gray-400` (disabled)
- [ ] **Line 351:** `bg-blue-600 text-white hover:bg-blue-700`
- [ ] **Line 357:** **Accessibility** `text-xs text-gray-500` on white
- [ ] **Line 366:** `bg-black bg-opacity-50`
- [ ] **Line 367:** `bg-white`
- [ ] **Lines 368, 371, 376:** `text-gray-900`, `text-gray-500`, `text-gray-700`
- [ ] **Line 384:** `border-gray-300 focus:ring-blue-500`
- [ ] **Line 388:** `text-green-600`, `text-red-600`
- [ ] **Lines 396, 405-408:** `bg-gray-200 text-gray-700`, `bg-gray-300 text-gray-500`, `bg-gray-700 text-white`

### `app/close-bills/page.tsx`

- [ ] **Line 135:** **Gradient violation** `bg-gradient-to-b from-blue-50 to-white`
- [ ] **Line 138:** `text-gray-900`
- [ ] **Line 139:** `text-gray-600`
- [ ] **Line 142:** `bg-white`
- [ ] **Line 146:** `text-gray-700`
- [ ] **Line 152:** `text-gray-400 hover:text-gray-600`
- [ ] **Line 161:** `border-gray-300 bg-gray-50 text-gray-500`
- [ ] **Lines 178, 182:** `text-gray-500`
- [ ] **Line 193:** `bg-gray-400` (disabled)
- [ ] **Line 194:** `bg-amber-600 text-white hover:bg-amber-700` — amber not in Mews palette
- [ ] **Line 200:** **Accessibility** `text-xs text-gray-500` on white
- [ ] **Line 209:** `bg-black bg-opacity-50` — should use `--mews-night-black`
- [ ] **Line 210:** `bg-white`
- [ ] **Lines 211, 214:** `text-gray-900`, `text-gray-500`
- [ ] **Lines 219, 227:** `text-gray-700`, `border-gray-300 focus:ring-blue-500`
- [ ] **Line 231:** `text-green-600`, `text-red-600`
- [ ] **Lines 239, 248-251:** `bg-gray-200 text-gray-700`, `bg-gray-300 text-gray-500`, `bg-gray-700 text-white`
- [ ] **Line 268:** `backdrop:bg-black/50`
- [ ] **Lines 270, 273, 276:** `text-gray-900`, `text-gray-700`, `text-gray-600`
- [ ] **Line 284:** `bg-gray-200 text-gray-700`
- [ ] **Line 290:** `bg-amber-600 text-white hover:bg-amber-700`

---

## Summary by Violation Type

| Category | Files | Instances | Severity |
|----------|-------|-----------|----------|
| Missing CSS variable definitions | 3 foundation files | 3 | **CRITICAL** |
| No font loading (Axiforma/Inter) | `layout.tsx` | 1 | **CRITICAL** |
| Gradient on page backgrounds | 7 page files | 7 | **HIGH** |
| Hardcoded hex in inline SVGs | 3 files (`SearchableSelect`, `create/page`, `fill/page`) | 3 | **HIGH** |
| Non-design-system Tailwind colors | All 15 UI files | ~300+ | **HIGH** |
| Non-palette colors (purple, amber, orange) | `logs/page`, `save/page`, `close-bills/page` | 6 | **MEDIUM** |
| `bg-white` instead of design token | 10+ files | ~20 | **MEDIUM** |
| `bg-black` instead of `--mews-night-black` | 5 files | 7 | **MEDIUM** |
| Non-brand font (`font-mono`) | `ApiCallLogs.tsx`, `logs/page.tsx` | 3 | **MEDIUM** |
| Semantic color mismatches | `StatusBadge.tsx`, `Toast.tsx` | 10 | **MEDIUM** |
| Accessibility: gray-400/gray-500 text on white | 7+ locations across 6 files | 7+ | **MEDIUM** |

**Total non-compliant files: 18** (every UI file in the project)
**Total violation instances: ~400+**
