# Design: Mews Colours — Navbar & /create page

**Date:** 2026-03-18
**Scope:** `app/navbar.tsx`, `app/create/page.tsx`, `app/globals.css`, `tailwind.config.js`
**Approach:** Linen throughout (light sidebar, light top bar), pink as primary action colour

---

## Goals

Apply the Mews brand palette to the navbar (top bar + slide-out burger menu) and the `/create` page form. This is the first section of a broader section-by-section colour update across the app.

---

## Design System Updates

This PR intentionally updates the design system itself in two ways, based on direct user instruction:

1. **Linen and deep-blue hex corrections** — the values currently in `globals.css` and `CLAUDE.md` are wrong. The authoritative values are from the user:
   - `--mews-linen`: `#F8F5F2` → `#FFFCF6`
   - `--mews-deep-blue`: `#172135` → `#2D2C37`

2. **Pink elevated to primary action colour** — `#FF83DA` is the new brand primary for this app. The existing design system rule that restricts highlight colours (coral, yellow, pink, indigo) to "accent only, max 10%" does not apply here: the user has explicitly designated `#FF83DA` as the primary action colour. The `CLAUDE.md` design system rules must be updated to reflect this.

---

## CSS Variable Changes (`app/globals.css`)

| Variable | Current | New | Reason |
|----------|---------|-----|--------|
| `--mews-linen` | `#F8F5F2` | `#FFFCF6` | Correct hex |
| `--mews-deep-blue` | `#172135` | `#2D2C37` | Correct hex |
| `--mews-primary` | _(does not exist)_ | `#FF83DA` | New primary action pink |
| `--mews-primary-hover` | _(does not exist)_ | `#ff6dd0` | Darker pink for hover state (same hue, ~8% darker) |

---

## Tailwind Config (`tailwind.config.js`)

Add two entries under `mews`:

```js
'primary': 'var(--mews-primary)',
'primary-hover': 'var(--mews-primary-hover)',
```

This allows `bg-mews-primary`, `text-mews-primary`, `focus:ring-mews-primary`, `hover:bg-mews-primary-hover` in components — no hardcoded hex in TSX files.

---

## Navbar — Top Bar

File: `app/navbar.tsx`, top `<nav>` element.

| Element | Current classes | New classes |
|---------|----------------|-------------|
| Bar background | `bg-white border-b border-gray-200` | `bg-mews-linen border-b border-neutral-200` |
| Burger button | `text-gray-500 hover:text-gray-900 hover:bg-gray-100` | `text-neutral-600 hover:text-mews-night-black hover:bg-neutral-100` |
| App title | `text-gray-900` | `text-mews-night-black` |
| Page label separator `·` | `text-gray-300` | `text-neutral-300` |
| Page label | `text-gray-500` | `text-neutral-500` |

No structural changes — class replacements only.

---

## Navbar — Slide-out Sidebar

File: `app/navbar.tsx`, `<aside>` element and its children.

### Backdrop overlay

The backdrop (`<div>` with `bg-gray-900/50`) is unchanged. It sits behind the sidebar and over the page — keeping it dark is correct and intentional.

### Background & header

| Element | Current | New |
|---------|---------|-----|
| Sidebar background | `style={{ backgroundColor: 'var(--mews-deep-blue)' }}` inline style | `bg-mews-linen` Tailwind class; remove inline style |
| Header border | `border-white/10` | `border-neutral-200` |
| App title | `text-white` | `text-mews-night-black` |
| Close button | `text-white/50 hover:text-white hover:bg-white/10` | `text-neutral-500 hover:text-mews-night-black hover:bg-neutral-100` |

### Section labels

All three `<p>` section labels (Sandboxes, Operations, Tools) use the same inline style — all change:

| Current | New |
|---------|-----|
| `style={{ color: 'var(--mews-indigo)', opacity: 0.7 }}` inline style | `text-neutral-400` Tailwind class; remove inline style |

### Nav link states (`linkClasses` function)

| State | Current | New |
|-------|---------|-----|
| Active | `text-white bg-white/15` | `text-mews-night-black bg-mews-primary/15` |
| Inactive | `text-white/60 hover:text-white hover:bg-white/10` | `text-neutral-600 hover:text-mews-night-black hover:bg-neutral-100` |

### Section dividers

All `border-white/10` instances in the sidebar change to `border-neutral-200`. There are two:
1. The sidebar header bottom border (between title and nav links)
2. The `mt-auto pt-3 border-t` above the Logs link

---

## `/create` Page

File: `app/create/page.tsx`.

### Page level

| Element | Current | New |
|---------|---------|-----|
| Background | `bg-mews-linen` | unchanged class — value corrects automatically when CSS var is fixed |
| Page heading | `text-gray-900` | `text-mews-night-black` |

### Form card

| Element | Current | New |
|---------|---------|-----|
| Card container | `bg-white rounded-xl shadow-lg` | `bg-white rounded-xl border border-neutral-100 shadow-sm` |

### Form inputs (all `<input>` and `<select>` elements)

| State | Current | New |
|-------|---------|-----|
| Focus ring | `focus:ring-2 focus:ring-primary-500 focus:border-transparent` | `focus:ring-2 focus:ring-mews-primary focus:border-mews-primary` |

Note: `focus:ring-2` is preserved (2px ring width). `focus:border-transparent` is removed — the border now matches the pink ring colour for visual continuity.

### Submit button

| Element | Current | New |
|---------|---------|-----|
| Background | `bg-primary-600 hover:bg-primary-700` | `bg-mews-primary hover:bg-mews-primary-hover` |
| Text colour | `text-white` | `text-mews-night-black` |

**Contrast note:** `text-mews-night-black` (`#1C1D24`) on `#FF83DA` passes WCAG AA (ratio ~4.6:1). `text-white` on `#FF83DA` fails (~2.1:1) and must not be used.

---

## CLAUDE.md Design System Update

The design system rules file (`.claude/rules/design-system.md`) must be updated to:
1. Correct the linen and deep-blue hex values
2. Document `--mews-primary` and `--mews-primary-hover` as the new primary action tokens
3. Note that pink (`#FF83DA`) is the primary action colour for this app (not accent-only)

---

## Constraints

- No structural changes to any component file — class/style replacements only.
- No other pages touched in this PR. The colour update proceeds section-by-section.
- Inline `style` props on the sidebar (background, section labels) are replaced with Tailwind utility classes.
- All colour references in TSX files use Tailwind tokens (`bg-mews-primary`, `text-mews-night-black`, etc.) — no hardcoded hex values in component files.

---

## Files Changed

1. `app/globals.css` — correct two CSS vars, add `--mews-primary` and `--mews-primary-hover`
2. `tailwind.config.js` — expose `mews.primary` and `mews.primary-hover` tokens
3. `app/navbar.tsx` — restyle top bar and sidebar
4. `app/create/page.tsx` — restyle heading, form card, inputs, submit button
5. `.claude/rules/design-system.md` — update colour values and document new primary token
