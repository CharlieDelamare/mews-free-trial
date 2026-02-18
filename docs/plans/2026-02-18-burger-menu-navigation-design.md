# Burger Menu Navigation Design

**Date**: 2026-02-18
**Status**: Approved

## Summary

Replace the current horizontal navbar with a burger menu that opens a slide-out sidebar from the left containing all navigation links.

## Design

### Top Navbar

- Left: Burger icon button (3-line hamburger SVG)
- Center: "Mews Sandbox Manager" brand title
- Right: empty

### Slide-out Sidebar

- Slides in from the left with CSS `translate-x` transition (~300ms)
- Semi-transparent dark backdrop overlays the page
- Width: 256px (Tailwind `w-64`)
- Full viewport height

### Sidebar Content

- **Top section**: Create, Reset, Fill links (vertical list)
- **Bottom section** (pinned to bottom with `mt-auto`): Logs link, separated by a divider

### Interactions

- Clicking the burger icon opens the sidebar
- Clicking any nav link navigates and closes the sidebar
- Clicking the backdrop closes the sidebar
- ESC key closes the sidebar
- Active page link highlighted with blue background (`text-blue-600 bg-blue-50`)

### Technical Approach

- Pure React state + Tailwind CSS (no new dependencies)
- Only file modified: `app/navbar.tsx`
- Hamburger icon rendered as inline SVG
- Sidebar uses fixed positioning with z-index layering

## File Changes

| File | Change |
|------|--------|
| `app/navbar.tsx` | Rewrite navbar to burger menu + slide-out sidebar |
