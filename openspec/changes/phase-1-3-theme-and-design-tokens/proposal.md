## Why

Phase 1 pages currently mix hard-coded Tailwind colors, spacing, radii, and interaction states across views. This makes the interface visually inconsistent, blocks reliable dark mode support, and increases the chance that future UI changes miss one-off styles.

## What Changes

- Add a global light/dark theme capability with a user-facing theme toggle and system preference support.
- Introduce shared design tokens for color, spacing, radius, density, shadow, focus, and transition behavior.
- Normalize common UI components so buttons, links, inputs, selects, textareas, search fields, badges, icon buttons, feedback, page headers, and editor shells use the same token-backed visual rules.
- Update Phase 1 pages to use the shared styling system instead of page-level hard-coded visual details.
- Reduce excessive emphasis by making repeated service "open" actions low-emphasis while preserving primary styling for create/save/confirm actions and selected navigation state.
- Keep the change frontend-only; no API, D1, KV, auth, sync, import/export, or credential storage behavior changes.

## Capabilities

### New Capabilities

- `phase-1.3-theme-and-design-tokens`: Covers the frontend theme system, token-backed visual rules, and normalized Phase 1 page styling.

### Modified Capabilities

- None.

## Non-goals

- No bookmark sync, extension sync, import/export, deployment, authentication, or secret-storage changes.
- No redesign of Phase 2 or later workflows.
- No change to service/category/tag data semantics or API contracts.

## Impact

- Affected code: `apps/web` Vue components, views, CSS, frontend tests, and package dependencies.
- New dependency: `@vueuse/core` for theme preference and persisted color mode handling.
- Validation: frontend unit tests plus existing project validation commands.
