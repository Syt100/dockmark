# Tasks

- [x] Remove the top-level route Transition so page navigation does not introduce extra layout jitter.
- [x] Remove obsolete route crossfade CSS and route transition-key helpers.
- [x] Split destructive confirmation backdrop and panel transitions.
- [x] Animate route-driven service/category/tag editor child routes on open and close, including save and cancel exits.
- [x] Replace initial management-page loading messages with stable list-shaped skeletons.
- [x] Keep existing management records visible during later refreshes and show a compact refresh indicator.
- [x] Remove confirmed deletions locally before reconciling with a background refresh.
- [x] Keep record-level enter/leave feedback while removing list move interpolation.
- [x] Preload primary lazy route chunks during browser idle time with a delayed fallback.
- [x] Ignore stale management-list responses when a newer request is already in flight.
- [x] Add subtle press feedback to shared controls and immediate active feedback to top navigation.
- [x] Preserve reduced-motion, focus management, Escape handling, and body scroll locking.
- [x] Add or update frontend regression tests for route rendering, editor closing, management refresh behavior, and out-of-order loads.
- [ ] Run `openspec validate --all --strict --no-interactive` before merge in an environment with the OpenSpec CLI available.
