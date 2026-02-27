# Mews Design System Rules

IMPORTANT: All UI code MUST follow these brand guidelines. Never use arbitrary colors, fonts, or spacing.

## Colors

Use CSS variables. Never hardcode hex values directly in components.

```css
:root {
  /* Core */
  --mews-night-black: #1C1D24;
  --mews-white: #FFFFFF;
  --mews-deep-blue: #172135;
  --mews-linen: #F8F5F2;
  --mews-light-indigo: #EFEFFF;
  --mews-blue: #D6E2FC;
  --mews-olive-green: #222B28;
  --mews-green: #E6F5F0;

  /* Highlights — max 10% of any composition */
  --mews-coral: #FF5A65;
  --mews-yellow: #EFF258;
  --mews-pink: #F7BCF1;
  --mews-indigo: #B3B2FB;
}
```

- Never use pure `#000000` — use `--mews-night-black` or `--mews-deep-blue` for dark backgrounds
- Prefer `--mews-linen` over stark white for editorial/content backgrounds
- Highlight colors (coral, yellow, pink, indigo) are accents only — always pair with a contrasting neutral
- Semantic product colors: Indigo=primary actions, Green=success, Blue=info, Orange=warning, Red=error

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

- Axiforma + Inter are the only fonts for web. No substitutions.
- Chivo Light: ONLY for small numerical data (page numbers, section details). Never for body text.
- Coign 47 Bold: ONLY at large display scale for impact data callouts.
- Tenorite: ONLY for shared PowerPoints/Word docs. Never in web UI.

## The Lozenge (Core Brand Element)

The lozenge (pill/rounded rectangle) is the primary brand device:
- Valid treatments: solid fill, line/stroke, transparency, mask
- NEVER apply as a gradient
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

## Brand Intensity (Low/Mid/High)

Match UI intensity to context:
- **Low**: Internal tools, product docs → neutral palette dominant, minimal highlights
- **Mid**: Demos, case studies → balanced brand color, moderate lozenge use
- **High**: Campaign pages, hero sections → bold pink/coral, large-scale lozenge, full palette
