---
name: web-performance-accessibility
description: Keep NHMA fast, mobile-safe and WCAG 2.2-aligned. Use for HTML/CSS/JS changes, product images, overlays, dialogs, chat panels, analytics scripts and any new frontend dependency.
---

# Web Performance & Accessibility

## Accessibility baseline
Target WCAG 2.2 AA for production UI.

Required:
- keyboard-visible focus for every interactive element
- sticky/floating UI must not obscure focused controls
- pointer targets >= 24x24 CSS px or meet spacing exceptions; prefer ~44px for primary mobile actions
- logical heading hierarchy
- accessible labels for form and icon controls
- color is not the only status signal
- state changes use restrained `aria-live` regions
- chat/bottom-sheet open/close has correct focus behavior and dismiss control
- no drag-only interactions

## Performance field targets
Aim at the 75th percentile for:
- LCP <= 2.5s
- INP <= 200ms
- CLS <= 0.1

## Frontend policy
- Do not add a framework or library unless it solves a real maintenance/product problem.
- Keep third-party JS minimal and deferred.
- Preserve the current advantage of no external font dependency unless brand value justifies it.
- Reserve media dimensions/aspect ratios to prevent layout shifts.
- Lazy-load below-fold product images; prioritize only above-fold content that materially affects LCP.
- Avoid synchronous analytics work in critical interactions.
- Debounce or batch noncritical telemetry.
- Keep search/chat network states visible without blocking the page.

## Mobile overlays
- Floating chat launcher must not cover primary product/search controls.
- Open chat as a bounded dismissible panel/bottom sheet.
- On small screens, secondary filter options should collapse rather than form multiple noisy wrapping rows.
- Respect viewport safe areas where possible.

## Dependency gate
Before adding a package answer:
1. Can native platform APIs do this adequately?
2. What bytes and runtime work does it add?
3. Does it introduce a third-party network dependency?
4. Is the capability used on initial load?
5. Does it improve user success enough to justify the cost?

## Acceptance checks
- keyboard through header -> search -> refinements -> results -> product actions -> chat
- 320px and 375px viewport no horizontal page overflow
- chat open does not make underlying primary controls unusable after close
- slow network shows stable skeleton/state, not layout collapse
- missing images keep card dimensions stable
- no console error from optional analytics/provider integrations
