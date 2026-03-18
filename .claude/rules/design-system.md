# Mews Design System Rules

IMPORTANT: All UI code MUST follow these brand guidelines. Never use arbitrary colors, fonts, or spacing.

## Colors

Use CSS variables. Never hardcode hex values directly in components.

```css
:root {
  /* Primary brand color — the hero pink */
  --mews-primary-pink: #FF83DA;   /* RGB 255, 131, 218 — main brand identity color */

  /* Secondary palette */
  --mews-orange: #FF5303;         /* RGB 255, 83, 3 */
  --mews-yellow-green: #E8FF5B;   /* RGB 232, 255, 91 — lime/chartreuse accent */
  --mews-yellow: #EFFD91;         /* RGB 239, 253, 145 — soft yellow */
  --mews-light-green: #D1F9D6;    /* RGB 209, 249, 214 */
  --mews-light-cyan: #E3FFFD;     /* RGB 227, 255, 253 */
  --mews-light-lavender: #F7E1F7; /* RGB 247, 225, 247 */

  /* Supporting / neutrals */
  --mews-charcoal: #2D2C37;       /* RGB 45, 44, 55 — dark surface */
  --mews-black: #000000;          /* Use only via this token, never bare #000 */
  --mews-cream: #FFFCF6;          /* RGB 255, 252, 246 — warm off-white */

  /* Legacy core tokens — retained for backward compatibility */
  --mews-night-black: #1C1D24;
  --mews-white: #FFFFFF;
  --mews-deep-blue: #2D2C37;
  --mews-linen: #FFFCF6;
  --mews-light-indigo: #EFEFFF;
  --mews-blue: #D6E2FC;
  --mews-olive-green: #222B28;
  --mews-green: #E6F5F0;

  /* Legacy highlight tokens */
  --mews-coral: #FF5A65;   /* Red-adjacent — error/danger only; prefer --mews-orange for brand orange */
  --mews-pink: #F7BCF1;    /* Soft pink — prefer --mews-primary-pink for full-strength brand pink */
  --mews-indigo: #B3B2FB;
}
```

### Color Rules

- **Never hardcode hex values** in components — always reference a CSS variable
- **Never use bare `#000000`** — use `var(--mews-black)` or `var(--mews-charcoal)` / `var(--mews-night-black)`
- **Primary pink (`--mews-primary-pink`)** is the signature brand color. Use it as the hero/dominant color in high-intensity contexts
- **Neutrals first**: `--mews-cream`, `--mews-charcoal`, `--mews-linen` carry most of any composition
- **Secondary palette** (orange, yellow-green, yellow, light-green, light-cyan, light-lavender) are accents — always pair with a contrasting neutral
- **Semantic product colors**: Indigo = primary actions, Green = success, Blue = info, Orange = warning, Red/Coral = error
- Prefer `--mews-cream` or `--mews-linen` over stark white for editorial/content backgrounds

### Color Volume (apply to web contexts — "Mid Volume")

| Volume | Use cases | Guidance |
|--------|-----------|----------|
| **Low** | PPT presentations, Product sheets, Internal tools | Neutrals dominant (~85%), accent pink/orange ≤5% |
| **Mid** | Website, LinkedIn posts, Newsletters, Demos | Balanced brand color, moderate lozenge use, pink 20–40% |
| **Max** | Social posts, Digital ads, Campaign heroes, Swag | Bold primary pink + orange prominent, full palette in play |

This app is a **Mid** volume context (internal demo tool). Use balanced brand presence — not fully muted, not campaign-level loud.

## App primary colour

`--mews-primary: #FF83DA` — hot pink, the primary action colour for this app.
`--mews-primary-hover: #ff6dd0` — hover state for primary interactive elements.

These are Tailwind tokens exposed via `tailwind.config.js` as `bg-mews-primary`, `text-mews-primary`, `focus:ring-mews-primary`, and `hover:bg-mews-primary-hover`. Use these in TSX files — never the raw hex.

In this app `--mews-primary` is used for buttons, focus rings, and active nav states.

Text on `--mews-primary` backgrounds must use `--mews-night-black` (#1C1D24). White text fails WCAG AA contrast on this background (~2.1:1). Dark text passes (~4.6:1).

## Typography

```css
:root {
  --font-heading: 'Axiforma', sans-serif;    /* Book 400 for headings */
  --font-subheading: 'Axiforma', sans-serif;  /* Bold 700 for subheads */
  --font-body: 'Inter', sans-serif;           /* Regular 400 for body */
  --font-data-small: 'Chivo', sans-serif;     /* Light 300 — small numbers only */
  --font-data-display: 'Coign 47', serif;     /* Bold — hero numbers only */
  --font-system: 'Tenorite', 'Segoe UI', sans-serif; /* Shared docs fallback only */
}
```

- Axiforma + Inter are the **only** fonts for web. No substitutions.
- Chivo Light: ONLY for small numerical data (page numbers, section details). Never for body text.
- Coign 47 Bold: ONLY at large display scale for impact data callouts.
- Tenorite: ONLY for shared PowerPoints/Word docs. **Never** in web UI.

## The Lozenge (Core Brand Element)

The lozenge (pill/rounded rectangle) is the primary brand device:
- Valid treatments: solid fill, line/stroke, transparency, mask
- **NEVER** apply as a gradient
- Can scale from micro UI elements to full-bleed sections
- Use rounded edges/curves on image frames, data containers, section dividers
- Must be crisp — no rough edges or hand-drawn style

## Layout Rules

- Corner radii: use sparingly. Follow the lozenge curvature as reference, not arbitrary rounding on every element.
- Layouts follow editorial design principles — clean, considered, high-contrast
- Icons and images must be consistent with Mews visual style

## Accessibility

- Text < 24px: minimum 4.5:1 contrast ratio (WCAG AA)
- Text ≥ 24px and UI elements: minimum 3:1 contrast ratio
- Never rely on color alone to convey meaning
- Apply colors through design tokens only — direct hex in components is an anti-pattern

## Known Violations (to fix)

The following patterns exist in the current codebase and should be remediated:

### Critical
- **`components/control-centre/IbeTab.tsx`**: `#2D3748`, `#2C5282` — not design system colors (use `--mews-charcoal` / `--mews-deep-blue`)
- **`app/control-centre/ibe/[theme]/page.tsx`**: same two off-brand hex values in `IBE_THEME_CONFIG`

### Moderate (ROI Calculator — widespread rgba() inline values)
- `components/roi-calculator/ui/ResultCard.tsx` — `rgba(107,163,176,...)` teal values (no token)
- `components/roi-calculator/ui/Slider.tsx` — color scheme objects with hardcoded rgba (yellow, orange, purple, pink variants)
- `components/roi-calculator/ui/ExportModal.tsx` — `rgba(0,26,51,...)` navy values (no token)
- `components/roi-calculator/PDFTemplate.tsx` — 60+ inline style color values (acceptable for PDF-only rendering; add a comment noting PDF context)
- `components/roi-calculator/ui/CollapsibleSection.tsx`, `ActionDock.tsx`, `NavigationSidebar.tsx`, `StickyROIBar.tsx`, `DiscoverySection.tsx`, `TotalSavings.tsx`, `HotelConfigSection.tsx`, `PresetSelector.tsx`, `ModuleCard.tsx`, `PropertyEditPopover.tsx` — various rgba violations

### Low (globals.css)
- `app/globals.css`: rgba() values in scrollbar, slider thumb, and shimmer utilities — these reference existing brand color RGB values but should use CSS variables with alpha where supported
