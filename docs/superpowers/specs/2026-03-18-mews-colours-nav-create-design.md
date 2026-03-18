# Design: Mews Colours — Navbar & /create page

**Date:** 2026-03-18
**Scope:** `app/navbar.tsx`, `app/create/page.tsx`, `app/globals.css`
**Approach:** Linen throughout (light sidebar, light top bar), pink as primary action colour

---

## Goals

Apply the Mews brand palette to the navbar (top bar + slide-out burger menu) and the `/create` page form. This is the first section of a broader section-by-section colour update across the app.

---

## CSS Variable Corrections (`app/globals.css`)

Two existing variables have incorrect hex values and must be corrected:

| Variable | Current (wrong) | Correct |
|----------|----------------|---------|
| `--mews-linen` | `#F8F5F2` | `#FFFCF6` |
| `--mews-deep-blue` | `#172135` | `#2D2C37` |

One new variable must be added:

| Variable | Value | Purpose |
|----------|-------|---------|
| `--mews-primary` | `#FF83DA` | Primary action pink — replaces indigo as the brand primary |

The Tailwind config (`tailwind.config.js`) must expose `--mews-primary` under `mews.primary`.

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

### Background & header

| Element | Current | New |
|---------|---------|-----|
| Sidebar background | `style={{ backgroundColor: 'var(--mews-deep-blue)' }}` inline style | `bg-mews-linen` Tailwind class; remove inline style |
| Header border | `border-white/10` | `border-neutral-200` |
| App title | `text-white` | `text-mews-night-black` |
| Close button | `text-white/50 hover:text-white hover:bg-white/10` | `text-neutral-500 hover:text-mews-night-black hover:bg-neutral-100` |

### Section labels

| Current | New |
|---------|-----|
| `style={{ color: 'var(--mews-indigo)', opacity: 0.7 }}` inline style | `text-neutral-400` Tailwind class; remove inline style |

### Nav link states (`linkClasses` function)

| State | Current | New |
|-------|---------|-----|
| Active | `text-white bg-white/15` | `text-mews-night-black bg-[rgba(255,131,218,0.15)]` |
| Inactive | `text-white/60 hover:text-white hover:bg-white/10` | `text-neutral-600 hover:text-mews-night-black hover:bg-neutral-100` |

### Bottom border (Logs section)

| Current | New |
|---------|-----|
| `border-white/10` | `border-neutral-200` |

---

## `/create` Page

File: `app/create/page.tsx`.

### Page level

| Element | Current | New |
|---------|---------|-----|
| Background | `bg-mews-linen` | unchanged — but value corrects automatically when CSS var is fixed |
| Page heading | `text-gray-900` | `text-mews-night-black` |

### Form card

| Element | Current | New |
|---------|---------|-----|
| Card container | `bg-white rounded-xl shadow-lg` | `bg-white rounded-xl border border-neutral-100 shadow-sm` |

### Form inputs (all `<input>` and `<select>` elements)

| State | Current | New |
|-------|---------|-----|
| Focus ring | `focus:ring-primary-500 focus:border-transparent` | `focus:ring-[#FF83DA] focus:border-[#FF83DA]` |

### Submit button

| Element | Current | New |
|---------|---------|-----|
| Background | `bg-primary-600 hover:bg-primary-700` | `bg-[#FF83DA] hover:bg-[#ff6dd0]` |
| Text colour | `text-white` | `text-mews-night-black` |

Note: `text-mews-night-black` on `#FF83DA` passes WCAG AA contrast (ratio ~4.6:1). White text on `#FF83DA` fails (ratio ~2.1:1) and must not be used.

---

## Constraints

- **No structural changes** to either file — class/style replacements only.
- **No other pages touched** in this PR. The colour update proceeds section-by-section.
- Tailwind `gray.*` already maps to the Mews neutral scale — no changes needed there.
- Inline `style` props on the sidebar background and section labels are replaced with Tailwind utility classes to be consistent with the rest of the codebase.

---

## Files Changed

1. `app/globals.css` — correct two CSS vars, add `--mews-primary`
2. `tailwind.config.js` — expose `mews.primary` token
3. `app/navbar.tsx` — restyle top bar and sidebar
4. `app/create/page.tsx` — restyle heading, form card, inputs, submit button
