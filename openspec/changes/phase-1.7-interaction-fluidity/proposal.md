# phase-1.7-interaction-fluidity

## Why
Dockmark already has shared motion tokens and basic route/dialog transitions, but several common interactions still feel delayed or abrupt. Top-level route animation has also shown visible layout jitter when switching between pages with different heights and loading states. Route-driven editor dialogs disappear immediately when their child route unmounts, management pages replace useful list content with blocking loading states during refreshes, and first visits to lazy routes can still pay a chunk-loading delay.

## What Changes
- Render top-level routes directly without a page-level enter/leave animation so navigation does not introduce extra layout jitter.
- Animate route-driven desktop editor dialogs on both open and close, including cancel, Escape, backdrop dismissal, and successful-save exits.
- Split destructive confirmation overlay and panel motion so backdrop and dialog respond independently.
- Use list-shaped skeletons for initial management-page loading, while later refreshes retain existing rows and show a lightweight refresh indicator.
- Remove deleted management records locally after the server confirms deletion, then reconcile with a background refresh.
- Add lightweight local list enter/leave feedback without reintroducing top-level route animation.
- Preload primary lazy route chunks after application startup so first navigation is less likely to wait on JavaScript loading.
- Add subtle press feedback to shared buttons and immediate color feedback to top navigation items.
- Keep local motion on shared CSS tokens and preserve reduced-motion behavior.

## Out of Scope
- No backend, API, D1, KV, or authentication changes.
- No third-party animation library.
- No broad visual redesign, typography overhaul, or layout rewrite.
- No page-level crossfade or directional transition between top-level routes.
