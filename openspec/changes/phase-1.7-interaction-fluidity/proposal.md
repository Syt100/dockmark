# phase-1.7-interaction-fluidity

## Why
Dockmark already has shared motion tokens and basic route/dialog transitions, but several common interactions still feel delayed or abrupt. Top-level route animation has also shown visible layout jitter when switching between pages with different heights and loading states. Route-driven editor dialogs disappear immediately when their child route unmounts, and confirmation dialogs animate their overlay and panel as one unit, which makes them feel heavier than necessary.

## What Changes
- Render top-level routes directly without a page-level enter/leave animation so navigation does not introduce extra layout jitter.
- Animate route-driven editor dialogs on both open and close.
- Split destructive confirmation overlay and panel motion so backdrop and dialog respond independently.
- Keep local motion on shared CSS tokens and preserve reduced-motion behavior.

## Out of Scope
- No backend, API, D1, KV, or authentication changes.
- No third-party animation library.
- No broad visual redesign, typography overhaul, or layout rewrite.
