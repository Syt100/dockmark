# phase-1-5-interaction-motion

## Why
Dockmark Phase 1 frontend already has consistent layout, theme tokens, and shared controls, but common state changes still appear abruptly. Route changes, dialogs, list updates, feedback messages, filter disclosures, and dynamic editor rows would be easier to follow with subtle motion.

## What Changes
- Add a lightweight shared motion system using CSS tokens and Vue built-in transitions.
- Animate route content, dialogs, feedback messages, mobile filter disclosure, and dynamic service editor rows.
- Keep filter-driven home and management lists on stable static containers to avoid retained-item and leaving-item layout jumps during search or filter changes.
- Respect reduced-motion user preferences.
- Keep motion definitions centralized to avoid repeated page-local animation CSS.

## Out of Scope
- No backend behavior changes.
- No data model, API, authentication, D1, or KV changes.
- No third-party animation library.
- No complex timeline, scroll-driven, or marketing-style animation.
