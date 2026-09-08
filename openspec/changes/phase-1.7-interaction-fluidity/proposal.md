# phase-1.7-interaction-fluidity

## Why
Dockmark already has shared motion tokens and basic route/dialog transitions, but several common interactions still feel delayed or abrupt. Top-level route changes currently wait for the previous view to finish leaving before the next view enters, and route-driven editor dialogs disappear immediately when their child route unmounts. Confirmation dialogs also animate their overlay and panel as one unit, which makes them feel heavier than necessary.

## What Changes
- Make top-level route transitions overlap instead of waiting for leave completion.
- Use lighter route motion tuned for fast navigation feedback.
- Animate route-driven editor dialogs on both open and close.
- Split destructive confirmation overlay and panel motion so backdrop and dialog respond independently.
- Keep all motion on shared CSS tokens and preserve reduced-motion behavior.

## Out of Scope
- No backend, API, D1, KV, or authentication changes.
- No third-party animation library.
- No broad visual redesign, typography overhaul, or layout rewrite.
